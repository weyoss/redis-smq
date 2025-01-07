/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export enum EMessageUnknowledgmentAction {
  DEAD_LETTER,
  REQUEUE,
  DELAY,
}

export enum EMessageUnknowledgmentDeadLetterReason {
  TTL_EXPIRED,
  RETRY_THRESHOLD_EXCEEDED,
  PERIODIC_MESSAGE,
}

export enum EMessageUnknowledgmentReason {
  TIMEOUT,
  CONSUME_ERROR,
  UNACKNOWLEDGED,
  OFFLINE_CONSUMER,
  OFFLINE_MESSAGE_HANDLER,
  TTL_EXPIRED,
}

export type TMessageUnknowledgmentAction =
  | {
      action:
        | EMessageUnknowledgmentAction.REQUEUE
        | EMessageUnknowledgmentAction.DELAY;
    }
  | {
      action: EMessageUnknowledgmentAction.DEAD_LETTER;
      deadLetterReason: EMessageUnknowledgmentDeadLetterReason;
    };

export type TMessageUnacknowledgmentStatus = Record<
  string,
  TMessageUnknowledgmentAction
>;
