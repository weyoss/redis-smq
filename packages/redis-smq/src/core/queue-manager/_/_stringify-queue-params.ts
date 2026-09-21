/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IQueueParams } from '../../../contracts/index.js';

/**
 * Canonicalize: sort keys so the serialization is stable regardless of how
 * the caller constructed the object.
 */
export function _stringifyQueueParams(queue: IQueueParams): string {
  return JSON.stringify({ name: queue.name, ns: queue.ns });
}
