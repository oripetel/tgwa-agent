'use strict';

/**
 * Formats WhatsApp contact list into name: number pairs.
 * @param {Array} contacts
 * @returns {Object<string, string>} lowercase name → phone number
 */
function formatContacts(contacts) {
  const out = {};
  for (const c of contacts) {
    const name = (c.name || c.pushname || '').toLowerCase();
    if (name && c.number) out[name] = c.number;
  }
  return out;
}

module.exports = { formatContacts };
