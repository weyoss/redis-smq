import {
  getConsumer,
  getProducer,
  getRedisInstance,
  startStatsWorker,
  untilConsumerIdle,
} from '../common';
import { TWebsocketMainStreamPayload } from '../../types';

test('WsMainStreamWorker: Case 2', async () => {
  const consumer = getConsumer();
  await consumer.runAsync();

  const producer = getProducer();
  await untilConsumerIdle(consumer);

  await startStatsWorker();

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

  expect(Object.keys(json)).toEqual(
    expect.arrayContaining(['queues', 'scheduledMessages']),
  );

  expect(json.scheduledMessages).toBe(0);

  expect(Object.keys(json.queues)).toEqual(expect.arrayContaining(['testing']));

  expect(Object.keys(json.queues['testing'])).toEqual(
    expect.arrayContaining(['test_queue']),
  );

  expect(Object.keys(json.queues['testing']['test_queue'])).toEqual(
    expect.arrayContaining([
      'queueName',
      'namespace',
      'deadLetteredMessages',
      'acknowledgedMessages',
      'pendingMessages',
      'pendingMessagesWithPriority',
      'consumers',
      'producers',
    ]),
  );

  expect(json.queues['testing']['test_queue']['consumers']).toEqual(1);
  expect(json.queues['testing']['test_queue']['producers']).toEqual(1);
});
