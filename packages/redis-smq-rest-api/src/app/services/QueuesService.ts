/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import {
  EQueueDeliveryModel,
  EQueueType,
  IQueueParams,
  Queue,
} from 'redis-smq';

const { promisifyAll } = bluebird;

export class QueuesService {
  protected queue;

  constructor(queue: Queue) {
    this.queue = promisifyAll(queue);
  }

  async createQueue(
    queueParams: IQueueParams,
    queueType: EQueueType,
    queueDeliveryModel: EQueueDeliveryModel,
  ) {
    return this.queue.saveAsync(queueParams, queueType, queueDeliveryModel);
  }

  async exists(queueParams: IQueueParams) {
    return this.queue.existsAsync(queueParams);
  }

  async getProperties(queueParams: IQueueParams) {
    return this.queue.getPropertiesAsync(queueParams);
  }

  async delete(queueParams: IQueueParams) {
    return this.queue.deleteAsync(queueParams);
  }

  async getQueues() {
    return this.queue.getQueuesAsync();
  }
}
