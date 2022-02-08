import {
  ICallback,
  TRedisClientMulti,
  TTimeSeriesParams,
  TTimeSeriesRange,
} from '../../../../types';
import { RedisClient } from '../redis-client/redis-client';
import { EventEmitter } from 'events';
import { ArgumentError } from '../errors/argument.error';

export abstract class TimeSeries<
  TimeSeriesParams extends TTimeSeriesParams,
> extends EventEmitter {
  protected retentionTime = 24 * 60 * 60;
  protected expireAfter = 0;
  protected windowSize = 60;
  protected redisClient: RedisClient;
  protected key: string;

  constructor(redisClient: RedisClient, params: TimeSeriesParams) {
    super();
    const {
      key,
      expireAfterInSeconds,
      retentionTimeInSeconds,
      windowSizeInSeconds,
    } = params;
    this.redisClient = redisClient;
    if (expireAfterInSeconds !== undefined)
      this.setExpiration(expireAfterInSeconds);
    if (retentionTimeInSeconds !== undefined)
      this.setRetentionTime(retentionTimeInSeconds);
    if (windowSizeInSeconds !== undefined)
      this.setWindowSize(windowSizeInSeconds);
    this.key = key;
  }

  setWindowSize(windowSizeInSeconds: number): void {
    if (windowSizeInSeconds < 1) {
      throw new ArgumentError(
        'Expected a positive integer value in milliseconds >= 1',
      );
    }
    this.windowSize = windowSizeInSeconds;
  }

  setRetentionTime(retentionTimeInSeconds: number): void {
    if (retentionTimeInSeconds < 1) {
      throw new ArgumentError(
        'Expected a positive integer value in milliseconds >= 1',
      );
    }
    this.retentionTime = retentionTimeInSeconds;
  }

  setExpiration(expireAfterInSeconds: number): void {
    if (expireAfterInSeconds < 0) {
      throw new ArgumentError(
        'Expected a positive integer value in milliseconds',
      );
    }
    this.expireAfter = expireAfterInSeconds;
  }

  abstract add(
    ts: number,
    value: number,
    cb: ICallback<void> | TRedisClientMulti,
  ): void;

  abstract getRange(
    from: number,
    to: number,
    cb: ICallback<TTimeSeriesRange>,
  ): void;

  abstract cleanUp(cb: ICallback<void>): void;

  getRangeFrom(from: number, cb: ICallback<TTimeSeriesRange>): void {
    const max = from;
    const min = from - this.windowSize;
    this.getRange(min, max, cb);
  }

  static getCurrentTimestamp(): number {
    return Math.ceil(Date.now() / 1000);
  }
}
