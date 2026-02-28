/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { HighResTimer } from './timing.js';

export function calculateThroughput(processed: number, timeTakenNs: number) {
  let throughput = 0;
  if (timeTakenNs) {
    const maxTimeSeconds = HighResTimer.toSeconds(timeTakenNs);
    throughput = Number((processed / maxTimeSeconds).toFixed(0));
  }
  return throughput;
}
