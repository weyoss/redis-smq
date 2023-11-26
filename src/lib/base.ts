/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { v4 as uuid } from 'uuid';
import { IEventListener } from '../../types';
import {
  async,
  redis,
  logger,
  PowerSwitch,
  RedisClient,
  ICallback,
  TFunction,
  TUnaryFunction,
  ILogger,
  CallbackEmptyReplyError,
  PanicError,
  EventEmitter,
} from 'redis-smq-common';
import { Configuration } from '../config/configuration';
import { TRedisSMQEvent } from '../../types';

export abstract class Base extends EventEmitter<TRedisSMQEvent> {
  protected readonly id: string;
  protected readonly powerSwitch: PowerSwitch;
  protected sharedRedisClient: RedisClient | null = null;
  protected logger: ILogger;
  protected eventListeners: IEventListener[] = [];

  constructor() {
    super();
    this.id = uuid();
    this.powerSwitch = new PowerSwitch(false);
    this.logger = logger.getLogger(
      Configuration.getSetConfig().logger,
      `${this.constructor.name.toLowerCase()}:${this.id}`,
    );
    this.registerSystemEventListeners();
  }

  protected setUpSharedRedisClient = (cb: ICallback<void>): void => {
    redis.createInstance(Configuration.getSetConfig().redis, (err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
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

  protected registerSystemEventListeners(): void {
    this.on('goingUp', () => this.logger.info(`Going up...`));
    this.on('up', () => this.logger.info(`Up and running...`));
    this.on('goingDown', () => this.logger.info(`Going down...`));
    this.on('down', () => this.logger.info(`Down.`));
    this.on('error', (err: Error) => this.handleError(err));
  }

  protected goingUp(): TFunction[] {
    return [this.setUpSharedRedisClient];
  }

  protected up(cb?: ICallback<boolean>): void {
    this.powerSwitch.commit();
    this.emit('up');
    cb && cb(null, true);
  }

  protected goingDown(): TUnaryFunction<ICallback<void>>[] {
    return [this.tearDownEventListeners, this.tearDownSharedRedisClient];
  }

  protected down(cb?: ICallback<boolean>): void {
    this.powerSwitch.commit();
    this.emit('down');
    cb && cb(null, true);
  }

  protected getSharedRedisClient(): RedisClient {
    if (!this.sharedRedisClient)
      throw new PanicError('Expected an instance of RedisClient');
    return this.sharedRedisClient;
  }

  protected registerEventListeners(
    Ctors: (new () => IEventListener)[],
    cb: ICallback<void>,
  ): void {
    async.eachOf(
      Ctors,
      (ctor, key, done) => {
        const instance = new ctor();
        instance.init(
          {
            instanceId: this.id,
            eventProvider: this,
          },
          (err) => {
            if (err) done(err);
            else {
              this.eventListeners.push(instance);
              done();
            }
          },
        );
      },
      cb,
    );
  }

  protected tearDownEventListeners = (cb: ICallback<void>): void => {
    async.each(
      this.eventListeners,
      (listener, index, done) => listener.quit(done),
      (err) => {
        if (err) cb(err);
        else {
          this.eventListeners = [];
          cb();
        }
      },
    );
  };

  handleError(err: Error): void {
    if (this.powerSwitch.isGoingUp() || this.powerSwitch.isRunning()) {
      throw err;
    }
  }

  run(cb?: ICallback<boolean>): void {
    const r = this.powerSwitch.goingUp();
    if (r) {
      this.emit('goingUp');
      const tasks = this.goingUp();
      async.waterfall(tasks, (err) => {
        if (err) {
          if (cb) cb(err);
          else this.emit('error', err);
        } else this.up(cb);
      });
    } else {
      cb && cb(null, r);
    }
  }

  shutdown(cb?: ICallback<boolean>): void {
    const r = this.powerSwitch.goingDown();
    if (r) {
      this.emit('goingDown');
      const tasks = this.goingDown();
      async.waterfall(tasks, () => {
        // ignoring shutdown errors
        this.down(cb);
      });
    } else cb && cb(null, r);
  }

  isRunning(): boolean {
    return this.powerSwitch.isRunning();
  }

  isGoingUp(): boolean {
    return this.powerSwitch.isGoingUp();
  }

  isGoingDown(): boolean {
    return this.powerSwitch.isGoingDown();
  }

  isUp(): boolean {
    return this.powerSwitch.isUp();
  }

  isDown(): boolean {
    return this.powerSwitch.isDown();
  }

  getId(): string {
    return this.id;
  }
}
