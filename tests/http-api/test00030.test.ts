import { validateTimeSeriesFrom } from '../common';

test('Global dead-lettered time series', async () => {
  await validateTimeSeriesFrom(`/api/time-series/dead-lettered`);
});
