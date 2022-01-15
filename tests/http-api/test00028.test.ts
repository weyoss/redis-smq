import {
  getConsumer,
  untilConsumerIdle,
  validateTimeSeriesFrom,
} from '../common';
import { promisifyAll } from 'bluebird';

test('Consumer dead-lettered time series', async () => {
  const consumer = promisifyAll(getConsumer());
  await consumer.runAsync();
  await untilConsumerIdle(consumer);
  const queue = consumer.getQueue();
  await validateTimeSeriesFrom(
    `/api/queues/${queue.name}/ns/${
      queue.ns
    }/consumers/${consumer.getId()}/time-series/dead-lettered`,
  );
});
