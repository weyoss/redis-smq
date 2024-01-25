/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ConsumerError } from './consumer.error';

export class ConsumerInvalidGroupIdError extends ConsumerError {
  constructor() {
    super(
      `Invalid consumer group name. Valid characters are letters (a-z) and numbers (0-9). (-_) are allowed between alphanumerics.`,
    );
  }
}
