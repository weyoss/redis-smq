import { promisifyAll } from 'bluebird';
import { getConsumer } from '../../common/consumer';
import { defaultQueue } from '../../common/message-producing-consuming';
import { EQueueType } from '../../../types';
import { getQueue } from '../../common/queue';

test('Priority queuing: case 1', async () => {
  const queue = await getQueue();
  await queue.saveAsync(defaultQueue, EQueueType.PRIORITY_QUEUE);

  const consumer = promisifyAll(getConsumer({ queue: defaultQueue }));
  await consumer.runAsync();
});
