/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ConsumerError } from './consumer.error';
import { IQueueParams } from '../../../../types';

export class ConsumerMessageHandlerAlreadyExistsError extends ConsumerError {
  constructor(queue: IQueueParams) {
    super(
      `A message handler for queue [${queue.name}@${queue.ns}] already exists`,
    );
  }
}
