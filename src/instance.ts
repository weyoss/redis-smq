import { v4 as uuid } from 'uuid';
import { EventEmitter } from 'events';
import { IConfig, IStatsProvider, ICallback, TUnitaryFunction } from '../types';
import { PowerManager } from './power-manager';
import { Logger } from './logger';
import * as BunyanLogger from 'bunyan';
import { Stats } from './stats';
import { events } from './events';
import { RedisClient } from './redis-client';
import { Scheduler } from './scheduler';
import { queueHelpers } from './queue-helpers';
import { redisKeys } from './redis-keys';

export abstract class Instance extends EventEmitter {
  protected readonly id: string;
  protected readonly queueName: string;
  protected readonly config: IConfig;
  protected powerManager: PowerManager;
  protected redisKeys: ReturnType<typeof redisKeys['getInstanceKeys']>;
  protected startupFiredEvents: string[] = [];
  protected shutdownFiredEvents: string[] = [];
  protected bootstrapping = false;
  protected schedulerInstance: Scheduler | null = null;
  protected redisClientInstance: RedisClient | null = null;
  protected statsInstance: Stats | null = null;
  protected loggerInstance: BunyanLogger;
  protected statsProvider: IStatsProvider | null = null;

  protected constructor(queueName: string, config: IConfig) {
    super();
    if (config.namespace) {
      redisKeys.setNamespace(config.namespace);
    }
    this.id = uuid();
    this.config = config;
    this.queueName = redisKeys.validateRedisKey(queueName);
    this.redisKeys = redisKeys.getInstanceKeys(
      this.getQueueName(),
      this.getId(),
    );
    this.powerManager = new PowerManager();
    this.loggerInstance = Logger(
      `${this.getQueueName()}:${this.getId()}`,
      this.config.log,
    );
    this.registerEventsHandlers();
  }

  protected registerEventsHandlers() {
    this.on(events.ERROR, (err: Error) => this.handleError(err));
    this.on(events.GOING_UP, () => {
      if (this.statsInstance) this.statsInstance.start();
    });
    this.on(events.UP, () => {
      this.startupFiredEvents = [];
    });
    this.on(events.GOING_DOWN, () => {
      if (this.statsInstance) this.statsInstance.stop();
      if (this.schedulerInstance) {
        this.schedulerInstance.quit();
        this.schedulerInstance = null;
      }
      this.getRedisInstance((client) => {
        client.end(true);
        this.redisClientInstance = null;
      });
    });
    this.on(events.DOWN, () => {
      this.shutdownFiredEvents = [];
      this.statsInstance = null;
      this.schedulerInstance = null;
      this.statsProvider = null;
    });
    this.on(events.STATS_UP, () => this.handleStartupEvent(events.STATS_UP));
    this.on(events.STATS_DOWN, () =>
      this.handleShutdownEvent(events.STATS_DOWN),
    );
  }

  protected setupStats() {
    const { monitor } = this.config;
    if (monitor && monitor.enabled) {
      this.statsInstance = new Stats(this);
    }
  }

  protected setupQueues(client: RedisClient, cb: ICallback<void>) {
    queueHelpers.setupQueues(client, this.getQueueName(), cb);
  }

  protected handleStartupEvent(event: string): void {
    this.startupFiredEvents.push(event);
    const isUp = this.hasGoneUp();
    if (isUp) {
      this.powerManager.commit();
      this.emit(events.UP);
    }
  }

  protected handleShutdownEvent(event: string): void {
    this.shutdownFiredEvents.push(event);
    const isDown = this.hasGoneDown();
    if (isDown) {
      this.powerManager.commit();
      this.emit(events.DOWN);
    }
  }

  protected hasGoneUp(): boolean {
    return (
      !this.statsInstance || this.startupFiredEvents.includes(events.STATS_UP)
    );
  }

  protected hasGoneDown(): boolean {
    return (
      !this.statsInstance ||
      this.shutdownFiredEvents.includes(events.STATS_DOWN)
    );
  }

  handleError(err: Error): void {
    if (this.powerManager.isRunning()) {
      throw err;
    }
  }

  protected bootstrap(cb: ICallback<void>): void {
    RedisClient.getInstance(this.config, (client) => {
      this.redisClientInstance = client;
      this.setupStats();
      this.setupQueues(client, cb);
    });
  }

  abstract getStatsProvider(): IStatsProvider;

  run(cb?: ICallback<void>): void {
    this.powerManager.goingUp();
    this.bootstrapping = true;
    this.bootstrap((err) => {
      if (err) this.handleError(err);
      else {
        this.bootstrapping = false;
        this.emit(events.GOING_UP);
      }
    });
    if (cb) {
      this.once(events.UP, cb);
    }
  }

  shutdown(cb?: ICallback<void>): void {
    this.powerManager.goingDown();
    this.emit(events.GOING_DOWN);
    if (cb) {
      this.once(events.DOWN, cb);
    }
  }

  isBootstrapping(): boolean {
    return this.bootstrapping;
  }

  isRunning(): boolean {
    return this.powerManager.isRunning();
  }

  protected getStatsInstance(cb: TUnitaryFunction<Stats>): void {
    if (!this.statsInstance)
      this.emit(events.ERROR, new Error(`Expected an instance of Stats`));
    else cb(this.statsInstance);
  }

  protected getRedisInstance(cb: TUnitaryFunction<RedisClient>): void {
    if (!this.redisClientInstance)
      this.emit(events.ERROR, new Error(`Expected an instance of RedisClient`));
    else cb(this.redisClientInstance);
  }

  getScheduler(cb: ICallback<Scheduler>) {
    if (!this.schedulerInstance) {
      RedisClient.getInstance(this.config, (client) => {
        this.schedulerInstance = new Scheduler(this.queueName, client);
        this.schedulerInstance.once(events.SCHEDULER_QUIT, () => {
          this.schedulerInstance = null;
        });
        cb(null, this.schedulerInstance);
      });
    } else cb(null, this.schedulerInstance);
  }

  getId() {
    return this.id;
  }

  getConfig() {
    return this.config;
  }

  getQueueName() {
    return this.queueName;
  }

  getInstanceRedisKeys() {
    return this.redisKeys;
  }
}
