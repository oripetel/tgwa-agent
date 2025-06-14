'use strict';

const transcribe = require('../ai/whisper-transcriber');

/**
 * Handle voice messages → transcribe → GPT flow.
 */
function register(bot, gpt, scheduler, whatsapp) {
  bot.on('voice', async msg => {
    if (String(msg.from.id) !== process.env.AUTH_USER_ID) return;

    bot.sendChatAction(msg.chat.id, 'typing');
    const text = await transcribe(bot, msg.voice);
    if (!text) return bot.sendMessage(msg.chat.id, '🤔 Didn’t catch that.');

    bot.sendMessage(msg.chat.id, `🗣️ ${text}`);
    // forward to GPT flow
    gpt.handle(msg.chat.id, text, reply => {
      // reuse your existing reply–handling logic...
      bot.sendMessage(msg.chat.id, reply);
    });
  });
}

module.exports = { register };
