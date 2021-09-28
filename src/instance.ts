import { v4 as uuid } from 'uuid';
import { EventEmitter } from 'events';
import { IConfig, IStatsProvider, ICallback } from '../types';
import { PowerManager } from './power-manager';
import { Logger } from './logger';
import * as BunyanLogger from 'bunyan';
import { Stats } from './stats';
import { events } from './events';
import { RedisClient } from './redis-client';
import { Scheduler } from './scheduler';
import { Queue } from './queue';
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
  protected queue: Queue | null = null;

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
    this.on(events.ERROR, (err: Error) => this.error(err));
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
      this.getRedisInstance().end(true);
      this.redisClientInstance = null;
    });
    this.on(events.DOWN, () => {
      this.shutdownFiredEvents = [];
      this.statsInstance = null;
      this.schedulerInstance = null;
    });
    this.on(events.STATS_UP, () => this.handleStartupEvent(events.STATS_UP));
    this.on(events.STATS_DOWN, () =>
      this.handleShutdownEvent(events.STATS_DOWN),
    );
  }

  protected setupStats() {
    const { monitor } = this.config;
    if (monitor && monitor.enabled) {
      const statsProvider = this.getStatsProvider();
      this.statsInstance = new Stats(this, statsProvider);
    }
  }

  protected setupQueues() {
    this.getQueueInstance().setupQueues(this.getQueueName());
    this.getQueueInstance().on(events.SYSTEM_QUEUES_CREATED, () =>
      this.handleStartupEvent(events.SYSTEM_QUEUES_CREATED),
    );
  }

  protected handleStartupEvent(event: string): void {
    this.startupFiredEvents.push(event);
    if (this.bootstrapping) {
      const hasBootstrapped = this.hasBootstrapped();
      if (hasBootstrapped) {
        this.bootstrapping = false;
        this.emit(events.GOING_UP);
      }
    } else {
      const isUp = this.hasGoneUp();
      if (isUp) {
        this.powerManager.commit();
        this.emit(events.UP);
      }
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

  protected hasBootstrapped(): boolean {
    return this.startupFiredEvents.includes(events.SYSTEM_QUEUES_CREATED);
  }

  protected hasGoneUp(): boolean {
    return (
      this.hasBootstrapped() &&
      (!this.statsInstance || this.startupFiredEvents.includes(events.STATS_UP))
    );
  }

  protected hasGoneDown(): boolean {
    return (
      !this.statsInstance ||
      this.shutdownFiredEvents.includes(events.STATS_DOWN)
    );
  }

  error(err: Error): void {
    if (this.powerManager.isRunning()) {
      this.shutdown();
      throw err;
    }
  }

  protected bootstrap(): void {
    this.bootstrapping = true;
    RedisClient.getInstance(this.config, (client) => {
      this.redisClientInstance = client;
      this.queue = new Queue(this.redisClientInstance);
      this.setupStats();
      this.setupQueues();
    });
  }

  protected abstract getStatsProvider(): IStatsProvider;

  run(cb?: ICallback<void>): void {
    this.powerManager.goingUp();
    this.bootstrap();
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

  protected getStatsInstance() {
    if (!this.statsInstance) {
      throw new Error(`Expected an instance of Stats`);
    }
    return this.statsInstance;
  }

  protected getRedisInstance() {
    if (!this.redisClientInstance) {
      throw new Error(`Expected an instance of RedisClient`);
    }
    return this.redisClientInstance;
  }

  protected getQueueInstance() {
    if (!this.queue) {
      throw new Error(`Expected an instance of Queue`);
    }
    return this.queue;
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
    if (!this.queueName) {
      throw new Error('Queue name has not been provided');
    }
    return this.queueName;
  }

  getInstanceRedisKeys() {
    return this.redisKeys;
  }

  getLogger(): BunyanLogger {
    if (!this.loggerInstance) {
      throw new Error(`Expected an instance of Logger`);
    }
    return this.loggerInstance;
  }
}
