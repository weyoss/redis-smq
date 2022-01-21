import { v4 as uuid } from 'uuid';
import { EventEmitter } from 'events';
import { IConfig, ICallback, TUnaryFunction, TFunction } from '../../../types';
import * as async from 'async';
import { PowerManager } from './power-manager/power-manager';
import { Logger } from './logger';
import * as BunyanLogger from 'bunyan';
import { events } from './events';
import { Broker } from './broker';
import { redisKeys } from './redis-keys/redis-keys';
import { RedisClient } from './redis-client/redis-client';
import { MessageManager } from '../message-manager/message-manager';
import { Message } from '../message';
import { EmptyCallbackReplyError } from './errors/empty-callback-reply.error';
import { PanicError } from './errors/panic.error';
import { QueueManager } from '../queue-manager/queue-manager';

export abstract class Base extends EventEmitter {
  protected readonly id: string;
  protected readonly config: IConfig;
  protected readonly logger: BunyanLogger;
  protected readonly powerManager: PowerManager;

  protected broker: Broker | null = null;
  protected sharedRedisClient: RedisClient | null = null;

  constructor(config: IConfig = {}) {
    super();
    if (config.namespace) {
      redisKeys.setNamespace(config.namespace);
    }
    this.id = uuid();
    this.config = config;
    this.powerManager = new PowerManager();
    this.logger = Logger(this.constructor.name, {
      ...this.config.log,
      options: {
        ...this.config.log?.options,
        [this.constructor.name]: this.getId(),
      },
    });
    this.registerEventsHandlers();
    Message.setDefaultOptions(config.message);
  }

  protected setUpSharedRedisClient = (cb: ICallback<void>): void => {
    this.logger.debug(`Set up shared RedisClient instance...`);
    RedisClient.getNewInstance(this.config, (err, client) => {
      if (err) cb(err);
      else if (!client) cb(new EmptyCallbackReplyError());
      else {
        this.sharedRedisClient = client;
        cb();
      }
    });
  };

  protected setUpBroker = (cb: ICallback<void>): void => {
    this.logger.debug(`Set up Broker instance...`);
    if (!this.sharedRedisClient)
      cb(new PanicError(`Expected an instance of RedisClient`));
    else {
      const messageManager = new MessageManager(
        this.sharedRedisClient,
        this.logger,
      );
      const queueManager = new QueueManager(
        this.sharedRedisClient,
        this.logger,
      );
      this.broker = new Broker(messageManager, queueManager, this.logger);
      cb();
    }
  };

  protected tearDownSharedRedisClient = (cb: ICallback<void>): void => {
    this.logger.debug(`Tear down shared RedisClient instance...`);
    if (this.sharedRedisClient) {
      this.sharedRedisClient.halt(() => {
        this.logger.debug(`Shared RedisClient instance has been torn down.`);
        this.sharedRedisClient = null;
        cb();
      });
    } else {
      this.logger.warn(
        `This is not normal. [this.sharedRedisClient] has not been set up. Ignoring...`,
      );
      cb();
    }
  };

  protected tearDownBroker = (cb: ICallback<void>): void => {
    this.logger.debug(`Tear down Broker instance...`);
    if (this.broker) {
      this.broker.quit(() => {
        this.logger.debug(`Broker instance has been torn down.`);
        this.broker = null;
        cb();
      });
    } else {
      this.logger.warn(
        `This is not normal. [this.broker] has not been set up. Ignoring...`,
      );
      cb();
    }
  };

  protected registerEventsHandlers(): void {
    this.on(events.GOING_UP, () => this.logger.info(`Starting up...`));
    this.on(events.UP, () => this.logger.info(`Up and running...`));
    this.on(events.GOING_DOWN, () => this.logger.info(`Shutting down...`));
    this.on(events.DOWN, () => this.logger.info(`Shutdown.`));
    this.on(events.ERROR, (err: Error) => this.handleError(err));
  }

  protected goingUp(): TFunction[] {
    return [this.setUpSharedRedisClient, this.setUpBroker];
  }

  protected up(cb?: ICallback<void>): void {
    this.powerManager.commit();
    this.emit(events.UP);
    cb && cb();
  }

  protected goingDown(): TUnaryFunction<ICallback<void>>[] {
    return [this.tearDownBroker, this.tearDownSharedRedisClient];
  }

  protected down(cb?: ICallback<void>): void {
    this.powerManager.commit();
    this.emit(events.DOWN);
    cb && cb();
  }

  protected getSharedRedisClient(cb: TUnaryFunction<RedisClient>): void {
    if (!this.sharedRedisClient)
      this.emit(
        events.ERROR,
        new PanicError('Expected an instance of RedisClient'),
      );
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
    async.waterfall(tasks, (err) => {
      if (err) {
        if (cb) cb(err);
        else this.emit(events.ERROR, err);
      } else this.up(cb);
    });
  }

  shutdown(cb?: ICallback<void>): void {
    this.powerManager.goingDown();
    this.emit(events.GOING_DOWN);
    const tasks = this.goingDown();
    async.waterfall(tasks, () => {
      // ignoring shutdown errors
      this.down(cb);
    });
  }

  isRunning(): boolean {
    return this.powerManager.isRunning();
  }

  isGoingUp(): boolean {
    return this.powerManager.isGoingUp();
  }

  isGoingDown(): boolean {
    return this.powerManager.isGoingDown();
  }

  isUp(): boolean {
    return this.powerManager.isUp();
  }

  isDown(): boolean {
    return this.powerManager.isDown();
  }

  getBroker(cb: TUnaryFunction<Broker>): void {
    if (!this.broker)
      this.emit(events.ERROR, new PanicError('Expected an instance of Broker'));
    else cb(this.broker);
  }

  getId(): string {
    return this.id;
  }

  getConfig(): IConfig {
    return this.config;
  }
}
