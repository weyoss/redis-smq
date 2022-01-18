import { MultiQueueProducer } from '../..';
import { config } from '../config';
import { promisifyAll } from 'bluebird';
import { Message } from '../../src/system/message';
import { getMessageManager } from '../common';

test('MultiQueueProducer: Case 6', async () => {
  const mProducer = promisifyAll(new MultiQueueProducer(config));
  const msg = new Message()
    .setScheduledCron('*/3 * * * * *')
    .setBody('CRON message');
  const r1 = await mProducer.produceAsync(`queue_a`, msg);
  expect(r1).toBe(true);

  const mManager = promisifyAll(await getMessageManager());
  const r = await mManager.getScheduledMessagesAsync(0, 100);
  expect(r.total).toBe(1);
  expect(r.items[0].getId()).toBe(msg.getId());

  await mProducer.shutdownAsync();
});
