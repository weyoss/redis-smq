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
  redis,
  RedisClient,
} from 'redis-smq-common';
import { Configuration } from '../../config/configuration';
import {
  EQueueDeliveryModel,
  IQueueParams,
  IQueueProperties,
} from '../../../types';
import { QueueEventEmitter } from '../queue/queue/queue-event-emitter';
import { ConsumerGroupEventEmitter } from '../consumer/consumer-groups/consumer-group-event-emitter';
import { _getQueues } from '../queue/queue/_get-queues';
import { _getQueueProperties } from '../queue/queue/_get-queue-properties';
import { _getConsumerGroups } from '../consumer/consumer-groups/_get-consumer-groups';

/**
 * QueueConsumerGroupsDictionary allows to improve performance when producing
 * messages.
 * A Producer instance needs to know if a given queue has consumer groups and
 * fetch them.
 * Without QueueConsumerGroupsDictionary it would, for each message to produce,
 * make one or more calls to Redis in order to fetch queue properties and queue
 * consumer groups.
 */
export class QueueConsumerGroupsDictionary {
  protected consumerGroupsByQueues: Record<string, string[]> = {};
  protected redisClient: RedisClient;
  protected subscribeRedisClient: RedisClient | null = null;
  protected queueEventEmitter: QueueEventEmitter | null = null;
  protected consumerGroupEventEmitter: ConsumerGroupEventEmitter | null = null;

  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
  }

  protected addConsumerGroup = (queue: IQueueParams, groupId: string) => {
    this.consumerGroupsByQueues[`${queue.name}@${queue.ns}`] =
      this.consumerGroupsByQueues[`${queue.name}@${queue.ns}`] || [];
    const group = this.consumerGroupsByQueues[`${queue.name}@${queue.ns}`];
    if (!group.includes(groupId)) {
      group.push(groupId);
    }
  };

  protected deleteConsumerGroup = (queue: IQueueParams, groupId: string) => {
    const groups = this.consumerGroupsByQueues[`${queue.name}@${queue.ns}`];
    if (groups && groups.includes(groupId)) {
      this.consumerGroupsByQueues[`${queue.name}@${queue.ns}`] = groups.filter(
        (i) => i !== groupId,
      );
    }
  };

  protected addQueue = (queue: IQueueParams, properties: IQueueProperties) => {
    if (properties.deliveryModel === EQueueDeliveryModel.PUB_SUB) {
      this.consumerGroupsByQueues[`${queue.name}@${queue.ns}`] = [];
    }
  };

  protected deleteQueue = (queue: IQueueParams) => {
    if (this.consumerGroupsByQueues[`${queue.name}@${queue.ns}`])
      delete this.consumerGroupsByQueues[`${queue.name}@${queue.ns}`];
  };

  protected subscribe = (cb: ICallback<void>): void => {
    redis.createInstance(
      Configuration.getSetConfig().redis,
      (err, redisClient) => {
        if (err) cb(err);
        else if (!redisClient) cb(new CallbackEmptyReplyError());
        else {
          this.subscribeRedisClient = redisClient;
          this.consumerGroupEventEmitter = new QueueEventEmitter(
            redisClient,
            redisClient,
          );
          this.consumerGroupEventEmitter.on(
            'consumerGroupCreated',
            this.addConsumerGroup,
          );
          this.consumerGroupEventEmitter.on(
            'consumerGroupDeleted',
            this.deleteConsumerGroup,
          );
          this.queueEventEmitter = new QueueEventEmitter(
            redisClient,
            redisClient,
          );
          this.queueEventEmitter.on('queueCreated', this.addQueue);
          this.queueEventEmitter.on('queueDeleted', this.deleteQueue);
          cb();
        }
      },
    );
  };

  protected loadConsumerGroups = (cb: ICallback<void>): void => {
    async.waterfall(
      [
        (cb: ICallback<IQueueParams[]>) => _getQueues(this.redisClient, cb),
        (queues: IQueueParams[], cb: ICallback<void>) => {
          async.eachOf(
            queues,
            (queue, _, done) => {
              async.waterfall(
                [
                  (cb: ICallback<IQueueProperties>) =>
                    _getQueueProperties(this.redisClient, queue, cb),
                  (properties: IQueueProperties, cb: ICallback<void>) => {
                    if (
                      properties.deliveryModel === EQueueDeliveryModel.PUB_SUB
                    ) {
                      _getConsumerGroups(
                        this.redisClient,
                        queue,
                        (err, reply) => {
                          if (err) cb(err);
                          else {
                            this.consumerGroupsByQueues[
                              `${queue.name}@${queue.ns}`
                            ] = reply ?? [];
                            cb();
                          }
                        },
                      );
                    } else cb();
                  },
                ],
                done,
              );
            },
            cb,
          );
        },
      ],
      cb,
    );
  };

  protected cleanUpConsumerGroups = (cb: ICallback<void>): void => {
    this.consumerGroupsByQueues = {};
    cb();
  };

  getConsumerGroups(queue: IQueueParams): {
    exists: boolean;
    consumerGroups: string[];
  } {
    const key = `${queue.name}@${queue.ns}`;
    if (this.consumerGroupsByQueues[key]) {
      return {
        exists: true,
        consumerGroups: this.consumerGroupsByQueues[key],
      };
    }
    return {
      exists: false,
      consumerGroups: [],
    };
  }

  run(cb: ICallback<void>) {
    async.waterfall([this.subscribe, this.loadConsumerGroups], cb);
  }

  quit(cb: ICallback<void>) {
    async.waterfall(
      [
        (cb: ICallback<void>) => {
          if (this.subscribeRedisClient)
            this.subscribeRedisClient.halt(() => {
              this.subscribeRedisClient = null;
              this.queueEventEmitter = null;
              this.consumerGroupEventEmitter = null;
              cb();
            });
          else cb();
        },
        this.cleanUpConsumerGroups,
      ],
      cb,
    );
  }
}
