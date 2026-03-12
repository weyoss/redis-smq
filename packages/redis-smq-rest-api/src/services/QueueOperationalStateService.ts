/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  IQueueParams,
  QueueStateManager,
  TQueueStateTransitionUserOptions,
} from 'redis-smq';
import bluebird from 'bluebird';

export class QueueOperationalStateService {
  protected queueStateManager;

  constructor(queueStateManager: QueueStateManager) {
    this.queueStateManager = bluebird.promisifyAll(queueStateManager);
  }

  async pauseQueue(
    queueParams: IQueueParams,
    options: TQueueStateTransitionUserOptions,
  ) {
    return this.queueStateManager.pauseAsync(queueParams, options);
  }

  async stopQueue(
    queueParams: IQueueParams,
    options: TQueueStateTransitionUserOptions,
  ) {
    return this.queueStateManager.stopAsync(queueParams, options);
  }

  async resumeQueue(
    queueParams: IQueueParams,
    options: TQueueStateTransitionUserOptions,
  ) {
    return this.queueStateManager.resumeAsync(queueParams, options);
  }

  async getState(queueParams: IQueueParams) {
    return this.queueStateManager.getStateAsync(queueParams);
  }

  async getStateHistory(queueParams: IQueueParams) {
    return this.queueStateManager.getStateHistoryAsync(queueParams);
  }
}
