import { Message } from '../message/message';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { MessageNotScheduledError } from './errors/message-not-scheduled.error';
import { RedisClient, ICallback } from 'redis-smq-common';
import { ELuaScriptName } from '../../common/redis-client/redis-client';
import {
  EMessageProperty,
  EMessagePropertyStatus,
  EQueueProperty,
} from '../../../types';

export function _scheduleMessage(
  mixed: RedisClient,
  message: Message,
  cb: ICallback<void>,
): void {
  const timestamp = message.getNextScheduledTimestamp();
  if (timestamp > 0) {
    const queue = message.getDestinationQueue();
    const {
      keyQueueProperties,
      keyQueueScheduled,
      keyScheduledMessages,
      keyDelayedMessages,
      keyQueueMessages,
    } = redisKeys.getQueueKeys(queue);
    const ts = Date.now();
    message.getRequiredMessageState().setScheduledAt(ts).setLastScheduledAt(ts);
    const messageId = message.getRequiredId();
    const { keyMessage } = redisKeys.getMessageKeys(messageId);
    mixed.runScript(
      ELuaScriptName.SCHEDULE_MESSAGE,
      [
        keyScheduledMessages,
        keyDelayedMessages,
        keyQueueProperties,
        keyMessage,
        keyQueueScheduled,
      ],
      [
        EQueueProperty.QUEUE_TYPE,
        EQueueProperty.MESSAGES_COUNT,
        EMessageProperty.MESSAGE,
        EMessageProperty.STATUS,
        EMessagePropertyStatus.SCHEDULED,
        EMessageProperty.STATE,
        '0',

        messageId,
        JSON.stringify(message),
        `${timestamp}`,
        keyQueueMessages, // Not a final key. Passing it as an argument
        JSON.stringify(message.getMessageState()),
      ],
      (err, reply) => {
        if (err) cb(err);
        else if (reply !== 'OK')
          cb(new MessageNotScheduledError(String(reply)));
        else cb();
      },
    );
  } else cb(new MessageNotScheduledError('INVALID_SCHEDULING_PARAMETERS'));
}