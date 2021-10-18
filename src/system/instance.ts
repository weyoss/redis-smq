import { v4 as uuid } from 'uuid';
import { EventEmitter } from 'events';
import {
  IConfig,
  IStatsProvider,
  ICallback,
  TInstanceRedisKeys,
  TUnaryFunction,
  TFunction,
} from '../../types';
import * as async from 'async';
import { PowerManager } from './power-manager';
import { Logger } from './logger';
import * as BunyanLogger from 'bunyan';
import { Stats } from './stats';
import { events } from './events';
import { Scheduler } from './scheduler';
import { Broker } from './broker';
import { redisKeys } from './redis-keys';
import { RedisClient } from './redis-client';
import { QueueManager } from './queue-manager';
import { MessageManager } from './message-manager';

export abstract class Instance extends EventEmitter {
  private broker: Broker | null = null;
  private stats: Stats | null = null;
  private scheduler: Scheduler | null = null;
  private messageManager: MessageManager | null = null;
  private queueManager: QueueManager | null = null;
  private commonRedisClient: RedisClient | null = null;
  private statsRedisClient: RedisClient | null = null;

  protected readonly id: string;
  protected readonly queueName: string;
  protected readonly config: IConfig;
  protected readonly logger: BunyanLogger;
  protected readonly powerManager: PowerManager;
  protected readonly redisKeys: TInstanceRedisKeys;

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
    this.logger = Logger(
      `${this.getQueueName()}:${this.getId()}`,
      this.config.log,
    );
    this.registerEventsHandlers();
  }

  private setupCommonRedisClient = (cb: ICallback<RedisClient>): void => {
    RedisClient.getNewInstance(this.config, (client) => {
      this.commonRedisClient = client;
      cb(null, client);
    });
  };

  private setupStats = (cb: ICallback<void>): void => {
    const { monitor } = this.config;
    if (monitor && monitor.enabled) {
      RedisClient.getNewInstance(this.config, (client) => {
        this.stats = new Stats(this, client);
        this.statsRedisClient = client;
        cb();
      });
    } else cb();
  };

  private setupMessageManager = (
    client: RedisClient,
    cb: (
      err?: Error | null,
      client?: RedisClient,
      messageManager?: MessageManager,
    ) => void,
  ): void => {
    const messageManager = new MessageManager(client);
    this.messageManager = messageManager;
    messageManager.bootstrap((err) => {
      if (err) cb(err);
      else cb(null, client, messageManager);
    });
  };

  private setupQueueManager = (
    client: RedisClient,
    messageManager: MessageManager,
    cb: (
      err?: Error | null,
      client?: RedisClient,
      messageManager?: MessageManager,
      queueManager?: QueueManager,
    ) => void,
  ): void => {
    const queueManager = new QueueManager(client);
    this.queueManager = queueManager;
    queueManager.bootstrap(this, (err) => {
      if (err) cb(err);
      else cb(null, client, messageManager, queueManager);
    });
  };

  private setupScheduler = (
    client: RedisClient,
    messageManager: MessageManager,
    queueManager: QueueManager,
    cb: (
      err?: Error | null,
      client?: RedisClient,
      messageManager?: MessageManager,
      queueManager?: QueueManager,
      scheduler?: Scheduler,
    ) => void,
  ): void => {
    this.scheduler = new Scheduler(this.queueName, client);
    cb(null, client, messageManager, queueManager, this.scheduler);
  };

  private setupBroker = (
    client: RedisClient,
    messageManager: MessageManager,
    queueManager: QueueManager,
    scheduler: Scheduler,
    cb: ICallback<Broker>,
  ): void => {
    this.broker = new Broker(
      this.config,
      scheduler,
      messageManager,
      queueManager,
    );
    cb();
  };

  protected registerEventsHandlers(): void {
    this.on(events.ERROR, (err: Error) => this.handleError(err));
  }

  protected goingUp(): TFunction[] {
    return [
      this.setupCommonRedisClient,
      this.setupMessageManager,
      this.setupQueueManager,
      this.setupScheduler,
      this.setupBroker,
      this.setupStats,
    ];
  }

  protected goingDown(): TUnaryFunction<ICallback<void>>[] {
    const stopMessageManager = (cb: ICallback<void>) => {
      if (this.messageManager) {
        this.messageManager.quit(() => {
          this.messageManager = null;
          cb();
        });
      } else cb();
    };
    const stopStats = (cb: ICallback<void>) => {
      if (this.stats) {
        this.stats.quit(() => {
          this.stats = null;
          this.statsRedisClient?.halt(() => {
            this.statsRedisClient = null;
            cb();
          });
        });
      } else cb();
    };
    const stopCommonRedisClient = (cb: ICallback<void>) => {
      this.commonRedisClient?.halt(() => {
        this.commonRedisClient = null;
        cb();
      });
    };
    const cleanUp = (cb: ICallback<void>): void => {
      this.queueManager = null;
      this.broker = null;
      this.scheduler = null;
      cb();
    };
    return [stopMessageManager, stopStats, stopCommonRedisClient, cleanUp];
  }

  protected getScheduler(cb: ICallback<Scheduler>): void {
    if (!this.scheduler)
      this.emit(events.ERROR, new Error('Expected an instance of Scheduler'));
    else cb(null, this.scheduler);
  }

  handleError(err: Error): void {
    if (this.powerManager.isGoingUp() || this.powerManager.isRunning()) {
      throw err;
    }
  }

  run(cb?: ICallback<void>): void {
    this.powerManager.goingUp();
    this.emit(events.GOING_UP);
    const tasks = this.goingUp();
    async.waterfall(tasks, () => {
      this.powerManager.commit();
      this.emit(events.UP);
      cb && cb();
    });
  }

  shutdown(cb?: ICallback<void>): void {
    this.powerManager.goingDown();
    this.emit(events.GOING_DOWN);
    const tasks = this.goingDown();
    async.waterfall(tasks, () => {
      this.powerManager.commit();
      this.emit(events.DOWN);
      cb && cb();
    });
  }

  isRunning(): boolean {
    return this.powerManager.isRunning();
  }

  getBroker(cb: TUnaryFunction<Broker>): void {
    if (!this.broker)
      this.emit(events.ERROR, new Error('Expected an instance of Broker'));
    else cb(this.broker);
  }

  getCommonRedisClient(cb: TUnaryFunction<RedisClient>): void {
    if (!this.commonRedisClient)
      this.emit(events.ERROR, new Error('Expected an instance of RedisClient'));
    else cb(this.commonRedisClient);
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

  getRedisKeys(): TInstanceRedisKeys {
    return this.redisKeys;
  }

  abstract getStatsProvider(): IStatsProvider;
}
