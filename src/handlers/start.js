'use strict';

/**
 * Handle /start → initialize or reboot WhatsApp.
 */
function register(bot, gpt, scheduler, whatsapp) {
  bot.onText(/^\/start$/, async msg => {
    if (String(msg.from.id) !== process.env.AUTH_USER_ID) return;
    await bot.sendMessage(msg.chat.id, '📲 WhatsApp client is starting...');
    whatsapp.setTelegramBot(bot);
    whatsapp.restart();
  });
}

module.exports = { register };
