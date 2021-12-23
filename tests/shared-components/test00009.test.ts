import { delay, promisifyAll } from 'bluebird';
import { getRedisInstance } from '../common';
import { TimeSeries } from '../../src/system/common/time-series/time-series';
import { SortedSetTimeSeries } from '../../src/system/common/time-series/sorted-set-time-series';

test('SortedSetTimeSeries: Case 3', async () => {
  const redisClient = await getRedisInstance();
  const sortedSetSeries = promisifyAll(
    new SortedSetTimeSeries(redisClient, 'my-key', 5, 20),
  );
  const ts = TimeSeries.getCurrentTimestamp();
  for (let i = 0; i < 10; i += 1) {
    await sortedSetSeries.addAsync(ts + i, i);
  }

  await delay(5000);

  const range1 = await sortedSetSeries.getRangeAsync(ts, ts + 10);
  expect(range1.length).toEqual(10);
  expect(range1[0]).toEqual({ timestamp: ts, value: 0 });
  expect(range1[1]).toEqual({ timestamp: ts + 1, value: 0 });
  expect(range1[2]).toEqual({ timestamp: ts + 2, value: 0 });
  expect(range1[3]).toEqual({ timestamp: ts + 3, value: 0 });
  expect(range1[4]).toEqual({ timestamp: ts + 4, value: 0 });
  expect(range1[5]).toEqual({ timestamp: ts + 5, value: 0 });
  expect(range1[6]).toEqual({ timestamp: ts + 6, value: 0 });
  expect(range1[7]).toEqual({ timestamp: ts + 7, value: 0 });
  expect(range1[8]).toEqual({ timestamp: ts + 8, value: 0 });
  expect(range1[9]).toEqual({ timestamp: ts + 9, value: 0 });

  await sortedSetSeries.quitAsync();
});
