'use strict';

/**
 * Logs with consistent formatting.
 */
const logger = {
  info: msg => console.log(`[INFO ${new Date().toISOString()}] ${msg}`),
  success: msg => console.log(`[✅ ${new Date().toISOString()}] ${msg}`),
  error: msg => console.error(`[❌ ${new Date().toISOString()}] ${msg}`),
};

module.exports = logger;
