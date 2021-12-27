import { validateTimeSeriesFrom } from '../common';

test('Global published time series', async () => {
  await validateTimeSeriesFrom(`/api/time-series/published`);
});
