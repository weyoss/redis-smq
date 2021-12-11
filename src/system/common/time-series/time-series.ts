import { ICallback, TRedisClientMulti } from '../../../../types';
import { RedisClient } from '../../redis-client/redis-client';

export abstract class TimeSeries<ExtraParameters extends Record<string, any>> {
  protected retentionTime: number;

  constructor(retentionTime = 24 * 60 * 60) {
    this.retentionTime = retentionTime;
  }

  static getCurrentTimestamp(): number {
    return Math.ceil(Date.now() / 1000);
  }

  abstract add(
    multi: TRedisClientMulti,
    ts: number,
    key: string,
    value: number,
    extra: ExtraParameters,
  ): void;

  abstract getTimeRange(
    redisClient: RedisClient,
    key: string,
    from: number,
    to: number,
    cb: ICallback<{ timestamp: number; value: number }[]>,
  ): void;
}
