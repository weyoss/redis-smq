/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { events } from '../../src/common/events/events';
import { Base } from '../../src/lib/base';

export async function shutDownBaseInstance(i: Base): Promise<void> {
  if (i.isGoingUp()) {
    await new Promise((resolve) => {
      i.once(events.UP, resolve);
    });
  }
  if (i.isRunning()) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => {
      i.shutdown(resolve);
    });
  }
}
