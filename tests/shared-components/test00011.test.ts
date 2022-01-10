import { getRedisInstance } from '../common';
import { delay, promisifyAll } from 'bluebird';
import { Message } from '../../src/system/message';
import { EnqueueHandler } from '../../src/system/message-manager/handlers/enqueue.handler';
import { ScheduleHandler } from '../../src/system/message-manager/handlers/schedule.handler';

test('MessageManager/ScheduleHandler', async () => {
  const redisClient = await getRedisInstance();
  const enq = new EnqueueHandler(redisClient);
  const scheduleHandler = promisifyAll(new ScheduleHandler(redisClient, enq));
  await scheduleHandler.enqueueScheduledMessagesAsync();

  const msg = new Message()
    .setScheduledDelay(10000)
    .setBody('Message body')
    .setQueue({
      ns: 'testing',
      name: 'test_queue',
    });
  const r = await scheduleHandler.scheduleAsync(msg);
  expect(r).toBe(true);

  await delay(10000);
  await scheduleHandler.enqueueScheduledMessagesAsync();
});
