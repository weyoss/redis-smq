/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IBenchmarkResult, IWorkerCompleteMessage } from '../types/index.js';
import { calculateThroughput } from './calculate-throughput.js';

export function calculateBenchmarkResult(
  resultData: IWorkerCompleteMessage['data'][],
): IBenchmarkResult {
  const totalMessages = resultData.reduce((sum, c) => sum + c.processed, 0);
  const maxTimeNs = Math.max(...resultData.map((c) => c.timeTaken));
  const throughput = calculateThroughput(totalMessages, maxTimeNs);
  return {
    totalMessages,
    totalTimeNs: maxTimeNs,
    throughput,
  };
}
