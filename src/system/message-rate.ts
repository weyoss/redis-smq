import { ICallback } from '../../types';
import { events } from './common/events';
import { Ticker } from './common/ticker/ticker';
import { RedisClient } from './redis-client/redis-client';
import { EventEmitter } from 'events';
import * as async from 'async';
import { HashTimeSeries } from './common/time-series/hash-time-series';
import { SortedSetTimeSeries } from './common/time-series/sorted-set-time-series';
import { TimeSeries } from './common/time-series/time-series';

export abstract class MessageRate<
  TMessageRateFields extends Record<string, number> = Record<string, number>,
> extends EventEmitter {
  protected redisClient: RedisClient;
  protected readerTicker: Ticker;
  protected writerTicker: Ticker;
  protected rateStack: [number, TMessageRateFields][] = [];
  protected hashTimeSeries: HashTimeSeries;
  protected sortedSetTimeSeries: SortedSetTimeSeries;

  constructor(redisClient: RedisClient) {
    super();
    this.redisClient = redisClient;
    this.hashTimeSeries = new HashTimeSeries();
    this.sortedSetTimeSeries = new SortedSetTimeSeries();
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
      const globalKeys: Record<string, { key: string; keyIndex: string }> = {};
      const queueKeys: Record<string, { key: string; keyIndex: string }> = {};
      const keys: Record<string, string> = {};
      Object.keys(rates).forEach((field) => {
        globalKeys[field] = this.mapFieldToGlobalKeys(field);
        queueKeys[field] = this.mapFieldToQueueKeys(field);
        keys[field] = this.mapFieldToKey(field);
      });
      const multi = this.redisClient.multi();
      for (const field in rates) {
        const value = rates[field];
        const key = keys[field];
        this.sortedSetTimeSeries.add(multi, ts, key, value, { expire: 10 });
        const globalKey = globalKeys[field];
        this.hashTimeSeries.add(multi, ts, globalKey.key, value, {
          keyIndex: globalKey.keyIndex,
        });
        const queueKey = queueKeys[field];
        this.hashTimeSeries.add(multi, ts, queueKey.key, value, {
          keyIndex: queueKey.keyIndex,
        });
      }
      this.redisClient.execMulti(multi, (err) => {
        if (err) throw err;
        for (const field in rates) {
          const key = keys[field];
          this.sortedSetTimeSeries.cleanUp(this.redisClient, ts, key);
          const globalKey = globalKeys[field];
          this.hashTimeSeries.cleanUp(
            this.redisClient,
            ts,
            globalKey.key,
            globalKey.keyIndex,
          );
          const queueKey = queueKeys[field];
          this.hashTimeSeries.cleanUp(
            this.redisClient,
            ts,
            queueKey.key,
            queueKey.keyIndex,
          );
        }
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

  abstract mapFieldToGlobalKeys(field: keyof TMessageRateFields): {
    key: string;
    keyIndex: string;
  };

  abstract mapFieldToKey(field: keyof TMessageRateFields): string;

  abstract mapFieldToQueueKeys(field: keyof TMessageRateFields): {
    key: string;
    keyIndex: string;
  };
}
