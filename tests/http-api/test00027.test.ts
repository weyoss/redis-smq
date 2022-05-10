import {
  createQueue,
  defaultQueue,
  getConsumer,
  untilConsumerIdle,
  validateTimeSeriesFrom,
} from '../common';

test('Consumer acknowledged time series', async () => {
  await createQueue(defaultQueue, false);
  const consumer = getConsumer();
  await consumer.runAsync();
  await untilConsumerIdle(consumer);
  await validateTimeSeriesFrom(
    `/api/consumers/${consumer.getId()}/time-series/acknowledged`,
  );
});
