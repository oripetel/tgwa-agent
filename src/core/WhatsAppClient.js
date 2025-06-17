'use strict';

const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode                = require('qrcode');
const logger                = require('../utils/logger');

class WhatsAppClient {
  constructor(scheduler) {
    this.scheduler    = scheduler;
    this.bot          = null;
    this.client       = null;
    this.expiryTimer  = null;
    this.expired      = false;
  }

  setTelegramBot(bot) {
    this.bot = bot;
  }

  async restart() {
    // destroy old
    if (this.client) {
      try { await this.client.destroy(); } catch {}
      clearTimeout(this.expiryTimer);
    }
    this.expired = false;

    // new client
    this.client = new Client({ authStrategy: new LocalAuth() });
    const chatId = process.env.AUTH_USER_ID;

    this.client.once('qr', async qr => {
      try {
        const buf = await QRCode.toBuffer(qr);
        if (!buf?.length) throw new Error('QR buffer is empty');
    
        // Send the QR
        await this.bot.sendPhoto(chatId, buf, {
          caption: '📲 Scan this QR to link WhatsApp.'
        });
    
        /* ⏲️  Start 60-second expiry timer */
        this.expired = false;
        clearTimeout(this.expiryTimer);             // safety: clear any previous
        this.expiryTimer = setTimeout(() => {
          if (!this.scheduler.isReady()) {
            this.expired = true;
            this.bot.sendMessage(
              chatId,
              '⌛️ QR code expired. Please send /start to try again.'
            );
          }
        }, 60_000);
    
      } catch (e) {
        logger.error('❌ Failed to send QR code to Telegram.');
        console.error(e);
      }
    });

    this.client.once('ready', async () => {
      clearTimeout(this.expiryTimer);
      this.scheduler.setClient(this.client);

      // fetch contacts as before
      const contacts = await this.client.getContacts();
      const contactsByName = {};
      for (const c of contacts) {
        if (!c.isUser || !c.isMyContact || !c.number) continue;
        const key = (c.name || c.pushname || '').toLowerCase();
        if (key) contactsByName[key] = c.number;
      }
      const formattedContacts = Object.entries(contactsByName)
        .map(([n, p]) => `${n} : ${p}`)
        .join('\n');
      this.scheduler.setContactList(formattedContacts);

      logger.success('✅ WhatsApp connected.');
      await this.bot.sendMessage(chatId, '✅ WhatsApp connected!');
    });

    this.client.initialize();
  }

  /**
   * Disconnects WhatsApp, clears session, resets scheduler.
   */
  async disconnect() {
    if (this.client) {
      try {
        await this.client.destroy();
        clearTimeout(this.expiryTimer);
      } catch {}
      this.client = null;
      this.scheduler.setClient(null);
      logger.info('🔌 WhatsApp client disconnected.');
    }
  }
}

module.exports = WhatsAppClient;
