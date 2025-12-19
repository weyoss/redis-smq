/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import {
  IMessageTransferable,
  IQueueParams,
  RedisSMQ,
} from '../../src/index.js';

export async function consumeOnce(
  queue: IQueueParams,
  timeoutMs = 2000,
): Promise<IMessageTransferable | null> {
  const consumer = bluebird.promisifyAll(RedisSMQ.createConsumer());
  await consumer.runAsync();

  return await new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        consumer.shutdown(() => resolve(null));
      }
    }, timeoutMs);

    consumer.consume(
      queue,
      (msg, cb: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        cb();
        consumer.shutdown(() => resolve(msg));
      },
      () => void 0,
    );
  });
}
