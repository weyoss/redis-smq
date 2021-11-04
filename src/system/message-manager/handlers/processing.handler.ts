import { Message } from '../../message';
import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgedCause,
  ICallback,
} from '../../../../types';
import { redisKeys } from '../../common/redis-keys';
import { deleteListMessageAtSequenceId } from '../common';
import { Handler } from './handler';

export class ProcessingHandler extends Handler {
  deleteDeadLetterMessage(
    queueName: string,
    index: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    const { keyQueueDL, keyLockDeleteDeadLetterMessage } =
      redisKeys.getKeys(queueName);
    deleteListMessageAtSequenceId(
      this.redisClient,
      keyLockDeleteDeadLetterMessage,
      keyQueueDL,
      index,
      messageId,
      cb,
    );
  }

  deleteAcknowledgedMessage(
    queueName: string,
    index: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    const { keyQueueAcknowledgedMessages, keyLockDeleteAcknowledgedMessage } =
      redisKeys.getKeys(queueName);
    deleteListMessageAtSequenceId(
      this.redisClient,
      keyLockDeleteAcknowledgedMessage,
      keyQueueAcknowledgedMessages,
      index,
      messageId,
      cb,
    );
  }

  deadLetterMessage(
    message: Message,
    queueName: string,
    keyQueueProcessing: string,
    unacknowledgedCause: EMessageUnacknowledgedCause,
    deadLetterCause: EMessageDeadLetterCause,
    cb: ICallback<void>,
  ): void {
    const { keyQueueDL } = redisKeys.getKeys(queueName);
    this.redisClient.rpoplpush(keyQueueProcessing, keyQueueDL, (err) => {
      if (err) cb(err);
      else cb();
    });
  }

  acknowledge(
    message: Message,
    queueName: string,
    keyQueueProcessing: string,
    cb: ICallback<void>,
  ): void {
    const { keyQueueAcknowledgedMessages } = redisKeys.getKeys(queueName);
    this.redisClient.rpoplpush(
      keyQueueProcessing,
      keyQueueAcknowledgedMessages,
      (err) => {
        if (err) cb(err);
        else cb();
      },
    );
  }

  delayBeforeRequeue(
    message: Message,
    queueName: string,
    keyQueueProcessing: string,
    unacknowledgedCause: EMessageUnacknowledgedCause,
    cb: ICallback<void>,
  ): void {
    const { keyQueueDelay } = redisKeys.getKeys(queueName);
    this.redisClient.rpoplpush(keyQueueProcessing, keyQueueDelay, (err) =>
      cb(err),
    );
  }

  requeue(
    message: Message,
    queueName: string,
    keyQueueProcessing: string,
    withPriority: boolean,
    unacknowledgedCause: EMessageUnacknowledgedCause,
    cb: ICallback<void>,
  ): void {
    const { keyQueueRequeue } = redisKeys.getKeys(queueName);
    this.redisClient.rpoplpush(keyQueueProcessing, keyQueueRequeue, (err) =>
      cb(err),
    );
  }
}
