import { RedisClient } from '../../redis-client/redis-client';
import {
  EMessageUnacknowledgedCause,
  ICallback,
  TRedisClientMulti,
} from '../../../../types';
import { Message } from '../../../lib/message/message';
import { redisKeys } from '../../redis-keys/redis-keys';
import { PanicError } from '../../errors/panic.error';

export function delayMessageTransaction(
  mixed: TRedisClientMulti,
  message: Message,
  keyQueueProcessing: string,
): void {
  const queue = message.getRequiredQueue();
  const { keyDelayedMessages } = redisKeys.getQueueKeys(queue);
  mixed.rpoplpush(keyQueueProcessing, keyDelayedMessages);
}

export function delayMessage(
  mixed: TRedisClientMulti,
  message: Message,
  keyQueueProcessing: string,
  unacknowledgedCause: EMessageUnacknowledgedCause,
): void;
export function delayMessage(
  mixed: RedisClient,
  message: Message,
  keyQueueProcessing: string,
  unacknowledgedCause: EMessageUnacknowledgedCause,
  cb: ICallback<void>,
): void;
export function delayMessage(
  mixed: RedisClient | TRedisClientMulti,
  message: Message,
  keyQueueProcessing: string,
  unacknowledgedCause: EMessageUnacknowledgedCause,
  cb?: ICallback<void>,
): void {
  if (mixed instanceof RedisClient) {
    if (!cb) throw new PanicError(`Expected a callback function`);
    const queue = message.getRequiredQueue();
    const { keyDelayedMessages } = redisKeys.getQueueKeys(queue);
    mixed.rpoplpush(keyQueueProcessing, keyDelayedMessages, (err) => cb(err));
  } else {
    delayMessageTransaction(mixed, message, keyQueueProcessing);
  }
}
