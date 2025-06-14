'use strict';

const TelegramClient = require('./TelegramClient');
const WhatsAppClient = require('./WhatsAppClient');
const GPTHandler     = require('./GPTHandler');
const Scheduler      = require('./Scheduler');
const logger         = require('../utils/logger');

class BotClient {
  constructor() {
    this.scheduler = new Scheduler();
    this.whatsapp  = new WhatsAppClient(this.scheduler);
    this.gpt       = new GPTHandler(this.scheduler);
    this.telegram  = new TelegramClient(this.gpt, this.scheduler, this.whatsapp);
  }

  start() {
    logger.info('🧠 Initializing tgwa-agent...');
    this.telegram.start();
  }
}

module.exports = BotClient;
