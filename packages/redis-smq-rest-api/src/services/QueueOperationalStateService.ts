/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IQueueParams, IQueueStateManager } from 'redis-smq';
import { TransitQueueStateControllerRequestBodyDTO } from '../controllers/namespaces/namespace/queues/queue/state/TransitQueueStateControllerRequestBodyDTO.js';

export class QueueOperationalStateService {
  constructor(protected queueStateManager: IQueueStateManager) {}

  async transitQueueState(
    queue: IQueueParams,
    queueStateAction: TransitQueueStateControllerRequestBodyDTO,
  ) {
    const { state, options } = queueStateAction;
    if (state === 'resume') {
      return this.queueStateManager.resume(queue, options);
    }
    if (state === 'stop') {
      return this.queueStateManager.stop(queue, options);
    }
    return this.queueStateManager.pause(queue, options);
  }

  async getState(queueParams: IQueueParams) {
    return this.queueStateManager.getState(queueParams);
  }

  async getStateHistory(queueParams: IQueueParams) {
    return this.queueStateManager.getStateHistory(queueParams);
  }
}
