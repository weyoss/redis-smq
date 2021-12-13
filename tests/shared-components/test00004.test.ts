import { delay, promisifyAll } from 'bluebird';
import { getRedisInstance } from '../common';
import { HashTimeSeries } from '../../src/system/common/time-series/hash-time-series';
import { TimeSeries } from '../../src/system/common/time-series/time-series';

test('HashTimeSeries: Case 2', async () => {
  const redisClient = await getRedisInstance();
  const hashTimeSeries = promisifyAll(
    new HashTimeSeries(redisClient, 'my-key', 'my-key-index', null, 5),
  );
  const multi = redisClient.multi();
  const ts = TimeSeries.getCurrentTimestamp();
  for (let i = 1; i <= 10; i += 1) {
    hashTimeSeries.add(ts + i, i, multi);
  }
  await redisClient.execMultiAsync(multi);

  const range1 = await hashTimeSeries.getRangeAsync(ts, ts + 10);
  await delay(15000);
  const range2 = await hashTimeSeries.getRangeAsync(ts, ts + 10);
  await delay(15000);
  const range3 = await hashTimeSeries.getRangeAsync(ts, ts + 10);

  console.log(range1);
  expect(range1[0]).toEqual({ timestamp: ts + 10, value: 10 });
  expect(range1[1]).toEqual({ timestamp: ts + 9, value: 9 });
  expect(range1[9]).toEqual({ timestamp: ts + 1, value: 1 });

  console.log(range2);
  expect(range2[0]).toEqual({ timestamp: ts + 10, value: 10 });
  expect(range2[1]).toEqual({ timestamp: ts + 9, value: 9 });
  expect(range2[2]).toEqual({ timestamp: ts + 8, value: 8 });
  expect(range2[3]).toEqual({ timestamp: ts + 7, value: 7 });
  expect(range2[4]).toEqual({ timestamp: ts + 6, value: 6 });
  expect(range2[5]).toEqual({ timestamp: ts + 5, value: 0 });
  expect(range2[9]).toEqual({ timestamp: ts + 1, value: 0 });

  console.log(range3);
  expect(range3[0]).toEqual({ timestamp: ts + 10, value: 0 });
  expect(range3[1]).toEqual({ timestamp: ts + 9, value: 0 });
  expect(range3[2]).toEqual({ timestamp: ts + 8, value: 0 });
  expect(range3[3]).toEqual({ timestamp: ts + 7, value: 0 });
  expect(range3[4]).toEqual({ timestamp: ts + 6, value: 0 });

  await hashTimeSeries.quitAsync();
});
