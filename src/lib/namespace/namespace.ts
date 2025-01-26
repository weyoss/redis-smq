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
  ICallback,
  logger,
} from 'redis-smq-common';
import { RedisClientInstance } from '../../common/redis-client/redis-client-instance.js';
import { redisKeys } from '../../common/redis-keys/redis-keys.js';
import { Configuration } from '../../config/index.js';
import { _deleteQueue } from '../queue/_/_delete-queue.js';
import { _getQueues } from '../queue/_/_get-queues.js';
import { IQueueParams } from '../queue/index.js';
import {
  NamespaceInvalidNamespaceError,
  NamespaceNotFoundError,
} from './errors/index.js';

/**
 * Namespace class for managing message queue namespaces in Redis.
 * This class provides methods to get, create, and delete namespaces, as well as retrieve
 * associated queues.
 */
export class Namespace {
  protected logger;
  protected redisClient;

  constructor() {
    // Logger instance for logging messages and errors.
    this.logger = logger.getLogger(
      Configuration.getSetConfig().logger,
      `exchange-fan-out-manager`,
    );

    // Redis client instance for interacting with Redis.
    this.redisClient = new RedisClientInstance();

    // Error handling for Redis client.
    this.redisClient.on('error', (err) => this.logger.error(err));
  }

  /**
   * Retrieves all namespaces from Redis.
   *
   * @param {ICallback<string[]>} cb - Callback function to handle the result.
   */
  getNamespaces(cb: ICallback<string[]>): void {
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else {
        const { keyNamespaces } = redisKeys.getMainKeys();
        // Getting members of the namespaces set.
        client.smembers(keyNamespaces, (err, reply) => {
          if (err) cb(err);
          else if (!reply) cb(new CallbackEmptyReplyError());
          else cb(null, reply);
        });
      }
    });
  }

  /**
   * Retrieves all queues associated with a given namespace.
   *
   * @param {string} namespace - The namespace to retrieve queues for.
   * @param {ICallback<IQueueParams[]>} cb - Callback function to handle the result.
   */
  getNamespaceQueues(namespace: string, cb: ICallback<IQueueParams[]>): void {
    const ns = redisKeys.validateRedisKey(namespace);
    if (ns instanceof Error) cb(new NamespaceInvalidNamespaceError());
    else {
      this.redisClient.getSetInstance((err, client) => {
        if (err) cb(err);
        else if (!client) cb(new CallbackEmptyReplyError());
        else {
          const { keyNamespaces } = redisKeys.getMainKeys();
          const { keyNamespaceQueues } = redisKeys.getNamespaceKeys(ns);
          async.waterfall(
            [
              (cb: ICallback<void>) => {
                client.sismember(keyNamespaces, ns, (err, reply) => {
                  if (err) cb(err);
                  else if (!reply) cb(new NamespaceNotFoundError());
                  else cb();
                });
              },
              (cb: ICallback<IQueueParams[]>) => {
                // Retrieving queues associated with the namespace.
                client.smembers(keyNamespaceQueues, (err, reply) => {
                  if (err) cb(err);
                  else if (!reply) cb(new CallbackEmptyReplyError());
                  else {
                    const messageQueues: IQueueParams[] = reply.map((i) =>
                      JSON.parse(i),
                    );
                    cb(null, messageQueues);
                  }
                });
              },
            ],
            cb,
          );
        }
      });
    }
  }

  /**
   * Deletes a namespace and its associated queues from Redis.
   *
   * @param {string} namespace - The namespace to delete.
   * @param {ICallback<void>} cb - Callback function to handle the result.
   */
  delete(namespace: string, cb: ICallback<void>): void {
    const ns = redisKeys.validateRedisKey(namespace);
    if (ns instanceof Error) cb(new NamespaceInvalidNamespaceError());
    else {
      this.redisClient.getSetInstance((err, client) => {
        if (err) cb(err);
        else if (!client) cb(new CallbackEmptyReplyError());
        else {
          const { keyNamespaces } = redisKeys.getMainKeys();
          async.waterfall(
            [
              (cb: ICallback<void>) => {
                // Check if the namespace exists.
                client.sismember(keyNamespaces, ns, (err, isMember) => {
                  if (err) cb(err);
                  else if (!isMember) cb(new NamespaceNotFoundError());
                  else cb();
                });
              },
            ],
            (err) => {
              if (err) cb(err);
              else {
                _getQueues(client, (err, reply) => {
                  if (err) cb(err);
                  else {
                    const queues = reply ?? [];
                    const multi = client.multi();
                    // Remove the namespace and its queues.
                    multi.srem(keyNamespaces, ns);
                    async.eachOf(
                      queues,
                      (queueParams, _, done) => {
                        _deleteQueue(client, queueParams, multi, (err) =>
                          done(err),
                        );
                      },
                      (err) => {
                        if (err) cb(err);
                        else multi.exec((err) => cb(err));
                      },
                    );
                  }
                });
              }
            },
          );
        }
      });
    }
  }

  /**
   * Shuts down the Redis client.
   *
   * @param {ICallback<void>} cb - Callback function to handle the shutdown result.
   */
  shutdown = (cb: ICallback<void>): void => {
    this.redisClient.shutdown(cb);
  };
}
