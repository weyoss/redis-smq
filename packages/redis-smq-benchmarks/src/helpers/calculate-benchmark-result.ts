/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IBenchmarkResult, IWorkerCompleteMessage } from '../types/index.js';
import { HighResTimer } from './timing.js';

export function calculateBenchmarkResult(
  resultData: IWorkerCompleteMessage['data'][],
): IBenchmarkResult {
  const totalMessages = resultData.reduce((sum, c) => sum + c.processed, 0);
  const maxTimeNs = Math.max(...resultData.map((c) => c.timeTaken));
  let throughput = 0;
  if (maxTimeNs) {
    const maxTimeSeconds = HighResTimer.toSeconds(maxTimeNs);
    throughput = Number((totalMessages / maxTimeSeconds).toFixed(0));
  }
  return {
    totalMessages,
    totalTimeNs: maxTimeNs,
    throughput,
  };
}
