import { IConfig, IStatsProvider, TUnaryFunction } from '../types';
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

  constructor(instance: Instance) {
    this.instance = instance;
    this.config = instance.getConfig();
    this.statsProvider = instance.getStatsProvider();
    this.powerManager = new PowerManager();
  }

  protected getRedisClientInstance(cb: TUnaryFunction<RedisClient>): void {
    if (!this.redisClientInstance)
      this.instance.emit(
        events.ERROR,
        new Error(`Expected an instance of RedisInstance`),
      );
    else cb(this.redisClientInstance);
  }

  protected getTicker(cb: TUnaryFunction<Ticker>): void {
    if (!this.ticker)
      this.instance.emit(
        events.ERROR,
        new Error(`Expected an instance of Ticker`),
      );
    else cb(this.ticker);
  }

  protected onTick() {
    if (this.powerManager.isRunning()) {
      const stats = this.statsProvider.tick();
      this.getRedisClientInstance((client) => {
        this.statsProvider.publish(client, stats);
      });
    }
    if (this.powerManager.isGoingDown()) {
      this.instance.emit(events.STATS_READY_TO_SHUTDOWN);
    }
  }

  protected setupTicker() {
    this.ticker = new Ticker(() => {
      this.onTick();
    }, 1000);
    this.ticker.on(events.ERROR, (err: Error) =>
      this.instance.emit(events.ERROR, err),
    );
    this.ticker.runTimer();
  }

  start() {
    this.powerManager.goingUp();
    RedisClient.getInstance(this.config, (client) => {
      this.redisClientInstance = client;
      this.setupTicker();
      this.powerManager.commit();
      this.instance.emit(events.STATS_UP);
    });
  }

  stop() {
    this.powerManager.goingDown();
    this.instance.once(events.STATS_READY_TO_SHUTDOWN, () => {
      this.getTicker((ticker) => {
        ticker.shutdown();
        this.getRedisClientInstance((client) => {
          client.end(true);
          this.redisClientInstance = null;
          this.powerManager.commit();
          this.instance.emit(events.STATS_DOWN);
        });
      });
    });
  }
}
