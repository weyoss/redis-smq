import { redisKeys } from '../common/redis-keys/redis-keys';
import { Message } from '../lib/message/message';
import { IConsumerWorkerParameters } from '../../types';
import { async, errors, RedisClient, Worker } from 'redis-smq-common';
import { ICallback } from 'redis-smq-common/dist/types';

export class RequeueWorker extends Worker<IConsumerWorkerParameters> {
  protected redisKeys: ReturnType<typeof redisKeys['getMainKeys']>;

  constructor(
    redisClient: RedisClient,
    params: IConsumerWorkerParameters,
    managed: boolean,
  ) {
    super(redisClient, params, managed);
    this.redisKeys = redisKeys.getMainKeys();
  }

  work = (cb: ICallback<void>): void => {
    const { keyRequeueMessages } = this.redisKeys;
    this.redisClient.lrange(keyRequeueMessages, 0, 99, (err, reply) => {
      if (err) cb(err);
      else {
        const messages = reply ?? [];
        if (messages.length) {
          const multi = this.redisClient.multi();
          async.each(
            messages,
            (messageStr, _, done) => {
              const message = Message.createFromMessage(messageStr);
              const queue = message.getRequiredQueue();
              const { keyQueuePending, keyQueuePendingPriorityMessageWeight } =
                redisKeys.getQueueKeys(queue);
              multi.lrem(keyRequeueMessages, 1, messageStr);
              message.getRequiredMetadata().incrAttempts();
              if (message.hasPriority()) {
                const priority = message.getPriority();
                if (priority === null)
                  done(
                    new errors.PanicError(
                      `Expected a non-empty message priority value`,
                    ),
                  );
                else {
                  multi.zadd(
                    keyQueuePendingPriorityMessageWeight,
                    priority,
                    JSON.stringify(message),
                  );
                }
              } else multi.lpush(keyQueuePending, JSON.stringify(message));
              done();
            },
            (err) => {
              if (err) cb(err);
              else this.redisClient.execMulti(multi, (err) => cb(err));
            },
          );
        } else cb();
      }
    });
  };
}

export default RequeueWorker;
