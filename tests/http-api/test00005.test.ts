import {
  getConsumer,
  getProducer,
  getRedisInstance,
  startWebsocketMainStreamWorker,
  untilConsumerIdle,
} from '../common';
import { TWebsocketMainStreamPayload } from '../../types';

test('WebsocketMainStreamWorker: Case 2', async () => {
  const consumer = getConsumer();
  await consumer.runAsync();

  const producer = getProducer();
  await untilConsumerIdle(consumer);

  await startWebsocketMainStreamWorker();

  const subscribeClient = await getRedisInstance();
  subscribeClient.subscribe('mainStream');

  const json = await new Promise<TWebsocketMainStreamPayload>(
    (resolve, reject) => {
      subscribeClient.on('message', (channel, message) => {
        if (typeof message === 'string') {
          const json: TWebsocketMainStreamPayload = JSON.parse(message);
          resolve(json);
        } else reject(new Error('Expected a message payload'));
      });
    },
  );

  expect(json).toEqual({
    scheduledMessagesCount: 0,
    deadLetteredMessagesCount: 0,
    pendingMessagesCount: 0,
    pendingMessagesWithPriorityCount: 0,
    acknowledgedMessagesCount: 0,
    producersCount: 1,
    consumersCount: 1,
    queuesCount: 1,
    queues: {
      testing: {
        test_queue: {
          queueName: 'test_queue',
          namespace: 'testing',
          deadLetteredMessagesCount: 0,
          acknowledgedMessagesCount: 0,
          pendingMessagesCount: 0,
          pendingMessagesWithPriorityCount: 0,
          consumersCount: 1,
          producersCount: 1,
        },
      },
    },
  });
});
