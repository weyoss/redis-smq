import { ICallback, IRatesProvider } from '../../types';
import { Base } from './base';
import { events } from './common/events';
import { Ticker } from './common/ticker';
import { RedisClient } from './redis-client/redis-client';
import { EventEmitter } from 'events';

export class Rates extends EventEmitter {
  protected instance: Base;
  protected ratesProvider: IRatesProvider;
  protected redisClient: RedisClient;
  protected ticker: Ticker;

  constructor(instance: Base, redisClient: RedisClient) {
    super();
    this.instance = instance;
    this.redisClient = redisClient;
    this.ratesProvider = instance.getStatsProvider();
    this.ticker = new Ticker(() => {
      this.onTick();
    }, 1000);
    this.ticker.runTimer();
  }

  protected onTick(): void {
    const stats = this.ratesProvider.getRates();
    this.publish(stats);
  }

  protected publish(stats: Record<string, any>): void {
    const formatted = this.ratesProvider.format(stats);
    const { keyIndexRates } = this.instance.getRedisKeys();
    this.redisClient.hmset(keyIndexRates, formatted, () => void 0);
  }

  quit(cb: ICallback<void>): void {
    this.ticker.once(events.DOWN, cb);
    this.ticker.quit();
  }
}
