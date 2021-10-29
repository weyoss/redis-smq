import { ICallback } from '../../../../types';
import { RedisClient } from '../../redis-client/redis-client';
import { redisKeys } from '../../redis-keys';
import { getListMessageAtIndex } from '../common';
import { Message } from '../../../message';

export class RequeueMessageHandler {
  protected requeueListMessage(
    redisClient: RedisClient,
    queueName: string,
    from: string,
    index: number,
    messageId: string,
    withPriority: boolean,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    const { keyQueuePriority, keyQueue } = redisKeys.getKeys(queueName);
    getListMessageAtIndex(redisClient, from, index, messageId, (err, msg) => {
      if (err) cb(err);
      else if (!msg) cb(new Error('Expected an instance of Message'));
      else {
        const multi = redisClient.multi();
        multi.lrem(from, 1, JSON.stringify(msg));
        const message = Message.createFromMessage(msg, true, true);
        const msgPriority = withPriority
          ? message.getSetPriority(priority)
          : null;
        if (typeof msgPriority === 'number')
          multi.zadd(keyQueuePriority, msgPriority, JSON.stringify(message));
        else multi.lpush(keyQueue, JSON.stringify(message));
        redisClient.execMulti(multi, (err) => cb(err));
      }
    });
  }

  requeueMessageFromDLQueue(
    redisClient: RedisClient,
    queueName: string,
    index: number,
    messageId: string,
    withPriority: boolean,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    const { keyQueueDL } = redisKeys.getKeys(queueName);
    this.requeueListMessage(
      redisClient,
      queueName,
      keyQueueDL,
      index,
      messageId,
      withPriority,
      priority,
      cb,
    );
  }

  requeueMessageFromAcknowledgedQueue(
    redisClient: RedisClient,
    queueName: string,
    index: number,
    messageId: string,
    withPriority: boolean,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    const { keyQueueAcknowledgedMessages } = redisKeys.getKeys(queueName);
    this.requeueListMessage(
      redisClient,
      queueName,
      keyQueueAcknowledgedMessages,
      index,
      messageId,
      withPriority,
      priority,
      cb,
    );
  }
}
