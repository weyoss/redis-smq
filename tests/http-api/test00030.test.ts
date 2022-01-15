import { validateTimeSeriesFrom } from '../common';

test('Global dead-lettered time series', async () => {
  await validateTimeSeriesFrom(`/api/main/time-series/dead-lettered`);
});
