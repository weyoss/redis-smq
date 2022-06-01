import { promisifyAll } from 'bluebird';
import { getQueueManager } from '../../common/queue-manager';
import { getConsumer } from '../../common/consumer';
import { defaultQueue } from '../../common/message-producing-consuming';

test('Priority queuing: case 1', async () => {
  const qm = await getQueueManager();
  await qm.queue.createAsync(defaultQueue, true);

  const consumer = promisifyAll(getConsumer({ queue: defaultQueue }));
  await consumer.runAsync();
});
