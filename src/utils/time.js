'use strict';

/**
 * Parses ISO-8601 string into Date
 * @param {string} iso
 * @returns {Date}
 */
function parseTime(iso) {
  return new Date(iso);
}

/**
 * Returns delay in milliseconds between now and target
 * @param {Date} now
 * @param {Date} target
 * @returns {number}
 */
function delayMs(now, target) {
  const diff = target.getTime() - now.getTime();
  return diff < 3000 ? 5000 : diff;
}

module.exports = { parseTime, delayMs };
