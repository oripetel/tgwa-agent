'use strict';

require('dotenv/config');
const TelegramBot = require('node-telegram-bot-api');
const logger      = require('../utils/logger');
const handlers    = require('../handlers');

class TelegramClient {
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

    /* command handlers */
    for (const h of handlers) {
      h.register(this.bot, this.gpt, this.scheduler, this.whatsapp);
    }

    /* free-text handler */
    this.bot.on('message', async msg => {
      try {
        const text   = msg.text?.trim();
        const chatId = msg.chat.id;
        if (!text || String(msg.from.id) !== process.env.AUTH_USER_ID) return;

        /* direct SEND: */
        const direct = text.match(/^SEND:\s*([^|]+)\|([^|]+)\|([^|]+)\|([\s\S]+)$/i);
        if (direct) {
          const [, name, rawPhone, rawTime, message] = direct;
          const phone = rawPhone.replace(/\D/g,'');
          this.scheduler.schedule(phone, message.trim(), rawTime.trim(), chatId);
          await this.bot.sendMessage(
            chatId,
            `✅ Scheduled *${name.trim()}* (${phone}) at \`${new Date(rawTime).toLocaleString('en-GB')}\``,
            { parse_mode:'Markdown' }
          );
          return;
        }

        if (text.startsWith('/')) return; // slash commands handled elsewhere

        console.log('[USER]', text);
        await this.bot.sendChatAction(chatId, 'typing');

        await this.gpt.handle(chatId, text, async reply => {
          console.log('[GPT ]', reply);
          const trimmed = reply.trim();

          /* 🗑 DELETE:n directive */
          if (trimmed.startsWith('DELETE:')) {
            const idx = parseInt(trimmed.split(':')[1], 10) - 1;
            const removed = this.scheduler.deleteTask(idx);
            await this.bot.sendMessage(
              chatId,
              removed ? `🗑️ Deleted #${idx + 1}.` : '❌ Could not delete – invalid index.'
            );
            return;
          }

            /* ---------- INLINE BUTTON HANDLING (reliable) ---------- */
            {
              const start = trimmed.indexOf('{');          // first “{”
              const end   = trimmed.lastIndexOf('}');      // *last* “}”
              if (start !== -1 && end !== -1 && end > start) {
                let jsonStr = trimmed.slice(start, end + 1)
                  .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":') // quote bare keys
                  .replace(/,\s*}/g, '}')                              // trim trailing commas
                  .replace(/,\s*]/g, ']');

                try {
                  const obj = JSON.parse(jsonStr);
                  if (obj.text && obj.reply_markup?.inline_keyboard) {
                    const kb = Array.isArray(obj.reply_markup.inline_keyboard[0])
                      ? obj.reply_markup.inline_keyboard
                      : [obj.reply_markup.inline_keyboard];

                    await this.bot.sendMessage(chatId, obj.text, {
                      reply_markup: { inline_keyboard: kb }
                    });
                    return;            // ✅ buttons sent, JSON hidden
                  }
                } catch (e) {
                  logger.error('[inline-button parse]', e.message);
                  return;              // silently drop invalid JSON
                }
              }
            }
            /* ------------------------------------------------------- */

          /* GPT-generated SEND: */
          if (/^SEND:/i.test(trimmed)) {
            const [, raw] = trimmed.split(/SEND:/i);
            const parts   = raw.split('|').map(s => s.trim());
            if (parts.length === 4) {
              const [name, rawPhone, iso, message] = parts;
              const phone = rawPhone.replace(/\D/g,'');
              this.scheduler.schedule(phone, message, iso, chatId);
              await this.bot.sendMessage(
                chatId,
                `✅ Scheduled *${name}* (${phone}) at \`${new Date(iso).toLocaleString('en-GB')}\``,
                { parse_mode:'Markdown' }
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
              return (
                `🗓️ *#${i+1}*\n` +
                `👤 \`${t.phone}\`\n` +
                `📅 \`${d.toLocaleDateString('en-GB')}\`\n` +
                `🕒 \`${d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}\`\n` +
                `💬 _${t.message}_`
              );
            }).join('\n\n');
            await this.bot.sendMessage(chatId, `📋 *Scheduled Messages:*\n\n${out}`, {
              parse_mode:'Markdown'
            });
            return;
          }

          /* fallback */
          await this.bot.sendMessage(chatId, reply);
        });

      } catch (err) {
        logger.error('[message handler]', err);
        this.bot.sendMessage(msg.chat.id, '⚠️ Unexpected error.');
      }
    });

    /* callback buttons */
    this.bot.on('callback_query', async cb => {
      if (String(cb.from.id) !== process.env.AUTH_USER_ID) return;
      await this.bot.answerCallbackQuery(cb.id);
      try {
        await this.gpt.handle(cb.message.chat.id, cb.data, async reply => {
          await this.bot.sendMessage(cb.message.chat.id, reply);
        });
      } catch (err) {
        logger.error('[callback handler]', err);
      }
    });
  }
}

module.exports = TelegramClient;
