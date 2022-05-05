import { defaultQueue, getConsumer, untilConsumerIdle } from '../common';
import { promisifyAll } from 'bluebird';

test('Priority queuing: case 1', async () => {
  const consumer = promisifyAll(
    getConsumer({
      queue: {
        ...defaultQueue,
        priorityQueuing: true,
      },
    }),
  );
  await consumer.runAsync();
  await untilConsumerIdle(consumer);
});
