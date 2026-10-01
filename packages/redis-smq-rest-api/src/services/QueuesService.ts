/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  EQueueDeliveryModel,
  EQueueType,
  IQueueManager,
  IQueueParams,
} from 'redis-smq';

export class QueuesService {
  constructor(protected queueManager: IQueueManager) {}

  async createQueue(
    queueParams: IQueueParams,
    queueType: EQueueType,
    queueDeliveryModel: EQueueDeliveryModel,
  ) {
    return this.queueManager.save(queueParams, queueType, queueDeliveryModel);
  }

  async exists(queueParams: IQueueParams) {
    return this.queueManager.exists(queueParams);
  }

  async getProperties(queueParams: IQueueParams) {
    return this.queueManager.getProperties(queueParams);
  }

  async getConsumers(queueParams: IQueueParams) {
    return this.queueManager.getConsumers(queueParams);
  }

  async delete(queueParams: IQueueParams) {
    return this.queueManager.delete(queueParams);
  }

  async getQueues() {
    return this.queueManager.getQueues();
  }
}
