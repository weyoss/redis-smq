import { ICallback } from '../../types';
import { events } from './common/events';
import { Ticker } from './common/ticker/ticker';
import { RedisClient } from './redis-client/redis-client';
import { EventEmitter } from 'events';
import { redisKeys } from './common/redis-keys/redis-keys';

export abstract class MessageRate<
  TMessageRateFields extends Record<string, unknown> = Record<string, unknown>,
> extends EventEmitter {
  protected redisClient: RedisClient;
  protected ticker: Ticker;

  constructor(redisClient: RedisClient) {
    super();
    this.redisClient = redisClient;
    this.ticker = new Ticker(() => {
      this.onTick();
    }, 1000);
    this.ticker.runTimer();
  }

  protected onTick(): void {
    const rates = this.getRateFields();
    this.publish(this.formatRateFields(rates));
  }

  protected publish(data: string[]): void {
    const { keyIndexRates } = redisKeys.getGlobalKeys();
    this.redisClient.hmset(keyIndexRates, data, () => void 0);
  }

  abstract getRateFields(): TMessageRateFields;

  abstract formatRateFields(rates: TMessageRateFields): string[];

  quit(cb: ICallback<void>): void {
    this.ticker.once(events.DOWN, cb);
    this.ticker.quit();
  }
}
