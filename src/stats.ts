import { IConfig, IStatsProvider } from '../types';
import { PowerManager } from './power-manager';
import { Instance } from './instance';
import { events } from './events';
import { Ticker } from './ticker';
import { RedisClient } from './redis-client';

export class Stats {
  protected instance: Instance;
  protected config: IConfig;
  protected powerManager: PowerManager;
  protected statsProvider: IStatsProvider;
  protected redisClientInstance: RedisClient | null = null;
  protected ticker: Ticker | null = null;

  constructor(instance: Instance, statsProvider: IStatsProvider) {
    this.instance = instance;
    this.config = instance.getConfig();
    this.powerManager = new PowerManager();
    this.statsProvider = statsProvider;
  }

  protected getRedisClientInstance() {
    if (!this.redisClientInstance) {
      throw new Error(`Expected an instance of RedisInstance`);
    }
    return this.redisClientInstance;
  }

  protected getTicker() {
    if (!this.ticker) {
      throw new Error(`Expected an instance of Ticker`);
    }
    return this.ticker;
  }

  protected onTick() {
    if (this.powerManager.isRunning()) {
      const stats = this.statsProvider.tick();
      this.statsProvider.publish(this.getRedisClientInstance(), stats);
    }
    if (this.powerManager.isGoingDown()) {
      this.instance.emit(events.STATS_READY_TO_SHUTDOWN);
    }
  }

  start() {
    this.powerManager.goingUp();
    RedisClient.getInstance(this.config, (c) => {
      this.redisClientInstance = c;
      this.ticker = new Ticker(() => {
        this.onTick();
      }, 1000);
      this.ticker.runTimer();
      this.powerManager.commit();
      this.instance.emit(events.STATS_UP);
    });
  }

  stop() {
    this.powerManager.goingDown();
    this.instance.once(events.STATS_READY_TO_SHUTDOWN, () => {
      this.getTicker().shutdown(() => {
        this.getRedisClientInstance().end(true);
        this.redisClientInstance = null;
        this.powerManager.commit();
        this.instance.emit(events.STATS_DOWN);
      });
    });
  }
}
