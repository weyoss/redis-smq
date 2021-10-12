import { v4 as uuid } from 'uuid';
import { EventEmitter } from 'events';
import {
  IConfig,
  IStatsProvider,
  ICallback,
  TInstanceRedisKeys,
} from '../types';
import { PowerManager } from './power-manager';
import { Logger } from './logger';
import * as BunyanLogger from 'bunyan';
import { Stats } from './stats';
import { events } from './events';
import { Scheduler } from './scheduler';
import { Broker } from './broker';
import { redisKeys } from './redis-keys';

export abstract class Instance extends EventEmitter {
  protected readonly id: string;
  protected readonly queueName: string;
  protected readonly config: IConfig;
  protected powerManager: PowerManager;
  protected redisKeys: TInstanceRedisKeys;
  protected startupFiredEvents: string[] = [];
  protected shutdownFiredEvents: string[] = [];
  protected statsInstance: Stats | null = null;
  protected loggerInstance: BunyanLogger;
  protected statsProvider: IStatsProvider | null = null;
  protected broker: Broker;

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
    this.broker = new Broker(this);
    this.setupStats();
    this.registerEventsHandlers();
  }

  protected registerEventsHandlers(): void {
    this.on(events.ERROR, (err: Error) => this.handleError(err));
    this.on(events.GOING_UP, () => {
      this.broker.start();
      if (this.statsInstance) this.statsInstance.start();
    });
    this.on(events.UP, () => {
      this.startupFiredEvents = [];
    });
    this.on(events.GOING_DOWN, () => {
      if (this.statsInstance) this.statsInstance.stop();
    });
    this.on(events.DOWN, () => {
      this.shutdownFiredEvents = [];
    });
    this.on(events.STATS_UP, () => this.handleStartupEvent(events.STATS_UP));
    this.on(events.STATS_DOWN, () =>
      this.handleShutdownEvent(events.STATS_DOWN),
    );
    this.on(events.BROKER_UP, () => this.handleStartupEvent(events.BROKER_UP));
  }

  protected setupStats(): void {
    const { monitor } = this.config;
    if (monitor && monitor.enabled) {
      this.statsInstance = new Stats(this);
    }
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
    const isReady = this.isReadyToGoDown();
    if (isReady) {
      this.once(events.BROKER_DOWN, () => {
        this.powerManager.commit();
        this.emit(events.DOWN);
      });

      // shutdown the broker as the last step
      this.getBroker().stop();
    }
  }

  protected hasGoneUp(): boolean {
    return (
      this.startupFiredEvents.includes(events.BROKER_UP) &&
      (!this.statsInstance || this.startupFiredEvents.includes(events.STATS_UP))
    );
  }

  protected isReadyToGoDown(): boolean {
    return (
      !this.statsInstance ||
      this.shutdownFiredEvents.includes(events.STATS_DOWN)
    );
  }

  abstract getStatsProvider(): IStatsProvider;

  handleError(err: Error): void {
    if (!this.powerManager.isGoingDown()) {
      throw err;
    }
  }

  run(cb?: ICallback<void>): void {
    this.powerManager.goingUp();
    this.emit(events.GOING_UP);
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

  isRunning(): boolean {
    return this.powerManager.isRunning();
  }

  getBroker(): Broker {
    return this.broker;
  }

  getScheduler(cb: ICallback<Scheduler>): void {
    this.broker.getScheduler(cb);
  }

  getId(): string {
    return this.id;
  }

  getConfig(): IConfig {
    return this.config;
  }

  getQueueName(): string {
    return this.queueName;
  }

  getInstanceRedisKeys(): TInstanceRedisKeys {
    return this.redisKeys;
  }
}
