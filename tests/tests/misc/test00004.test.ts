/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from '@jest/globals';
import {
  MessageDestinationQueueAlreadySetError,
  MessageDestinationQueueRequiredError,
  MessageMessageExchangeRequiredError,
  ProducibleMessage,
} from '../../../src/lib/index.js';
import { MessageEnvelope } from '../../../src/lib/message/message-envelope.js';

test('MessageEnvelope: additional checks', async () => {
  const msg = new ProducibleMessage();
  const env = new MessageEnvelope(msg);
  expect(() => env.getDestinationQueue()).toThrow(
    MessageDestinationQueueRequiredError,
  );
  env.setDestinationQueue({ ns: 'ns1', name: 'queue1' });
  expect(() => env.setDestinationQueue({ ns: 'ns1', name: 'queue2' })).toThrow(
    MessageDestinationQueueAlreadySetError,
  );
  expect(() => env.getExchange()).toThrow(MessageMessageExchangeRequiredError);
});
