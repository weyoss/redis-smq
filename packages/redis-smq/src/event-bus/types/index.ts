/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

// Targets where an event should be published
import { TRedisSMQEvent } from '../../common/index.js';

export enum EEventTarget {
  SYSTEM,
  USER,
  BOTH,
}

// A policy mapping of event name -> target bus(es)
export type TEventRoutingPolicy = Partial<
  Record<keyof TRedisSMQEvent, EEventTarget>
>;
