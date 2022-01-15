import { validateTimeSeriesFrom } from '../common';

test('Queue acknowledged time series', async () => {
  await validateTimeSeriesFrom(
    `/api/queues/test_queue/ns/testing/time-series/acknowledged`,
  );
});
