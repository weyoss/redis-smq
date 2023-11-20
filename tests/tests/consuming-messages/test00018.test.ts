/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  createQueue,
  defaultQueue,
  produceMessage,
} from '../../common/message-producing-consuming';
import { ProducerMessageAlreadyPublishedError } from '../../../src/lib/producer/errors';

test('Producing duplicate message', async () => {
  await createQueue(defaultQueue, false);
  const { producer, message } = await produceMessage();
  await expect(async () => {
    await producer.produceAsync(message);
  }).rejects.toThrow(ProducerMessageAlreadyPublishedError);
});
