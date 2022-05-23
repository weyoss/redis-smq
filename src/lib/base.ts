import { v4 as uuid } from 'uuid';
import { EventEmitter } from 'events';
import {
  ICallback,
  TUnaryFunction,
  TFunction,
  IRequiredConfig,
  ICompatibleLogger,
} from '../../types';
import { PowerManager } from '../common/power-manager/power-manager';
import { events } from '../common/events/events';
import { RedisClient } from '../common/redis-client/redis-client';
import { EmptyCallbackReplyError } from '../common/errors/empty-callback-reply.error';
import { PanicError } from '../common/errors/panic.error';
import { getConfiguration } from '../config/configuration';
import { getNamespacedLogger } from '../common/logger/logger';
import { waterfall } from '../common/async/async';
import { disablePluginRegistration } from '../plugins/plugins';

export abstract class Base extends EventEmitter {
  protected readonly id: string;
  protected readonly powerManager: PowerManager;
  protected sharedRedisClient: RedisClient | null = null;
  protected logger: ICompatibleLogger;

  constructor() {
    super();
    this.id = uuid();
    this.powerManager = new PowerManager(false);
    this.logger = getNamespacedLogger(
      `${this.constructor.name}/${this.getId()}`,
    );
    this.registerEventsHandlers();
    disablePluginRegistration();
  }

  protected setUpSharedRedisClient = (cb: ICallback<void>): void => {
    RedisClient.getNewInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new EmptyCallbackReplyError());
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
      throw new PanicError('Expected an instance of RedisClient');
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
        waterfall(tasks, (err) => {
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
        waterfall(tasks, () => {
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
    return getConfiguration();
  }
}
