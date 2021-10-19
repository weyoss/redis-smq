import {
  EMessageMetadataType,
  EQueueMetadataType,
  ICallback,
  IMessageMetadata,
} from '../../../types';
import { ELuaScriptName, getScriptId } from './lua-scripts';
import { redisKeys } from '../redis-keys';
import { Message } from '../../message';
import { MessageOperation } from './message-operation';
import { RedisClient } from '../redis-client';
import { DeleteMessageHandler } from './delete-message-handler';

export class RequeueMessageHandler extends MessageOperation {
  protected getScriptId(
    messageMetadata: IMessageMetadata,
    withPriority: boolean,
  ): string {
    const { type } = messageMetadata;
    if (withPriority) {
      if (type === EMessageMetadataType.ACKNOWLEDGED)
        return getScriptId(
          ELuaScriptName.ENQUEUE_WITH_PRIORITY_MESSAGE_FROM_ACKNOWLEDGED,
        );
      if (type === EMessageMetadataType.DEAD_LETTER)
        return getScriptId(
          ELuaScriptName.ENQUEUE_WITH_PRIORITY_MESSAGE_FROM_DL,
        );
      if (type === EMessageMetadataType.SCHEDULED)
        return getScriptId(
          ELuaScriptName.ENQUEUE_WITH_PRIORITY_MESSAGE_FROM_SCHEDULED,
        );
    }
    if (type === EMessageMetadataType.ACKNOWLEDGED)
      return getScriptId(ELuaScriptName.ENQUEUE_MESSAGE_FROM_ACKNOWLEDGED);
    if (type === EMessageMetadataType.DEAD_LETTER)
      return getScriptId(ELuaScriptName.ENQUEUE_MESSAGE_FROM_DL);
    if (type === EMessageMetadataType.SCHEDULED)
      return getScriptId(ELuaScriptName.ENQUEUE_MESSAGE_FROM_SCHEDULED);
    throw new Error(`Unexpected message metadata type [${type}]`);
  }

  protected getDstQueue(queueName: string, withPriority: boolean): string {
    const { keyQueue, keyQueuePriority } = redisKeys.getKeys(queueName);
    if (withPriority) return keyQueuePriority;
    return keyQueue;
  }

  protected getMessagePriority(
    msg: Message,
    priority = Message.MessagePriority.NORMAL,
  ): number {
    if (!Object.values(Message.MessagePriority).includes(priority)) {
      throw new Error(`Invalid message priority`);
    }
    return msg.getPriority() ?? priority;
  }

  protected getMessageEnqueuedMetadata(
    messageMetadata: IMessageMetadata,
    withPriority: boolean,
    priority: number | undefined,
  ): IMessageMetadata {
    return {
      state: this.getMessageEnqueuedState(
        messageMetadata,
        withPriority,
        priority,
      ),
      type: withPriority
        ? EMessageMetadataType.ENQUEUED_WITH_PRIORITY
        : EMessageMetadataType.ENQUEUED,
      timestamp: Date.now(),
    };
  }

  protected getOriginQueueMetadataProperty(
    messageMetadata: IMessageMetadata,
  ): EQueueMetadataType {
    const { type } = messageMetadata;
    if (type === EMessageMetadataType.ACKNOWLEDGED)
      return EQueueMetadataType.ACKNOWLEDGED_MESSAGES;
    if (type === EMessageMetadataType.DEAD_LETTER)
      return EQueueMetadataType.DEAD_LETTER_MESSAGES;
    if (type === EMessageMetadataType.SCHEDULED)
      return EQueueMetadataType.SCHEDULED_MESSAGES;
    throw new Error(`Unexpected message metadata type [${type}]`);
  }

  protected getDestQueueMetadataProperty(
    withPriority: boolean,
  ): EQueueMetadataType {
    if (withPriority) return EQueueMetadataType.PENDING_MESSAGES_WITH_PRIORITY;
    return EQueueMetadataType.PENDING_MESSAGES;
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
    if (type === EMessageMetadataType.ACKNOWLEDGED)
      return keyQueueAcknowledgedMessages;
    if (type === EMessageMetadataType.DEAD_LETTER) return keyQueueDL;
    if (type === EMessageMetadataType.SCHEDULED)
      return keyQueueScheduledMessages;
    throw new Error(`Unexpected message metadata type [${type}]`);
  }

  protected getMessageEnqueuedState(
    messageMetadata: IMessageMetadata,
    withPriority: boolean,
    priority: number | undefined,
  ): Message {
    const { state } = messageMetadata;
    const newState = Message.createFromMessage(state, true);
    if (withPriority) {
      const defaultPriority = this.getMessagePriority(newState, priority);
      if (defaultPriority !== newState.getPriority()) {
        newState.setPriority(defaultPriority);
      }
    }
    return newState;
  }

  protected getEnqueueMessageFromOriginScriptArgs(
    messageMetadata: IMessageMetadata,
    queueName: string,
    messageId: string,
    withPriority: boolean,
    priority: number | undefined,
    deleteMessageManager: DeleteMessageHandler,
  ): (string | number)[] {
    const { state } = messageMetadata;
    const { keyMetadataQueue } = redisKeys.getKeys(queueName);
    const { keyMetadataMessage } = redisKeys.getMessageKeys(messageId);
    const messageDeletedMetadata = JSON.stringify(
      deleteMessageManager.getMessageDeletedMetadata(messageMetadata),
    );
    const messageEnqueuedMetadata = JSON.stringify(
      this.getMessageEnqueuedMetadata(messageMetadata, withPriority, priority),
    );
    const msgCurrentState = JSON.stringify(state);
    const msgNextState = JSON.stringify(
      this.getMessageEnqueuedState(messageMetadata, withPriority, priority),
    );
    if (withPriority) {
      return [
        11,
        this.getOriginQueue(queueName, messageMetadata),
        this.getDstQueue(queueName, withPriority),
        msgCurrentState,
        msgNextState,
        this.getMessagePriority(state, priority),
        keyMetadataMessage,
        messageDeletedMetadata,
        messageEnqueuedMetadata,
        keyMetadataQueue,
        this.getOriginQueueMetadataProperty(messageMetadata),
        this.getDestQueueMetadataProperty(withPriority),
      ];
    }
    return [
      10,
      this.getOriginQueue(queueName, messageMetadata),
      this.getDstQueue(queueName, withPriority),
      msgCurrentState,
      msgNextState,
      keyMetadataMessage,
      messageDeletedMetadata,
      messageEnqueuedMetadata,
      keyMetadataQueue,
      this.getOriginQueueMetadataProperty(messageMetadata),
      this.getDestQueueMetadataProperty(withPriority),
    ];
  }

  requeueMessage(
    redisClient: RedisClient,
    queueName: string,
    messageId: string,
    withPriority: boolean,
    priority: number | undefined,
    expectedLastMessageMetadata: EMessageMetadataType[],
    deleteMessageManager: DeleteMessageHandler,
    cb: ICallback<void>,
  ): void {
    this.handleMessageOperation(
      redisClient,
      messageId,
      expectedLastMessageMetadata,
      (messageMetadata: IMessageMetadata, cb: ICallback<void>) => {
        redisClient.evalsha(
          this.getScriptId(messageMetadata, withPriority),
          this.getEnqueueMessageFromOriginScriptArgs(
            messageMetadata,
            queueName,
            messageId,
            withPriority,
            priority,
            deleteMessageManager,
          ),
          (err, reply) => {
            if (err) cb(err);
            else if (!reply || reply !== 'OK')
              cb(new Error('An error occurred'));
            else cb();
          },
        );
      },
      cb,
    );
  }
}
