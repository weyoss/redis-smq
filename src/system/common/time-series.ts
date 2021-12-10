import { ICallback, TRedisClientMulti } from '../../../types';
import { RedisClient } from '../redis-client/redis-client';

const dataRetentionTime = 24 * 60 * 60; // In seconds, 1 day

export const timeSeries = {
  add(
    multi: TRedisClientMulti,
    ts: number,
    key: string,
    value: number,
    expire: number,
  ): void {
    multi.zremrangebyrank(key, 0, 0);
    multi.zadd(key, ts, `${value}:${ts}`);
    multi.expire(key, expire);
  },

  incrBy(
    multi: TRedisClientMulti,
    ts: number,
    key: string,
    value: number,
    created: boolean,
  ): void {
    multi.hincrby(key, String(ts), value);
    if (created) multi.hdel(key, String(ts - dataRetentionTime));
  },

  initHash(
    redisClient: RedisClient,
    key: string,
    ts: number,
    cb: ICallback<void>,
  ): void {
    redisClient.zrevrange(key, 0, 0, (err, reply) => {
      if (err) cb(err);
      else {
        const item = (reply ?? [])[0];
        if (!item) {
          // Initializing for the first time
          const arr = this.getRangeDefaultValues(ts, dataRetentionTime);
          redisClient.hmset(key, arr, (err) => cb(err));
        } else {
          const [, timestamp] = item.split(':');
          const lastTimestamp = Number(timestamp);
          const seconds = ts - lastTimestamp;
          if (seconds > 5) {
            // There is a gap
            const add = this.getRangeDefaultValues(ts, seconds);
            const multi = redisClient.multi();
            multi.hmset(key, add);
            const del = new Array(seconds)
              .fill(0)
              .map((_: number, index: number) =>
                String(lastTimestamp - dataRetentionTime + index),
              );
            multi.hdel(key, ...del);
            redisClient.execMulti(multi, (err) => cb(err));
          } else {
            // Everything looks OK
            cb();
          }
        }
      }
    });
  },

  initSortedSet(
    redisClient: RedisClient,
    key: string,
    ts: number,
    expireAfter: number | undefined,
    cb: ICallback<void>,
  ): void {
    redisClient.zrevrange(key, 0, 0, (err, reply) => {
      if (err) cb(err);
      else {
        const item = (reply ?? [])[0];
        if (!item) {
          // Initializing for the first time
          const arr = this.getRangeDefaultValues(ts, dataRetentionTime);
          const multi = redisClient.multi();
          multi.zadd(key, ...arr);
          if (expireAfter) {
            multi.expire(key, expireAfter);
          }
          redisClient.execMulti(multi, (err) => cb(err));
        } else {
          const [, timestamp] = item.split(':');
          const seconds = ts - Number(timestamp);
          if (seconds > 5) {
            // There is a gap
            const arr = this.getRangeDefaultValues(ts, seconds);
            const multi = redisClient.multi();
            multi.zadd(key, ...arr);
            multi.zremrangebyrank(key, 0, seconds - 1);
            if (expireAfter) {
              multi.expire(key, expireAfter);
            }
            redisClient.execMulti(multi, (err) => cb(err));
          } else {
            // Everything looks OK
            cb();
          }
        }
      }
    });
  },

  getRangeDefaultValues(ts: number, size: number): (string | number)[] {
    const r: (string | number)[] = [];
    for (let i = size; i >= 0; i -= 1) {
      const timestamp = ts - i;
      r.push(timestamp);
      r.push(`${0}:${timestamp}`);
    }
    return r;
  },

  getCurrentTimestamp(): number {
    return Math.ceil(Date.now() / 1000);
  },
};
