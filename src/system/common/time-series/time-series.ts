import {
  ICallback,
  TRedisClientMulti,
  TTimeSeriesRange,
} from '../../../../types';
import { RedisClient } from '../../redis-client/redis-client';
import { Ticker } from '../ticker/ticker';
import { events } from '../events';
import { EventEmitter } from 'events';

export abstract class TimeSeries extends EventEmitter {
  private readonly ticker: Ticker | null = null;
  protected retentionTime: number;
  protected redisClient: RedisClient;
  protected expireAfter: number | null = null;
  protected key: string;
  protected windowSize: number;

  constructor(
    redisClient: RedisClient,
    key: string,
    expireAfter = 0,
    retentionTime = 24 * 60 * 60,
    windowSize = 60,
    readOnly = false,
  ) {
    super();
    this.retentionTime = retentionTime;
    this.redisClient = redisClient;
    this.expireAfter = expireAfter;
    this.windowSize = windowSize;
    this.key = key;
    if (!readOnly) {
      this.ticker = new Ticker(() => this.onTick(), 10000);
      this.ticker.nextTick();
    }
  }

  private onTick(): void {
    this.cleanUp((err) => {
      if (err) this.emit(events.ERROR, err);
      else this.ticker?.nextTick();
    });
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

  quit(cb: ICallback<void>): void {
    if (this.ticker) {
      this.ticker.on(events.DOWN, cb);
      this.ticker.quit();
    } else cb();
  }

  static getCurrentTimestamp(): number {
    return Math.ceil(Date.now() / 1000);
  }
}
