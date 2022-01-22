'use strict';

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
  },
  monitor: {
    enabled: false,
    port: 3000,
    host: '127.0.0.1',
  },
};
