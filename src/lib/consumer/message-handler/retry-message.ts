import { Message } from '../../message/message';
import {
  EConsumeMessageDeadLetterCause,
  EConsumeMessageUnacknowledgedCause,
} from '../../../../types';

export enum ERetryAction {
  DEAD_LETTER,
  REQUEUE,
  DELAY,
}

export type TGetRetryActionReply =
  | {
      action: ERetryAction.REQUEUE | ERetryAction.DELAY;
    }
  | {
      action: ERetryAction.DEAD_LETTER;
      deadLetterCause: EConsumeMessageDeadLetterCause;
    };

export function getRetryAction(
  message: Message,
  unacknowledgedCause: EConsumeMessageUnacknowledgedCause,
): TGetRetryActionReply {
  if (
    unacknowledgedCause === EConsumeMessageUnacknowledgedCause.TTL_EXPIRED ||
    message.getSetExpired()
  ) {
    return {
      action: ERetryAction.DEAD_LETTER,
      deadLetterCause: EConsumeMessageDeadLetterCause.TTL_EXPIRED,
    };
  }
  if (message.isPeriodic()) {
    // Only non-periodic message are re-queued. Failure of periodic message is ignored since such
    // message are periodically scheduled for delivery.
    return {
      action: ERetryAction.DEAD_LETTER,
      deadLetterCause: EConsumeMessageDeadLetterCause.PERIODIC_MESSAGE,
    };
  }
  if (message.hasRetryThresholdExceeded()) {
    return {
      action: ERetryAction.DEAD_LETTER,
      deadLetterCause: EConsumeMessageDeadLetterCause.RETRY_THRESHOLD_EXCEEDED,
    };
  }
  const delay = message.getRetryDelay();
  if (delay) {
    return {
      action: ERetryAction.DELAY,
    };
  }
  return {
    action: ERetryAction.REQUEUE,
  };
}
