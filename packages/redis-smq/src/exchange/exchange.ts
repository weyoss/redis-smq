/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  ICallback,
  createLogger,
  CallbackEmptyReplyError,
} from 'redis-smq-common';
import { IQueueParams } from '../queue-manager/index.js';
import { IExchangeParsedParams } from './types/index.js';
import { ExchangeError, RedisKeysInvalidKeyError } from '../errors/index.js';
import { Configuration } from '../config/index.js';
import { withSharedPoolConnection } from '../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import { redisKeys } from '../common/redis/redis-keys/redis-keys.js';
import { _parseQueueParams } from '../queue-manager/_/_parse-queue-params.js';

/**
 * Exchange management operations.
 *
 * This class provides methods for querying and retrieving exchange information
 * across the RedisSMQ system. It handles exchange discovery at global, namespace,
 * and queue-specific levels.
 *
 * All methods are read-only operations that query existing exchange data from Redis.
 * For exchange creation, binding, and deletion operations, use the specific exchange
 * type classes (ExchangeDirect, ExchangeTopic, ExchangeFanout).
 */
export class Exchange {
  protected readonly logger: ReturnType<typeof createLogger>;

  /**
   * Creates a new Exchange instance.
   * Initializes the logger with the class name for consistent logging context.
   */
  constructor() {
    this.logger = createLogger(
      Configuration.getConfig().logger,
      this.constructor.name,
    );
    this.logger.debug('Exchange initialized');
  }

  /**
   * Retrieve all exchanges across all namespaces in the system.
   *
   * This method queries the global exchanges index and returns all registered
   * exchanges regardless of their namespace or type. Each exchange entry includes
   * its namespace, name, and type information.
   *
   * @param cb - Callback invoked with an array of all exchange parameters or an error.
   *
   * @throws CallbackEmptyReplyError via callback on unexpected empty Redis reply.
   *
   * @example
   * ```typescript
   * exchange.getAllExchanges((err, exchanges) => {
   *   if (err) {
   *     console.error('Failed to get exchanges:', err);
   *     return;
   *   }
   *
   *   console.log(`Found ${exchanges.length} exchanges:`);
   *   exchanges.forEach(ex => {
   *     console.log(`- ${ex.name} (${ex.type}) in namespace ${ex.ns}`);
   *   });
   * });
   * ```
   */
  getAllExchanges(cb: ICallback<IExchangeParsedParams[]>): void {
    const { keyExchanges } = redisKeys.getMainKeys();
    withSharedPoolConnection((client, done) => {
      client.smembers(keyExchanges, (err, members) => {
        if (err) {
          this.logger.error(`getAllExchanges: redis error err=${err.message}`);
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
    }, cb);
  }

  /**
   * Retrieve all exchanges within a specific namespace.
   *
   * This method queries the namespace-specific exchanges index and returns all
   * exchanges registered within the given namespace. The namespace parameter
   * is validated to ensure it conforms to Redis key naming requirements.
   *
   * @param ns - The namespace to query. Must be a valid Redis key identifier.
   * @param cb - Callback invoked with an array of exchange parameters for the namespace or an error.
   *
   * @throws ExchangeError via callback if the namespace parameter is invalid.
   * @throws CallbackEmptyReplyError via callback on unexpected empty Redis reply.
   *
   * @example
   * ```typescript
   * exchange.getNamespaceExchanges('production', (err, exchanges) => {
   *   if (err) {
   *     console.error('Failed to get namespace exchanges:', err);
   *     return;
   *   }
   *
   *   console.log(`Production namespace has ${exchanges.length} exchanges:`);
   *   exchanges.forEach(ex => {
   *     console.log(`- ${ex.name} (${ex.type})`);
   *   });
   * });
   * ```
   */
  getNamespaceExchanges(
    ns: string,
    cb: ICallback<IExchangeParsedParams[]>,
  ): void {
    const namespace = redisKeys.validateRedisKey(ns);
    if (namespace instanceof RedisKeysInvalidKeyError) {
      this.logger.error('getNamespaceExchanges: invalid namespace');
      return cb(new ExchangeError('Invalid namespace'));
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
    }, cb);
  }

  /**
   * Retrieve all exchanges that a specific queue is bound to.
   *
   * This method queries the queue's reverse binding index to find all exchanges
   * (of any type) that the queue is currently bound to. This is useful for
   * understanding message routing paths and managing queue dependencies.
   *
   * The queue parameter can be either a string name (using the default namespace)
   * or a complete IQueueParams object specifying both namespace and name.
   *
   * @param queue - Queue name (string) or complete queue parameters (IQueueParams).
   * @param cb - Callback invoked with an array of exchange parameters the queue is bound to or an error.
   *
   * @throws Error via callback if the queue parameters are invalid.
   * @throws CallbackEmptyReplyError via callback on unexpected empty Redis reply.
   *
   * @example
   * ```typescript
   * // Using queue name (default namespace)
   * exchange.getQueueBoundExchanges('order-processing', (err, exchanges) => {
   *   if (err) {
   *     console.error('Failed to get queue bindings:', err);
   *     return;
   *   }
   *
   *   console.log(`Queue is bound to ${exchanges.length} exchanges:`);
   *   exchanges.forEach(ex => {
   *     console.log(`- ${ex.name} (${ex.type}) in ${ex.ns}`);
   *   });
   * });
   *
   * // Using complete queue parameters
   * exchange.getQueueBoundExchanges(
   *   { name: 'notifications', ns: 'production' },
   *   (err, exchanges) => {
   *     // Handle results...
   *   }
   * );
   * ```
   */
  getQueueBoundExchanges(
    queue: string | IQueueParams,
    cb: ICallback<IExchangeParsedParams[]>,
  ): void {
    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) {
      this.logger.error('getQueueBoundExchanges: invalid queue params');
      return cb(queueParams);
    }
    const { keyQueueExchangeBindings } = redisKeys.getQueueKeys(
      queueParams,
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
    }, cb);
  }
}
