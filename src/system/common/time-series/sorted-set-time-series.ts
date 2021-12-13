import { ICallback, TRedisClientMulti } from '../../../../types';
import { TimeSeries } from './time-series';
import { ArgumentError } from '../errors/argument.error';

export class SortedSetTimeSeries extends TimeSeries {
  add(
    ts: number,
    value: number,
    mixed: ICallback<void> | TRedisClientMulti,
  ): void {
    const process = (multi: TRedisClientMulti) => {
      multi.zadd(this.key, ts, `${value}:${ts}`);
      this.expireAfter && multi.expire(this.key, this.expireAfter);
    };
    if (typeof mixed === 'function') {
      const multi = this.redisClient.multi();
      process(multi);
      this.redisClient.execMulti(multi, (err) => mixed(err));
    } else process(mixed);
  }

  onCleanUp(cb: ICallback<void>): void {
    const ts = TimeSeries.getCurrentTimestamp();
    const max = ts - this.retentionTime;
    this.redisClient.zremrangebyscore(this.key, '-inf', `${max}`, () => cb());
  }

  getRange(
    from: number,
    to: number,
    cb: ICallback<{ timestamp: number; value: number }[]>,
  ): void {
    if (to <= from) {
      cb(
        new ArgumentError(`Expected parameter [to] to be greater than [from]`),
      );
    } else {
      this.redisClient.zrevrangebyscore(this.key, to, from, (err, reply) => {
        if (err) cb(err);
        else {
          const replyRange = reply ?? {};
          console.log('replyRange ', replyRange);
          const length = to - from;
          const range = new Array(length)
            .fill(0)
            .map((_: number, index: number) => {
              const timestamp = to - index;
              const value =
                typeof replyRange[timestamp] === 'string'
                  ? Number(replyRange[timestamp].split(':')[0])
                  : 0;
              return {
                timestamp,
                value,
              };
            });
          cb(null, range);
        }
      });
    }
  }
}
