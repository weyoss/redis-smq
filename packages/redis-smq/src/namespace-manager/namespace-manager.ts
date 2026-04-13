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
import { redisKeys } from '../common/redis/redis-keys/redis-keys.js';
import { Configuration } from '../config-manager/configuration.js';
import { _deleteQueue } from '../queue-manager/_/_delete-queue.js';
import { IQueueParams } from '../queue-manager/index.js';
import {
  InvalidNamespaceError,
  NamespaceNotFoundError,
  QueueNotFoundError,
} from '../errors/index.js';
import { withSharedPoolConnection } from '../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import { _getNamespaceQueues } from './_/_get-namespace-queues.js';
import { validateRedisKey } from '../common/redis/redis-keys/validator.js';

/**
 * Manages message queue namespaces.
 *
 * Provides methods to get namespaces, retrieve queues in a namespace,
 * and delete namespaces with all their queues.
 *
 * @example
 * const namespaceManager = new NamespaceManager();
 *
 * // Get all namespaces
 * const namespaces = await namespaceManager.getNamespaces();
 *
 * // Get queues in a namespace
 * const queues = await namespaceManager.getNamespaceQueues('production');
 */
export class NamespaceManager {
  protected logger;

  constructor() {
    this.logger = createLogger(
      Configuration.getConfig().logger,
      this.constructor.name.toLowerCase(),
    );
  }

  /**
   * Gets all namespaces.
   *
   * @param cb - (err, namespaces) => void. Returns string[]
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const namespaces = await namespaceManager.getNamespaces();
   * console.log(namespaces);
   *
   * // Callback
   * namespaceManager.getNamespaces((err, namespaces) => {
   *   if (err) throw err;
   *   console.log(namespaces);
   * });
   */
  getNamespaces(): Promise<string[]>;
  getNamespaces(cb: ICallback<string[]>): void;
  getNamespaces(cb?: ICallback<string[]>): Promise<string[]> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.logger.debug('Getting all namespaces');
      withSharedPoolConnection((client, cb) => {
        const { keyNamespaces } = redisKeys.getMainKeys();
        this.logger.debug('Fetching namespaces from Redis', {
          key: keyNamespaces,
        });
        client.smembers(keyNamespaces, (err, reply) => {
          if (err) {
            this.logger.error('Failed to get namespaces', {
              error: err.message,
            });
            return cb(err);
          }
          if (!reply) {
            this.logger.error('Empty namespaces reply');
            return cb(new CallbackEmptyReplyError());
          }
          this.logger.debug('Successfully retrieved namespaces', {
            count: reply.length,
          });
          cb(null, reply);
        });
      }, callback);
    });
  }

  /**
   * Gets all queues in a namespace.
   *
   * @param namespace - Namespace name
   * @param cb - (err, queues) => void. Returns IQueueParams[]
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const queues = await namespaceManager.getNamespaceQueues('production');
   * queues.forEach(q => console.log(q.name));
   *
   * // Callback
   * namespaceManager.getNamespaceQueues('production', (err, queues) => {
   *   if (err) throw err;
   *   console.log(queues);
   * });
   */
  getNamespaceQueues(namespace: string): Promise<IQueueParams[]>;
  getNamespaceQueues(namespace: string, cb: ICallback<IQueueParams[]>): void;
  getNamespaceQueues(
    namespace: string,
    cb?: ICallback<IQueueParams[]>,
  ): Promise<IQueueParams[]> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.logger.debug('Getting queues for namespace', { namespace });
      const ns = validateRedisKey(namespace);
      if (ns instanceof Error) {
        this.logger.error('Invalid namespace', { namespace });
        return callback(new InvalidNamespaceError());
      }
      withSharedPoolConnection((client, cb) => {
        const { keyNamespaces } = redisKeys.getMainKeys();
        const { keyNamespaceQueues } = redisKeys.getNamespaceKeys(ns);
        this.logger.debug('Checking if namespace exists', {
          namespace: ns,
          key: keyNamespaces,
        });

        async.waterfall(
          [
            (cb: ICallback<void>) => {
              client.sismember(keyNamespaces, ns, (err, reply) => {
                if (err) {
                  this.logger.error('Failed to check namespace existence', {
                    namespace: ns,
                    error: err.message,
                  });
                  return cb(err);
                }
                if (!reply) {
                  this.logger.error('Namespace not found', {
                    namespace: ns,
                  });
                  return cb(new NamespaceNotFoundError());
                }
                this.logger.debug('Namespace exists', { namespace: ns });
                cb();
              });
            },
            (_, cb: ICallback<IQueueParams[]>) => {
              this.logger.debug('Fetching queues for namespace', {
                namespace: ns,
                key: keyNamespaceQueues,
              });
              client.smembers(keyNamespaceQueues, (err, reply) => {
                if (err) {
                  this.logger.error('Failed to get namespace queues', {
                    namespace: ns,
                    error: err.message,
                  });
                  return cb(err);
                }
                if (!reply) {
                  this.logger.error('Empty queues reply', { namespace: ns });
                  return cb(new CallbackEmptyReplyError());
                }

                const messageQueues: IQueueParams[] = reply.map((i) =>
                  JSON.parse(i),
                );
                this.logger.debug('Successfully retrieved namespace queues', {
                  namespace: ns,
                  queueCount: messageQueues.length,
                });
                cb(null, messageQueues);
              });
            },
          ],
          cb,
        );
      }, callback);
    });
  }

  /**
   * Deletes a namespace and all its queues.
   *
   * @param namespace - Namespace name
   * @param cb - (err) => void
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * await namespaceManager.delete('staging');
   *
   * // Callback
   * namespaceManager.delete('staging', (err) => {
   *   if (err) throw err;
   * });
   */
  delete(namespace: string): Promise<void>;
  delete(namespace: string, cb: ICallback<void>): void;
  delete(namespace: string, cb?: ICallback<void>): Promise<void> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.logger.debug('Deleting namespace', { namespace });
      const ns = validateRedisKey(namespace);
      if (ns instanceof Error) {
        this.logger.error('Invalid namespace', { namespace });
        return callback(new InvalidNamespaceError());
      }

      withSharedPoolConnection((client, cb) => {
        const { keyNamespaces } = redisKeys.getMainKeys();
        this.logger.debug('Checking if namespace exists before deletion', {
          namespace: ns,
          key: keyNamespaces,
        });

        async.waterfall(
          [
            (cb: ICallback) => {
              client.sismember(keyNamespaces, ns, (err, isMember) => {
                if (err) {
                  this.logger.error('Failed to check namespace existence', {
                    namespace: ns,
                    error: err.message,
                  });
                  return cb(err);
                }
                if (!isMember) {
                  this.logger.error('Namespace not found for deletion', {
                    namespace: ns,
                  });
                  return cb(new NamespaceNotFoundError());
                }
                this.logger.debug(
                  'Namespace exists, proceeding with deletion',
                  {
                    namespace: ns,
                  },
                );
                cb();
              });
            },

            (_, cb: ICallback<IQueueParams[]>) => {
              this.logger.debug('Getting all queues for deletion', {
                namespace: ns,
              });
              _getNamespaceQueues(client, ns, (err, reply) => {
                if (err) {
                  this.logger.error(
                    'Failed to get namespace queues for deletion',
                    {
                      namespace: ns,
                      error: err.message,
                    },
                  );
                }
                cb(err, reply);
              });
            },

            (queues: IQueueParams[], cb: ICallback) => {
              this.logger.debug(
                'Preparing to delete namespace and its queues',
                {
                  namespace: ns,
                  queueCount: queues.length,
                },
              );

              async.eachOf(
                queues,
                (queueParams, _, done) => {
                  this.logger.debug('Deleting queue', {
                    namespace: ns,
                    queue: queueParams.name,
                  });
                  _deleteQueue(client, queueParams, (err) => {
                    if (err) {
                      this.logger.error('Failed to delete queue', {
                        namespace: ns,
                        queue: queueParams.name,
                        error: err,
                      });
                      if (err instanceof QueueNotFoundError) return done();
                    }
                    done(err);
                  });
                },
                (err) => {
                  if (err) {
                    this.logger.error('Failed during queue deletion', {
                      namespace: ns,
                      error: err,
                    });
                    return cb(err);
                  }
                  client.srem(keyNamespaces, ns, (err) => {
                    if (err) {
                      this.logger.error('Failed to delete namespace', {
                        namespace: ns,
                        error: err,
                      });
                      return cb(err);
                    }
                    this.logger.debug('Successfully deleted namespace', {
                      namespace: ns,
                    });
                    cb();
                  });
                },
              );
            },
          ],
          (err) => cb(err),
        );
      }, callback);
    });
  }
}
