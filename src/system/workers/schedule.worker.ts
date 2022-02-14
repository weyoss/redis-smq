import { ICallback, IConsumerWorkerParameters } from '../../../types';
import { redisKeys } from '../common/redis-keys/redis-keys';
import { RedisClient } from '../common/redis-client/redis-client';
import { EmptyCallbackReplyError } from '../common/errors/empty-callback-reply.error';
import { Message } from '../app/message/message';
import { ELuaScriptName } from '../common/redis-client/lua-scripts';
import { Worker } from '../common/worker/worker';
import { setConfiguration } from '../common/configuration/configuration';
import { each, waterfall } from '../lib/async';

export class ScheduleWorker extends Worker<IConsumerWorkerParameters> {
  protected fetchMessages = (ids: string[], cb: ICallback<Message[]>): void => {
    if (ids.length) {
      const { keyScheduledMessages } = redisKeys.getMainKeys();
      this.redisClient.hmget(keyScheduledMessages, ids, (err, reply) => {
        if (err) cb(err);
        else {
          const messages: Message[] = [];
          each(
            reply ?? [],
            (item, _, done) => {
              if (!item) done(new EmptyCallbackReplyError());
              else {
                messages.push(Message.createFromMessage(item));
                done();
              }
            },
            (err) => {
              if (err) cb(err);
              else cb(null, messages);
            },
          );
        }
      });
    } else cb(null, []);
  };

  protected fetchMessageIds = (cb: ICallback<string[]>): void => {
    const { keyScheduledMessageIds } = redisKeys.getMainKeys();
    this.redisClient.zrangebyscore(keyScheduledMessageIds, 0, Date.now(), cb);
  };

  protected enqueueMessages = (
    messages: Message[],
    cb: ICallback<void>,
  ): void => {
    if (messages.length) {
      each(
        messages,
        (msg, _, done) => {
          const message = Message.createFromMessage(msg);
          const queue = message.getRequiredQueue();
          const {
            keyQueues,
            keyQueuePending,
            keyQueuePendingPriorityMessages,
            keyQueuePendingPriorityMessageIds,
            keyScheduledMessageIds,
            keyScheduledMessages,
          } = redisKeys.getQueueKeys(queue);
          const nextScheduleTimestamp = message.getNextScheduledTimestamp();
          message.getRequiredMetadata().setPublishedAt(Date.now());
          this.redisClient.runScript(
            ELuaScriptName.ENQUEUE_SCHEDULED_MESSAGE,
            [
              keyQueues,
              keyQueuePendingPriorityMessages,
              keyQueuePendingPriorityMessageIds,
              keyQueuePending,
              keyScheduledMessageIds,
              keyScheduledMessages,
            ],
            [
              JSON.stringify(queue),
              message.getRequiredId(),
              JSON.stringify(message),
              message.getPriority() ?? '',
              `${nextScheduleTimestamp}`,
            ],
            (err) => done(err),
          );
        },
        cb,
      );
    } else cb();
  };

  work = (cb: ICallback<void>): void => {
    waterfall(
      [
        (cb: ICallback<string[]>) => {
          this.fetchMessageIds(cb);
        },
        (ids: string[], cb: ICallback<Message[]>) => {
          this.fetchMessages(ids, cb);
        },
        (messages: Message[], cb: ICallback<void>) => {
          this.enqueueMessages(messages, cb);
        },
      ],
      cb,
    );
  };
}

export default ScheduleWorker;

process.on('message', (payload: string) => {
  const params: IConsumerWorkerParameters = JSON.parse(payload);
  setConfiguration(params.config);
  RedisClient.getNewInstance((err, client) => {
    if (err) throw err;
    else if (!client) throw new EmptyCallbackReplyError();
    else new ScheduleWorker(client, params, false).run();
  });
});
