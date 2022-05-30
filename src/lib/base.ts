import { v4 as uuid } from 'uuid';
import { EventEmitter } from 'events';
import { IConfig, IRequiredConfig } from '../../types';
import { events } from '../common/events/events';
import { getConfiguration } from '../config/configuration';
import {
  async,
  createClientInstance,
  errors,
  logger,
  PowerManager,
  RedisClient,
} from 'redis-smq-common';
import { disablePluginRegistration } from '../plugins/plugins';
import {
  ICallback,
  ICompatibleLogger,
  TFunction,
  TUnaryFunction,
} from 'redis-smq-common/dist/types';

export abstract class Base extends EventEmitter {
  protected readonly id: string;
  protected readonly powerManager: PowerManager;
  protected sharedRedisClient: RedisClient | null = null;
  protected logger: ICompatibleLogger;
  protected config: IRequiredConfig;

  constructor(config: IConfig) {
    super();
    this.id = uuid();
    this.powerManager = new PowerManager(false);
    this.config = getConfiguration(config);
    this.logger = logger.getNamespacedLogger(
      this.config.logger,
      `${this.constructor.name.toLowerCase()}:${this.id}`,
    );
    this.registerEventsHandlers();
    disablePluginRegistration();
  }

  protected setUpSharedRedisClient = (cb: ICallback<void>): void => {
    createClientInstance(this.config.redis, (err, client) => {
      if (err) cb(err);
      else if (!client) cb(new errors.EmptyCallbackReplyError());
      else {
        this.sharedRedisClient = client;
        cb();
      }
    });
  };

  protected tearDownSharedRedisClient = (cb: ICallback<void>): void => {
    if (this.sharedRedisClient) {
      this.sharedRedisClient.halt(() => {
        this.sharedRedisClient = null;
        cb();
      });
    } else cb();
  };

  protected registerEventsHandlers(): void {
    this.on(events.GOING_UP, () => this.logger.info(`Going up...`));
    this.on(events.UP, () => this.logger.info(`Up and running...`));
    this.on(events.GOING_DOWN, () => this.logger.info(`Going down...`));
    this.on(events.DOWN, () => this.logger.info(`Down.`));
    this.on(events.ERROR, (err: Error) => this.handleError(err));
  }

  protected goingUp(): TFunction[] {
    return [this.setUpSharedRedisClient];
  }

  protected up(cb?: ICallback<boolean>): void {
    this.powerManager.commit();
    this.emit(events.UP);
    cb && cb(null, true);
  }

  protected goingDown(): TUnaryFunction<ICallback<void>>[] {
    return [this.tearDownSharedRedisClient];
  }

  protected down(cb?: ICallback<boolean>): void {
    this.powerManager.commit();
    this.emit(events.DOWN);
    cb && cb(null, true);
  }

  protected getSharedRedisClient(): RedisClient {
    if (!this.sharedRedisClient)
      throw new errors.PanicError('Expected an instance of RedisClient');
    return this.sharedRedisClient;
  }

  handleError(err: Error): void {
    if (this.powerManager.isGoingUp() || this.powerManager.isRunning()) {
      throw err;
    }
  }

  run(cb?: ICallback<boolean>): void {
    if (this.powerManager.isGoingDown()) {
      this.once(events.DOWN, () => this.run(cb));
    } else {
      const r = this.powerManager.goingUp();
      if (r) {
        this.emit(events.GOING_UP);
        const tasks = this.goingUp();
        async.waterfall(tasks, (err) => {
          if (err) {
            if (cb) cb(err);
            else this.emit(events.ERROR, err);
          } else this.up(cb);
        });
      } else {
        cb && cb(null, r);
      }
    }
  }

  shutdown(cb?: ICallback<boolean>): void {
    if (this.powerManager.isGoingUp()) {
      this.once(events.UP, () => this.shutdown(cb));
    } else {
      const r = this.powerManager.goingDown();
      if (r) {
        this.emit(events.GOING_DOWN);
        const tasks = this.goingDown();
        async.waterfall(tasks, () => {
          // ignoring shutdown errors
          this.down(cb);
        });
      } else cb && cb(null, r);
    }
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

  getId(): string {
    return this.id;
  }

  getConfig(): IRequiredConfig {
    return this.config;
  }
}
