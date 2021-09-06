'use strict';
const path = require('path');

module.exports = {
  namespace: 'ns1',
  redis: {
    client: 'redis',
    options: {
      host: 'localhost',
      port: 6379,
    },
  },
  log: {
    enabled: true,
    options: {
      name: 'qqqq',
      level: 'trace',
      // streams: [
      //   {
      //     path: path.normalize(`${__dirname}/logs/redis-smq.log`),
      //   },
      // ],
    },
  },
  monitor: {
    enabled: true,
    port: 3000,
    host: '127.0.0.1',
  },
};
