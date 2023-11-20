/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ProducerError } from './producer.error';

export class ProducerMessageAlreadyPublishedError extends ProducerError {
  constructor(
    msg = 'The message can not published. Either you have already published the message or you have called the getSetMessageState() method.',
  ) {
    super(msg);
  }
}
