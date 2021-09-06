import * as async from 'neo-async';
import { v4 as uuid } from 'uuid';
import { EventEmitter } from 'events';
import {
  IConfig,
  IStatsProvider,
  TCallback,
  TCompatibleRedisClient,
} from '../types';
import { PowerManager } from './power-manager';
import { Logger } from './logger';
import * as BunyanLogger from 'bunyan';
import { Scheduler } from './scheduler';
import { MQRedisKeys } from './redis-keys/mq-redis-keys';
import { Stats } from './stats';
import { events } from './events';
import { RedisClient } from './redis-client';

export abstract class Instance extends EventEmitter {
  protected readonly id: string;
  protected readonly queueName: string | null = null;
  protected readonly config: IConfig;
  protected powerManager: PowerManager;
  protected startupFiredEvents: string[] = [];
  protected shutdownFiredEvents: string[] = [];
  protected bootstrapping = false;
  protected schedulerInstance: Scheduler | null = null;
  protected redisClientInstance: TCompatibleRedisClient | null = null;
  protected statsInstance: Stats | null = null;
  protected instanceRedisKeys: Record<string, string> | null = null;
  protected redisKeys: MQRedisKeys | null = null;
  protected loggerInstance: BunyanLogger;

  constructor(queueName: string, config: IConfig) {
    super();
    this.id = uuid();
    this.config = config;
    this.queueName = MQRedisKeys.validateRedisKey(queueName);
    this.powerManager = new PowerManager();
    if (config.namespace) {
      MQRedisKeys.setNamespace(config.namespace);
    }
    this.loggerInstance = Logger(
      `${this.getQueueName()}:${this.getId()}`,
      this.config.log,
    );
    this.registerEventsHandlers();
  }

  protected registerEventsHandlers() {
    this.on(events.ERROR, (err: Error) => this.error(err));
    this.on(events.BOOTSTRAP_REDIS_CLIENT, () => this.setupQueues());
    this.on(events.BOOTSTRAP_SYSTEM_QUEUES, () => this.completeBootstrap());
    this.on(events.BOOTSTRAP_SUCCESS, () => {
      this.bootstrapping = false;
      this.emit(events.GOING_UP);
    });
    this.on(events.GOING_UP, () => {
      this.getScheduler().start();
      if (this.statsInstance) this.statsInstance.start();
    });
    this.on(events.UP, () => {
      this.startupFiredEvents = [];
    });
    this.on(events.GOING_DOWN, () => {
      if (this.statsInstance) this.statsInstance.stop();
      this.getScheduler().stop();
      this.getRedisInstance().end(true);
      this.redisClientInstance = null;
    });
    this.on(events.DOWN, () => {
      this.shutdownFiredEvents = [];
      this.statsInstance = null;
      this.schedulerInstance = null;
    });
    this.on(events.SCHEDULER_UP, () =>
      this.handleStartupEvent(events.SCHEDULER_UP),
    );
    this.on(events.SCHEDULER_DOWN, () =>
      this.handleShutdownEvent(events.SCHEDULER_DOWN),
    );
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

  protected setupScheduler() {
    this.schedulerInstance = new Scheduler(this);
  }

  protected setupRedisClient(): void {
    RedisClient.getNewInstance(
      this.config,
      (client: TCompatibleRedisClient) => {
        this.redisClientInstance = client;
        this.emit(events.BOOTSTRAP_REDIS_CLIENT);
      },
    );
  }

  protected setupQueues(): void {
    const redis = this.getRedisInstance();
    const { keyIndexQueue, keyQueue, keyQueueDLQ, keyIndexQueueDLQ } =
      this.getInstanceRedisKeys();
    const rememberDLQ = (cb: TCallback<void>) => {
      redis.sadd(keyIndexQueueDLQ, keyQueueDLQ, (err) => {
        if (err) cb(err);
        else cb();
      });
    };
    const rememberQueue = (cb: TCallback<void>) => {
      redis.sadd(keyIndexQueue, keyQueue, (err) => {
        if (err) cb(err);
        else cb();
      });
    };
    async.parallel([rememberQueue, rememberDLQ], (err?: Error | null) => {
      if (err) this.error(err);
      else this.emit(events.BOOTSTRAP_SYSTEM_QUEUES);
    });
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
      this.startupFiredEvents.includes(events.SCHEDULER_UP) &&
      (!this.statsInstance || this.startupFiredEvents.includes(events.STATS_UP))
    );
  }

  protected hasGoneDown(): boolean {
    return (
      this.shutdownFiredEvents.includes(events.SCHEDULER_DOWN) &&
      (!this.statsInstance ||
        this.shutdownFiredEvents.includes(events.STATS_DOWN))
    );
  }

  error(err: Error): void {
    if (this.powerManager.isRunning()) {
      this.shutdown();
      throw err;
    }
  }

  /**
   * Overwrite this method to do extra bootstrapping before starting up
   * This method should always emit 'BOOTSTRAP_SUCCESS' once bootstrap completed
   */
  protected completeBootstrap(): void {
    this.emit(events.BOOTSTRAP_SUCCESS);
  }

  protected bootstrap(): void {
    this.bootstrapping = true;
    this.setupStats();
    this.setupScheduler();
    this.setupRedisClient();
  }

  protected abstract getStatsProvider(): IStatsProvider;

  run(): void {
    this.powerManager.goingUp();
    this.bootstrap();
  }

  shutdown(): void {
    this.powerManager.goingDown();
    this.emit(events.GOING_DOWN);
  }

  isBootstrapping(): boolean {
    return this.bootstrapping;
  }

  isRunning(): boolean {
    return this.powerManager.isRunning();
  }

  protected getStatsInstance() {
    if (!this.statsInstance) {
      throw new Error();
    }
    return this.statsInstance;
  }

  protected getRedisInstance() {
    if (!this.redisClientInstance) {
      throw new Error();
    }
    return this.redisClientInstance;
  }

  getScheduler() {
    if (!this.schedulerInstance) {
      throw new Error();
    }
    return this.schedulerInstance;
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
    if (!this.instanceRedisKeys) {
      if (!this.redisKeys) {
        throw new Error();
      }
      this.instanceRedisKeys = this.redisKeys.getKeys();
    }
    return this.instanceRedisKeys;
  }

  getLogger(): BunyanLogger {
    if (!this.loggerInstance) {
      throw new Error();
    }
    return this.loggerInstance;
  }

  static getMessageQueues(
    redisClient: TCompatibleRedisClient,
    cb: TCallback<string[]>,
  ): void {
    const { keyIndexQueue } = MQRedisKeys.getGlobalKeys();
    redisClient.smembers(keyIndexQueue, cb);
  }

  static getDLQQueues(
    redisClient: TCompatibleRedisClient,
    cb: TCallback<string[]>,
  ): void {
    const { keyIndexQueueDLQ } = MQRedisKeys.getGlobalKeys();
    redisClient.smembers(keyIndexQueueDLQ, cb);
  }
}
