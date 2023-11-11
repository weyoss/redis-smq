import { redisKeys } from '../common/redis-keys/redis-keys';
import {
  async,
  errors,
  RedisClient,
  Worker,
  ICallback,
} from 'redis-smq-common';
import {
  EMessageProperty,
  EMessagePropertyStatus,
  EQueueProperty,
} from '../../types';
import { ELuaScriptName } from '../common/redis-client/redis-client';
import { _getMessage } from '../lib/queue/queue-messages/_get-message';

export class DelayUnacknowledgedWorker extends Worker {
  protected redisKeys: ReturnType<typeof redisKeys['getMainKeys']>;
  protected redisClient: RedisClient;

  constructor(redisClient: RedisClient, managed: boolean) {
    super(managed);
    this.redisClient = redisClient;
    this.redisKeys = redisKeys.getMainKeys();
  }

  work = (cb: ICallback<void>): void => {
    const { keyDelayedMessages, keyScheduledMessages } =
      redisKeys.getMainKeys();
    this.redisClient.lrange(keyDelayedMessages, 0, 9, (err, reply) => {
      if (err) cb(err);
      else {
        const messageIds = reply ?? [];
        if (messageIds.length) {
          const keys: string[] = [keyScheduledMessages, keyDelayedMessages];
          const args: (string | number)[] = [
            EQueueProperty.QUEUE_TYPE,
            EQueueProperty.MESSAGES_COUNT,
            EMessageProperty.MESSAGE,
            EMessageProperty.STATUS,
            EMessagePropertyStatus.SCHEDULED,
            EMessageProperty.STATE,
            '1',
          ];
          async.each(
            messageIds,
            (messageId, _, done) => {
              _getMessage(this.redisClient, messageId, (err, message) => {
                if (err) done(err);
                else if (!message) cb(new errors.EmptyCallbackReplyError());
                else {
                  const messageId = message.getRequiredId();
                  const queue = message.getDestinationQueue();
                  const {
                    keyQueueProperties,
                    keyQueueMessages,
                    keyQueueScheduled,
                  } = redisKeys.getQueueKeys(queue);
                  const { keyMessage } = redisKeys.getMessageKeys(messageId);
                  keys.push(keyQueueProperties, keyMessage, keyQueueScheduled);
                  args.push(messageId, '');
                  const delay = message.getRetryDelay();
                  const messageState = message.getRequiredMessageState();
                  messageState.incrAttempts();
                  messageState.setNextRetryDelay(delay);
                  const timestamp = message.getNextScheduledTimestamp();
                  args.push(
                    timestamp,
                    keyQueueMessages,
                    JSON.stringify(messageState),
                  );
                  done();
                }
              });
            },
            (err) => {
              if (err) cb(err);
              else {
                this.redisClient.runScript(
                  ELuaScriptName.SCHEDULE_MESSAGE,
                  keys,
                  args,
                  (err, reply) => {
                    if (err) cb(err);
                    else if (!reply) cb(new errors.EmptyCallbackReplyError());
                    else if (reply !== 'OK')
                      cb(new errors.GenericError(String(reply)));
                    else cb();
                  },
                );
              }
            },
          );
        } else cb();
      }
    });
  };
}

export default DelayUnacknowledgedWorker;
