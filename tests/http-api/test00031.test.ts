import { validateTimeSeriesFrom } from '../common';

test('Global acknowledged time series', async () => {
  await validateTimeSeriesFrom(`/api/main/time-series/acknowledged`);
});
