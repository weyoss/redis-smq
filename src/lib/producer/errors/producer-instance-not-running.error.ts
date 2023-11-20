/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ProducerError } from './producer.error';

export class ProducerInstanceNotRunningError extends ProducerError {
  constructor(
    msg = `Producer instance is not running. Before producing messages you need to run your producer instance.`,
  ) {
    super(msg);
  }
}
