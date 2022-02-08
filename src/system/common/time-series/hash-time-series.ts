import { TimeSeries } from './time-series';
import {
  ICallback,
  IHashTimeSeriesParams,
  TRedisClientMulti,
  TTimeSeriesRange,
} from '../../../../types';
import { ArgumentError } from '../errors/argument.error';
import { RedisClient } from '../redis-client/redis-client';

export class HashTimeSeries extends TimeSeries<IHashTimeSeriesParams> {
  protected indexKey: string;

  constructor(redisClient: RedisClient, params: IHashTimeSeriesParams) {
    super(redisClient, params);
    const { indexKey } = params;
    this.indexKey = indexKey;
  }

  add(
    ts: number,
    value: number,
    mixed: ICallback<void> | TRedisClientMulti,
  ): void {
    const process = (multi: TRedisClientMulti) => {
      multi.hincrby(this.key, String(ts), value);
      multi.zadd(this.indexKey, ts, ts);
      if (this.expireAfter) {
        multi.expire(this.key, this.expireAfter);
        multi.expire(this.indexKey, this.expireAfter);
      }
    };
    if (typeof mixed === 'function') {
      const multi = this.redisClient.multi();
      process(multi);
      this.redisClient.execMulti(multi, (err) => mixed(err));
    } else process(mixed);
  }

  cleanUp(cb: ICallback<void>): void {
    const ts = TimeSeries.getCurrentTimestamp();
    const max = ts - this.retentionTime;
    this.redisClient.zrangebyscore(
      this.indexKey,
      '-inf',
      `${max}`,
      (err, reply) => {
        if (err) cb(err);
        else if (reply && reply.length) {
          const multi = this.redisClient.multi();
          multi.zrem(this.indexKey, ...reply);
          multi.hdel(this.key, ...reply);
          this.redisClient.execMulti(multi, (err) => cb(err));
        } else cb();
      },
    );
  }

  getRange(from: number, to: number, cb: ICallback<TTimeSeriesRange>): void {
    if (to <= from) {
      cb(
        new ArgumentError(`Expected parameter [to] to be greater than [from]`),
      );
    } else {
      const length = to - from;
      const timestamps = new Array(length)
        .fill(0)
        .map((_: number, index: number) => String(from + index));
      this.redisClient.hmget(this.key, timestamps, (err, reply) => {
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
}
