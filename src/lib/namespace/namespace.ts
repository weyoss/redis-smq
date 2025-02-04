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
    this.logger = logger.getLogger(
      Configuration.getSetConfig().logger,
      `exchange-fan-out-manager`,
    );

    this.redisClient = new RedisClientInstance();
    this.redisClient.on('error', (err) => this.logger.error(err));
  }

  /**
   * Retrieves all namespaces from Redis.
   *
   * @param {ICallback<string[]>} cb - Callback function to handle the result.
   */
  getNamespaces(cb: ICallback<string[]>): void {
    this.redisClient.getSetInstance((err, client) => {
      if (err) return cb(err);
      if (!client) return cb(new CallbackEmptyReplyError());

      const { keyNamespaces } = redisKeys.getMainKeys();
      client.smembers(keyNamespaces, (err, reply) => {
        if (err) return cb(err);
        if (!reply) return cb(new CallbackEmptyReplyError());
        cb(null, reply);
      });
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
    if (ns instanceof Error) return cb(new NamespaceInvalidNamespaceError());

    this.redisClient.getSetInstance((err, client) => {
      if (err) return cb(err);
      if (!client) return cb(new CallbackEmptyReplyError());

      const { keyNamespaces } = redisKeys.getMainKeys();
      const { keyNamespaceQueues } = redisKeys.getNamespaceKeys(ns);
      async.waterfall(
        [
          (cb: ICallback<void>) => {
            client.sismember(keyNamespaces, ns, (err, reply) => {
              if (err) return cb(err);
              if (!reply) return cb(new NamespaceNotFoundError());
              cb();
            });
          },
          (cb: ICallback<IQueueParams[]>) => {
            client.smembers(keyNamespaceQueues, (err, reply) => {
              if (err) return cb(err);
              if (!reply) return cb(new CallbackEmptyReplyError());

              const messageQueues: IQueueParams[] = reply.map((i) =>
                JSON.parse(i),
              );
              cb(null, messageQueues);
            });
          },
        ],
        cb,
      );
    });
  }

  /**
   * Deletes a namespace and its associated queues from Redis.
   *
   * @param {string} namespace - The namespace to delete.
   * @param {ICallback<void>} cb - Callback function to handle the result.
   */
  delete(namespace: string, cb: ICallback<void>): void {
    const ns = redisKeys.validateRedisKey(namespace);
    if (ns instanceof Error) return cb(new NamespaceInvalidNamespaceError());

    this.redisClient.getSetInstance((err, client) => {
      if (err) return cb(err);
      if (!client) return cb(new CallbackEmptyReplyError());

      const { keyNamespaces } = redisKeys.getMainKeys();
      async.waterfall(
        [
          (cb: ICallback<void>) => {
            client.sismember(keyNamespaces, ns, (err, isMember) => {
              if (err) return cb(err);
              if (!isMember) return cb(new NamespaceNotFoundError());
              cb();
            });
          },
        ],
        (err) => {
          if (err) return cb(err);

          _getQueues(client, (err, reply) => {
            if (err) return cb(err);

            const queues = reply ?? [];
            const multi = client.multi();
            multi.srem(keyNamespaces, ns);
            async.eachOf(
              queues,
              (queueParams, _, done) => {
                _deleteQueue(client, queueParams, multi, (err) => done(err));
              },
              (err) => {
                if (err) return cb(err);
                multi.exec((err) => cb(err));
              },
            );
          });
        },
      );
    });
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
