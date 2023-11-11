import { Message } from '../../src/lib/message/message';
import { ICallback } from '../../../redis-smq-common';
import { IQueueParams } from '../queue';
import { redisKeys } from '../../src/common/redis-keys/redis-keys';

export type TConsumerMessageHandler = (
  msg: Message,
  cb: ICallback<void>,
) => void;

export interface IConsumerMessageHandlerArgs {
  queue: IQueueParams;
  messageHandler: TConsumerMessageHandler;
}

export type TConsumerRedisKeys = ReturnType<
  typeof redisKeys['getConsumerKeys']
>;
