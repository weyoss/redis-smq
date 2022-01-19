import { ICallback, TQueueParams } from '../../../../types';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { getListMessageAtSequenceId } from '../common';
import { Handler } from './handler';
import { EnqueueHandler } from './enqueue.handler';
import { RedisClient } from '../../common/redis-client/redis-client';
import { EmptyCallbackReplyError } from '../../common/errors/empty-callback-reply.error';
import { ELuaScriptName } from '../../common/redis-client/lua-scripts';
import { Message } from '../../message';

export class RequeueHandler extends Handler {
  protected enqueueHandler: EnqueueHandler;

  constructor(redisClient: RedisClient, enqueueHandler: EnqueueHandler) {
    super(redisClient);
    this.enqueueHandler = enqueueHandler;
  }

  protected requeueListMessage(
    queue: TQueueParams,
    from: string,
    index: number,
    messageId: string,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    getListMessageAtSequenceId(
      this.redisClient,
      from,
      index,
      messageId,
      queue,
      (err, msg) => {
        if (err) cb(err);
        else if (!msg) cb(new EmptyCallbackReplyError());
        else {
          const message = Message.createFromMessage(msg, true); // resetting all system parameters
          if (priority !== undefined) {
            message.setPriority(priority);
          } else message.disablePriority();
          const {
            keyQueues,
            keyQueuePending,
            keyQueuePriority,
            keyQueuePendingWithPriority,
          } = redisKeys.getKeys(queue.name, queue.ns);
          this.redisClient.runScript(
            ELuaScriptName.REQUEUE_MESSAGE,
            [
              keyQueues,
              JSON.stringify(queue),
              message.getId(),
              JSON.stringify(message),
              message.getPriority() ?? '',
              keyQueuePendingWithPriority,
              keyQueuePriority,
              keyQueuePending,
              from,
              JSON.stringify(msg),
            ],
            (err) => cb(err),
          );
        }
      },
    );
  }

  requeueMessageFromDLQueue(
    queue: TQueueParams,
    index: number,
    messageId: string,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    const { keyQueueDL } = redisKeys.getKeys(queue.name, queue.ns);
    this.requeueListMessage(queue, keyQueueDL, index, messageId, priority, cb);
  }

  requeueMessageFromAcknowledgedQueue(
    queue: TQueueParams,
    index: number,
    messageId: string,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    const { keyQueueAcknowledged } = redisKeys.getKeys(queue.name, queue.ns);
    this.requeueListMessage(
      queue,
      keyQueueAcknowledged,
      index,
      messageId,
      priority,
      cb,
    );
  }
}
