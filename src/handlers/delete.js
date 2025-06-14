'use strict';

/**
 * Handle /delete [n] → remove the nth scheduled message.
 */
function register(bot, gpt, scheduler, whatsapp) {
  bot.onText(/^\/delete\s+(\d+)$/, async (msg, match) => {
    if (String(msg.from.id) !== process.env.AUTH_USER_ID) return;

    const num = parseInt(match[1], 10);
    const idx = num - 1;
    const removed = scheduler.deleteTask(idx);

    if (!removed) {
      return bot.sendMessage(
        msg.chat.id,
        `❌ No scheduled message found at #${num}.`
      );
    }

    const dateStr = removed.time.toLocaleDateString('en-GB');
    const timeStr = removed.time.toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    await bot.sendMessage(
      msg.chat.id,
      `🗑️ Deleted scheduled message #${num}:\n` +
      `👤 ${removed.phone}\n` +
      `📅 ${dateStr} ${timeStr}\n` +
      `💬 ${removed.message}`
    );
  });
}

module.exports = { register };
