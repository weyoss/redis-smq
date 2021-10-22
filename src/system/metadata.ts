import { Message } from '../message';
import {
  EMessageDeadLetterCause,
  EMessageMetadata,
  EMessageUnacknowledgedCause,
  EQueueMetadata,
  ICallback,
  IMessageMetadata,
  TQueueMetadata,
  TRedisClientMulti,
} from '../../types';
import { redisKeys } from './redis-keys';
import { RedisClient } from './redis-client';

export const metadata = {
  preQueueDeadLetterPurge(queueName: string, multi: TRedisClientMulti): void {
    const { keyMetadataQueue } = redisKeys.getKeys(queueName);
    multi.hset(keyMetadataQueue, EQueueMetadata.DEAD_LETTER_MESSAGES, '0');
  },

  prePurgeAcknowledgedMessagesQueue(
    queueName: string,
    multi: TRedisClientMulti,
  ): void {
    const { keyMetadataQueue } = redisKeys.getKeys(queueName);
    multi.hset(keyMetadataQueue, EQueueMetadata.ACKNOWLEDGED_MESSAGES, '0');
  },

  preQueuePurge(queueName: string, multi: TRedisClientMulti): void {
    const { keyMetadataQueue } = redisKeys.getKeys(queueName);
    multi.hset(keyMetadataQueue, EQueueMetadata.PENDING_MESSAGES, '0');
  },

  prePriorityQueuePurge(queueName: string, multi: TRedisClientMulti): void {
    const { keyMetadataQueue } = redisKeys.getKeys(queueName);
    multi.hset(
      keyMetadataQueue,
      EQueueMetadata.PENDING_MESSAGES_WITH_PRIORITY,
      '0',
    );
  },

  ///

  getScheduledMessageMetadata(state: Message): IMessageMetadata {
    return {
      state,
      type: EMessageMetadata.SCHEDULED,
      timestamp: Date.now(),
    };
  },

  getDeadLetterMessageMetadata(
    state: Message,
    deadLetterCause: EMessageDeadLetterCause,
  ): IMessageMetadata {
    return {
      state,
      type: EMessageMetadata.DEAD_LETTER,
      timestamp: Date.now(),
      deadLetterCause,
    };
  },

  getMessageAcknowledgedMetadata(state: Message): IMessageMetadata {
    return {
      state,
      type: EMessageMetadata.ACKNOWLEDGED,
      timestamp: Date.now(),
    };
  },

  getUnacknowledgedMessageMetadata(
    state: Message,
    unacknowledgedCause: EMessageUnacknowledgedCause,
  ): IMessageMetadata {
    return {
      state,
      type: EMessageMetadata.UNACKNOWLEDGED,
      timestamp: Date.now(),
      unacknowledgedCause,
    };
  },

  getEnqueuedMessageMetadata(
    message: Message,
    withPriority: boolean,
  ): IMessageMetadata {
    return {
      state: message,
      type: withPriority
        ? EMessageMetadata.ENQUEUED_WITH_PRIORITY
        : EMessageMetadata.ENQUEUED,
      timestamp: Date.now(),
    };
  },

  getDeletedMessageMetadata(
    messageMetadata: IMessageMetadata,
  ): IMessageMetadata {
    const { state, type } = messageMetadata;
    const getMessageMetadataType = (): EMessageMetadata => {
      if (type === EMessageMetadata.ENQUEUED) {
        return EMessageMetadata.DELETED_FROM_QUEUE;
      }
      if (type === EMessageMetadata.ENQUEUED_WITH_PRIORITY) {
        return EMessageMetadata.DELETED_FROM_PRIORITY_QUEUE;
      }
      if (type === EMessageMetadata.ACKNOWLEDGED) {
        return EMessageMetadata.DELETED_FROM_ACKNOWLEDGED_QUEUE;
      }
      if (type === EMessageMetadata.DEAD_LETTER) {
        return EMessageMetadata.DELETED_FROM_DL;
      }
      if (type === EMessageMetadata.SCHEDULED) {
        return EMessageMetadata.DELETED_FROM_SCHEDULED_QUEUE;
      }
      throw new Error(`Unexpected message metadata type [${type}]`);
    };
    return {
      state,
      type: getMessageMetadataType(),
      timestamp: Date.now(),
    };
  },

  ///

  getMessageMetadataList(
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
          pending: meta[EQueueMetadata.PENDING_MESSAGES]
            ? Number(meta[EQueueMetadata.PENDING_MESSAGES])
            : 0,
          pendingWithPriority: meta[
            EQueueMetadata.PENDING_MESSAGES_WITH_PRIORITY
          ]
            ? Number(meta[EQueueMetadata.PENDING_MESSAGES_WITH_PRIORITY])
            : 0,
          acknowledged: meta[EQueueMetadata.ACKNOWLEDGED_MESSAGES]
            ? Number(meta[EQueueMetadata.ACKNOWLEDGED_MESSAGES])
            : 0,
          deadLetter: meta[EQueueMetadata.DEAD_LETTER_MESSAGES]
            ? Number(meta[EQueueMetadata.DEAD_LETTER_MESSAGES])
            : 0,
          scheduled: meta[EQueueMetadata.SCHEDULED_MESSAGES]
            ? Number(meta[EQueueMetadata.SCHEDULED_MESSAGES])
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

  getLastMessageMetadataItem(
    client: RedisClient,
    messageId: string,
    messageMetadata: EMessageMetadata[] | undefined,
    cb: ICallback<IMessageMetadata>,
  ): void {
    this.getMessageMetadataList(client, messageId, (err, reply) => {
      if (err) cb(err);
      else {
        const m = messageMetadata
          ? reply?.filter((i) => messageMetadata.includes(i.type)).pop()
          : reply?.pop();
        if (!m) cb(new Error('Message does not exist'));
        else cb(null, m);
      }
    });
  },
};
