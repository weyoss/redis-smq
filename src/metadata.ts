import { events } from './events';
import { Message } from './message';
import {
  EMessageMetadataType,
  EQueueMetadataType,
  ICallback,
  TMessageMetadata,
  TQueueMetadata,
  TRedisClientMulti,
} from '../types';
import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgementCause,
} from './broker';
import { redisKeys } from './redis-keys';
import { EventEmitter } from 'events';
import { RedisClient } from './redis-client';

export class Metadata {
  constructor(eventEmitter: EventEmitter) {
    eventEmitter
      .on(events.PRE_MESSAGE_ENQUEUED, this.preMessageEnqueued)
      .on(events.PRE_MESSAGE_ACKNOWLEDGED, this.preMessageAcknowledged)
      .on(events.PRE_MESSAGE_RETRY, this.preMessageRetry)
      .on(events.PRE_MESSAGE_RETRY_AFTER_DELAY, this.preMessageRetryAfterDelay)
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
    multi.zadd(
      keyMetadataMessage,
      metadata.timestamp,
      JSON.stringify(metadata),
    );
  };

  preMessageRetry = (
    msg: Message,
    queueName: string,
    unacknowledgedCause: EMessageUnacknowledgementCause,
    multi: TRedisClientMulti,
  ): void => {
    this.addMessageMetadata(
      msg,
      {
        type: EMessageMetadataType.UNACKNOWLEDGED,
        timestamp: Date.now(),
        unacknowledgedCause,
        delayed: false,
      },
      multi,
    );
    const { keyMetadataQueue } = redisKeys.getKeys(queueName);
    multi.hincrby(
      keyMetadataQueue,
      EQueueMetadataType.UNACKNOWLEDGED_MESSAGES,
      1,
    );
    multi.hincrby(keyMetadataQueue, EQueueMetadataType.PENDING_MESSAGES, -1);
  };

  preMessageRetryAfterDelay = (
    msg: Message,
    queueName: string,
    unacknowledgedCause: EMessageUnacknowledgementCause,
    multi: TRedisClientMulti,
  ): void => {
    this.addMessageMetadata(
      msg,
      {
        type: EMessageMetadataType.UNACKNOWLEDGED,
        timestamp: Date.now(),
        unacknowledgedCause,
        delayed: true,
      },
      multi,
    );
    const { keyMetadataQueue } = redisKeys.getKeys(queueName);
    multi.hincrby(
      keyMetadataQueue,
      EQueueMetadataType.UNACKNOWLEDGED_MESSAGES,
      1,
    );
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
    multi.hincrby(keyMetadataQueue, EQueueMetadataType.PENDING_MESSAGES, -1);
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
    messageId: string,
    client: RedisClient,
    cb: ICallback<TMessageMetadata[]>,
  ): void {
    const { keyMetadataMessage } = redisKeys.getMessageKeys(messageId);
    client.zrange(keyMetadataMessage, 0, -1, (err, metadata) => {
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
    queueName: string,
    client: RedisClient,
    cb: ICallback<TQueueMetadata>,
  ): void {
    const { keyMetadataQueue } = redisKeys.getKeys(queueName);
    client.hgetall(keyMetadataQueue, (err, metadata) => {
      if (err) cb(err);
      else
        cb(null, {
          pending: 0,
          acknowledged: 0,
          unacknowledged: 0,
          deadLetter: 0,
          scheduled: 0,
          ...metadata,
        });
    });
  }
}
