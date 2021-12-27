import { promisifyAll } from 'bluebird';
import { getRedisInstance } from '../common';
import { TimeSeries } from '../../src/system/common/time-series/time-series';
import { SortedSetTimeSeries } from '../../src/system/common/time-series/sorted-set-time-series';

test('SortedSetTimeSeries: Case 1', async () => {
  const redisClient = await getRedisInstance();
  const sortedSetTimeSeries = promisifyAll(
    new SortedSetTimeSeries(
      redisClient,
      'my-key',
      undefined,
      20,
      undefined,
      true,
    ),
  );
  const multi = redisClient.multi();
  const ts = TimeSeries.getCurrentTimestamp();
  sortedSetTimeSeries.add(ts, 100, multi);
  sortedSetTimeSeries.add(ts + 3, 56, multi);
  sortedSetTimeSeries.add(ts + 10, 70, multi);
  await redisClient.execMultiAsync(multi);
  const range = await sortedSetTimeSeries.getRangeAsync(ts - 20, ts + 20);

  expect(range.length).toBe(40);
  expect(range[0]).toEqual({ timestamp: ts - 20, value: 0 });
  expect(range[20]).toEqual({ timestamp: ts, value: 100 });
  expect(range[23]).toEqual({ timestamp: ts + 3, value: 56 });
  expect(range[30]).toEqual({ timestamp: ts + 10, value: 70 });
  expect(range[39]).toEqual({ timestamp: ts + 20 - 1, value: 0 });
  await sortedSetTimeSeries.quitAsync();
});
