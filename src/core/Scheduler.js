'use strict';

const logger = require('../utils/logger');
const { parseTime, delayMs } = require('../utils/time');

/**
 * Queues and executes scheduled WhatsApp messages,
 * notifies Telegram when deliveries happen, and allows deletion.
 */
class Scheduler {
  constructor() {
    this.client       = null;
    this.queue        = [];
    this.contactList  = '';
    this.telegramBot  = null;
  }

  setClient(waClient) {
    this.client = waClient;
  }

  isReady() {
    return !!this.client;
  }

  setContactList(str) {
    this.contactList = str;
  }

  getFormattedContacts() {
    return this.contactList;
  }

  setTelegramBot(bot) {
    this.telegramBot = bot;
  }

  /**
   * Schedule a message.
   * @param {string} phone
   * @param {string} message
   * @param {string} isoTime
   * @param {string} chatId Telegram chat to notify on delivery
   */
  schedule(phone, message, isoTime, chatId) {
    const now    = new Date();
    const target = parseTime(isoTime);
    const delay  = delayMs(now, target);

    const task = {
      phone,
      message,
      time: target,
      chatId,
      timeoutId: null
    };

    // schedule the send
    task.timeoutId = setTimeout(async () => {
      if (!this.client) {
        return logger.error('⚠️ WhatsApp client not ready.');
      }
      try {
        await this.client.sendMessage(`${phone}@c.us`, message);
        logger.success(`✅ Sent to ${phone}: ${message}`);

        // notify back on Telegram
        if (this.telegramBot && chatId) {
          const sent = new Date();
          const dateStr = sent.toLocaleDateString('en-GB');
          const timeStr = sent.toLocaleTimeString('en-GB', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          });
          await this.telegramBot.sendMessage(
            chatId,
            `✅ Delivered to ${phone}\n🕒 ${dateStr} ${timeStr}\n💬 ${message}`
          );
        }
      } catch (err) {
        logger.error(`❌ Failed to send to ${phone}: ${err.message}`);
      } finally {
        // remove from queue
        this.queue = this.queue.filter(t => t !== task);
      }
    }, delay);

    this.queue.push(task);
    logger.info(`📬 Scheduled to ${phone} in ${Math.round(delay/1000)}s`);
  }

  /**
   * Delete a scheduled task by one-based index.
   * Cancels its timeout so the message will not be sent.
   * @param {number} index (zero-based)
   * @returns {object|null} The removed task data or null if invalid index.
   */
  deleteTask(index) {
    if (index < 0 || index >= this.queue.length) return null;

    const [removed] = this.queue.splice(index, 1);
    if (removed.timeoutId) {
      clearTimeout(removed.timeoutId);
      logger.info(`🗑️ Cleared timeout for ${removed.phone}`);
    }
    return removed;
  }

  /**
   * Return a shallow copy of the queue.
   */
  getQueue() {
    return [...this.queue];
  }
}

module.exports = Scheduler;
