/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * Numeric/string enum values from `openapi-specs.json`, mirrored here so
 * the e2e suite doesn't depend on `@/types/*` (app code). Update both if
 * the schema changes.
 */

export const EXCHANGE_TYPE = {
  DIRECT: 0,
  FANOUT: 1,
  TOPIC: 2,
} as const;

export const EXCHANGE_QUEUE_POLICY = {
  STANDARD: 0,
  PRIORITY: 1,
} as const;

export const QUEUE_TYPE = {
  LIFO: 0,
  FIFO: 1,
  PRIORITY: 2,
} as const;

export const DELIVERY_MODEL = {
  POINT_TO_POINT: 0,
  PUB_SUB: 1,
} as const;

/**
 * Message status filter accepted by the browse endpoints and used in
 * purge URLs. `published` is the "all statuses" filter — every message
 * ever published to the queue, regardless of its current state.
 */
export const MESSAGE_STATUS = {
  PENDING: 'pending',
  ACKNOWLEDGED: 'acknowledged',
  DEAD_LETTERED: 'dead-lettered',
  SCHEDULED: 'scheduled',
  PUBLISHED: 'published',
} as const;

export type ExchangeType = (typeof EXCHANGE_TYPE)[keyof typeof EXCHANGE_TYPE];
export type ExchangeQueuePolicy =
  (typeof EXCHANGE_QUEUE_POLICY)[keyof typeof EXCHANGE_QUEUE_POLICY];
export type QueueType = (typeof QUEUE_TYPE)[keyof typeof QUEUE_TYPE];
export type DeliveryModel =
  (typeof DELIVERY_MODEL)[keyof typeof DELIVERY_MODEL];
export type MessageStatus =
  (typeof MESSAGE_STATUS)[keyof typeof MESSAGE_STATUS];
