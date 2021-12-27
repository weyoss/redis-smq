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
  await untilConsumerIdle(consumer);

  const producer = getProducer();

  await startWebsocketMainStreamWorker();

  const subscribeClient = await getRedisInstance();
  subscribeClient.subscribe('streamMain');

  const json = await new Promise<TWebsocketMainStreamPayload>(
    (resolve, reject) => {
      subscribeClient.on('message', (channel, message) => {
        const json: TWebsocketMainStreamPayload = JSON.parse(message);
        resolve(json);
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
          name: 'test_queue',
          ns: 'testing',
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
