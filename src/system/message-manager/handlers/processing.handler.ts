import { Message } from '../../message';
import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgedCause,
  ICallback,
  TQueueParams,
} from '../../../../types';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { deleteListMessageAtSequenceId } from '../common';
import { Handler } from './handler';
import { PanicError } from '../../common/errors/panic.error';

export class ProcessingHandler extends Handler {
  deleteDeadLetterMessage(
    queue: TQueueParams,
    index: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    const { keyQueueDL, keyLockDeleteDeadLetterMessage } = redisKeys.getKeys(
      queue.name,
      queue.ns,
    );
    deleteListMessageAtSequenceId(
      this.redisClient,
      keyLockDeleteDeadLetterMessage,
      keyQueueDL,
      index,
      messageId,
      queue,
      cb,
    );
  }

  deleteAcknowledgedMessage(
    queue: TQueueParams,
    index: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    const { keyQueueAcknowledgedMessages, keyLockDeleteAcknowledgedMessage } =
      redisKeys.getKeys(queue.name, queue.ns);
    deleteListMessageAtSequenceId(
      this.redisClient,
      keyLockDeleteAcknowledgedMessage,
      keyQueueAcknowledgedMessages,
      index,
      messageId,
      queue,
      cb,
    );
  }

  deadLetterMessage(
    message: Message,
    keyQueueProcessing: string,
    unacknowledgedCause: EMessageUnacknowledgedCause,
    deadLetterCause: EMessageDeadLetterCause,
    cb: ICallback<void>,
  ): void {
    const queue = message.getQueue();
    if (!queue) {
      throw new PanicError(`Message parameters are required`);
    }
    const { keyQueueDL } = redisKeys.getKeys(queue.name, queue.ns);
    this.redisClient.lpoprpush(keyQueueProcessing, keyQueueDL, (err) => {
      if (err) cb(err);
      else cb();
    });
  }

  acknowledge(
    message: Message,
    keyQueueProcessing: string,
    cb: ICallback<void>,
  ): void {
    const queue = message.getQueue();
    if (!queue) {
      throw new PanicError(`Message queue parameters are required`);
    }
    const { keyQueueAcknowledgedMessages } = redisKeys.getKeys(
      queue.name,
      queue.ns,
    );
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
    keyQueueProcessing: string,
    unacknowledgedCause: EMessageUnacknowledgedCause,
    cb: ICallback<void>,
  ): void {
    const queue = message.getQueue();
    if (!queue) {
      throw new PanicError(`Message queue parameters are required.`);
    }
    const { keyQueueDelay } = redisKeys.getKeys(queue.name, queue.ns);
    this.redisClient.rpoplpush(keyQueueProcessing, keyQueueDelay, (err) =>
      cb(err),
    );
  }

  requeue(
    message: Message,
    keyQueueProcessing: string,
    withPriority: boolean,
    unacknowledgedCause: EMessageUnacknowledgedCause,
    cb: ICallback<void>,
  ): void {
    const queue = message.getQueue();
    if (!queue) {
      throw new PanicError(`Message parameters are required`);
    }
    const { keyQueueRequeue } = redisKeys.getKeys(queue.name, queue.ns);
    this.redisClient.rpoplpush(keyQueueProcessing, keyQueueRequeue, (err) =>
      cb(err),
    );
  }
}
