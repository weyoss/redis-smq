import { RedisClient } from '../../redis-client/redis-client';
import { ICallback, TRedisClientMulti } from '../../../../types';
import { TimeSeries } from './time-series';

export class SortedSetTimeSeries extends TimeSeries<{ expire: number }> {
  add(
    multi: TRedisClientMulti,
    ts: number,
    key: string,
    value: number,
    extra: { expire: number },
  ): void {
    multi.zremrangebyrank(key, 0, 0);
    multi.zadd(key, ts, `${value}:${ts}`);
    multi.expire(key, extra.expire);
  }

  cleanUp(redisClient: RedisClient, ts: number, key: string): void {
    const max = ts - this.retentionTime;
    redisClient.zremrangebyscore(key, '-inf', `${max}`, (err, reply) => {
      if (err) throw err;
    });
  }

  getTimeRange(
    redisClient: RedisClient,
    key: string,
    from: number,
    to: number,
    cb: ICallback<{ timestamp: number; value: number }[]>,
  ): void {
    redisClient.zrevrangebyscore(key, from, to, (err, reply) => {
      if (err) cb(err);
      else {
        const replyRange = reply ?? {};
        const length = to - from;
        const range = new Array(length)
          .fill(0)
          .map((_: number, index: number) => {
            const timestamp = from + index;
            return {
              timestamp,
              value: Number(replyRange[timestamp] ?? 0),
            };
          });
        cb(null, range);
      }
    });
  }
}
