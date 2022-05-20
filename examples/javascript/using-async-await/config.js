module.exports = {
  namespace: 'ns1',
  redis: {
    client: 'ioredis',
    options: {
      host: '127.0.0.1',
      port: 6379,
    },
  },
  logger: {
    enabled: true,
    options: {
      level: 'info',
      // streams: [
      //   {
      //     path: path.normalize(`${__dirname}/logs/redis-smq.log`),
      //   },
      // ],
    },
  },
};
