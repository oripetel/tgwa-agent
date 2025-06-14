'use strict';

const BotClient = require('./core/BotClient');

/**
 * Entry point for tgwa-agent.
 * Initializes and starts the main BotClient instance.
 */
const bot = new BotClient();
bot.start();
