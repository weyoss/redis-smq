const config = require('./config');
const {
  StatsWorker,
} = require('../../dist/src/monitor-server/workers/stats.worker');

const {
  RedisClient,
} = require('../../dist/src/system/redis-client/redis-client');
RedisClient.getNewInstance(config, (client) => {
  new StatsWorker(client, config);
});

RedisClient.getNewInstance(config, (client) => {
  client.subscribe('stats');
  client.on('message', (channel, message) => {
    const stats = JSON.parse(message);
    console.log(stats.rates);
  });
});
