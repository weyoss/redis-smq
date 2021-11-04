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
  protected readonly id: string;
  protected readonly queueName: string;
  protected readonly config: IConfig;
  protected readonly logger: BunyanLogger;
  protected readonly powerManager: PowerManager;
  protected readonly redisKeys: TInstanceRedisKeys;
  protected broker: Broker | null = null;
  protected rates: Rates | null = null;
  protected sharedRedisClient: RedisClient | null = null;

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

  private setupRates = (cb: ICallback<void>): void => {
    const { monitor } = this.config;
    if (monitor && monitor.enabled) {
      if (!this.sharedRedisClient)
        cb(new Error(`Expected an instance of RedisClient`));
      else {
        this.rates = new Rates(this, this.sharedRedisClient);
        cb();
      }
    } else cb();
  };

  private registerQueues = (
    messageManager: MessageManager,
    cb: ICallback<void>,
  ): void => {
    if (!this.sharedRedisClient)
      cb(new Error(`Expected an instance of RedisClient`));
    else QueueManager.registerQueues(this, this.sharedRedisClient, cb);
  };

  private setupBroker = (cb: ICallback<Broker>): void => {
    if (!this.sharedRedisClient)
      cb(new Error(`Expected an instance of RedisClient`));
    else {
      const messageManager = new MessageManager(this.sharedRedisClient);
      this.broker = new Broker(this.config, messageManager);
      cb();
    }
  };

  protected registerEventsHandlers(): void {
    this.on(events.ERROR, (err: Error) => this.handleError(err));
  }

  protected goingUp(): TFunction[] {
    return [
      this.setupSharedRedisClient,
      this.registerQueues,
      this.setupBroker,
      this.setupRates,
    ];
  }

  protected goingDown(): TUnaryFunction<ICallback<void>>[] {
    const stopSharedRedisClient = (cb: ICallback<void>) => {
      if (this.sharedRedisClient) {
        this.sharedRedisClient.halt(() => {
          this.sharedRedisClient = null;
          cb();
        });
      } else cb();
    };
    const stopRates = (cb: ICallback<void>) => {
      if (this.rates) {
        this.rates.quit(() => {
          this.rates = null;
          cb();
        });
      } else cb();
    };
    const stopBroker = (cb: ICallback<void>): void => {
      if (this.broker) {
        this.broker.quit(() => {
          this.broker = null;
          cb();
        });
      } else cb();
    };
    return [stopBroker, stopRates, stopSharedRedisClient];
  }

  protected getSharedRedisClient(cb: TUnaryFunction<RedisClient>): void {
    if (!this.sharedRedisClient)
      this.emit(events.ERROR, new Error('Expected an instance of RedisClient'));
    else cb(this.sharedRedisClient);
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
