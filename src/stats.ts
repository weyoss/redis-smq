import { ICallback, IStatsProvider } from '../types';
import { Instance } from './instance';
import { events } from './events';
import { Ticker } from './ticker';
import { RedisClient } from './redis-client';
import { EventEmitter } from 'events';

export class Stats extends EventEmitter {
  protected instance: Instance;
  protected statsProvider: IStatsProvider;
  protected redisClient: RedisClient;
  protected ticker: Ticker;

  constructor(instance: Instance, redisClient: RedisClient) {
    super();
    this.instance = instance;
    this.redisClient = redisClient;
    this.statsProvider = instance.getStatsProvider();
    this.ticker = new Ticker(() => {
      this.onTick();
    }, 1000);
    this.ticker.runTimer();
  }

  protected onTick(): void {
    const stats = this.statsProvider.getStats();
    this.publish(stats);
  }

  protected publish(stats: Record<string, any>): void {
    const formatted = this.statsProvider.format(stats);
    const { keyIndexRates } = this.instance.getInstanceRedisKeys();
    this.redisClient.hmset(keyIndexRates, formatted, () => void 0);
  }

  quit(cb: ICallback<void>): void {
    this.ticker.once(events.DOWN, cb);
    this.ticker.quit();
  }
}
