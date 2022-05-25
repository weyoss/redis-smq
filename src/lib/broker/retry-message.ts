import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgedCause,
  IRequiredConfig,
} from '../../../types';
import { deadLetterMessage } from './dead-letter-message';
import { requeueMessage } from './requeue-message';
import { Message } from '../message/message';
import { delayMessage } from './delay-message';
import { ICallback, TRedisClientMulti } from 'redis-smq-common/dist/types';
import { errors, RedisClient } from 'redis-smq-common';

enum EValidateAction {
  DEAD_LETTER,
  REQUEUE,
  DELAY,
}

type TGetRetryActionReply =
  | {
      action: EValidateAction.REQUEUE | EValidateAction.DELAY;
    }
  | {
      action: EValidateAction.DEAD_LETTER;
      deadLetterCause: EMessageDeadLetterCause;
    };

function getRetryAction(
  message: Message,
  unacknowledgedCause: EMessageUnacknowledgedCause,
): TGetRetryActionReply {
  if (
    unacknowledgedCause === EMessageUnacknowledgedCause.TTL_EXPIRED ||
    message.getSetExpired()
  ) {
    return {
      action: EValidateAction.DEAD_LETTER,
      deadLetterCause: EMessageDeadLetterCause.TTL_EXPIRED,
    };
  }

  if (message.isPeriodic()) {
    // Only non-periodic messages are re-queued. Failure of periodic messages is ignored since such
    // messages are periodically scheduled for delivery.
    return {
      action: EValidateAction.DEAD_LETTER,
      deadLetterCause: EMessageDeadLetterCause.PERIODIC_MESSAGE,
    };
  }

  if (message.hasRetryThresholdExceeded()) {
    return {
      action: EValidateAction.DEAD_LETTER,
      deadLetterCause: EMessageDeadLetterCause.RETRY_THRESHOLD_EXCEEDED,
    };
  }

  const delay = message.getRetryDelay();
  if (delay) {
    return {
      action: EValidateAction.DELAY,
    };
  }

  return {
    action: EValidateAction.REQUEUE,
  };
}

function retryTransaction(
  config: IRequiredConfig,
  mixed: TRedisClientMulti,
  processingQueue: string,
  message: Message,
  unacknowledgedCause: EMessageUnacknowledgedCause,
): EMessageDeadLetterCause | void {
  const r = getRetryAction(message, unacknowledgedCause);
  if (r.action === EValidateAction.DEAD_LETTER) {
    deadLetterMessage(
      config,
      mixed,
      message,
      processingQueue,
      unacknowledgedCause,
      r.deadLetterCause,
    );
    return r.deadLetterCause;
  }
  if (r.action === EValidateAction.REQUEUE) {
    return requeueMessage(mixed, message, processingQueue, unacknowledgedCause);
  }
  return delayMessage(mixed, message, processingQueue, unacknowledgedCause);
}

export function retryMessage(
  config: IRequiredConfig,
  mixed: TRedisClientMulti,
  processingQueue: string,
  message: Message,
  unacknowledgedCause: EMessageUnacknowledgedCause,
): EMessageDeadLetterCause | void;
export function retryMessage(
  config: IRequiredConfig,
  mixed: RedisClient,
  processingQueue: string,
  message: Message,
  unacknowledgedCause: EMessageUnacknowledgedCause,
  cb: ICallback<EMessageDeadLetterCause | void>,
): void;
export function retryMessage(
  config: IRequiredConfig,
  mixed: RedisClient | TRedisClientMulti,
  processingQueue: string,
  message: Message,
  unacknowledgedCause: EMessageUnacknowledgedCause,
  cb?: ICallback<EMessageDeadLetterCause | void>,
): void | EMessageDeadLetterCause {
  if (mixed instanceof RedisClient) {
    if (!cb) throw new errors.PanicError(`Expected a callback function`);
    const r = getRetryAction(message, unacknowledgedCause);
    if (r.action === EValidateAction.DEAD_LETTER) {
      return deadLetterMessage(
        config,
        mixed,
        message,
        processingQueue,
        unacknowledgedCause,
        r.deadLetterCause,
        (err) => {
          if (err) cb(err);
          else cb(null, r.deadLetterCause);
        },
      );
    }
    if (r.action === EValidateAction.DELAY) {
      return delayMessage(
        mixed,
        message,
        processingQueue,
        unacknowledgedCause,
        cb,
      );
    }
    return requeueMessage(
      mixed,
      message,
      processingQueue,
      unacknowledgedCause,
      cb,
    );
  } else {
    return retryTransaction(
      config,
      mixed,
      processingQueue,
      message,
      unacknowledgedCause,
    );
  }
}
