import { RedisClient } from '../common/redis-client/redis-client';
import { redisKeys } from '../common/redis-keys/redis-keys';
import { Message } from '../message/message';
import { ICallback, IConsumerWorkerParameters } from '../../../types';
import { EmptyCallbackReplyError } from '../common/errors/empty-callback-reply.error';
import { PanicError } from '../common/errors/panic.error';
import { Worker } from '../common/worker/worker';
import { setConfiguration } from '../common/configuration';
import { each } from '../lib/async';

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
          each(
            messages,
            (messageStr, _, done) => {
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
                    done(
                      new PanicError(
                        `Expected a non-empty message priority value`,
                      ),
                    );
                  else {
                    multi.zadd(
                      keyQueuePendingPriorityMessageIds,
                      priority,
                      JSON.stringify(message),
                    );
                  }
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

export default RequeueWorker;

process.on('message', (payload: string) => {
  const params: IConsumerWorkerParameters = JSON.parse(payload);
  setConfiguration(params.config);
  RedisClient.getNewInstance((err, client) => {
    if (err) throw err;
    else if (!client) throw new EmptyCallbackReplyError();
    else new RequeueWorker(client, params, false).run();
  });
});
