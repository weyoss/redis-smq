import { validateTimeSeriesFrom } from '../common';

test('Global acknowledged time series', async () => {
  await validateTimeSeriesFrom(`/api/time-series/acknowledged`);
});
