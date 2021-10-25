const config = require('./config');
const {
  StatsAggregatorThread,
} = require('../../dist/src/monitor-server/threads/stats-aggregator.thread');

const { RedisClient } = require('../../dist/src/system/redis-client');
RedisClient.getNewInstance(config, (client) => {
  new StatsAggregatorThread(client, config);
});

RedisClient.getNewInstance(config, (client) => {
  client.subscribe('stats');
  client.on('message', (channel, message) => {
    const stats = JSON.parse(message);
    console.log(stats.rates);
  });
});
