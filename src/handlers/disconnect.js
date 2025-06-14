'use strict';

/**
 * Handle /disconnect → tear down WhatsApp session.
 */
function register(bot, gpt, scheduler, whatsapp) {
  bot.onText(/^\/disconnect$/, async msg => {
    if (String(msg.from.id) !== process.env.AUTH_USER_ID) return;
    await whatsapp.disconnect();
    bot.sendMessage(msg.chat.id,
      '🔌 WhatsApp disconnected. Send /start to reconnect.'
    );
  });
}

module.exports = { register };
