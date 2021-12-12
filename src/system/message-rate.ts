import { ICallback } from '../../types';
import { events } from './common/events';
import { Ticker } from './common/ticker/ticker';
import { RedisClient } from './redis-client/redis-client';
import { EventEmitter } from 'events';
import * as async from 'async';
import { TimeSeries } from './common/time-series/time-series';

export abstract class MessageRate<
  TMessageRateFields extends Record<string, number> = Record<string, number>,
> extends EventEmitter {
  protected redisClient: RedisClient;
  protected readerTicker: Ticker;
  protected writerTicker: Ticker;
  protected rateStack: [number, TMessageRateFields][] = [];

  constructor(redisClient: RedisClient) {
    super();
    this.redisClient = redisClient;
    this.readerTicker = new Ticker(() => {
      this.onTick();
    }, 1000);
    this.readerTicker.runTimer();
    this.writerTicker = new Ticker(() => void 0, 1000);
    this.writerTicker.nextTickFn(() => {
      this.updateTimeSeries();
    });
  }

  protected updateTimeSeries(): void {
    const item = this.rateStack.shift();
    if (item) {
      const [ts, rates] = item;
      this.onUpdate(ts, rates, () => {
        this.writerTicker.nextTickFn(() => this.updateTimeSeries());
      });
    } else this.writerTicker.nextTickFn(() => this.updateTimeSeries());
  }

  protected onTick(): void {
    const ts = TimeSeries.getCurrentTimestamp();
    const rates = this.getRateFields();
    this.rateStack.push([ts, rates]);
  }

  quit(cb: ICallback<void>): void {
    async.waterfall(
      [
        (cb: ICallback<void>) => {
          this.readerTicker.once(events.DOWN, cb);
          this.readerTicker.quit();
        },
        (cb: ICallback<void>) => {
          this.writerTicker.once(events.DOWN, cb);
          this.writerTicker.quit();
        },
      ],
      cb,
    );
  }

  abstract getRateFields(): TMessageRateFields;

  abstract onUpdate(
    ts: number,
    rates: TMessageRateFields,
    cb: ICallback<void>,
  ): void;
}
