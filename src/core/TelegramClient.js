'use strict';

require('dotenv/config');
const TelegramBot = require('node-telegram-bot-api');
const logger      = require('../utils/logger');
const handlers    = require('../handlers');

class TelegramClient {
  /**
   * @param {GPTHandler} gpt
   * @param {Scheduler} scheduler
   * @param {WhatsAppClient} whatsapp
   */
  constructor(gpt, scheduler, whatsapp) {
    this.gpt       = gpt;
    this.scheduler = scheduler;
    this.whatsapp  = whatsapp;

    this.bot = new TelegramBot(process.env.TELEGRAM_TOKEN, {
      polling: { params: { allowed_updates: ['message','callback_query'] } }
    });

    this.bot.on('polling_error', err => {
      logger.error(`[polling_error] ${err.code || ''} ${err.message || err}`);
    });
  }

  start() {
    logger.success('🤖 Telegram bot online.');

    /* 1️⃣  Static command handlers (/start, /queue, /delete …) */
    for (const h of handlers) {
      h.register(this.bot, this.gpt, this.scheduler, this.whatsapp);
    }

    /* 2️⃣  Unified message handler */
    this.bot.on('message', async msg => {
      try {
        const text   = msg.text?.trim();
        const chatId = msg.chat.id;
        const userId = String(msg.from.id);

        if (!text || userId !== process.env.AUTH_USER_ID) return;

        /* 2-a. Direct user “SEND: name|phone|time|message” */
        const direct = text.match(/^SEND:\s*([^|]+)\|([^|]+)\|([^|]+)\|([\s\S]+)$/i);
        if (direct) {
          const [ , name, rawPhone, rawTime, message ] = direct;
          const phone = rawPhone.replace(/\D/g, '');
          const iso   = rawTime.trim();
          this.scheduler.schedule(phone, message.trim(), iso, chatId);
          await this.bot.sendMessage(
            chatId,
            `✅ Scheduled *${name.trim()}* (${phone}) at \`${new Date(iso).toLocaleString('en-GB')}\``,
            { parse_mode: 'Markdown' }
          );
          return;
        }

        /* Ignore other slash commands (handled by handlers/) */
        if (text.startsWith('/')) return;

        console.log(`[USER] ${text}`);
        await this.bot.sendChatAction(chatId, 'typing');
        
        
        /* 2-b. Forward to GPT flow */
        await this.gpt.handle(chatId, text, async reply => {
          console.log(`[GPT ] ${reply}`);
          const trimmed = reply.trim();
            /* ----- DELETE:n directive from GPT ---------------- */
            if (trimmed.startsWith('DELETE:')) {
              const idx = parseInt(trimmed.split(':')[1], 10) - 1;
              const removed = this.scheduler.deleteTask(idx);
              const txt = removed
                ? `🗑️ Deleted #${idx + 1}.`
                : '❌ Could not delete – invalid index.';
              await this.bot.sendMessage(chatId, txt);
              return;
            }

          

            /* ---------- INLINE BUTTON HANDLING (compact) ---------- */
            try {
              const start = reply.indexOf('{');
              const end   = reply.lastIndexOf('}');
              if (start !== -1 && end !== -1 && end > start) {
                const jsonText = reply.slice(start, end + 1);
                const parsed = JSON.parse(jsonText);
            
                if (parsed.text && parsed.reply_markup?.inline_keyboard) {
                  const kb = Array.isArray(parsed.reply_markup.inline_keyboard[0])
                    ? parsed.reply_markup.inline_keyboard
                    : [ parsed.reply_markup.inline_keyboard ];
            
                  await this.bot.sendMessage(chatId, parsed.text, {
                    reply_markup: { inline_keyboard: kb }
                  });
                  return;
                }
              }
            } catch (err) {
              console.error('[GPT JSON button parse failed]', err);
            }
            /* ------------------------------------------------------ */
          /* GPT-generated SEND: */
          if (/^SEND:/i.test(trimmed)) {
            const [, raw] = trimmed.split(/SEND:/i);
            const parts = raw.split('|').map(s => s.trim());
            if (parts.length === 4) {
              const [name, rawPhone, timeIso, message] = parts;
              const phone = rawPhone.replace(/\D/g, '');
              this.scheduler.schedule(phone, message, timeIso, chatId);
              await this.bot.sendMessage(
                chatId,
                `✅ Scheduled *${name}* (${phone}) at \`${new Date(timeIso).toLocaleString('en-GB')}\``,
                { parse_mode: 'Markdown' }
              );
              this.gpt.clear(chatId);
              return;
            }
          }

          /* QUEUE: */
          if (trimmed === 'QUEUE:') {
            const q = this.scheduler.getQueue();
            if (!q.length) {
              await this.bot.sendMessage(chatId, '📭 No scheduled messages.');
              return;
            }
            const out = q.map((t,i) => {
              const d = t.time;
              const date = d.toLocaleDateString('en-GB');
              const time = d.toLocaleTimeString('en-GB',
                { hour:'2-digit', minute:'2-digit', second:'2-digit' });
              return (
                `🗓️ *#${i+1}*\n` +
                `👤 \`${t.phone}\`\n` +
                `📅 \`${date}\`\n` +
                `🕒 \`${time}\`\n` +
                `💬 _${t.message}_`
              );
            }).join('\n\n');
            await this.bot.sendMessage(chatId, `📋 *Scheduled Messages:*\n\n${out}`, {
              parse_mode:'Markdown'
            });
            return;
          }

          /* Fallback plain text */
          await this.bot.sendMessage(chatId, reply);
        });

      } catch (err) {
        logger.error('[message handler] ' + err);
        this.bot.sendMessage(msg.chat.id, '⚠️ Unexpected error.');
      }
    });

    

    /* 3️⃣  Button callbacks */
    this.bot.on('callback_query', async cb => {
      if (String(cb.from.id) !== process.env.AUTH_USER_ID) return;
      await this.bot.answerCallbackQuery(cb.id);
      try {
        await this.gpt.handle(cb.message.chat.id, cb.data, async reply => {
          await this.bot.sendMessage(cb.message.chat.id, reply);
        });
      } catch (err) {
        logger.error('[callback handler] ' + err);
      }
    });
  }
}



/* helper: tryLooseJson(" {text:'hi',reply_markup:{inline_keyboard:[]}} ") */
function tryLooseJson(str) {
  try {
    // normalise unicode quotes and backticks → "
    const clean = str
      .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":') // quote keys
      .replace(/[\u2018\u2019`]/g, '"')                     // fancy quotes → "
      .replace(/,\s*}/g, '}')                              // trailing commas
      .replace(/,\s*]/g, ']');                             // trailing commas in arrays

    // eval in a safe Function wrapper
    return Function('"use strict"; return (' + clean + ')')();
  } catch { return null; }
}


module.exports = TelegramClient;
