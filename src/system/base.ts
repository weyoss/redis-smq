import { v4 as uuid } from 'uuid';
import { EventEmitter } from 'events';
import {
  IConfig,
  IRatesProvider,
  ICallback,
  TInstanceRedisKeys,
  TUnaryFunction,
  TFunction,
} from '../../types';
import * as async from 'async';
import { PowerManager } from './common/power-manager';
import { Logger } from './common/logger';
import * as BunyanLogger from 'bunyan';
import { Rates } from './rates';
import { events } from './common/events';
import { Broker } from './broker';
import { redisKeys } from './common/redis-keys';
import { RedisClient } from './redis-client/redis-client';
import { QueueManager } from './queue-manager/queue-manager';
import { MessageManager } from './message-manager/message-manager';
import { Message } from './message';
import { loadScripts } from './redis-client/lua-scripts';

export abstract class Base extends EventEmitter {
  private broker: Broker | null = null;
  private rates: Rates | null = null;
  private messageManager: MessageManager | null = null;
  private queueManager: QueueManager | null = null;
  private sharedRedisClient: RedisClient | null = null;
  private ratesRedisClient: RedisClient | null = null;

  protected readonly id: string;
  protected readonly queueName: string;
  protected readonly config: IConfig;
  protected readonly logger: BunyanLogger;
  protected readonly powerManager: PowerManager;
  protected readonly redisKeys: TInstanceRedisKeys;

  constructor(queueName: string, config: IConfig) {
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
    Message.setDefaultOptions(config.message);
  }

  private setupSharedRedisClient = (cb: ICallback<RedisClient>): void => {
    RedisClient.getNewInstance(this.config, (err, client) => {
      if (err) cb(err);
      else if (!client) cb(new Error(`Expected an instance of RedisClient`));
      else {
        this.sharedRedisClient = client;
        loadScripts(client, (err) => {
          if (err) cb(err);
          else cb(null, client);
        });
      }
    });
  };

  private setupStats = (cb: ICallback<void>): void => {
    const { monitor } = this.config;
    if (monitor && monitor.enabled) {
      RedisClient.getNewInstance(this.config, (err, client) => {
        if (err) cb(err);
        else if (!client) cb(new Error(`Expected an instance of RedisClient`));
        else {
          this.rates = new Rates(this, client);
          this.ratesRedisClient = client;
          cb();
        }
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
    this.messageManager = new MessageManager(client);
    cb(null, client, this.messageManager);
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

  private setupBroker = (
    client: RedisClient,
    messageManager: MessageManager,
    queueManager: QueueManager,
    cb: ICallback<Broker>,
  ): void => {
    this.broker = new Broker(this.config, messageManager, queueManager);
    cb();
  };

  protected registerEventsHandlers(): void {
    this.on(events.ERROR, (err: Error) => this.handleError(err));
  }

  protected goingUp(): TFunction[] {
    return [
      this.setupSharedRedisClient,
      this.setupMessageManager,
      this.setupQueueManager,
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
      if (this.rates) {
        this.rates.quit(() => {
          this.rates = null;
          this.ratesRedisClient?.halt(() => {
            this.ratesRedisClient = null;
            cb();
          });
        });
      } else cb();
    };
    const stopSharedRedisClient = (cb: ICallback<void>) => {
      this.sharedRedisClient?.halt(() => {
        this.sharedRedisClient = null;
        cb();
      });
    };
    const cleanUp = (cb: ICallback<void>): void => {
      this.queueManager = null;
      this.broker = null;
      cb();
    };
    return [stopMessageManager, stopStats, stopSharedRedisClient, cleanUp];
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

  getSharedRedisClient(cb: TUnaryFunction<RedisClient>): void {
    if (!this.sharedRedisClient)
      this.emit(events.ERROR, new Error('Expected an instance of RedisClient'));
    else cb(this.sharedRedisClient);
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

  abstract getStatsProvider(): IRatesProvider;
}
