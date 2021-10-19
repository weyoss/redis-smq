import { Message } from '../message';
import {
  EMessageDeadLetterCause,
  EMessageMetadataType,
  EMessageUnacknowledgedCause,
  EQueueMetadataType,
  ICallback,
  IMessageMetadata,
  TQueueMetadata,
  TRedisClientMulti,
} from '../../types';
import { redisKeys } from './redis-keys';
import { RedisClient } from './redis-client';

export const metadata = {
  addMessageMetadata(
    message: Message,
    metadata: IMessageMetadata,
    multi: TRedisClientMulti,
  ): void {
    const messageId = message.getId();
    const { keyMetadataMessage } = redisKeys.getMessageKeys(messageId);
    multi.rpush(keyMetadataMessage, JSON.stringify(metadata));
  },

  preMessageUnacknowledged(
    msg: Message,
    queueName: string,
    unacknowledgedCause: EMessageUnacknowledgedCause,
    multi: TRedisClientMulti,
  ): void {
    this.addMessageMetadata(
      msg,
      {
        state: msg,
        type: EMessageMetadataType.UNACKNOWLEDGED,
        timestamp: Date.now(),
        unacknowledgedCause,
      },
      multi,
    );
    const { keyMetadataQueue } = redisKeys.getKeys(queueName);
    multi.hincrby(keyMetadataQueue, EQueueMetadataType.PENDING_MESSAGES, -1);
  },

  preMessageDeadLetter(
    msg: Message,
    queueName: string,
    deadLetterCause: EMessageDeadLetterCause,
    multi: TRedisClientMulti,
  ): void {
    this.addMessageMetadata(
      msg,
      {
        state: msg,
        type: EMessageMetadataType.DEAD_LETTER,
        timestamp: Date.now(),
        deadLetterCause,
      },
      multi,
    );
    const { keyMetadataQueue } = redisKeys.getKeys(queueName);
    multi.hincrby(keyMetadataQueue, EQueueMetadataType.DEAD_LETTER_MESSAGES, 1);
  },

  preMessageEnqueued(
    msg: Message,
    queueName: string,
    multi: TRedisClientMulti,
  ): void {
    this.addMessageMetadata(
      msg,
      {
        state: msg,
        type: EMessageMetadataType.ENQUEUED,
        timestamp: Date.now(),
      },
      multi,
    );
    const { keyMetadataQueue } = redisKeys.getKeys(queueName);
    multi.hincrby(keyMetadataQueue, EQueueMetadataType.PENDING_MESSAGES, 1);
  },

  preMessageWithPriorityEnqueued(
    msg: Message,
    queueName: string,
    multi: TRedisClientMulti,
  ): void {
    this.addMessageMetadata(
      msg,
      {
        state: msg,
        type: EMessageMetadataType.ENQUEUED_WITH_PRIORITY,
        timestamp: Date.now(),
      },
      multi,
    );
    const { keyMetadataQueue } = redisKeys.getKeys(queueName);
    multi.hincrby(
      keyMetadataQueue,
      EQueueMetadataType.PENDING_MESSAGES_WITH_PRIORITY,
      1,
    );
  },

  preMessageAcknowledged(
    msg: Message,
    queueName: string,
    multi: TRedisClientMulti,
  ): void {
    this.addMessageMetadata(
      msg,
      {
        state: msg,
        type: EMessageMetadataType.ACKNOWLEDGED,
        timestamp: Date.now(),
      },
      multi,
    );
    const { keyMetadataQueue } = redisKeys.getKeys(queueName);
    multi.hincrby(
      keyMetadataQueue,
      EQueueMetadataType.ACKNOWLEDGED_MESSAGES,
      1,
    );
    multi.hincrby(keyMetadataQueue, EQueueMetadataType.PENDING_MESSAGES, -1);
  },

  preMessageScheduledEnqueue(
    msg: Message,
    queueName: string,
    multi: TRedisClientMulti,
  ): void {
    this.addMessageMetadata(
      msg,
      {
        state: msg,
        type: EMessageMetadataType.SCHEDULED_ENQUEUED,
        timestamp: Date.now(),
      },
      multi,
    );
    const { keyMetadataQueue } = redisKeys.getKeys(queueName);
    multi.hincrby(keyMetadataQueue, EQueueMetadataType.SCHEDULED_MESSAGES, -1);
  },

  preMessageScheduled(
    msg: Message,
    queueName: string,
    multi: TRedisClientMulti,
  ): void {
    this.addMessageMetadata(
      msg,
      {
        state: msg,
        type: EMessageMetadataType.SCHEDULED,
        timestamp: Date.now(),
      },
      multi,
    );
    const { keyMetadataQueue } = redisKeys.getKeys(queueName);
    multi.hincrby(keyMetadataQueue, EQueueMetadataType.SCHEDULED_MESSAGES, 1);
  },

  ///

  preQueueDeadLetterPurge(queueName: string, multi: TRedisClientMulti): void {
    const { keyMetadataQueue } = redisKeys.getKeys(queueName);
    multi.hset(keyMetadataQueue, EQueueMetadataType.DEAD_LETTER_MESSAGES, '0');
  },

  prePurgeAcknowledgedMessagesQueue(
    queueName: string,
    multi: TRedisClientMulti,
  ): void {
    const { keyMetadataQueue } = redisKeys.getKeys(queueName);
    multi.hset(keyMetadataQueue, EQueueMetadataType.ACKNOWLEDGED_MESSAGES, '0');
  },

  preQueuePurge(queueName: string, multi: TRedisClientMulti): void {
    const { keyMetadataQueue } = redisKeys.getKeys(queueName);
    multi.hset(keyMetadataQueue, EQueueMetadataType.PENDING_MESSAGES, '0');
  },

  prePriorityQueuePurge(queueName: string, multi: TRedisClientMulti): void {
    const { keyMetadataQueue } = redisKeys.getKeys(queueName);
    multi.hset(
      keyMetadataQueue,
      EQueueMetadataType.PENDING_MESSAGES_WITH_PRIORITY,
      '0',
    );
  },

  ///

  getMessageMetadata(
    client: RedisClient,
    messageId: string,
    cb: ICallback<IMessageMetadata[]>,
  ): void {
    const { keyMetadataMessage } = redisKeys.getMessageKeys(messageId);
    client.lrange(keyMetadataMessage, 0, -1, (err, metadata) => {
      if (err) cb(err);
      else {
        const metadataList: IMessageMetadata[] = (metadata ?? []).map((i) => {
          const msgMetadataItem: IMessageMetadata = JSON.parse(i);
          msgMetadataItem.state = Message.createFromMessage(
            msgMetadataItem.state,
          );
          return msgMetadataItem;
        });
        cb(null, metadataList);
      }
    });
  },

  getQueueMetadata(
    client: RedisClient,
    queueName: string,
    cb: ICallback<TQueueMetadata>,
  ): void {
    const { keyMetadataQueue } = redisKeys.getKeys(queueName);
    client.hgetall(keyMetadataQueue, (err, metadata) => {
      if (err) cb(err);
      else {
        const meta = metadata ?? {};
        const result = {
          pending: meta[EQueueMetadataType.PENDING_MESSAGES]
            ? Number(meta[EQueueMetadataType.PENDING_MESSAGES])
            : 0,
          pendingWithPriority: meta[
            EQueueMetadataType.PENDING_MESSAGES_WITH_PRIORITY
          ]
            ? Number(meta[EQueueMetadataType.PENDING_MESSAGES_WITH_PRIORITY])
            : 0,
          acknowledged: meta[EQueueMetadataType.ACKNOWLEDGED_MESSAGES]
            ? Number(meta[EQueueMetadataType.ACKNOWLEDGED_MESSAGES])
            : 0,
          deadLetter: meta[EQueueMetadataType.DEAD_LETTER_MESSAGES]
            ? Number(meta[EQueueMetadataType.DEAD_LETTER_MESSAGES])
            : 0,
          scheduled: meta[EQueueMetadataType.SCHEDULED_MESSAGES]
            ? Number(meta[EQueueMetadataType.SCHEDULED_MESSAGES])
            : 0,
        };
        cb(null, result);
      }
    });
  },

  getQueueMetadataByKey(
    client: RedisClient,
    queueName: string,
    key: keyof TQueueMetadata,
    cb: ICallback<number>,
  ): void {
    this.getQueueMetadata(client, queueName, (err, metadata) => {
      if (err) cb(err);
      if (!metadata) cb(new Error('Expected a non empty reply'));
      else {
        const m = metadata[key];
        cb(null, m);
      }
    });
  },

  getLastMessageMetadata(
    client: RedisClient,
    messageId: string,
    cb: ICallback<IMessageMetadata>,
  ): void {
    this.getMessageMetadata(client, messageId, (err, messageMetata) => {
      if (err) cb(err);
      else {
        const m = messageMetata?.pop();
        if (!m) cb(new Error('Message does not exist'));
        else cb(null, m);
      }
    });
  },
};
