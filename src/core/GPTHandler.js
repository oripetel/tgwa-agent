'use strict';

const OpenAI = require('openai');
const prompt = require('../prompts/schedulingPrompt');
const logger = require('../utils/logger');
const env = require('../utils/env');

/**
 * Handles communication with OpenAI's ChatGPT.
 */
class GPTHandler {
  /**
   * @param {Scheduler} scheduler
   */
  constructor(scheduler) {
    this.scheduler = scheduler;
    this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    this.conversations = new Map(); // { chatId → message history }
  }

  /**
   * Processes a message and sends it to GPT.
   * @param {string} chatId
   * @param {string} message
   * @param {function} onReply - Callback with GPT response
   */
  async handle(chatId, message, onReply) {
    if (!this.conversations.has(chatId)) {
      this.conversations.set(chatId, []);
    }

    const history = this.conversations.get(chatId);
    history.push({ role: 'user', content: message });

    const messages = [
      { role: 'system', content: prompt.getPrompt(this.scheduler.getFormattedContacts()) },
      ...history,
    ];

    try {
      const res = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages,
      });

      const reply = res.choices[0].message.content.trim();
      history.push({ role: 'assistant', content: reply });
      onReply(reply);
    } catch (err) {
      logger.error('GPT error: ' + err.message);
      onReply('⚠️ Failed to contact GPT.');
    }
  }

  clear(chatId) {
    this.conversations.delete(chatId);
  }
}

module.exports = GPTHandler;
