import {
  EMessageMetadata,
  EQueueMetadata,
  ICallback,
  IMessageMetadata,
} from '../../../../types';
import { redisKeys } from '../../redis-keys';
import { MessageOperation } from './message-operation';
import { RedisClient } from '../../redis-client';
import { metadata } from '../../metadata';
import { Message } from '../../../message';

export class RequeueMessageOperation extends MessageOperation {
  protected getDstQueue(queueName: string, withPriority: boolean): string {
    const { keyQueue, keyQueuePriority } = redisKeys.getKeys(queueName);
    if (withPriority) return keyQueuePriority;
    return keyQueue;
  }

  protected getDstQueueMetadataProperty(withPriority: boolean): EQueueMetadata {
    if (withPriority) return EQueueMetadata.PENDING_MESSAGES_WITH_PRIORITY;
    return EQueueMetadata.PENDING_MESSAGES;
  }

  protected getOriginQueue(
    queueName: string,
    messageMetadata: IMessageMetadata,
  ): string {
    const {
      keyQueueAcknowledgedMessages,
      keyQueueDL,
      keyQueueScheduledMessages,
    } = redisKeys.getKeys(queueName);
    const { type } = messageMetadata;
    if (type === EMessageMetadata.ACKNOWLEDGED)
      return keyQueueAcknowledgedMessages;
    if (type === EMessageMetadata.DEAD_LETTER) return keyQueueDL;
    if (type === EMessageMetadata.SCHEDULED) return keyQueueScheduledMessages;
    throw new Error(`Unexpected message metadata type [${type}]`);
  }

  protected getOriginQueueMetadataProperty(
    messageMetadata: IMessageMetadata,
  ): EQueueMetadata {
    const { type } = messageMetadata;
    if (type === EMessageMetadata.ACKNOWLEDGED)
      return EQueueMetadata.ACKNOWLEDGED_MESSAGES;
    if (type === EMessageMetadata.DEAD_LETTER)
      return EQueueMetadata.DEAD_LETTER_MESSAGES;
    throw new Error(`Unexpected message metadata type [${type}]`);
  }

  requeue(
    redisClient: RedisClient,
    queueName: string,
    messageId: string,
    withPriority: boolean,
    priority: number | undefined,
    expectedLastMessageMetadata: EMessageMetadata[],
    cb: ICallback<void>,
  ): void {
    this.handleMessageOperation(
      redisClient,
      messageId,
      expectedLastMessageMetadata,
      (messageMetadata: IMessageMetadata, cb: ICallback<void>) => {
        const { state, type } = messageMetadata;
        const newState = Message.createFromMessage(state);
        if (type === EMessageMetadata.DEAD_LETTER) newState.reset(true);
        const messagePriority = withPriority
          ? newState.getSetPriority(priority)
          : null;
        const { keyMetadataQueue } = redisKeys.getKeys(queueName);
        const { keyMetadataMessage } = redisKeys.getMessageKeys(messageId);
        const deletedMetadata =
          metadata.getDeletedMessageMetadata(messageMetadata);
        const enqueuedMetadata = metadata.getEnqueuedMessageMetadata(
          newState,
          withPriority,
        );
        const originQueue = this.getOriginQueue(queueName, messageMetadata);
        const dstQueue = this.getDstQueue(queueName, withPriority);
        redisClient.watch([originQueue], (err) => {
          if (err) cb(err);
          else {
            const multi = redisClient.multi();
            multi.zrem(originQueue, JSON.stringify(state));
            if (
              ![
                EMessageMetadata.ACKNOWLEDGED,
                EMessageMetadata.DEAD_LETTER,
              ].includes(type)
            ) {
              throw new Error(`Unexpected message metadata type [${type}]`);
            }
            if (messagePriority) {
              multi.zadd(dstQueue, messagePriority, JSON.stringify(newState));
            } else {
              multi.lpush(dstQueue, JSON.stringify(newState));
            }
            multi.rpush(keyMetadataMessage, JSON.stringify(deletedMetadata));
            multi.rpush(keyMetadataMessage, JSON.stringify(enqueuedMetadata));
            multi.hincrby(
              keyMetadataQueue,
              this.getOriginQueueMetadataProperty(messageMetadata),
              -1,
            );
            multi.hincrby(
              keyMetadataQueue,
              this.getDstQueueMetadataProperty(withPriority),
              1,
            );
            redisClient.execMulti(multi, (err) => cb(err));
          }
        });
      },
      cb,
    );
  }
}
