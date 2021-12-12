import { ICallback, TRedisClientMulti } from '../../../../types';
import { RedisClient } from '../../redis-client/redis-client';
import { Ticker } from '../ticker/ticker';
import { events } from '../events';

export abstract class TimeSeries {
  protected retentionTime: number;
  protected redisClient: RedisClient;
  protected expireAfter: number | null = null;
  protected key: string;
  protected cleanUpTicker: Ticker;

  constructor(
    redisClient: RedisClient,
    key: string,
    expireAfter: number | null = null,
    retentionTime = 24 * 60 * 60,
  ) {
    this.retentionTime = retentionTime;
    this.redisClient = redisClient;
    this.expireAfter = expireAfter;
    this.key = key;
    this.cleanUpTicker = new Ticker(() => this.cleanUp(), 10000);
    this.cleanUpTicker.nextTick();
  }

  protected cleanUp(): void {
    this.onCleanUp(() => this.cleanUpTicker.nextTick());
  }

  abstract add(
    ts: number,
    value: number,
    cb: ICallback<void> | TRedisClientMulti,
  ): void;

  abstract getRange(
    from: number,
    to: number,
    cb: ICallback<{ timestamp: number; value: number }[]>,
  ): void;

  abstract onCleanUp(cb: ICallback<void>): void;

  quit(cb: ICallback<void>): void {
    this.cleanUpTicker.on(events.DOWN, cb);
    this.cleanUpTicker.quit();
  }

  static getCurrentTimestamp(): number {
    return Math.ceil(Date.now() / 1000);
  }
}
