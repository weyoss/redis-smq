const config = require('./config');

const {
  WebsocketRateStreamWorker,
} = require('../../dist/src/monitor-server/workers/websocket-rate-stream.worker');

const {
  RedisClient,
} = require('../../dist/src/system/redis-client/redis-client');

const { Logger } = require('../../dist/src/system/common/logger');

RedisClient.getNewInstance(config, (_, client) => {
  const logger = Logger('WebsocketRateStreamWorkerLogger', config.log);
  new WebsocketRateStreamWorker(client, logger);
});

RedisClient.getNewInstance(config, (_, client) => {
  client.subscribe(`queueAcknowledged:ns1:test_queue`);
  client.on('message', (channel, message) => {
    const timeSeries = JSON.parse(message);
    console.log(timeSeries);
  });
});
