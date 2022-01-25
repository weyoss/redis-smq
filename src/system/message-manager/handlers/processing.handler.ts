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
import { RedisClient } from '../../common/redis-client/redis-client';

export class ProcessingHandler extends Handler {
  protected storeMessages: boolean;

  constructor(redisClient: RedisClient, storeMessages = false) {
    super(redisClient);
    this.storeMessages = storeMessages;
  }

  deleteDeadLetteredMessage(
    queue: TQueueParams,
    index: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    const { keyQueueDL, keyLockDeleteDeadLetteredMessage } =
      redisKeys.getQueueKeys(queue.name, queue.ns);
    deleteListMessageAtSequenceId(
      this.redisClient,
      keyLockDeleteDeadLetteredMessage,
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
    const { keyQueueAcknowledged, keyLockDeleteAcknowledgedMessage } =
      redisKeys.getQueueKeys(queue.name, queue.ns);
    deleteListMessageAtSequenceId(
      this.redisClient,
      keyLockDeleteAcknowledgedMessage,
      keyQueueAcknowledged,
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
    if (this.storeMessages) {
      const { keyQueueDL } = redisKeys.getQueueKeys(queue.name, queue.ns);
      this.redisClient.lpoprpush(keyQueueProcessing, keyQueueDL, (err) => {
        if (err) cb(err);
        else cb();
      });
    } else {
      this.redisClient.rpop(keyQueueProcessing, (err) => cb(err));
    }
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
    if (this.storeMessages) {
      const { keyQueueAcknowledged } = redisKeys.getQueueKeys(
        queue.name,
        queue.ns,
      );
      this.redisClient.lpoprpush(
        keyQueueProcessing,
        keyQueueAcknowledged,
        (err) => {
          if (err) cb(err);
          else cb();
        },
      );
    } else {
      this.redisClient.rpop(keyQueueProcessing, (err) => cb(err));
    }
  }

  delayUnacknowledgedMessageBeforeRequeuing(
    message: Message,
    keyQueueProcessing: string,
    unacknowledgedCause: EMessageUnacknowledgedCause,
    cb: ICallback<void>,
  ): void {
    const queue = message.getQueue();
    if (!queue) {
      throw new PanicError(`Message queue parameters are required.`);
    }
    const { keyDelayedMessages } = redisKeys.getQueueKeys(queue.name, queue.ns);
    this.redisClient.rpoplpush(keyQueueProcessing, keyDelayedMessages, (err) =>
      cb(err),
    );
  }

  requeue(
    message: Message,
    keyQueueProcessing: string,
    unacknowledgedCause: EMessageUnacknowledgedCause,
    cb: ICallback<void>,
  ): void {
    const queue = message.getQueue();
    if (!queue) {
      throw new PanicError(`Message parameters are required`);
    }
    const { keyRequeueMessages } = redisKeys.getQueueKeys(queue.name, queue.ns);
    this.redisClient.rpoplpush(keyQueueProcessing, keyRequeueMessages, (err) =>
      cb(err),
    );
  }
}
