import {
  getConsumer,
  untilConsumerIdle,
  validateTimeSeriesFrom,
} from '../common';
import { promisifyAll } from 'bluebird';

test('Consumer acknowledged time series', async () => {
  const consumer = promisifyAll(getConsumer());
  await consumer.runAsync();
  await untilConsumerIdle(consumer);
  const queue = consumer.getQueue();
  await validateTimeSeriesFrom(
    `/api/ns/${queue.ns}/queues/${
      queue.name
    }/consumers/${consumer.getId()}/acknowledged-time-series`,
  );
});
