/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export enum EMessagePropertyStatus {
  NEW = 0,
  PENDING = 1,
  PROCESSING = 2,
  SCHEDULED = 3,
  ACKNOWLEDGED = 4,
  UNACK_REQUEUING = 5,
  UNACK_DELAYING = 6,
  DEAD_LETTERED = 7,
}

export enum EMessageUnacknowledgementAction {
  DEAD_LETTER = 0,
  REQUEUE = 1,
  DELAY = 2,
}

export enum EMessageUnacknowledgementCause {
  TIMEOUT = 0,
  CONSUME_ERROR = 1,
  UNACKNOWLEDGED = 2,
  OFFLINE_CONSUMER = 3,
  SHUTTING_DOWN = 4,
  TTL_EXPIRED = 5,
  QUEUE_STOPPED = 6,
  QUEUE_INVALID_STATE = 7,
  QUEUE_LOCKED = 8,
  MESSAGE_NOT_FOUND = 9,
  QUEUE_STATE_CHANGED = 10,
  QUEUE_NOT_FOUND = 11,
  UNEXPECTED_ERROR = 12,
  INVALID_HANDLER_SIGNATURE = 13,
}

export enum EMessageDeadLetterCause {
  TTL_EXPIRED = 0,
  RETRY_THRESHOLD_EXCEEDED = 1,
  PERIODIC_MESSAGE = 2,
}
