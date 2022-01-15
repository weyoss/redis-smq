import { validateTimeSeriesFrom } from '../common';

test('Queue dead-lettered time series', async () => {
  await validateTimeSeriesFrom(
    `/api/queues/test_queue/ns/testing/time-series/dead-lettered`,
  );
});
