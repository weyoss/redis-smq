import { getConsumer, untilConsumerIdle } from '../common';
import { promisifyAll } from 'bluebird';

test('Priority queuing: case 1', async () => {
  const consumer = promisifyAll(
    getConsumer({
      enablePriorityQueuing: true,
    }),
  );
  await consumer.runAsync();
  await untilConsumerIdle(consumer);
});
