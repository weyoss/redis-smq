/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export enum EMessageRecoveryAction {
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
}

export type TMessageRecoveryResolution =
  | {
      action: EMessageRecoveryAction.REQUEUE | EMessageRecoveryAction.DELAY;
    }
  | {
      action: EMessageRecoveryAction.DEAD_LETTER;
      deadLetterCause: EMessageDeadLetterCause;
    };

export type TMessageRecovery = Record<string, TMessageRecoveryResolution>;
