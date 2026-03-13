/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IQueueParams, QueueStateManager } from 'redis-smq';
import bluebird from 'bluebird';
import { TransitQueueStateControllerRequestBodyDTO } from '../dto/controllers/queue-state/TransitQueueStateControllerRequestBodyDTO.js';

export class QueueOperationalStateService {
  protected queueStateManager;

  constructor(queueStateManager: QueueStateManager) {
    this.queueStateManager = bluebird.promisifyAll(queueStateManager);
  }

  async transitQueueState(
    queue: IQueueParams,
    queueStateAction: TransitQueueStateControllerRequestBodyDTO,
  ) {
    const { state, options } = queueStateAction;
    if (state === 'resume') {
      return this.queueStateManager.resumeAsync(queue, options);
    }
    if (state === 'stop') {
      return this.queueStateManager.stopAsync(queue, options);
    }
    return this.queueStateManager.pauseAsync(queue, options);
  }

  async getState(queueParams: IQueueParams) {
    return this.queueStateManager.getStateAsync(queueParams);
  }

  async getStateHistory(queueParams: IQueueParams) {
    return this.queueStateManager.getStateHistoryAsync(queueParams);
  }
}
