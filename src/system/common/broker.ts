import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgedCause,
  ICallback,
  TRedisClientMulti,
} from '../../../types';
import { Message } from '../message';
import { RedisClient } from './redis-client/redis-client';
import { PanicError } from './errors/panic.error';
import { redisKeys } from './redis-keys/redis-keys';
import { ArgumentError } from './errors/argument.error';
import { ELuaScriptName } from './redis-client/lua-scripts';
import { getConfiguration } from './configuration';

function deadLetterMessage(
  redisClient: RedisClient,
  message: Message,
  keyQueueProcessing: string,
  unacknowledgedCause: EMessageUnacknowledgedCause,
  deadLetterCause: EMessageDeadLetterCause,
  cb: ICallback<void>,
): void {
  const queue = message.getQueue();
  if (!queue) {
    throw new PanicError(`Message parameters are required`);
  }
  const { storeMessages } = getConfiguration();
  if (storeMessages) {
    const { keyQueueDL } = redisKeys.getQueueKeys(queue.name, queue.ns);
    redisClient.lpoprpush(keyQueueProcessing, keyQueueDL, (err) => {
      if (err) cb(err);
      else cb();
    });
  } else {
    redisClient.rpop(keyQueueProcessing, (err) => cb(err));
  }
}

function delayUnacknowledgedMessageBeforeRequeuing(
  redisClient: RedisClient,
  message: Message,
  keyQueueProcessing: string,
  unacknowledgedCause: EMessageUnacknowledgedCause,
  cb: ICallback<void>,
): void {
  const queue = message.getQueue();
  if (!queue) {
    throw new PanicError(`Message queue parameters are required.`);
  }
  const { keyDelayedMessages } = redisKeys.getQueueKeys(queue.name, queue.ns);
  redisClient.rpoplpush(keyQueueProcessing, keyDelayedMessages, (err) =>
    cb(err),
  );
}

function requeueUnacknowledgedMessage(
  redisClient: RedisClient,
  message: Message,
  keyQueueProcessing: string,
  unacknowledgedCause: EMessageUnacknowledgedCause,
  cb: ICallback<void>,
): void {
  const queue = message.getQueue();
  if (!queue) {
    throw new PanicError(`Message parameters are required`);
  }
  const { keyRequeueMessages } = redisKeys.getQueueKeys(queue.name, queue.ns);
  redisClient.rpoplpush(keyQueueProcessing, keyRequeueMessages, (err) =>
    cb(err),
  );
}

export const broker = {
  schedule(multi: TRedisClientMulti, message: Message): void {
    const timestamp = message.getNextScheduledTimestamp();
    if (timestamp > 0) {
      const { keyScheduledMessageIds, keyScheduledMessages } =
        redisKeys.getMainKeys();
      message.setScheduledAt(Date.now());
      const messageId = message.getId();
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
      const queue = message.getQueue();
      if (!queue) cb(new ArgumentError('Message queue is required'));
      else {
        const { keyQueues, keyScheduledMessageIds, keyScheduledMessages } =
          redisKeys.getQueueKeys(queue.name, queue.ns);
        message.setScheduledAt(Date.now());
        const messageId = message.getId();
        redisClient.runScript(
          ELuaScriptName.SCHEDULE_MESSAGE,
          [
            keyQueues,
            JSON.stringify(queue),
            messageId,
            JSON.stringify(message),
            `${timestamp}`,
            keyScheduledMessageIds,
            keyScheduledMessages,
          ],
          (err) => {
            if (err) cb(err);
            else cb(null, true);
          },
        );
      }
    } else cb(null, false);
  },

  acknowledgeMessage(
    redisClient: RedisClient,
    message: Message,
    keyQueueProcessing: string,
    storeMessages: boolean,
    cb: ICallback<void>,
  ): void {
    const queue = message.getQueue();
    if (!queue) {
      throw new PanicError(`Message queue parameters are required`);
    }
    if (storeMessages) {
      const { keyQueueAcknowledged } = redisKeys.getQueueKeys(
        queue.name,
        queue.ns,
      );
      redisClient.lpoprpush(keyQueueProcessing, keyQueueAcknowledged, (err) => {
        if (err) cb(err);
        else cb();
      });
    } else {
      redisClient.rpop(keyQueueProcessing, (err) => cb(err));
    }
  },

  retry(
    redisClient: RedisClient,
    processingQueue: string,
    message: Message,
    unacknowledgedCause: EMessageUnacknowledgedCause,
    cb: ICallback<EMessageDeadLetterCause>,
  ): void {
    if (
      unacknowledgedCause === EMessageUnacknowledgedCause.TTL_EXPIRED ||
      message.hasExpired()
    ) {
      //consumer.emit(events.MESSAGE_EXPIRED, message);
      deadLetterMessage(
        redisClient,
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
        redisClient,
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
        delayUnacknowledgedMessageBeforeRequeuing(
          redisClient,
          message,
          processingQueue,
          unacknowledgedCause,
          (err) => cb(err),
        );
      } else {
        requeueUnacknowledgedMessage(
          redisClient,
          message,
          processingQueue,
          unacknowledgedCause,
          (err) => cb(err),
        );
      }
    } else {
      deadLetterMessage(
        redisClient,
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
