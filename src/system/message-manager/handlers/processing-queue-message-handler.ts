import { RedisClient } from '../../redis-client';
import { Message } from '../../../message';
import {
  EMessageDeadLetterCause,
  EMessageMetadata,
  EMessageUnacknowledgedCause,
  EQueueMetadata,
  ICallback,
  IMessageMetadata,
} from '../../../../types';
import { redisKeys } from '../../redis-keys';
import { metadata } from '../../metadata';

export class ProcessingQueueMessageHandler {
  protected getLastMetadataItem(
    redisClient: RedisClient,
    messageId: string,
    fn: (metadataItem: IMessageMetadata, cb: ICallback<void>) => void,
    cb: ICallback<void>,
  ): void {
    metadata.getLastMessageMetadataItem(
      redisClient,
      messageId,
      undefined,
      (err, metadataItem) => {
        if (err) cb(err);
        else if (!metadataItem) cb(new Error('Expected a non empty reply'));
        else if (
          [
            EMessageMetadata.DELETED_FROM_QUEUE,
            EMessageMetadata.DELETED_FROM_PRIORITY_QUEUE,
          ].includes(metadataItem.type)
        )
          cb();
        else if (
          ![
            EMessageMetadata.ENQUEUED,
            EMessageMetadata.ENQUEUED_WITH_PRIORITY,
          ].includes(metadataItem.type)
        )
          cb(new Error(`Unexpected metadatata type [${metadataItem.type}]`));
        else fn(metadataItem, cb);
      },
    );
  }

  deadLetterMessage(
    redisClient: RedisClient,
    message: Message,
    queueName: string,
    keyQueueProcessing: string,
    unacknowledgedCause: EMessageUnacknowledgedCause,
    deadLetterCause: EMessageDeadLetterCause,
    cb: ICallback<void>,
  ): void {
    this.getLastMetadataItem(
      redisClient,
      message.getId(),
      (metadataItem, cb: ICallback<void>) => {
        const { keyQueueDL, keyMetadataQueue } = redisKeys.getKeys(queueName);
        const { keyMetadataMessage } = redisKeys.getMessageKeys(
          message.getId(),
        );
        const unacknowledgedMetadata =
          metadata.getUnacknowledgedMessageMetadata(
            message,
            unacknowledgedCause,
          );
        const deadLetterMetadata = metadata.getDeadLetterMessageMetadata(
          message,
          deadLetterCause,
        );
        redisClient.watch([keyQueueProcessing], (err) => {
          if (err) cb(err);
          else {
            const multi = redisClient.multi();
            multi.lrem(
              keyQueueProcessing,
              1,
              JSON.stringify(metadataItem.state),
            );
            multi.zadd(
              keyQueueDL,
              deadLetterMetadata.timestamp,
              JSON.stringify(message),
            );
            multi.rpush(
              keyMetadataMessage,
              JSON.stringify(unacknowledgedMetadata),
            );
            multi.rpush(keyMetadataMessage, JSON.stringify(deadLetterMetadata));
            multi.hincrby(
              keyMetadataQueue,
              metadataItem.type === EMessageMetadata.ENQUEUED
                ? EQueueMetadata.PENDING_MESSAGES
                : EQueueMetadata.PENDING_MESSAGES_WITH_PRIORITY,
              -1,
            );
            multi.hincrby(
              keyMetadataQueue,
              EQueueMetadata.DEAD_LETTER_MESSAGES,
              1,
            );
            redisClient.execMulti(multi, (err) => cb(err));
          }
        });
      },
      cb,
    );
  }

  acknowledge(
    redisClient: RedisClient,
    message: Message,
    queueName: string,
    keyQueueProcessing: string,
    cb: ICallback<void>,
  ): void {
    this.getLastMetadataItem(
      redisClient,
      message.getId(),
      (metadataItem, cb: ICallback<void>) => {
        const { keyQueueAcknowledgedMessages, keyMetadataQueue } =
          redisKeys.getKeys(queueName);
        const { keyMetadataMessage } = redisKeys.getMessageKeys(
          message.getId(),
        );
        const acknowledgedMetadata =
          metadata.getMessageAcknowledgedMetadata(message);
        redisClient.watch([keyQueueProcessing], (err) => {
          if (err) cb(err);
          else {
            const multi = redisClient.multi();
            multi.lrem(
              keyQueueProcessing,
              1,
              JSON.stringify(metadataItem.state),
            );
            multi.zadd(
              keyQueueAcknowledgedMessages,
              acknowledgedMetadata.timestamp,
              JSON.stringify(message),
            );
            multi.rpush(
              keyMetadataMessage,
              JSON.stringify(acknowledgedMetadata),
            );
            multi.hincrby(
              keyMetadataQueue,
              metadataItem.type === EMessageMetadata.ENQUEUED
                ? EQueueMetadata.PENDING_MESSAGES
                : EQueueMetadata.PENDING_MESSAGES_WITH_PRIORITY,
              -1,
            );
            multi.hincrby(
              keyMetadataQueue,
              EQueueMetadata.ACKNOWLEDGED_MESSAGES,
              1,
            );
            redisClient.execMulti(multi, (err) => cb(err));
          }
        });
      },
      cb,
    );
  }

  delayBeforeRequeue(
    redisClient: RedisClient,
    message: Message,
    queueName: string,
    delayTimestamp: number,
    keyQueueProcessing: string,
    unacknowledgedCause: EMessageUnacknowledgedCause,
    cb: ICallback<void>,
  ): void {
    this.getLastMetadataItem(
      redisClient,
      message.getId(),
      (metadataItem, cb: ICallback<void>) => {
        const { keyQueueScheduledMessages, keyMetadataQueue } =
          redisKeys.getKeys(queueName);
        const { keyMetadataMessage } = redisKeys.getMessageKeys(
          message.getId(),
        );
        const unacknowledgedMetadata =
          metadata.getUnacknowledgedMessageMetadata(
            message,
            unacknowledgedCause,
          );
        const scheduledMetadata = metadata.getScheduledMessageMetadata(message);
        redisClient.watch([keyQueueProcessing], (err) => {
          if (err) cb(err);
          else {
            const multi = redisClient.multi();
            multi.lrem(
              keyQueueProcessing,
              1,
              JSON.stringify(metadataItem.state),
            );
            multi.zadd(
              keyQueueScheduledMessages,
              delayTimestamp,
              JSON.stringify(message),
            );
            multi.rpush(
              keyMetadataMessage,
              JSON.stringify(unacknowledgedMetadata),
            );
            multi.rpush(keyMetadataMessage, JSON.stringify(scheduledMetadata));
            multi.hincrby(
              keyMetadataQueue,
              metadataItem.type === EMessageMetadata.ENQUEUED
                ? EQueueMetadata.PENDING_MESSAGES
                : EQueueMetadata.PENDING_MESSAGES_WITH_PRIORITY,
              -1,
            );
            multi.hincrby(
              keyMetadataQueue,
              EQueueMetadata.SCHEDULED_MESSAGES,
              1,
            );
            redisClient.execMulti(multi, (err) => cb(err));
          }
        });
      },
      cb,
    );
  }

  requeue(
    redisClient: RedisClient,
    message: Message,
    queueName: string,
    keyQueueProcessing: string,
    withPriority: boolean,
    unacknowledgedCause: EMessageUnacknowledgedCause,
    cb: ICallback<void>,
  ): void {
    this.getLastMetadataItem(
      redisClient,
      message.getId(),
      (metadataItem, cb: ICallback<void>) => {
        const { keyQueue, keyQueuePriority } = redisKeys.getKeys(queueName);
        const { keyMetadataMessage } = redisKeys.getMessageKeys(
          message.getId(),
        );
        const unacknowledgedMetadata =
          metadata.getUnacknowledgedMessageMetadata(
            message,
            unacknowledgedCause,
          );
        const enqueuedMetadata = metadata.getEnqueuedMessageMetadata(
          message,
          withPriority,
        );
        const priority = withPriority
          ? enqueuedMetadata.state.getPriority()
          : null;
        redisClient.watch([keyQueueProcessing], (err) => {
          if (err) cb(err);
          else {
            const multi = redisClient.multi();
            multi.lrem(
              keyQueueProcessing,
              1,
              JSON.stringify(metadataItem.state),
            );
            if (typeof priority === 'number') {
              multi.zadd(keyQueuePriority, priority, JSON.stringify(message));
            } else {
              multi.lpush(keyQueue, JSON.stringify(message));
            }
            multi.rpush(
              keyMetadataMessage,
              JSON.stringify(unacknowledgedMetadata),
            );
            multi.rpush(keyMetadataMessage, JSON.stringify(enqueuedMetadata));
            redisClient.execMulti(multi, (err) => cb(err));
          }
        });
      },
      cb,
    );
  }
}
