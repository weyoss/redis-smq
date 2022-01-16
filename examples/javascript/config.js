'use strict';
const path = require('path');

module.exports = {
  namespace: 'ns1',
  redis: {
    client: 'ioredis',
    options: {
      host: 'localhost',
      port: 6379,
    },
  },
  log: {
    enabled: false,
    options: {
      level: 'info',
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
