/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  EventEmitter,
  ICallback,
  OperationNotAllowedError,
  PanicError,
  PowerSwitch,
} from 'redis-smq-common';
import { IRedisSMQConfig, IRedisSMQParsedConfig } from './types/index.js';
import { ConfigurationNotFoundError } from '../errors/configuration-not-found.error.js';
import { redisKeys } from '../common/redis/redis-keys/redis-keys.js';
import { parseConfig } from './parse-config.js';
import { defaultConfig } from './default-config.js';
import { withSharedPoolConnection } from '../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import {
  ConfigurationUpdateError,
  InvalidConfigurationError,
  UnexpectedScriptReplyError,
} from '../errors/index.js';
import { TConfigurationEvent } from '../event-bus/types/index.js';
import { ERedisScriptName } from '../common/redis/scripts.js';

enum EConfigurationField {
  VERSION = 'version',
  DATA = 'data',
}

interface IRedisSMQParsedConfigWithVersion {
  version: number;
  data: IRedisSMQParsedConfig;
}

export class Configuration extends EventEmitter<TConfigurationEvent> {
  private static instance: Configuration | null = null;
  private static state = new PowerSwitch();
  private static initQueue: Array<ICallback> = [];

  private operationLock = false;
  private operationQueue: Array<() => void> = [];
  private completionWaiters: Array<ICallback> = [];

  private config: IRedisSMQParsedConfigWithVersion;

  private constructor() {
    super();
    this.config = {
      data: parseConfig(defaultConfig),
      version: 0,
    };
  }

  // ==================== Static Public API ====================

  static initialize(cb: ICallback): void {
    this.performInit((instance, done) => {
      instance.reload((err) => {
        if (err instanceof ConfigurationNotFoundError) {
          instance.save(instance.config.data, done);
        } else {
          done(err);
        }
      });
    }, cb);
  }

  static initializeWithConfig(config: IRedisSMQConfig, cb: ICallback): void {
    this.performInit((instance, done) => {
      try {
        instance.save(parseConfig(config), done);
      } catch (err) {
        done(err instanceof Error ? err : new InvalidConfigurationError());
      }
    }, cb);
  }

  static getInstance(): Configuration {
    const state = this.state;

    if (state.isDown()) {
      throw new OperationNotAllowedError({
        message: 'Configuration not initialized. Call initialize() first.',
      });
    }

    if (state.isGoingUp()) {
      throw new OperationNotAllowedError({
        message: 'Configuration is initializing. Please wait.',
      });
    }

    if (state.isGoingDown()) {
      throw new OperationNotAllowedError({
        message: 'Configuration is shutting down.',
      });
    }

    if (!this.instance) {
      throw new PanicError({
        message: 'Configuration instance is null despite being initialized',
      });
    }

    return this.instance;
  }

  static getConfig(): IRedisSMQParsedConfig {
    return this.getInstance().getConfig().data;
  }

  static shutdown(cb: ICallback): void {
    const state = this.state;

    if (state.isDown()) return cb();
    if (state.isGoingDown()) {
      return cb(
        new OperationNotAllowedError({ message: 'Already shutting down' }),
      );
    }
    if (state.isGoingUp()) {
      return cb(
        new OperationNotAllowedError({
          message: 'Cannot shutdown while initializing',
        }),
      );
    }

    state.goingDown();

    if (this.instance) {
      this.instance.waitForCompletion(() => {
        this.instance = null;
        state.commit();
        cb();
      });
    } else {
      state.commit();
      cb();
    }
  }

  // ==================== Instance Public API ====================

  getConfig(): IRedisSMQParsedConfigWithVersion {
    return Object.freeze({
      ...this.config,
    });
  }

  /**
   * Reload configuration from Redis. Usually only needed internally or for manual refresh.
   * After successful reload, 'configuration.updated' is NOT emitted (intentional).
   */
  reload(cb: ICallback<IRedisSMQParsedConfigWithVersion>): void {
    withSharedPoolConnection((client, done) => {
      const key = redisKeys.getMainKeys().keyConfiguration;
      client.hgetall(key, (err, result) => {
        if (err) return done(err);

        const version = result?.[EConfigurationField.VERSION];
        const data = result?.[EConfigurationField.DATA];

        if (!version || !data) {
          return done(new ConfigurationNotFoundError());
        }

        this.config.data = JSON.parse(data);
        this.config.version = Number(version);
        done(null, this.config);
      });
    }, cb);
  }

  save(config: IRedisSMQParsedConfig, cb: ICallback): void {
    this.runExclusive((done) => {
      withSharedPoolConnection((client, cb) => {
        const key = redisKeys.getMainKeys().keyConfiguration;
        const configData = JSON.stringify(config);

        client.runScript(
          ERedisScriptName.SAVE_CONFIG,
          [key],
          [
            EConfigurationField.VERSION,
            EConfigurationField.DATA,
            this.config.version,
            configData,
          ],
          (err, reply) => {
            if (err) return cb(err);

            if (typeof reply === 'number') {
              this.config.data = config;
              this.config.version = Number(reply);
              this.emit(
                'configuration.updated',
                this.config.data,
                this.config.version,
              );
              return cb();
            }

            if (reply === 'VERSION_MISMATCH') {
              return this.reload((loadErr) => {
                if (loadErr) return cb(loadErr);
                cb(
                  new ConfigurationUpdateError({
                    message: 'Version mismatch during save',
                  }),
                );
              });
            }

            cb(
              new UnexpectedScriptReplyError({
                message: 'Unexpected result from config save',
                metadata: { reply },
              }),
            );
          },
        );
      }, done);
    }, cb);
  }

  updateConfigFromEvent(
    config: IRedisSMQParsedConfig,
    version: number,
    cb: ICallback,
  ): void {
    this.runExclusive((done) => {
      if (version <= this.config.version) {
        return done(
          new ConfigurationUpdateError({
            message: `Version mismatch: current=${this.config.version}, event=${version}`,
          }),
        );
      }

      this.config.data = config;
      this.config.version = version;
      this.emit('configuration.updated', this.config.data, this.config.version);
      done();
    }, cb);
  }

  // ==================== Private Helpers ====================

  private static performInit(
    fn: (instance: Configuration, cb: ICallback) => void,
    cb: ICallback,
  ): void {
    if (!this.validateInitState(cb)) return;

    this.state.goingUp();
    const instance = new Configuration();

    fn(instance, (err) => {
      if (err) {
        this.state.rollback();
        this.instance = null;
      } else {
        this.instance = instance;
        this.state.commit();
      }

      const queued = this.initQueue.splice(0);
      cb(err);
      queued.forEach((qcb) => qcb(err));
    });
  }

  private static validateInitState(cb: ICallback): boolean {
    const state = this.state;

    if (state.isUp()) {
      cb(
        new OperationNotAllowedError({
          message: 'Configuration already initialized',
        }),
      );
      return false;
    }

    if (state.isGoingUp()) {
      this.initQueue.push(cb);
      return false;
    }

    if (state.isGoingDown()) {
      cb(
        new OperationNotAllowedError({
          message: 'Cannot initialize while shutting down',
        }),
      );
      return false;
    }

    return true;
  }

  private runExclusive(fn: (done: ICallback) => void, done: ICallback): void {
    const execute = () => {
      this.operationLock = true;

      const release = (err?: Error | null) => {
        try {
          done(err);
        } finally {
          this.operationLock = false;
          this.notifyWaiters();
          this.processNext();
        }
      };

      try {
        fn(release);
      } catch (err) {
        release(err instanceof Error ? err : new ConfigurationUpdateError());
      }
    };

    if (this.operationLock) {
      this.operationQueue.push(execute);
    } else {
      execute();
    }
  }

  private processNext(): void {
    if (this.operationLock || this.operationQueue.length === 0) return;
    setImmediate(() => {
      if (!this.operationLock) {
        this.operationQueue.shift()?.();
      }
    });
  }

  private notifyWaiters(): void {
    if (!this.operationLock && this.operationQueue.length === 0) {
      const waiters = this.completionWaiters.splice(0);
      waiters.forEach((waiter) => waiter());
    }
  }

  private waitForCompletion(cb: ICallback): void {
    if (!this.operationLock && this.operationQueue.length === 0) {
      return cb();
    }
    this.completionWaiters.push(cb);
  }
}
