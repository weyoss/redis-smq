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
  ICallback,
  ILogger,
  Runnable,
  TRedisClientEvent,
} from 'redis-smq-common';
import { RedisClient } from '../../common/redis-client/redis-client.js';
import { _getConsumerGroups } from '../consumer-groups/_/_get-consumer-groups.js';
import { EventBus } from '../event-bus/index.js';
import { _getQueueProperties } from '../queue/_/_get-queue-properties.js';
import { _getQueues } from '../queue/_/_get-queues.js';
import {
  EQueueDeliveryModel,
  IQueueParams,
  IQueueProperties,
} from '../queue/index.js';
import { Producer } from './producer.js';

export class QueueConsumerGroupsCache extends Runnable<
  Pick<TRedisClientEvent, 'error'>
> {
  protected redisClient;
  protected eventBus;
  protected producerId;
  protected logger;
  protected consumerGroupsByQueues: Record<string, string[]> = {};

  constructor(
    producer: Producer,
    redisClient: RedisClient,
    eventBus: EventBus,
    logger: ILogger,
  ) {
    super();
    this.redisClient = redisClient;
    this.eventBus = eventBus;
    this.producerId = producer.getId();
    this.logger = logger;
  }

  protected override getLogger(): ILogger {
    return this.logger;
  }

  protected override goingUp(): ((cb: ICallback<void>) => void)[] {
    return super.goingUp().concat([this.subscribe, this.loadConsumerGroups]);
  }

  protected override goingDown(): ((cb: ICallback<void>) => void)[] {
    return [this.unsubscribe, this.cleanUpConsumerGroups].concat(
      super.goingDown(),
    );
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
    const instance = this.eventBus.getInstance();
    if (instance instanceof Error) cb(instance);
    else {
      instance.on('queue.queueCreated', this.addQueue);
      instance.on('queue.queueDeleted', this.deleteQueue);
      instance.on('queue.consumerGroupCreated', this.addConsumerGroup);
      instance.on('queue.consumerGroupDeleted', this.deleteConsumerGroup);
      cb();
    }
  };

  protected unsubscribe = (cb: ICallback<void>): void => {
    const instance = this.eventBus.getInstance();
    if (instance instanceof Error) cb(instance);
    else {
      instance.removeListener('queue.queueCreated', this.addQueue);
      instance.removeListener('queue.queueDeleted', this.deleteQueue);
      instance.removeListener(
        'queue.consumerGroupCreated',
        this.addConsumerGroup,
      );
      instance.removeListener(
        'queue.consumerGroupDeleted',
        this.deleteConsumerGroup,
      );
      cb();
    }
  };

  protected loadConsumerGroups = (cb: ICallback<void>): void => {
    const redisClient = this.redisClient.getInstance();
    if (redisClient instanceof Error) cb(redisClient);
    else {
      async.waterfall(
        [
          (cb: ICallback<IQueueParams[]>) => _getQueues(redisClient, cb),
          (queues: IQueueParams[], cb: ICallback<void>) => {
            async.eachOf(
              queues,
              (queue, _, done) => {
                async.waterfall(
                  [
                    (cb: ICallback<IQueueProperties>) =>
                      _getQueueProperties(redisClient, queue, cb),
                    (properties: IQueueProperties, cb: ICallback<void>) => {
                      if (
                        properties.deliveryModel === EQueueDeliveryModel.PUB_SUB
                      ) {
                        _getConsumerGroups(redisClient, queue, (err, reply) => {
                          if (err) cb(err);
                          else {
                            this.consumerGroupsByQueues[
                              `${queue.name}@${queue.ns}`
                            ] = reply ?? [];
                            cb();
                          }
                        });
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
    }
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
}
