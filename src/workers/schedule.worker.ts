import { ICallback, IConsumerWorkerParameters } from '../../types';
import { redisKeys } from '../common/redis-keys/redis-keys';
import { EmptyCallbackReplyError } from '../common/errors/empty-callback-reply.error';
import { Message } from '../app/message/message';
import { ELuaScriptName } from '../common/redis-client/lua-scripts';
import { Worker } from '../common/worker/worker';
import { each, waterfall } from '../lib/async';

export class ScheduleWorker extends Worker<IConsumerWorkerParameters> {
  protected fetchMessageIds = (cb: ICallback<string[]>): void => {
    const { keyScheduledMessageIds } = redisKeys.getMainKeys();
    this.redisClient.zrangebyscore(keyScheduledMessageIds, 0, Date.now(), cb);
  };

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
            keyQueueSettings,
            keyQueueSettingsPriorityQueuing,
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
              keyQueueSettings,
              keyQueueSettingsPriorityQueuing,
              keyQueuePendingPriorityMessages,
              keyQueuePendingPriorityMessageIds,
              keyQueuePending,
              keyScheduledMessageIds,
              keyScheduledMessages,
            ],
            [
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
      [this.fetchMessageIds, this.fetchMessages, this.enqueueMessages],
      cb,
    );
  };
}

export default ScheduleWorker;
