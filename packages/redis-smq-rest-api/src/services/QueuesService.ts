/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
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
  QueueManager,
  QueueStateManager,
  TQueueStateCommonOptions,
} from 'redis-smq';

const { promisifyAll } = bluebird;

export class QueuesService {
  protected queueManager;
  protected queueStateManager;

  constructor(
    queueManager: QueueManager,
    queueStateManager: QueueStateManager,
  ) {
    this.queueManager = promisifyAll(queueManager);
    this.queueStateManager = promisifyAll(queueStateManager);
  }

  async createQueue(
    queueParams: IQueueParams,
    queueType: EQueueType,
    queueDeliveryModel: EQueueDeliveryModel,
  ) {
    return this.queueManager.saveAsync(
      queueParams,
      queueType,
      queueDeliveryModel,
    );
  }

  async exists(queueParams: IQueueParams) {
    return this.queueManager.existsAsync(queueParams);
  }

  async getProperties(queueParams: IQueueParams) {
    return this.queueManager.getPropertiesAsync(queueParams);
  }

  async getConsumers(queueParams: IQueueParams) {
    return this.queueManager.getConsumersAsync(queueParams);
  }

  async delete(queueParams: IQueueParams) {
    return this.queueManager.deleteAsync(queueParams);
  }

  async getQueues() {
    return this.queueManager.getQueuesAsync();
  }

  async pauseQueue(
    queueParams: IQueueParams,
    options: TQueueStateCommonOptions,
  ) {
    return this.queueStateManager.pauseAsync(queueParams, options);
  }

  async stopQueue(
    queueParams: IQueueParams,
    options: TQueueStateCommonOptions,
  ) {
    return this.queueStateManager.stopAsync(queueParams, options);
  }

  async resumeQueue(
    queueParams: IQueueParams,
    options: TQueueStateCommonOptions,
  ) {
    return this.queueStateManager.resumeAsync(queueParams, options);
  }
}
