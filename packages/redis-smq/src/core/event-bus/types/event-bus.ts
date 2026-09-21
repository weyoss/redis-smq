/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { TRedisSMQEvent } from '../../../contracts/index.js';

export enum EEventTarget {
  SYSTEM,
  USER,
  BOTH,
}

export type TEventRoutingPolicy = Partial<
  Record<keyof TRedisSMQEvent, EEventTarget>
>;
