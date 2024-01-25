/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ConsumerError } from './consumer.error';

export class ConsumerGroupIdNotSupportedError extends ConsumerError {
  constructor() {
    super(
      `Consumer groups are only supported for queues of a PubSub delivery model.`,
    );
  }
}
