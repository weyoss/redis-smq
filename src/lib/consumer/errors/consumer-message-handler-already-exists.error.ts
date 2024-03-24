/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IQueueParsedParams } from '../../queue/index.js';
import { ConsumerError } from './consumer.error.js';

export class ConsumerMessageHandlerAlreadyExistsError extends ConsumerError {
  constructor(queue: IQueueParsedParams) {
    super(
      `A message handler for queue [${queue.queueParams.name}@${
        queue.queueParams.ns
      }${queue.groupId ? `/${queue.groupId}` : ''}] already exists`,
    );
  }
}
