/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export enum EMessageUnacknowledgementAction {
  DEAD_LETTER,
  REQUEUE,
  DELAY,
}

export enum EMessageUnacknowledgementDeadLetterReason {
  TTL_EXPIRED,
  RETRY_THRESHOLD_EXCEEDED,
  PERIODIC_MESSAGE,
}

export enum EMessageUnacknowledgementReason {
  TIMEOUT,
  CONSUME_ERROR,
  UNACKNOWLEDGED,
  OFFLINE_CONSUMER,
  OFFLINE_MESSAGE_HANDLER,
  TTL_EXPIRED,
}

export type TMessageUnacknowledgementAction =
  | {
      action:
        | EMessageUnacknowledgementAction.REQUEUE
        | EMessageUnacknowledgementAction.DELAY;
    }
  | {
      action: EMessageUnacknowledgementAction.DEAD_LETTER;
      deadLetterReason: EMessageUnacknowledgementDeadLetterReason;
    };

export type TMessageUnacknowledgementStatus = Record<
  string,
  TMessageUnacknowledgementAction
>;
