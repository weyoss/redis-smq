import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgedCause,
  IRequiredConfig,
} from '../../../../types';
import { deadLetterMessage } from './dead-letter-message';
import { requeueMessage } from './requeue-message';
import { Message } from '../../message/message';
import { delayMessage } from './delay-message';
import { ICallback, IRedisClientMulti } from 'redis-smq-common/dist/types';
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

export enum ERetryStatus {
  MESSAGE_DELAYED,
  MESSAGE_REQUEUED,
  MESSAGE_DEAD_LETTERED,
}

export type TRetryStatus = {
  status: ERetryStatus;
  message: Message;
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
  mixed: IRedisClientMulti,
  processingQueue: string,
  message: Message,
  unacknowledgedCause: EMessageUnacknowledgedCause,
): TRetryStatus {
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
    return { message, status: ERetryStatus.MESSAGE_DEAD_LETTERED };
  }
  if (r.action === EValidateAction.REQUEUE) {
    requeueMessage(mixed, message, processingQueue, unacknowledgedCause);
    return { message, status: ERetryStatus.MESSAGE_REQUEUED };
  }
  delayMessage(mixed, message, processingQueue, unacknowledgedCause);
  return { message, status: ERetryStatus.MESSAGE_DELAYED };
}

export function retryMessage(
  config: IRequiredConfig,
  mixed: IRedisClientMulti,
  processingQueue: string,
  message: Message,
  unacknowledgedCause: EMessageUnacknowledgedCause,
): TRetryStatus;
export function retryMessage(
  config: IRequiredConfig,
  mixed: RedisClient,
  processingQueue: string,
  message: Message,
  unacknowledgedCause: EMessageUnacknowledgedCause,
  cb: ICallback<TRetryStatus>,
): void;
export function retryMessage(
  config: IRequiredConfig,
  mixed: RedisClient | IRedisClientMulti,
  processingQueue: string,
  message: Message,
  unacknowledgedCause: EMessageUnacknowledgedCause,
  cb?: ICallback<TRetryStatus>,
): TRetryStatus | void {
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
          else
            cb(null, { message, status: ERetryStatus.MESSAGE_DEAD_LETTERED });
        },
      );
    }
    if (r.action === EValidateAction.DELAY) {
      return delayMessage(
        mixed,
        message,
        processingQueue,
        unacknowledgedCause,
        (err) => {
          if (err) cb(err);
          else cb(null, { message, status: ERetryStatus.MESSAGE_DELAYED });
        },
      );
    }
    return requeueMessage(
      mixed,
      message,
      processingQueue,
      unacknowledgedCause,
      (err) => {
        if (err) cb(err);
        else cb(null, { message, status: ERetryStatus.MESSAGE_REQUEUED });
      },
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
