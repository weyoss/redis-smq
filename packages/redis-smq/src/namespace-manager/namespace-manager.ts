/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
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
import { _getQueues } from '../queue-manager/_/_get-queues.js';
import { IQueueParams } from '../queue-manager/index.js';
import {
  InvalidNamespaceError,
  NamespaceNotFoundError,
} from '../errors/index.js';
import { withSharedPoolConnection } from '../common/redis/redis-connection-pool/with-shared-pool-connection.js';

/**
 * NamespaceManager class for managing message queue namespaces in Redis.
 * This class provides methods to get, create, and delete namespaces, as well as retrieve
 * associated queues.
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
   * @param {ICallback<string[]>} cb - Callback function to handle the result.
   */
  getNamespaces(cb: ICallback<string[]>): void {
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
    }, cb);
  }

  /**
   * Retrieves all queues associated with a given namespace.
   *
   * @param {string} namespace - The namespace to retrieve queues for.
   * @param {ICallback<IQueueParams[]>} cb - Callback function to handle the result.
   */
  getNamespaceQueues(namespace: string, cb: ICallback<IQueueParams[]>): void {
    this.logger.debug('Getting queues for namespace', { namespace });
    const ns = redisKeys.validateRedisKey(namespace);
    if (ns instanceof Error) {
      this.logger.error('Invalid namespace', { namespace });
      return cb(new InvalidNamespaceError());
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
    }, cb);
  }

  /**
   * Deletes a namespace and its associated queues from Redis.
   *
   * @param {string} namespace - The namespace to delete.
   * @param {ICallback<void>} cb - Callback function to handle the result.
   */
  delete(namespace: string, cb: ICallback<void>): void {
    this.logger.debug('Deleting namespace', { namespace });
    const ns = redisKeys.validateRedisKey(namespace);
    if (ns instanceof Error) {
      this.logger.error('Invalid namespace', { namespace });
      return cb(new InvalidNamespaceError());
    }

    withSharedPoolConnection((client, cb) => {
      const { keyNamespaces } = redisKeys.getMainKeys();
      this.logger.debug('Checking if namespace exists before deletion', {
        namespace: ns,
        key: keyNamespaces,
      });

      async.waterfall(
        [
          (cb: ICallback<void>) => {
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
              this.logger.debug('Namespace exists, proceeding with deletion', {
                namespace: ns,
              });
              cb();
            });
          },
        ],
        (err) => {
          if (err) return cb(err);

          this.logger.debug('Getting all queues for deletion', {
            namespace: ns,
          });
          _getQueues(client, (err, reply) => {
            if (err) {
              this.logger.error('Failed to get queues for deletion', {
                namespace: ns,
                error: err.message,
              });
              return cb(err);
            }

            const queues = reply ?? [];
            this.logger.debug('Preparing to delete namespace and queues', {
              namespace: ns,
              queueCount: queues.length,
            });

            const multi = client.multi();
            multi.srem(keyNamespaces, ns);

            async.eachOf(
              queues,
              (queueParams, _, done) => {
                this.logger.debug('Deleting queue', {
                  namespace: ns,
                  queue: queueParams.name,
                });
                _deleteQueue(client, queueParams, multi, (err) => {
                  if (err) {
                    this.logger.error('Failed to delete queue', {
                      namespace: ns,
                      queue: queueParams.name,
                      error: err,
                    });
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

                this.logger.debug('Executing namespace deletion transaction', {
                  namespace: ns,
                });
                multi.exec((err) => {
                  if (err) {
                    this.logger.error(
                      'Failed to execute namespace deletion transaction',
                      {
                        namespace: ns,
                        error: err,
                      },
                    );
                    return cb(err);
                  }
                  this.logger.debug('Successfully deleted namespace', {
                    namespace: ns,
                  });
                  cb();
                });
              },
            );
          });
        },
      );
    }, cb);
  }
}
