/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * Queue operational states representing the current mode of queue processing.
 * These states are mutually exclusive - a queue can only be in one state at a time.
 */
export enum EQueueOperationalState {
  /**
   * Queue is operating normally.
   * - Consuming messages
   * - Accepting new messages
   * - All operations enabled
   */
  ACTIVE,

  /**
   * Queue processing is temporarily paused.
   * - **NOT** consuming messages
   * - **CAN** accept new messages (messages buffer)
   * - Message handler remain subscribed
   * - In-flight messages complete or timeout
   * - Quick resume capability
   *
   * @example
   * // Use cases:
   * // - Rolling deployments
   * // - Downstream service issues
   * // - Temporary maintenance
   * // - Debugging/inspection
   */
  PAUSED,

  /**
   * Queue is completely shut down.
   * - **NOT** consuming messages
   * - **NOT** accepting new messages
   * - All message handler are disconnected
   *
   * @example
   * // Use cases:
   * // - Major maintenance
   * // - Resource reclamation
   * // - Long-term disabling
   * // - Emergency intervention
   */
  STOPPED,

  /**
   * Queue has an exclusive lock for operations.
   * - **NOT** consuming messages (except lock holder)
   * - **NOT** accepting new messages
   * - External operations blocked
   * - Lock holder has exclusive access
   *
   * @example
   * // Use cases:
   * // - Administrative operations
   * // - Bulk data operations
   * // - Schema migrations
   * // - Critical repairs
   */
  LOCKED,
}

export enum EQueueType {
  LIFO_QUEUE,
  FIFO_QUEUE,
  PRIORITY_QUEUE,
}

export interface IQueueParams {
  name: string;
  ns: string;
}

export type TQueueExtendedParams = string | IQueueParams | IQueueParsedParams;

export interface IQueueParsedParams {
  queueParams: IQueueParams;
  groupId: string | null;
}

export interface IQueueRateLimit {
  /**
   * The maximum number of messages that can be processed per unit of time.
   */
  limit: number;

  /**
   * The time window over which the rate limit is applied. In milliseconds.
   */
  interval: number;
}

export enum EQueueDeliveryModel {
  POINT_TO_POINT,
  PUB_SUB,
}

export interface IQueueProperties {
  deliveryModel: EQueueDeliveryModel;
  queueType: EQueueType;
  rateLimit: IQueueRateLimit | null;
  messagesCount: number;
  scheduledMessagesCount: number;
  pendingMessagesCount: number;
  processingMessagesCount: number;
  acknowledgedMessagesCount: number;
  deadLetteredMessagesCount: number;
  delayedMessagesCount: number;
  requeuedMessagesCount: number;
  operationalState: EQueueOperationalState;
  lastStateChangeAt: number | null;
  lockId: string | null;
}

export enum EQueueProperty {
  QUEUE_TYPE,
  RATE_LIMIT,
  MESSAGES_COUNT,
  DELIVERY_MODEL,
  SCHEDULED_MESSAGES_COUNT,
  PENDING_MESSAGES_COUNT,
  PROCESSING_MESSAGES_COUNT,
  ACKNOWLEDGED_MESSAGES_COUNT,
  DEAD_LETTERED_MESSAGES_COUNT,
  DELAYED_MESSAGES_COUNT,
  REQUEUED_MESSAGES_COUNT,
  OPERATIONAL_STATE,
  LAST_STATE_CHANGE_AT,
  LOCK_ID,
}
