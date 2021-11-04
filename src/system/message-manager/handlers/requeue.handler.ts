import { ICallback } from '../../../../types';
import { redisKeys } from '../../common/redis-keys';
import { getListMessageAtSequenceId } from '../common';
import { Message } from '../../message';
import { Handler } from './handler';

export class RequeueHandler extends Handler {
  protected requeueListMessage(
    queueName: string,
    from: string,
    index: number,
    messageId: string,
    withPriority: boolean,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    const { keyQueuePriority, keyQueue } = redisKeys.getKeys(queueName);
    getListMessageAtSequenceId(
      this.redisClient,
      from,
      index,
      messageId,
      (err, msg) => {
        if (err) cb(err);
        else if (!msg) cb(new Error('Expected an instance of Message'));
        else {
          const multi = this.redisClient.multi();
          multi.lrem(from, 1, JSON.stringify(msg));
          const message = Message.createFromMessage(msg, true, true);
          const msgPriority = withPriority
            ? message.getSetPriority(priority)
            : null;
          if (typeof msgPriority === 'number')
            multi.zadd(keyQueuePriority, msgPriority, JSON.stringify(message));
          else multi.lpush(keyQueue, JSON.stringify(message));
          this.redisClient.execMulti(multi, (err) => cb(err));
        }
      },
    );
  }

  requeueMessageFromDLQueue(
    queueName: string,
    index: number,
    messageId: string,
    withPriority: boolean,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    const { keyQueueDL } = redisKeys.getKeys(queueName);
    this.requeueListMessage(
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
    queueName: string,
    index: number,
    messageId: string,
    withPriority: boolean,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    const { keyQueueAcknowledgedMessages } = redisKeys.getKeys(queueName);
    this.requeueListMessage(
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
