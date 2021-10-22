import {
  EMessageMetadata,
  EQueueMetadata,
  ICallback,
  IMessageMetadata,
} from '../../../../types';
import { ELuaScriptName, getScriptId } from '../lua-scripts';
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

  protected getScriptArguments(
    messageMetadata: IMessageMetadata,
    queueName: string,
    messageId: string,
    withPriority: boolean,
    priority: number | undefined,
  ): (string | number)[] {
    const { state, type } = messageMetadata;
    const newState = Message.createFromMessage(state);
    if (type === EMessageMetadata.DEAD_LETTER) newState.reset(true);
    if (withPriority) newState.getSetPriority(priority);
    const { keyMetadataQueue } = redisKeys.getKeys(queueName);
    const { keyMetadataMessage } = redisKeys.getMessageKeys(messageId);
    const deletedMetadata = metadata.getDeletedMessageMetadata(messageMetadata);
    const enqueuedMetadata = metadata.getEnqueuedMessageMetadata(
      newState,
      withPriority,
    );
    return [
      11,
      this.getOriginQueue(queueName, messageMetadata),
      this.getDstQueue(queueName, withPriority),
      JSON.stringify(state),
      JSON.stringify(newState),
      enqueuedMetadata.state.getPriority() ?? '-1',
      keyMetadataMessage,
      JSON.stringify(deletedMetadata),
      JSON.stringify(enqueuedMetadata),
      keyMetadataQueue,
      this.getOriginQueueMetadataProperty(messageMetadata),
      this.getDstQueueMetadataProperty(withPriority),
    ];
  }

  protected getScriptId(
    messageMetadata: IMessageMetadata,
    withPriority: boolean,
  ): string {
    const { type } = messageMetadata;
    if (withPriority) {
      if (type === EMessageMetadata.ACKNOWLEDGED)
        return getScriptId(
          ELuaScriptName.REQUEUE_ACKNOWLEDGED_MESSAGE_WITH_PRIORITY,
        );
      if (type === EMessageMetadata.DEAD_LETTER)
        return getScriptId(
          ELuaScriptName.REQUEUE_DEAD_LETTER_MESSAGE_WITH_PRIORITY,
        );
    }
    if (type === EMessageMetadata.ACKNOWLEDGED)
      return getScriptId(ELuaScriptName.REQUEUE_ACKNOWLEDGED_MESSAGE);
    if (type === EMessageMetadata.DEAD_LETTER)
      return getScriptId(ELuaScriptName.REQUEUE_DEAD_LETTER_MESSAGE);
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
        redisClient.evalsha(
          this.getScriptId(messageMetadata, withPriority),
          this.getScriptArguments(
            messageMetadata,
            queueName,
            messageId,
            withPriority,
            priority,
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
