/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export enum EMessagePriority {
  HIGHEST,
  VERY_HIGH,
  HIGH,
  ABOVE_NORMAL,
  NORMAL,
  LOW,
  VERY_LOW,
  LOWEST,
}

export enum EMessageProperty {
  ID,
  STATUS,
  STATE,
  MESSAGE,
}

export enum EMessagePropertyStatus {
  NEW = 0,
  PENDING,
  PROCESSING,
  SCHEDULED,
  ACKNOWLEDGED,
  UNACK_REQUEUING,
  UNACK_DELAYING,
  DEAD_LETTERED,
}

export enum EMessageType {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  DEAD_LETTERED = 'dead-lettered',
  ACKNOWLEDGED = 'acknowledged',
}

export interface IMessageTypeConfig {
  title: string;
  icon: string;
  description: string;
  emptyMessage: string;
  requiresConsumerGroup: boolean;
  requiresConfig: boolean;
  configEnabledProperty?: string;
}

export enum EMessageUnacknowledgementAction {
  DEAD_LETTER,
  REQUEUE,
  DELAY,
}

export enum EMessageDeadLetterCause {
  TTL_EXPIRED,
  RETRY_THRESHOLD_EXCEEDED,
  PERIODIC_MESSAGE,
}

export enum EMessageUnacknowledgementCause {
  TIMEOUT,
  CONSUME_ERROR,
  UNACKNOWLEDGED,
  OFFLINE_CONSUMER,
  SHUTTING_DOWN,
  TTL_EXPIRED,
  QUEUE_STOPPED,
  QUEUE_INVALID_STATE,
  QUEUE_LOCKED,
  MESSAGE_NOT_FOUND,
  QUEUE_STATE_CHANGED,
  QUEUE_NOT_FOUND,
  UNEXPECTED_ERROR,
  INVALID_HANDLER_SIGNATURE,
}
