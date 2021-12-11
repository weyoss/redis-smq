import { TimeSeries } from './time-series';
import { RedisClient } from '../../redis-client/redis-client';
import { ICallback, TRedisClientMulti } from '../../../../types';

export class HashTimeSeries extends TimeSeries<{ keyIndex: string }> {
  add(
    multi: TRedisClientMulti,
    ts: number,
    key: string,
    value: number,
    extra: { keyIndex: string },
  ): void {
    multi.hincrby(key, String(ts), value);
    multi.zadd(extra.keyIndex, ts, ts);
  }

  cleanUp(
    redisClient: RedisClient,
    ts: number,
    key: string,
    keyIndex: string,
  ): void {
    const max = ts - this.retentionTime;
    redisClient.zrangebyscore(keyIndex, '-inf', `${max}`, (err, reply) => {
      if (err) throw err;
      if (reply && reply.length) {
        const multi = redisClient.multi();
        multi.zrem(keyIndex, ...reply);
        multi.hdel(key, ...reply);
        redisClient.execMulti(multi, (err) => {
          if (err) throw err;
        });
      }
    });
  }

  getTimeRange(
    redisClient: RedisClient,
    key: string,
    from: number,
    to: number,
    cb: ICallback<{ timestamp: number; value: number }[]>,
  ): void {
    const length = to - from;
    const timestamps = new Array(length)
      .fill(0)
      .map((_: number, index: number) => String(from + index));
    redisClient.hmget(key, timestamps, (err, reply) => {
      if (err) cb(err);
      else {
        const replyRange = reply ?? [];
        const range = timestamps.map((i, index) => ({
          timestamp: Number(i),
          value: Number(replyRange[index] ?? 0),
        }));
        cb(null, range);
      }
    });
  }
}
