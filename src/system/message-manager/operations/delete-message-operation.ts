import { MessageOperation } from './message-operation';
import {
  EMessageMetadata,
  EQueueMetadata,
  ICallback,
  IMessageMetadata,
} from '../../../../types';
import { redisKeys } from '../../redis-keys';
import { RedisClient } from '../../redis-client';
import { metadata } from '../../metadata';

export class DeleteMessageOperation extends MessageOperation {
  protected getQueue(
    queueName: string,
    messageMetadata: IMessageMetadata,
  ): string {
    const {
      keyQueue,
      keyQueuePriority,
      keyQueueAcknowledgedMessages,
      keyQueueScheduledMessages,
      keyQueueDL,
    } = redisKeys.getKeys(queueName);
    const { type } = messageMetadata;
    if (type === EMessageMetadata.ENQUEUED) {
      return keyQueue;
    }
    if (type === EMessageMetadata.ENQUEUED_WITH_PRIORITY) {
      return keyQueuePriority;
    }
    if (type === EMessageMetadata.ACKNOWLEDGED) {
      return keyQueueAcknowledgedMessages;
    }
    if (type === EMessageMetadata.SCHEDULED) {
      return keyQueueScheduledMessages;
    }
    if (type === EMessageMetadata.DEAD_LETTER) {
      return keyQueueDL;
    }
    throw new Error(`Unexpected message metadata type [${type}]`);
  }

  protected getQueueMetadataProperty(
    messageMetadata: IMessageMetadata,
  ): string {
    const { type } = messageMetadata;
    if (type === EMessageMetadata.ENQUEUED) {
      return EQueueMetadata.PENDING_MESSAGES;
    }
    if (type === EMessageMetadata.ENQUEUED_WITH_PRIORITY) {
      return EQueueMetadata.PENDING_MESSAGES_WITH_PRIORITY;
    }
    if (type === EMessageMetadata.ACKNOWLEDGED) {
      return EQueueMetadata.ACKNOWLEDGED_MESSAGES;
    }
    if (type === EMessageMetadata.SCHEDULED) {
      return EQueueMetadata.SCHEDULED_MESSAGES;
    }
    if (type === EMessageMetadata.DEAD_LETTER) {
      return EQueueMetadata.DEAD_LETTER_MESSAGES;
    }
    throw new Error(`Unexpected message metadata type [${type}]`);
  }

  deleteMessage(
    redisClient: RedisClient,
    queueName: string,
    messageId: string,
    expectedLastMetadata: EMessageMetadata[],
    cb: ICallback<void>,
  ): void {
    this.handleMessageOperation(
      redisClient,
      messageId,
      expectedLastMetadata,
      (messageMetadata: IMessageMetadata, cb: ICallback<void>) => {
        const { state } = messageMetadata;
        const { keyMetadataQueue } = redisKeys.getKeys(queueName);
        const { keyMetadataMessage } = redisKeys.getMessageKeys(messageId);
        const message = JSON.stringify(state);
        const originQueue = this.getQueue(queueName, messageMetadata);
        redisClient.watch([originQueue], (err) => {
          if (err) cb(err);
          else {
            const multi = redisClient.multi();
            const { type } = messageMetadata;
            if (type === EMessageMetadata.ENQUEUED) {
              multi.lrem(originQueue, 1, message);
            } else if (
              [
                EMessageMetadata.ENQUEUED_WITH_PRIORITY,
                EMessageMetadata.ACKNOWLEDGED,
                EMessageMetadata.SCHEDULED,
                EMessageMetadata.DEAD_LETTER,
              ].includes(type)
            ) {
              multi.zrem(originQueue, message);
            } else {
              throw new Error(`Unexpected message metadata type [${type}]`);
            }
            multi.rpush(
              keyMetadataMessage,
              JSON.stringify(
                metadata.getDeletedMessageMetadata(messageMetadata),
              ),
            );
            multi.hincrby(
              keyMetadataQueue,
              this.getQueueMetadataProperty(messageMetadata),
              -1,
            );
            redisClient.execMulti(multi, (err) => cb(err));
          }
        });
      },
      cb,
    );
  }
}
