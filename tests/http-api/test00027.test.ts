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
  await validateTimeSeriesFrom(
    `/api/consumers/${consumer.getId()}/time-series/acknowledged`,
  );
});
