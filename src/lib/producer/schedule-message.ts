import { Message } from '../message/message';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { MessageNotScheduledError } from './errors/message-not-scheduled.error';
import { ICallback, IRedisClientMulti } from 'redis-smq-common/dist/types';
import { errors, RedisClient } from 'redis-smq-common';
import { ELuaScriptName } from '../../common/redis-client/redis-client';

function scheduleMessageTransaction(
  multi: IRedisClientMulti,
  message: Message,
): boolean {
  const timestamp = message.getNextScheduledTimestamp();
  if (timestamp > 0) {
    const { keyScheduledMessageWeight, keyScheduledMessages } =
      redisKeys.getMainKeys();
    message.getRequiredMessageState().setScheduledAt(Date.now());
    const messageId = message.getRequiredId();
    multi.zadd(keyScheduledMessageWeight, timestamp, messageId);
    multi.hset(keyScheduledMessages, messageId, JSON.stringify(message));
    return true;
  }
  return false;
}

export function scheduleMessage(
  mixed: IRedisClientMulti,
  message: Message,
): boolean;
export function scheduleMessage(
  mixed: RedisClient,
  message: Message,
  cb: ICallback<void>,
): void;
export function scheduleMessage(
  mixed: RedisClient | IRedisClientMulti,
  message: Message,
  cb?: ICallback<void>,
): void | boolean {
  if (mixed instanceof RedisClient) {
    if (!cb) throw new errors.PanicError(`Expected a callback function`);
    const timestamp = message.getNextScheduledTimestamp();
    if (timestamp > 0) {
      const queue = message.getDestinationQueue();
      const {
        keyQueueSettings,
        keyQueueSettingsPriorityQueuing,
        keyScheduledMessageWeight,
        keyScheduledMessages,
      } = redisKeys.getQueueKeys(queue);
      message.getRequiredMessageState().setScheduledAt(Date.now());
      const messageId = message.getRequiredId();
      mixed.runScript(
        ELuaScriptName.SCHEDULE_MESSAGE,
        [
          keyQueueSettings,
          keyQueueSettingsPriorityQueuing,
          keyScheduledMessageWeight,
          keyScheduledMessages,
        ],
        [
          messageId,
          JSON.stringify(message),
          `${timestamp}`,
          `${message.getPriority() ?? ''}`,
        ],
        (err, reply) => {
          if (err) cb(err);
          else if (reply !== 'OK')
            cb(new MessageNotScheduledError(String(reply)));
          else cb();
        },
      );
    } else cb(new MessageNotScheduledError('INVALID_SCHEDULING_PARAMETERS'));
  } else {
    return scheduleMessageTransaction(mixed, message);
  }
}
