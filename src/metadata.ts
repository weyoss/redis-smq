import { events } from './events';
import { Message } from './message';
import {
  EMessageDeadLetterCause,
  EMessageMetadataType,
  EMessageUnacknowledgedCause,
  EQueueMetadataType,
  ICallback,
  TMessageMetadata,
  TQueueMetadata,
  TRedisClientMulti,
} from '../types';
import { redisKeys } from './redis-keys';
import { EventEmitter } from 'events';
import { RedisClient } from './redis-client';

export class Metadata {
  constructor(eventEmitter: EventEmitter) {
    eventEmitter
      .on(events.PRE_MESSAGE_ENQUEUED, this.preMessageEnqueued)
      .on(
        events.PRE_MESSAGE_WITH_PRIORITY_ENQUEUED,
        this.preMessageWithPriorityEnqueued,
      )
      .on(events.PRE_MESSAGE_ACKNOWLEDGED, this.preMessageAcknowledged)
      .on(events.PRE_MESSAGE_UNACKNOWLEDGED, this.preMessageUnacknowledged)
      .on(events.PRE_MESSAGE_DEAD_LETTER, this.preMessageDeadLetter)
      .on(events.PRE_MESSAGE_SCHEDULED_ENQUEUE, this.preMessageScheduledEnqueue)
      .on(events.PRE_MESSAGE_SCHEDULED, this.preMessageScheduled)
      .on(events.PRE_MESSAGE_SCHEDULED_DELETE, this.preMessageScheduledDelete);
  }

  protected addMessageMetadata = (
    message: Message,
    metadata: TMessageMetadata,
    multi: TRedisClientMulti,
  ): void => {
    const messageId = message.getId();
    const { keyMetadataMessage } = redisKeys.getMessageKeys(messageId);
    multi.rpush(keyMetadataMessage, JSON.stringify(metadata));
  };

  preMessageUnacknowledged = (
    msg: Message,
    queueName: string,
    unacknowledgedCause: EMessageUnacknowledgedCause,
    multi: TRedisClientMulti,
  ): void => {
    this.addMessageMetadata(
      msg,
      {
        type: EMessageMetadataType.UNACKNOWLEDGED,
        timestamp: Date.now(),
        unacknowledgedCause,
      },
      multi,
    );
    const { keyMetadataQueue } = redisKeys.getKeys(queueName);
    multi.hincrby(keyMetadataQueue, EQueueMetadataType.PENDING_MESSAGES, -1);
  };

  preMessageDeadLetter = (
    msg: Message,
    queueName: string,
    deadLetterCause: EMessageDeadLetterCause,
    multi: TRedisClientMulti,
  ): void => {
    this.addMessageMetadata(
      msg,
      {
        type: EMessageMetadataType.DEAD_LETTER,
        timestamp: Date.now(),
        deadLetterCause,
      },
      multi,
    );
    const { keyMetadataQueue } = redisKeys.getKeys(queueName);
    multi.hincrby(keyMetadataQueue, EQueueMetadataType.DEAD_LETTER_MESSAGES, 1);
  };

  preMessageEnqueued = (
    msg: Message,
    queueName: string,
    multi: TRedisClientMulti,
  ): void => {
    this.addMessageMetadata(
      msg,
      {
        type: EMessageMetadataType.ENQUEUED,
        timestamp: Date.now(),
      },
      multi,
    );
    const { keyMetadataQueue } = redisKeys.getKeys(queueName);
    multi.hincrby(keyMetadataQueue, EQueueMetadataType.PENDING_MESSAGES, 1);
  };

  preMessageWithPriorityEnqueued = (
    msg: Message,
    queueName: string,
    multi: TRedisClientMulti,
  ): void => {
    this.addMessageMetadata(
      msg,
      {
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
  };

  preMessageAcknowledged = (
    msg: Message,
    queueName: string,
    multi: TRedisClientMulti,
  ): void => {
    this.addMessageMetadata(
      msg,
      {
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
  };

  preMessageScheduledEnqueue = (
    msg: Message,
    queueName: string,
    multi: TRedisClientMulti,
  ): void => {
    this.addMessageMetadata(
      msg,
      {
        type: EMessageMetadataType.SCHEDULED_ENQUEUED,
        timestamp: Date.now(),
      },
      multi,
    );
    const { keyMetadataQueue } = redisKeys.getKeys(queueName);
    multi.hincrby(keyMetadataQueue, EQueueMetadataType.SCHEDULED_MESSAGES, -1);
  };

  preMessageScheduled = (
    msg: Message,
    queueName: string,
    multi: TRedisClientMulti,
  ): void => {
    this.addMessageMetadata(
      msg,
      {
        type: EMessageMetadataType.SCHEDULED,
        timestamp: Date.now(),
      },
      multi,
    );
    const { keyMetadataQueue } = redisKeys.getKeys(queueName);
    multi.hincrby(keyMetadataQueue, EQueueMetadataType.SCHEDULED_MESSAGES, 1);
  };

  preMessageScheduledDelete = (
    msg: Message,
    queueName: string,
    multi: TRedisClientMulti,
  ): void => {
    this.addMessageMetadata(
      msg,
      {
        type: EMessageMetadataType.SCHEDULED_DELETED,
        timestamp: Date.now(),
      },
      multi,
    );
    const { keyMetadataQueue } = redisKeys.getKeys(queueName);
    multi.hincrby(keyMetadataQueue, EQueueMetadataType.SCHEDULED_MESSAGES, -1);
  };

  static getMessageMetadata(
    client: RedisClient,
    messageId: string,
    cb: ICallback<TMessageMetadata[]>,
  ): void {
    const { keyMetadataMessage } = redisKeys.getMessageKeys(messageId);
    client.lrange(keyMetadataMessage, 0, -1, (err, metadata) => {
      if (err) cb(err);
      else {
        const metadataList: TMessageMetadata[] = (metadata ?? []).map((i) =>
          JSON.parse(i),
        );
        cb(null, metadataList);
      }
    });
  }

  static getQueueMetadata(
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
  }

  static getQueueMetadataByKey(
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
  }
}
