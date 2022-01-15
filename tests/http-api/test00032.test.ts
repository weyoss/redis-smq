import { validateTimeSeriesFrom } from '../common';

test('Global published time series', async () => {
  await validateTimeSeriesFrom(`/api/main/time-series/published`);
});
