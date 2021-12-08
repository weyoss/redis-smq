import { ICallback } from '../../../../types';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { getListMessageAtSequenceId } from '../common';
import { Message } from '../../message';
import { Handler } from './handler';
import { EnqueueHandler } from './enqueue.handler';
import { RedisClient } from '../../redis-client/redis-client';
import { EmptyCallbackReplyError } from '../../common/errors/empty-callback-reply.error';

export class RequeueHandler extends Handler {
  protected enqueueHandler: EnqueueHandler;

  constructor(redisClient: RedisClient, enqueueHandler: EnqueueHandler) {
    super(redisClient);
    this.enqueueHandler = enqueueHandler;
  }

  protected requeueListMessage(
    queueName: string,
    ns: string | undefined,
    from: string,
    index: number,
    messageId: string,
    withPriority: boolean,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    const namespace = ns ?? redisKeys.getNamespace();
    getListMessageAtSequenceId(
      this.redisClient,
      from,
      index,
      messageId,
      queueName,
      namespace,
      (err, msg) => {
        if (err) cb(err);
        else if (!msg) cb(new EmptyCallbackReplyError());
        else {
          const multi = this.redisClient.multi();
          multi.lrem(from, 1, JSON.stringify(msg));
          const message = Message.createFromMessage(msg, true); // resetting all system parameters
          message.setQueue(namespace, queueName); // do not lose message queue
          if (withPriority && typeof priority !== 'undefined') {
            message.setPriority(priority);
          }
          this.enqueueHandler.enqueue(multi, message, withPriority);
          this.redisClient.execMulti(multi, (err) => cb(err));
        }
      },
    );
  }

  requeueMessageFromDLQueue(
    queueName: string,
    ns: string | undefined,
    index: number,
    messageId: string,
    withPriority: boolean,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    const { keyQueueDL } = redisKeys.getKeys(queueName, ns);
    this.requeueListMessage(
      queueName,
      ns,
      keyQueueDL,
      index,
      messageId,
      withPriority,
      priority,
      cb,
    );
  }

  requeueMessageFromAcknowledgedQueue(
    queueName: string,
    ns: string | undefined,
    index: number,
    messageId: string,
    withPriority: boolean,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    const { keyQueueAcknowledgedMessages } = redisKeys.getKeys(queueName, ns);
    this.requeueListMessage(
      queueName,
      ns,
      keyQueueAcknowledgedMessages,
      index,
      messageId,
      withPriority,
      priority,
      cb,
    );
  }
}
