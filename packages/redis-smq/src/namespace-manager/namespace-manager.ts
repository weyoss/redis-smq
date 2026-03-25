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
import { Configuration } from '../config/index.js';
import { _deleteQueue } from '../queue-manager/_/_delete-queue.js';
import { IQueueParams } from '../queue-manager/index.js';
import {
  InvalidNamespaceError,
  NamespaceNotFoundError,
  QueueNotFoundError,
} from '../errors/index.js';
import { withSharedPoolConnection } from '../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import { _getNamespaceQueues } from './_/_get-namespace-queues.js';

/**
 * NamespaceManager class for managing message queue namespaces in Redis.
 * This class provides methods to get, create, and delete namespaces, as well as retrieve
 * associated queues.
 *
 * Namespaces provide logical isolation for queues, allowing you to group related queues
 * and avoid naming conflicts. Each queue belongs to a namespace, with the default
 * namespace being "default" if not specified.
 *
 * @example
 * ```typescript
 * const namespaceManager = new NamespaceManager();
 *
 * // Using callback
 * namespaceManager.getNamespaces((err, namespaces) => {
 *   if (err) {
 *     console.error('Failed to get namespaces:', err);
 *   } else {
 *     console.log('Namespaces:', namespaces);
 *   }
 * });
 *
 * // Using promise
 * const namespaces = await namespaceManager.getNamespaces();
 * console.log('Namespaces:', namespaces);
 * ```
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
   * Retrieves all namespaces from Redis.
   *
   * This method returns a list of all namespaces that have been created in the system.
   * Namespaces are stored as a Redis set, making this operation efficient even with
   * a large number of namespaces.
   *
   * @param cb - Optional callback function to handle the result.
   *             - On success: `cb(null, namespaces)` where namespaces is an array of namespace strings.
   *             - On error: `cb(error)` with any Redis or system errors.
   *             - If not provided, the method returns a Promise that resolves with the namespaces.
   * @returns {Promise<string[]> | void} - Returns a Promise if no callback is provided,
   *          otherwise returns void.
   *
   * @example
   * ```typescript
   * const namespaceManager = new NamespaceManager();
   *
   * // Callback pattern
   * namespaceManager.getNamespaces((err, namespaces) => {
   *   if (err) {
   *     console.error('Failed to get namespaces:', err);
   *   } else {
   *     console.log(`Found ${namespaces.length} namespaces:`);
   *     namespaces.forEach(ns => console.log(`  - ${ns}`));
   *   }
   * });
   *
   * // Promise pattern - list namespaces with queue counts
   * async function listNamespacesWithQueueCounts() {
   *   try {
   *     const namespaces = await namespaceManager.getNamespaces();
   *     console.log(`Total namespaces: ${namespaces.length}`);
   *
   *     for (const ns of namespaces) {
   *       const queues = await namespaceManager.getNamespaceQueues(ns);
   *       console.log(`Namespace '${ns}': ${queues.length} queues`);
   *     }
   *   } catch (err) {
   *     console.error('Failed to list namespaces:', err);
   *   }
   * }
   * ```
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
   * Retrieves all queues associated with a given namespace.
   *
   * This method returns detailed queue information for all queues within a specific
   * namespace. Each queue is represented with its name and namespace, allowing you
   * to inspect and manage queues in a particular namespace.
   *
   * @param namespace - The namespace to retrieve queues for (must be a valid Redis key)
   * @param cb - Optional callback function to handle the result.
   *             - On success: `cb(null, queues)` where queues is an array of queue parameters.
   *             - On error: `cb(error)` with one of the errors listed below.
   *             - If not provided, the method returns a Promise that resolves with the queues.
   * @returns {Promise<IQueueParams[]> | void} - Returns a Promise if no callback is provided,
   *          otherwise returns void.
   *
   * @throws {InvalidNamespaceError} When the namespace parameter is invalid (empty or contains invalid characters).
   * @throws {NamespaceNotFoundError} When the specified namespace doesn't exist.
   *
   * @example
   * ```typescript
   * const namespaceManager = new NamespaceManager();
   *
   * // Callback pattern
   * namespaceManager.getNamespaceQueues('production', (err, queues) => {
   *   if (err) {
   *     if (err instanceof NamespaceNotFoundError) {
   *       console.error('Namespace does not exist');
   *     } else {
   *       console.error('Failed to get queues:', err);
   *     }
   *   } else {
   *     console.log(`Found ${queues.length} queues in production namespace:`);
   *     queues.forEach(queue => {
   *       console.log(`  - ${queue.name}@${queue.ns}`);
   *     });
   *   }
   * });
   *
   * // Promise pattern
   * async function getNamespaceMetrics(namespace: string) {
   *   try {
   *     const queues = await namespaceManager.getNamespaceQueues(namespace);
   *     const queueManager = new QueueManager();
   *
   *     let totalMessages = 0;
   *     let totalPending = 0;
   *
   *     for (const queue of queues) {
   *       const props = await queueManager.getProperties(queue);
   *       totalMessages += props.messagesCount;
   *       totalPending += props.pendingMessagesCount;
   *     }
   *
   *     console.log(`Namespace '${namespace}' metrics:`);
   *     console.log(`  Total queues: ${queues.length}`);
   *     console.log(`  Total messages: ${totalMessages}`);
   *     console.log(`  Total pending: ${totalPending}`);
   *
   *     return { queues, totalMessages, totalPending };
   *   } catch (err) {
   *     console.error('Failed to get namespace metrics:', err);
   *   }
   * }
   * ```
   */
  getNamespaceQueues(namespace: string): Promise<IQueueParams[]>;
  getNamespaceQueues(namespace: string, cb: ICallback<IQueueParams[]>): void;
  getNamespaceQueues(
    namespace: string,
    cb?: ICallback<IQueueParams[]>,
  ): Promise<IQueueParams[]> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.logger.debug('Getting queues for namespace', { namespace });
      const ns = redisKeys.validateKey(namespace);
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
   * Deletes a namespace and its associated queues from Redis.
   *
   * This method performs a complete deletion of a namespace and all queues within it.
   * The operation is comprehensive and includes validation checks to ensure the
   * namespace can be safely deleted.
   *
   * @param namespace - The namespace to delete (must be a valid Redis key)
   * @param cb - Optional callback function to handle the result.
   *             - On success: `cb(null)`
   *             - On error: `cb(error)` with one of the errors listed below.
   *             - If not provided, the method returns a Promise that resolves when deleted.
   * @returns {Promise<void> | void} - Returns a Promise if no callback is provided,
   *          otherwise returns void.
   *
   * @throws {InvalidNamespaceError} When the namespace parameter is invalid.
   * @throws {NamespaceNotFoundError} When the specified namespace doesn't exist.
   * @throws {QueueNotFoundError} When a queue in the namespace doesn't exist (should not happen).
   * @throws {QueueNotEmptyError} When a queue in the namespace has messages.
   * @throws {QueueHasActiveConsumersError} When a queue has active consumers.
   * @throws {QueueHasBoundExchangesError} When a queue has bound exchanges.
   * @throws {ConsumerSetMismatchError} When consumer set is inconsistent.
   * @throws {UnexpectedScriptReplyError} When Redis returns an unexpected response.
   * @throws {QueueLockedError} When a queue is locked.
   * @throws {InvalidQueueStateError} When a queue is in an invalid state.
   *
   * @example
   * ```typescript
   * const namespaceManager = new NamespaceManager();
   *
   * // Callback pattern
   * namespaceManager.delete('staging', (err) => {
   *   if (err) {
   *       console.error('Failed to delete namespace:', err);
   *   } else {
   *     console.log('Namespace and all its queues deleted successfully');
   *   }
   * });
   *
   * // Promise pattern
   * async function safeDeleteNamespace(namespace: string) {
   *   try {
   *     // First, check if namespace exists
   *     const namespaces = await namespaceManager.getNamespaces();
   *     if (!namespaces.includes(namespace)) {
   *       console.log(`Namespace '${namespace}' does not exist`);
   *       return false;
   *     }
   *
   *     // Delete the namespace
   *     await namespaceManager.delete(namespace);
   *     console.log(`Namespace '${namespace}' deleted successfully`);
   *     return true;
   *   } catch (err) {
   *     console.error('Failed to delete namespace:', err);
   *     return false;
   *   }
   * }
   * ```
   */
  delete(namespace: string): Promise<void>;
  delete(namespace: string, cb: ICallback<void>): void;
  delete(namespace: string, cb?: ICallback<void>): Promise<void> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.logger.debug('Deleting namespace', { namespace });
      const ns = redisKeys.validateKey(namespace);
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
