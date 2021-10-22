import { MessageOperation } from './message-operation';
import {
  EMessageMetadata,
  EQueueMetadata,
  ICallback,
  IMessageMetadata,
} from '../../../../types';
import { ELuaScriptName, getScriptId } from '../lua-scripts';
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

  protected getScriptArguments(
    queueName: string,
    messageId: string,
    messageMetadata: IMessageMetadata,
  ): (string | number)[] {
    const { state } = messageMetadata;
    const { keyMetadataQueue } = redisKeys.getKeys(queueName);
    const { keyMetadataMessage } = redisKeys.getMessageKeys(messageId);
    const message = JSON.stringify(state);
    return [
      6,
      this.getQueue(queueName, messageMetadata),
      message,
      keyMetadataMessage,
      JSON.stringify(metadata.getDeletedMessageMetadata(messageMetadata)),
      keyMetadataQueue,
      this.getQueueMetadataProperty(messageMetadata),
    ];
  }

  protected getScriptId(messageMetadata: IMessageMetadata): string {
    const { type } = messageMetadata;
    if (type === EMessageMetadata.ENQUEUED) {
      return getScriptId(ELuaScriptName.DELETE_PENDING_MESSAGE);
    }
    if (type === EMessageMetadata.ENQUEUED_WITH_PRIORITY) {
      return getScriptId(ELuaScriptName.DELETE_PENDING_MESSAGE_WITH_PRIORITY);
    }
    if (type === EMessageMetadata.ACKNOWLEDGED) {
      return getScriptId(ELuaScriptName.DELETE_ACKNOWLEDGED_MESSAGE);
    }
    if (type === EMessageMetadata.SCHEDULED) {
      return getScriptId(ELuaScriptName.DELETE_SCHEDULED_MESSAGE);
    }
    if (type === EMessageMetadata.DEAD_LETTER) {
      return getScriptId(ELuaScriptName.DELETE_DEAD_LETTER_MESSAGE);
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
        const scriptId = this.getScriptId(messageMetadata);
        redisClient.evalsha(
          scriptId,
          this.getScriptArguments(queueName, messageId, messageMetadata),
          (err) => cb(err),
        );
      },
      cb,
    );
  }
}
