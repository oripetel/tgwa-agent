'use strict';

require('dotenv/config');

/**
 * Ensures required environment variables are loaded.
 */
const env = {
  TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  AUTH_USER_ID: process.env.AUTH_USER_ID,
};

for (const [key, value] of Object.entries(env)) {
  if (!value) {
    throw new Error(`❌ Missing required environment variable: ${key}`);
  }
}

module.exports = env;
