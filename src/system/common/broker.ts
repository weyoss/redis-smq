import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgedCause,
  ICallback,
  TRedisClientMulti,
} from '../../../types';
import { Message } from '../app/message/message';
import { RedisClient } from './redis-client/redis-client';
import { redisKeys } from './redis-keys/redis-keys';
import { ELuaScriptName } from './redis-client/lua-scripts';
import { getConfiguration } from './configuration';

function deadLetterMessage(
  mixed: RedisClient | TRedisClientMulti,
  message: Message,
  keyQueueProcessing: string,
  unacknowledgedCause: EMessageUnacknowledgedCause,
  deadLetterCause: EMessageDeadLetterCause,
  cb: ICallback<void>,
): void {
  const queue = message.getRequiredQueue();
  const { storeMessages } = getConfiguration();
  const { keyQueueDL } = redisKeys.getQueueKeys(queue);
  if (mixed instanceof RedisClient) {
    if (storeMessages) {
      mixed.lpoprpush(keyQueueProcessing, keyQueueDL, (err) => {
        if (err) cb(err);
        else cb();
      });
    } else {
      mixed.rpop(keyQueueProcessing, (err) => cb(err));
    }
  } else {
    if (storeMessages) {
      mixed.lpop(keyQueueProcessing);
      mixed.rpush(keyQueueDL, JSON.stringify(message));
    } else {
      mixed.rpop(keyQueueProcessing);
    }
    cb();
  }
}

function delayMessageBeforeRequeuing(
  mixed: RedisClient | TRedisClientMulti,
  message: Message,
  keyQueueProcessing: string,
  unacknowledgedCause: EMessageUnacknowledgedCause,
  cb: ICallback<void>,
): void {
  const queue = message.getRequiredQueue();
  const { keyDelayedMessages } = redisKeys.getQueueKeys(queue);
  if (mixed instanceof RedisClient) {
    mixed.rpoplpush(keyQueueProcessing, keyDelayedMessages, (err) => cb(err));
  } else {
    mixed.rpoplpush(keyQueueProcessing, keyDelayedMessages);
    cb();
  }
}

function requeueMessage(
  mixed: RedisClient | TRedisClientMulti,
  message: Message,
  keyQueueProcessing: string,
  unacknowledgedCause: EMessageUnacknowledgedCause,
  cb: ICallback<void>,
): void {
  const queue = message.getRequiredQueue();
  const { keyRequeueMessages } = redisKeys.getQueueKeys(queue);
  if (mixed instanceof RedisClient) {
    mixed.rpoplpush(keyQueueProcessing, keyRequeueMessages, (err) => cb(err));
  } else {
    mixed.rpoplpush(keyQueueProcessing, keyRequeueMessages);
    cb();
  }
}

export const broker = {
  schedule(multi: TRedisClientMulti, message: Message): void {
    const timestamp = message.getNextScheduledTimestamp();
    if (timestamp > 0) {
      const { keyScheduledMessageIds, keyScheduledMessages } =
        redisKeys.getMainKeys();
      message.getRequiredMetadata().setScheduledAt(Date.now());
      const messageId = message.getRequiredId();
      multi.zadd(keyScheduledMessageIds, timestamp, messageId);
      multi.hset(keyScheduledMessages, messageId, JSON.stringify(message));
    }
  },

  scheduleMessage(
    redisClient: RedisClient,
    message: Message,
    cb: ICallback<boolean>,
  ): void {
    const timestamp = message.getNextScheduledTimestamp();
    if (timestamp > 0) {
      const queue = message.getRequiredQueue();
      const {
        keyNamespaces,
        keyNsQueues,
        keyQueues,
        keyScheduledMessageIds,
        keyScheduledMessages,
      } = redisKeys.getQueueKeys(queue);
      message.getRequiredMetadata().setScheduledAt(Date.now());
      const messageId = message.getRequiredId();
      redisClient.runScript(
        ELuaScriptName.SCHEDULE_MESSAGE,
        [
          keyNamespaces,
          keyNsQueues,
          keyQueues,
          keyScheduledMessageIds,
          keyScheduledMessages,
        ],
        [
          queue.ns,
          JSON.stringify(queue),
          messageId,
          JSON.stringify(message),
          `${timestamp}`,
        ],
        (err) => {
          if (err) cb(err);
          else cb(null, true);
        },
      );
    } else cb(null, false);
  },

  acknowledgeMessage(
    redisClient: RedisClient,
    message: Message,
    keyQueueProcessing: string,
    storeMessages: boolean,
    cb: ICallback<void>,
  ): void {
    const queue = message.getRequiredQueue();
    if (storeMessages) {
      const { keyQueueAcknowledged } = redisKeys.getQueueKeys(queue);
      redisClient.lpoprpush(keyQueueProcessing, keyQueueAcknowledged, (err) => {
        if (err) cb(err);
        else cb();
      });
    } else {
      redisClient.rpop(keyQueueProcessing, (err) => cb(err));
    }
  },

  retry(
    mixed: RedisClient | TRedisClientMulti,
    processingQueue: string,
    message: Message,
    unacknowledgedCause: EMessageUnacknowledgedCause,
    cb: ICallback<EMessageDeadLetterCause>,
  ): void {
    if (
      unacknowledgedCause === EMessageUnacknowledgedCause.TTL_EXPIRED ||
      message.getSetExpired()
    ) {
      //consumer.emit(events.MESSAGE_EXPIRED, message);
      deadLetterMessage(
        mixed,
        message,
        processingQueue,
        unacknowledgedCause,
        EMessageDeadLetterCause.TTL_EXPIRED,
        (err) => {
          if (err) cb(err);
          else cb(null, EMessageDeadLetterCause.TTL_EXPIRED);
        },
      );
    } else if (message.isPeriodic()) {
      // Only non-periodic messages are re-queued. Failure of periodic messages is ignored since such
      // messages are periodically scheduled for delivery.
      deadLetterMessage(
        mixed,
        message,
        processingQueue,
        unacknowledgedCause,
        EMessageDeadLetterCause.PERIODIC_MESSAGE,
        (err) => {
          if (err) cb(err);
          else cb(null, EMessageDeadLetterCause.PERIODIC_MESSAGE);
        },
      );
    } else if (!message.hasRetryThresholdExceeded()) {
      const delay = message.getRetryDelay();
      if (delay) {
        delayMessageBeforeRequeuing(
          mixed,
          message,
          processingQueue,
          unacknowledgedCause,
          (err) => cb(err),
        );
      } else {
        requeueMessage(
          mixed,
          message,
          processingQueue,
          unacknowledgedCause,
          (err) => cb(err),
        );
      }
    } else {
      deadLetterMessage(
        mixed,
        message,
        processingQueue,
        unacknowledgedCause,
        EMessageDeadLetterCause.RETRY_THRESHOLD_EXCEEDED,
        (err) => {
          if (err) cb(err);
          else cb(null, EMessageDeadLetterCause.RETRY_THRESHOLD_EXCEEDED);
        },
      );
    }
  },
};
