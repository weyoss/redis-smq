import {
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
import { EnqueueHandler } from '../../src/system/message-manager/handlers/enqueue.handler';
import { ScheduleHandler } from '../../src/system/message-manager/handlers/schedule.handler';
import { config } from '../config';
import { redisKeys } from '../../src/system/common/redis-keys/redis-keys';
import { events } from '../../src/system/common/events';

test('MessageManager/DelayHandler', async () => {
  const redisClient = await getRedisInstance();
  const enq = new EnqueueHandler(redisClient);
  const sch = new ScheduleHandler(redisClient, enq);
  const delayHandler = promisifyAll(new DelayHandler(redisClient, sch));
  await delayHandler.scheduleAsync();

  const queueName = 'test_queue';
  let message: Message | null = null;

  const consumer = getConsumer({
    queueName,
    cfg: config,
    consumeMock: jest.fn((msg) => {
      message = msg;
      consumer.shutdown();
    }),
  });

  const producer = getProducer(queueName);
  await producer.produceAsync(
    new Message().setRetryDelay(10000).setBody('message body'),
  );

  const { keyQueueProcessing } = redisKeys.getConsumerKeys(
    queueName,
    consumer.getId(),
    'testing',
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
