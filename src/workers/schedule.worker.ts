import { redisKeys } from '../common/redis-keys/redis-keys';
import { Message } from '../lib/message/message';
import { async, errors, RedisClient, Worker } from 'redis-smq-common';
import { ELuaScriptName } from '../common/redis-client/redis-client';
import { ICallback } from 'redis-smq-common/dist/types';

export class ScheduleWorker extends Worker {
  protected redisClient: RedisClient;

  constructor(redisClient: RedisClient, managed: boolean) {
    super(managed);
    this.redisClient = redisClient;
  }

  protected fetchMessageIds = (cb: ICallback<string[]>): void => {
    const { keyScheduledMessageWeight } = redisKeys.getMainKeys();
    this.redisClient.zrangebyscore(
      keyScheduledMessageWeight,
      0,
      Date.now(),
      cb,
    );
  };

  protected fetchMessages = (ids: string[], cb: ICallback<Message[]>): void => {
    if (ids.length) {
      const { keyScheduledMessages } = redisKeys.getMainKeys();
      this.redisClient.hmget(keyScheduledMessages, ids, (err, reply) => {
        if (err) cb(err);
        else {
          const messages: Message[] = [];
          async.each(
            reply ?? [],
            (item, _, done) => {
              if (!item) done(new errors.EmptyCallbackReplyError());
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
      async.each(
        messages,
        (msg, _, done) => {
          const message = Message.createFromMessage(msg);
          const queue = message.getDestinationQueue();
          const {
            keyQueueSettings,
            keyQueueSettingsPriorityQueuing,
            keyQueuePending,
            keyQueuePendingPriorityMessages,
            keyQueuePendingPriorityMessageWeight,
            keyScheduledMessageWeight,
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
              keyQueuePendingPriorityMessageWeight,
              keyQueuePending,
              keyScheduledMessageWeight,
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
    async.waterfall(
      [this.fetchMessageIds, this.fetchMessages, this.enqueueMessages],
      cb,
    );
  };
}

export default ScheduleWorker;
