import { validateTimeSeriesFrom } from '../common';

test('Queue published time series', async () => {
  await validateTimeSeriesFrom(
    `/api/ns/testing/queues/test_queue/time-series/published`,
  );
});
