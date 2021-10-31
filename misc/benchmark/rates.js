const config = require('./config');
const {
  StatsWorker,
} = require('../../dist/src/monitor-server/workers/stats.worker');

const {
  RedisClient,
} = require('../../dist/src/system/redis-client/redis-client');
RedisClient.getNewInstance(config, (_, client) => {
  new StatsWorker(client, config);
});

RedisClient.getNewInstance(config, (_, client) => {
  client.subscribe('stats');
  client.on('message', (channel, message) => {
    const stats = JSON.parse(message);
    console.log(stats.rates);
  });
});
