import { Message } from '../../../message';
import { EQueueMetadata, ICallback } from '../../../../types';
import { redisKeys } from '../../redis-keys';
import { ELuaScriptName, getScriptId } from '../lua-scripts';
import { RedisClient } from '../../redis-client';
import { metadata } from '../../metadata';

export class EnqueueMessageHandler {
  enqueue(
    redisClient: RedisClient,
    queueName: string,
    message: Message,
    withPriority: boolean,
    cb: ICallback<void>,
  ): void {
    const { keyQueue, keyQueuePriority } = redisKeys.getKeys(queueName);
    const { keyMetadataMessage } = redisKeys.getMessageKeys(message.getId());
    const { keyMetadataQueue } = redisKeys.getKeys(queueName);
    const messageMetadata = metadata.getEnqueuedMessageMetadata(
      message,
      withPriority,
    );
    const scriptName = withPriority
      ? ELuaScriptName.ENQUEUE_MESSAGE_WITH_PRIORITY
      : ELuaScriptName.ENQUEUE_MESSAGE;
    redisClient.evalsha(
      getScriptId(scriptName),
      [
        7,
        withPriority ? keyQueuePriority : keyQueue,
        JSON.stringify(message),
        messageMetadata.state.getPriority() ?? '-1',
        keyMetadataMessage,
        JSON.stringify(messageMetadata),
        keyMetadataQueue,
        withPriority
          ? EQueueMetadata.PENDING_MESSAGES_WITH_PRIORITY
          : EQueueMetadata.PENDING_MESSAGES,
      ],
      (err) => cb(err),
    );
  }
}
