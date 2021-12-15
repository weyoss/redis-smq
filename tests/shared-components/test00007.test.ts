import { delay, promisifyAll } from 'bluebird';
import { getRedisInstance } from '../common';
import { TimeSeries } from '../../src/system/common/time-series/time-series';
import { SortedSetTimeSeries } from '../../src/system/common/time-series/sorted-set-time-series';

test('SortedSetTimeSeries: Case 2', async () => {
  const redisClient = await getRedisInstance();
  const sortedSetTimeSeries = promisifyAll(
    new SortedSetTimeSeries(redisClient, 'my-key', undefined, 5),
  );
  const ts = TimeSeries.getCurrentTimestamp();
  for (let i = 1; i <= 10; i += 1) {
    await sortedSetTimeSeries.addAsync(ts + i, i);
  }

  const range1 = await sortedSetTimeSeries.getRangeAsync(ts, ts + 10);

  await delay(15000);
  const range2 = await sortedSetTimeSeries.getRangeAsync(ts, ts + 10);

  await delay(15000);
  const range3 = await sortedSetTimeSeries.getRangeAsync(ts, ts + 10);

  expect(range1[0]).toEqual({ timestamp: ts + 10, value: 10 });
  expect(range1[1]).toEqual({ timestamp: ts + 9, value: 9 });
  expect(range1[9]).toEqual({ timestamp: ts + 1, value: 1 });

  expect(range2[0]).toEqual({ timestamp: ts + 10, value: 10 });
  expect(range2[1]).toEqual({ timestamp: ts + 9, value: 9 });
  expect(range2[2]).toEqual({ timestamp: ts + 8, value: 8 });
  expect(range2[3]).toEqual({ timestamp: ts + 7, value: 7 });
  expect(range2[4]).toEqual({ timestamp: ts + 6, value: 6 });
  expect(range2[5]).toEqual({ timestamp: ts + 5, value: 0 });
  expect(range2[9]).toEqual({ timestamp: ts + 1, value: 0 });

  expect(range3[0]).toEqual({ timestamp: ts + 10, value: 0 });
  expect(range3[1]).toEqual({ timestamp: ts + 9, value: 0 });
  expect(range3[2]).toEqual({ timestamp: ts + 8, value: 0 });
  expect(range3[3]).toEqual({ timestamp: ts + 7, value: 0 });
  expect(range3[4]).toEqual({ timestamp: ts + 6, value: 0 });

  await sortedSetTimeSeries.quitAsync();
});
