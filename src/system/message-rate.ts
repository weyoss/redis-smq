import { ICallback } from '../../types';
import { events } from './common/events';
import { Ticker } from './common/ticker/ticker';
import { RedisClient } from './redis-client/redis-client';
import { EventEmitter } from 'events';
import { timeSeries } from './common/time-series';
import * as async from 'async';

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
      const createdStatus: Record<string, boolean> = {};
      const globalKeys: Record<string, string> = {};
      const queueKeys: Record<string, string> = {};
      const keys: Record<string, string> = {};
      Object.keys(rates).forEach((field) => {
        globalKeys[field] = this.mapFieldToGlobalKey(field);
        queueKeys[field] = this.mapFieldToQueueKey(field);
        keys[field] = this.mapFieldToKey(field);
      });
      const tasks = Object.values(globalKeys)
        .concat(Object.values(queueKeys))
        .map((key) => (cb: ICallback<number>) => {
          this.redisClient.hsetnx(key, String(ts), '0', (err, reply) => {
            if (err) cb(err);
            else {
              createdStatus[key] = reply === 1;
            }
          });
        });
      async.waterfall(tasks, (err) => {
        if (err) throw err;
        else {
          const multi = this.redisClient.multi();
          for (const field in rates) {
            const value = rates[field];
            const key = keys[field];
            timeSeries.add(multi, ts, key, value, 5);
            const globalKey = globalKeys[field];
            timeSeries.incrBy(
              multi,
              ts,
              globalKey,
              value,
              createdStatus[globalKey],
            );
            const queueKey = queueKeys[field];
            timeSeries.incrBy(
              multi,
              ts,
              queueKey,
              value,
              createdStatus[queueKey],
            );
          }
          this.redisClient.execMulti(multi, (err) => {
            if (err) throw err;
            this.writerTicker.nextTickFn(() => this.updateTimeSeries());
          });
        }
      });
    } else this.writerTicker.nextTickFn(() => this.updateTimeSeries());
  }

  protected onTick(): void {
    const ts = timeSeries.getCurrentTimestamp();
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

  abstract init(cb: ICallback<void>): void;

  abstract getRateFields(): TMessageRateFields;

  abstract mapFieldToGlobalKey(field: keyof TMessageRateFields): string;

  abstract mapFieldToKey(field: keyof TMessageRateFields): string;

  abstract mapFieldToQueueKey(field: keyof TMessageRateFields): string;
}
