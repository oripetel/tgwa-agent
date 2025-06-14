'use strict';

/**
 * Export an array of all handler modules.
 * Make sure delete.js is included.
 */
module.exports = [
  require('./start'),
  require('./connect'),
  require('./disconnect'),
  require('./queue'),
  require('./delete'),
  require('./voice'),
];
