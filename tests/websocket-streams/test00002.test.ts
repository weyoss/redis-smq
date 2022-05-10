import {
  createQueue,
  defaultQueue,
  getConsumer,
  getRedisInstance,
  startWebsocketMainStreamWorker,
  untilConsumerIdle,
} from '../common';
import { TWebsocketMainStreamPayload } from '../../types';

test('WebsocketMainStreamWorker: Case 2', async () => {
  await createQueue(defaultQueue, false);
  const consumer = getConsumer();
  await consumer.runAsync();
  await untilConsumerIdle(consumer);

  await startWebsocketMainStreamWorker();

  const subscribeClient = await getRedisInstance();
  subscribeClient.subscribe('streamMain');

  const json = await new Promise<TWebsocketMainStreamPayload>((resolve) => {
    subscribeClient.on('message', (channel, message) => {
      const json: TWebsocketMainStreamPayload = JSON.parse(message);
      resolve(json);
    });
  });

  expect(json).toEqual({
    scheduledMessagesCount: 0,
    deadLetteredMessagesCount: 0,
    pendingMessagesCount: 0,
    pendingMessagesWithPriorityCount: 0,
    acknowledgedMessagesCount: 0,
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
        },
      },
    },
  });
});
