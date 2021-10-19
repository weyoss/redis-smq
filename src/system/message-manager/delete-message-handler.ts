import { MessageOperation } from './message-operation';
import {
  EMessageMetadataType,
  EQueueMetadataType,
  ICallback,
  IMessageMetadata,
} from '../../../types';
import { ELuaScriptName, getScriptId } from './lua-scripts';
import { redisKeys } from '../redis-keys';
import { RedisClient } from '../redis-client';

export class DeleteMessageHandler extends MessageOperation {
  protected getMessageMetadataType(
    messageMetadata: IMessageMetadata,
  ): EMessageMetadataType {
    const { type } = messageMetadata;
    if (type === EMessageMetadataType.ENQUEUED) {
      return EMessageMetadataType.DELETED_FROM_QUEUE;
    }
    if (type === EMessageMetadataType.ENQUEUED_WITH_PRIORITY) {
      return EMessageMetadataType.DELETED_FROM_PRIORITY_QUEUE;
    }
    if (type === EMessageMetadataType.ACKNOWLEDGED) {
      return EMessageMetadataType.DELETED_FROM_ACKNOWLEDGED_QUEUE;
    }
    if (type === EMessageMetadataType.DEAD_LETTER) {
      return EMessageMetadataType.DELETED_FROM_DL;
    }
    if (type === EMessageMetadataType.SCHEDULED) {
      return EMessageMetadataType.DELETED_FROM_SCHEDULED_QUEUE;
    }
    throw new Error(`Unexpected message metadata type [${type}]`);
  }

  protected getScriptId(messageMetadata: IMessageMetadata): string {
    const { type } = messageMetadata;
    if (type === EMessageMetadataType.ENQUEUED) {
      return getScriptId(ELuaScriptName.DELETE_MESSAGE_FROM_LIST);
    }
    if (
      type === EMessageMetadataType.ENQUEUED_WITH_PRIORITY ||
      type === EMessageMetadataType.ACKNOWLEDGED ||
      type === EMessageMetadataType.SCHEDULED ||
      type === EMessageMetadataType.DEAD_LETTER
    ) {
      return getScriptId(ELuaScriptName.DELETE_MESSAGE_FROM_SORTED_SET);
    }
    throw new Error(`Unexpected message metadata type [${type}]`);
  }

  protected getOriginQueue(
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
    if (type === EMessageMetadataType.ENQUEUED) {
      return keyQueue;
    }
    if (type === EMessageMetadataType.ENQUEUED_WITH_PRIORITY) {
      return keyQueuePriority;
    }
    if (type === EMessageMetadataType.ACKNOWLEDGED) {
      return keyQueueAcknowledgedMessages;
    }
    if (type === EMessageMetadataType.SCHEDULED) {
      return keyQueueScheduledMessages;
    }
    if (type === EMessageMetadataType.DEAD_LETTER) {
      return keyQueueDL;
    }
    throw new Error(`Unexpected message metadata type [${type}]`);
  }

  protected getQueueMetadataProperty(
    messageMetadata: IMessageMetadata,
  ): string {
    const { type } = messageMetadata;
    if (type === EMessageMetadataType.ENQUEUED) {
      return EQueueMetadataType.PENDING_MESSAGES;
    }
    if (type === EMessageMetadataType.ENQUEUED_WITH_PRIORITY) {
      return EQueueMetadataType.PENDING_MESSAGES_WITH_PRIORITY;
    }
    if (type === EMessageMetadataType.ACKNOWLEDGED) {
      return EQueueMetadataType.ACKNOWLEDGED_MESSAGES;
    }
    if (type === EMessageMetadataType.SCHEDULED) {
      return EQueueMetadataType.SCHEDULED_MESSAGES;
    }
    if (type === EMessageMetadataType.DEAD_LETTER) {
      return EQueueMetadataType.DEAD_LETTER_MESSAGES;
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
      this.getOriginQueue(queueName, messageMetadata),
      message,
      keyMetadataMessage,
      JSON.stringify(this.getMessageDeletedMetadata(messageMetadata)),
      keyMetadataQueue,
      this.getQueueMetadataProperty(messageMetadata),
    ];
  }

  getMessageDeletedMetadata(
    messageMetadata: IMessageMetadata,
  ): IMessageMetadata {
    const { state } = messageMetadata;
    return {
      state,
      type: this.getMessageMetadataType(messageMetadata),
      timestamp: Date.now(),
    };
  }

  deleteMessage(
    redisClient: RedisClient,
    queueName: string,
    messageId: string,
    expectedLastMetadata: EMessageMetadataType[],
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
