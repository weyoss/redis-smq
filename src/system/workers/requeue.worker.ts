import { RedisClient } from '../common/redis-client/redis-client';
import { redisKeys } from '../common/redis-keys/redis-keys';
import { Message } from '../message';
import * as async from 'async';
import { ICallback, TConsumerWorkerParameters } from '../../../types';
import { EmptyCallbackReplyError } from '../common/errors/empty-callback-reply.error';
import { PanicError } from '../common/errors/panic.error';
import { ConsumerWorker } from '../consumer/consumer-worker';
import { setConfiguration } from '../common/configuration';

export class RequeueWorker extends ConsumerWorker {
  protected redisKeys: ReturnType<typeof redisKeys['getMainKeys']>;

  constructor(redisClient: RedisClient) {
    super(redisClient);
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
            (messageStr, done) => {
              const message = Message.createFromMessage(messageStr);
              const queue = message.getQueue();
              if (!queue)
                done(new PanicError('Message queue parameters are required'));
              else {
                const { ns, name } = queue;
                const { keyQueuePending, keyQueuePendingPriorityMessageIds } =
                  redisKeys.getQueueKeys(name, ns);
                multi.lrem(keyRequeueMessages, 1, messageStr);
                message.incrAttempts();
                if (message.isWithPriority()) {
                  const priority = message.getPriority();
                  if (priority === null)
                    throw new PanicError(
                      `Expected a non-empty message priority value`,
                    );
                  multi.zadd(
                    keyQueuePendingPriorityMessageIds,
                    priority,
                    JSON.stringify(message),
                  );
                } else multi.lpush(keyQueuePending, JSON.stringify(message));
                done();
              }
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

process.on('message', (c: string) => {
  const { config }: TConsumerWorkerParameters = JSON.parse(c);
  setConfiguration(config);
  RedisClient.getNewInstance((err, client) => {
    if (err) throw err;
    else if (!client) throw new EmptyCallbackReplyError();
    else new RequeueWorker(client).run();
  });
});
