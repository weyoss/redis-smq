/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

// Numeric enums from redis-smq, matching the wire format in openapi-specs.json.
// Orval generates `{ NUMBER_0: 0, NUMBER_1: 1 }` for these because the spec
// has no name metadata — so we declare them here with the semantic names.

export enum EQueueDeliveryModel {
  POINT_TO_POINT = 0,
  PUB_SUB = 1,
}

export enum EQueueType {
  LIFO_QUEUE = 0,
  FIFO_QUEUE = 1,
  PRIORITY_QUEUE = 2,
}

export enum EQueueOperationalState {
  ACTIVE = 0,
  PAUSED = 1,
  STOPPED = 2,
  LOCKED = 3,
}
