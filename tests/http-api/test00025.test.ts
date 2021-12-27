import { validateTimeSeriesFrom } from '../common';

test('Queue dead-lettered time series', async () => {
  await validateTimeSeriesFrom(
    `/api/ns/testing/queues/test_queue/dead-lettered-time-series`,
  );
});
