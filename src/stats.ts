import { IConfig, IStatsProvider, TCompatibleRedisClient } from '../types';
import { PowerManager } from './power-manager';
import { ChildProcess, fork } from 'child_process';
import { Instance } from './instance';
import { events } from './events';
import { resolve } from 'path';
import { Ticker } from './ticker';
import { RedisClient } from './redis-client';

export class Stats {
  protected instance: Instance;
  protected config: IConfig;
  protected powerManager: PowerManager;
  protected statsProvider: IStatsProvider;
  protected redisClientInstance: TCompatibleRedisClient | null = null;
  protected statsAggregatorThread: ChildProcess | null = null;
  protected ticker: Ticker | null = null;

  constructor(instance: Instance, statsProvider: IStatsProvider) {
    this.instance = instance;
    this.config = instance.getConfig();
    this.powerManager = new PowerManager();
    this.statsProvider = statsProvider;
  }

  protected getRedisClientInstance() {
    if (!this.redisClientInstance) {
      throw new Error();
    }
    return this.redisClientInstance;
  }

  protected getTicker() {
    if (!this.ticker) {
      throw new Error();
    }
    return this.ticker;
  }

  start() {
    this.powerManager.goingUp();
    RedisClient.getNewInstance(this.config, (c: TCompatibleRedisClient) => {
      this.redisClientInstance = c;
      this.ticker = new Ticker(() => {
        const stats = this.statsProvider.tick();
        this.statsProvider.publish(this.getRedisClientInstance(), stats);
      }, 1000);
      this.ticker.autoRun();
      this.powerManager.commit();
      this.instance.emit(events.STATS_UP);
    });
  }

  startAggregator() {
    this.statsAggregatorThread = fork(
      resolve(`${__dirname}/stats-aggregator.js`),
    );
    this.statsAggregatorThread.on('error', (err) => {
      this.instance.error(err);
    });
    this.statsAggregatorThread.on('exit', (code, signal) => {
      const err = new Error(
        `statsAggregatorThread exited with code ${code} and signal ${signal}`,
      );
      this.instance.error(err);
    });
    this.statsAggregatorThread.send(JSON.stringify(this.config));
  }

  stopAggregator() {
    if (this.statsAggregatorThread) {
      this.statsAggregatorThread.kill('SIGHUP');
      this.statsAggregatorThread = null;
    }
  }

  stop() {
    this.powerManager.goingDown();
    this.stopAggregator();
    this.getTicker().shutdown(() => {
      this.getRedisClientInstance().end(true);
      this.redisClientInstance = null;
      this.powerManager.commit();
      this.instance.emit(events.STATS_DOWN);
    });
  }
}
