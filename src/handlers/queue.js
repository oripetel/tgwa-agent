'use strict';

/**
 * Utility – format a single scheduled task to readable text.
 */
function formatTask(t, index) {
  const dateStr = t.time.toLocaleDateString('en-GB');
  const timeStr = t.time.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    `🗓️ *#${index + 1}*\n` +
    `👤 \`${t.phone}\`\n` +
    `📅 \`${dateStr}\`\n` +
    `🕒 \`${timeStr}\`\n` +
    `💬 _${t.message}_`
  );
}

/**
 * Helper – send a numbered delete keyboard.
 * Each row:  ❌ #1   ❌ #2   …
 */
function promptDelete(bot, chatId, queue) {
  if (!queue.length) {
    return bot.sendMessage(chatId, '📭 No messages are currently scheduled.');
  }
  const rows = queue.map((_, i) => [
    { text: `❌ #${i + 1}`, callback_data: `del:${i}` },
  ]);
  bot.sendMessage(chatId, 'איזו הודעה למחוק?', {
    reply_markup: { inline_keyboard: rows },
  });
}

/**
 * /queue command – list pending messages with full timestamp.
 * Exports `promptDelete` so the delete-handler can reuse it.
 */
function register(bot, _gpt, scheduler) {
  bot.onText(/^\/queue$/, msg => {
    if (String(msg.from.id) !== process.env.AUTH_USER_ID) return;

    const q = scheduler.getQueue();
    if (!q.length) {
      return bot.sendMessage(
        msg.chat.id,
        '📭 No messages are currently scheduled.'
      );
    }

    const out = q.map((t, i) => formatTask(t, i)).join('\n\n');
    bot.sendMessage(msg.chat.id, `📋 *Scheduled Messages:*\n\n${out}`, {
      parse_mode: 'Markdown',
    });
  });

  /* Natural-language “what’s waiting?” from GPT (QUEUE:) */
  bot.on('message', msg => {
    if (
      String(msg.from.id) !== process.env.AUTH_USER_ID ||
      !msg.text ||
      msg.text.trim() !== 'QUEUE:'
    )
      return;

    const q = scheduler.getQueue();
    // show numbered delete keyboard to let the user pick which to delete
    promptDelete(bot, msg.chat.id, q);
  });
}

module.exports = { register, promptDelete };
