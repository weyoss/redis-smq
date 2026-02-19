/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Consumer, Producer } from '../../src/index.js';

export async function shutDownBaseInstance(
  i: Consumer | Producer,
): Promise<void> {
  if (i.isGoingUp()) {
    await new Promise<void>((resolve) => {
      if (i instanceof Producer) i.on('producer.up', () => resolve());
      else i.on('consumer.up', () => resolve());
    });
  }
  if (i.isOperational()) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise<void>((resolve) => {
      i.shutdown(() => resolve());
    });
  }
}
