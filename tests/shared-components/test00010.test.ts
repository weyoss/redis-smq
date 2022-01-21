import {
  defaultQueue,
  getConsumer,
  getMessageManager,
  getProducer,
  getRedisInstance,
  untilConsumerEvent,
} from '../common';
import { promisifyAll } from 'bluebird';
import { DelayHandler } from '../../src/system/message-manager/handlers/delay.handler';
import { EMessageUnacknowledgedCause } from '../../types';
import { Message } from '../../src/system/message';
import { ScheduleHandler } from '../../src/system/message-manager/handlers/schedule.handler';
import { config } from '../config';
import { redisKeys } from '../../src/system/common/redis-keys/redis-keys';
import { events } from '../../src/system/common/events';

test('MessageManager/DelayHandler', async () => {
  const redisClient = await getRedisInstance();
  const sch = new ScheduleHandler(redisClient);
  const delayHandler = promisifyAll(new DelayHandler(redisClient, sch));
  await delayHandler.scheduleAsync();

  let message: Message | null = null;

  const consumer = getConsumer({
    cfg: config,
    messageHandler: jest.fn((msg) => {
      message = msg;
      consumer.shutdown();
    }),
  });

  const producer = getProducer();
  await producer.produceAsync(
    new Message()
      .setRetryDelay(10000)
      .setBody('message body')
      .setQueue(defaultQueue),
  );

  const { keyQueueProcessing } = redisKeys.getQueueConsumerKeys(
    defaultQueue.name,
    consumer.getId(),
    defaultQueue.ns,
  );

  consumer.run();
  await untilConsumerEvent(consumer, events.DOWN);

  expect(message !== null).toBe(true);

  const messageManager = promisifyAll(await getMessageManager());
  await messageManager.delayUnacknowledgedMessageBeforeRequeuingAsync(
    message ?? new Message(),
    keyQueueProcessing,
    EMessageUnacknowledgedCause.CAUGHT_ERROR,
  );

  await delayHandler.scheduleAsync();
});
