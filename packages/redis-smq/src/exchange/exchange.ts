/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  async,
  CallbackEmptyReplyError,
  createLogger,
  ICallback,
} from 'redis-smq-common';
import { IQueueParams } from '../queue-manager/index.js';
import { IExchangeParsedParams } from './types/index.js';
import {
  InvalidNamespaceError,
  InvalidRedisKeyError,
} from '../errors/index.js';
import { Configuration } from '../config-manager/configuration.js';
import { withSharedPoolConnection } from '../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import { redisKeys } from '../common/redis/redis-keys/redis-keys.js';
import { _parseQueueParams } from '../queue-manager/_/_parse-queue-params.js';
import { validateRedisKey } from '../common/redis/redis-keys/validator.js';

/**
 * Provides read-only exchange discovery operations.
 *
 * For exchange creation, binding, and deletion, use ExchangeDirect, ExchangeTopic, or ExchangeFanout.
 *
 * @example
 * const exchange = new Exchange();
 *
 * // Get all exchanges
 * const exchanges = await exchange.getAllExchanges();
 *
 * // Get exchanges in a namespace
 * const nsExchanges = await exchange.getNamespaceExchanges('production');
 */
export class Exchange {
  protected readonly logger: ReturnType<typeof createLogger>;

  constructor() {
    this.logger = createLogger(
      Configuration.getConfig().logger,
      this.constructor.name,
    );
    this.logger.debug('Exchange initialized');
  }

  /**
   * Gets all exchanges across all namespaces.
   *
   * @param cb - (err, exchanges) => void. Returns IExchangeParsedParams[]
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const exchanges = await exchange.getAllExchanges();
   *
   * // Callback
   * exchange.getAllExchanges((err, exchanges) => {
   *   if (err) throw err;
   *   console.log(exchanges.length);
   * });
   */
  getAllExchanges(
    cb?: ICallback<IExchangeParsedParams[]>,
  ): Promise<IExchangeParsedParams[]>;
  getAllExchanges(cb: ICallback<IExchangeParsedParams[]>): void;
  getAllExchanges(
    cb?: ICallback<IExchangeParsedParams[]>,
  ): Promise<IExchangeParsedParams[]> | void {
    return async.withOptionalCallback(cb, (callback) => {
      const { keyExchanges } = redisKeys.getMainKeys();
      withSharedPoolConnection((client, done) => {
        client.smembers(keyExchanges, (err, members) => {
          if (err) {
            this.logger.error(
              `getAllExchanges: redis error err=${err.message}`,
            );
            return done(err);
          }
          if (!members) {
            this.logger.error('getAllExchanges: empty reply');
            return done(new CallbackEmptyReplyError());
          }
          const exchanges: IExchangeParsedParams[] = [];
          for (const s of members) {
            try {
              const ex: IExchangeParsedParams = JSON.parse(s);
              if (ex && ex.ns && ex.name) exchanges.push(ex);
            } catch {
              this.logger.warn(
                'getAllExchanges: ignoring malformed exchange entry',
              );
            }
          }
          this.logger.debug(
            `getAllExchanges: found ${exchanges.length} exchange(s)`,
          );
          done(null, exchanges);
        });
      }, callback);
    });
  }

  /**
   * Gets all exchanges within a specific namespace.
   *
   * @param ns - Namespace name
   * @param cb - (err, exchanges) => void. Returns IExchangeParsedParams[]
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const exchanges = await exchange.getNamespaceExchanges('production');
   *
   * // Callback
   * exchange.getNamespaceExchanges('production', (err, exchanges) => {
   *   if (err) throw err;
   *   console.log(exchanges);
   * });
   */
  getNamespaceExchanges(ns: string): Promise<IExchangeParsedParams[]>;
  getNamespaceExchanges(
    ns: string,
    cb: ICallback<IExchangeParsedParams[]>,
  ): void;
  getNamespaceExchanges(
    ns: string,
    cb?: ICallback<IExchangeParsedParams[]>,
  ): Promise<IExchangeParsedParams[]> | void {
    return async.withOptionalCallback(cb, (callback) => {
      const namespace = validateRedisKey(ns);
      if (namespace instanceof InvalidRedisKeyError) {
        this.logger.error('getNamespaceExchanges: invalid namespace');
        return callback(new InvalidNamespaceError());
      }
      const { keyNamespaceExchanges } = redisKeys.getNamespaceKeys(namespace);
      withSharedPoolConnection((client, done) => {
        client.smembers(keyNamespaceExchanges, (err, members) => {
          if (err) {
            this.logger.error(
              `getNamespaceExchanges: redis error ns=${ns} err=${err.message}`,
            );
            return done(err);
          }
          if (!members) {
            this.logger.error(`getNamespaceExchanges: empty reply ns=${ns}`);
            return done(new CallbackEmptyReplyError());
          }
          const exchanges: IExchangeParsedParams[] = members.map((i) =>
            JSON.parse(i),
          );
          this.logger.debug(
            `getNamespaceExchanges: ns=${ns} count=${exchanges.length}`,
          );
          done(null, exchanges);
        });
      }, callback);
    });
  }

  /**
   * Gets all exchanges that a queue is bound to.
   *
   * @param queue - Queue name (string) or { name, ns }
   * @param cb - (err, exchanges) => void. Returns IExchangeParsedParams[]
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const exchanges = await exchange.getQueueExchanges('orders');
   *
   * // Callback
   * exchange.getQueueExchanges('orders', (err, exchanges) => {
   *   if (err) throw err;
   *   console.log(exchanges);
   * });
   */
  getQueueExchanges(
    queue: string | IQueueParams,
  ): Promise<IExchangeParsedParams[]>;
  getQueueExchanges(
    queue: string | IQueueParams,
    cb: ICallback<IExchangeParsedParams[]>,
  ): void;
  getQueueExchanges(
    queue: string | IQueueParams,
    cb?: ICallback<IExchangeParsedParams[]>,
  ): Promise<IExchangeParsedParams[]> | void {
    return async.withOptionalCallback(cb, (callback) => {
      const queueParams = _parseQueueParams(queue);
      if (queueParams instanceof Error) {
        this.logger.error('getQueueBoundExchanges: invalid queue params');
        return callback(queueParams);
      }
      const { keyQueueExchangeBindings } = redisKeys.getQueueKeys(
        queueParams.ns,
        queueParams.name,
        null,
      );
      withSharedPoolConnection((client, done) => {
        client.smembers(keyQueueExchangeBindings, (err, members) => {
          if (err) {
            this.logger.error(
              `getQueueBoundExchanges: redis error ns=${queueParams.ns} q=${queueParams.name} err=${err.message}`,
            );
            return done(err);
          }
          if (!members) {
            this.logger.error(
              `getQueueBoundExchanges: empty reply ns=${queueParams.ns} q=${queueParams.name}`,
            );
            return done(new CallbackEmptyReplyError());
          }
          const exchanges: IExchangeParsedParams[] = members.map((i) =>
            JSON.parse(i),
          );
          this.logger.debug(
            `getQueueBoundExchanges: ns=${queueParams.ns} q=${queueParams.name} count=${exchanges.length}`,
          );
          done(null, exchanges);
        });
      }, callback);
    });
  }
}
