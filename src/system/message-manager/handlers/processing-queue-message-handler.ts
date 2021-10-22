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
import { ELuaScriptName, getScriptId } from '../lua-scripts';
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
        redisClient.evalsha(
          getScriptId(ELuaScriptName.DEAD_LETTER_UNACKNOWLEDGED_MESSAGE),
          [
            11,
            keyQueueProcessing,
            keyQueueDL,
            JSON.stringify(metadataItem.state),
            JSON.stringify(message),
            deadLetterMetadata.timestamp,
            keyMetadataMessage,
            JSON.stringify(unacknowledgedMetadata),
            JSON.stringify(deadLetterMetadata),
            keyMetadataQueue,
            metadataItem.type === EMessageMetadata.ENQUEUED
              ? EQueueMetadata.PENDING_MESSAGES
              : EQueueMetadata.PENDING_MESSAGES_WITH_PRIORITY,
            EQueueMetadata.DEAD_LETTER_MESSAGES,
          ],
          (err) => cb(err),
        );
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
        redisClient.evalsha(
          getScriptId(ELuaScriptName.ACKNOWLEDGE_MESSAGE),
          [
            10,
            keyQueueProcessing,
            keyQueueAcknowledgedMessages,
            JSON.stringify(metadataItem.state),
            JSON.stringify(message),
            acknowledgedMetadata.timestamp,
            keyMetadataMessage,
            JSON.stringify(acknowledgedMetadata),
            keyMetadataQueue,
            metadataItem.type === EMessageMetadata.ENQUEUED
              ? EQueueMetadata.PENDING_MESSAGES
              : EQueueMetadata.PENDING_MESSAGES_WITH_PRIORITY,
            EQueueMetadata.ACKNOWLEDGED_MESSAGES,
          ],
          (err) => cb(err),
        );
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
        redisClient.evalsha(
          getScriptId(ELuaScriptName.ACKNOWLEDGE_MESSAGE),
          [
            11,
            keyQueueProcessing,
            keyQueueScheduledMessages,
            JSON.stringify(metadataItem.state),
            JSON.stringify(message),
            delayTimestamp,
            keyMetadataMessage,
            JSON.stringify(unacknowledgedMetadata),
            JSON.stringify(scheduledMetadata),
            keyMetadataQueue,
            metadataItem.type === EMessageMetadata.ENQUEUED
              ? EQueueMetadata.PENDING_MESSAGES
              : EQueueMetadata.PENDING_MESSAGES_WITH_PRIORITY,
            EQueueMetadata.SCHEDULED_MESSAGES,
          ],
          (err) => cb(err),
        );
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
        redisClient.evalsha(
          getScriptId(ELuaScriptName.REQUEUE_UNACKNOWLEDGED_MESSAGE),
          [
            8,
            keyQueueProcessing,
            withPriority ? keyQueuePriority : keyQueue,
            JSON.stringify(metadataItem.state),
            JSON.stringify(message),
            enqueuedMetadata.state.getPriority() ?? '-1',
            keyMetadataMessage,
            JSON.stringify(unacknowledgedMetadata),
            JSON.stringify(enqueuedMetadata),
          ],
          (err) => cb(err),
        );
      },
      cb,
    );
  }
}
