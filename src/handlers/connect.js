'use strict';

/**
 * Handle /connect → same as /start but rephrased.
 */
function register(bot, gpt, scheduler, whatsapp) {
  bot.onText(/^\/connect$/, async msg => {
    if (String(msg.from.id) !== process.env.AUTH_USER_ID) return;
    await bot.sendMessage(msg.chat.id, '🔄 Reconnecting to WhatsApp...');
    whatsapp.setTelegramBot(bot);
    whatsapp.restart();
  });
}

module.exports = { register };
