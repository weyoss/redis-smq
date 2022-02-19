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
  await validateTimeSeriesFrom(
    `/api/consumers/${consumer.getId()}/time-series/dead-lettered`,
  );
});
