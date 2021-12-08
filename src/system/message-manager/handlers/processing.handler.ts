import { Message } from '../../message';
import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgedCause,
  ICallback,
} from '../../../../types';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { deleteListMessageAtSequenceId } from '../common';
import { Handler } from './handler';

export class ProcessingHandler extends Handler {
  deleteDeadLetterMessage(
    queueName: string,
    ns: string | undefined,
    index: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    const namespace = ns ?? redisKeys.getNamespace();
    const { keyQueueDL, keyLockDeleteDeadLetterMessage } = redisKeys.getKeys(
      queueName,
      namespace,
    );
    deleteListMessageAtSequenceId(
      this.redisClient,
      keyLockDeleteDeadLetterMessage,
      keyQueueDL,
      index,
      messageId,
      queueName,
      namespace,
      cb,
    );
  }

  deleteAcknowledgedMessage(
    queueName: string,
    ns: string | undefined,
    index: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    const namespace = ns ?? redisKeys.getNamespace();
    const { keyQueueAcknowledgedMessages, keyLockDeleteAcknowledgedMessage } =
      redisKeys.getKeys(queueName, namespace);
    deleteListMessageAtSequenceId(
      this.redisClient,
      keyLockDeleteAcknowledgedMessage,
      keyQueueAcknowledgedMessages,
      index,
      messageId,
      queueName,
      namespace,
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
    this.redisClient.lpoprpush(keyQueueProcessing, keyQueueDL, (err) => {
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
    this.redisClient.lpoprpush(
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
