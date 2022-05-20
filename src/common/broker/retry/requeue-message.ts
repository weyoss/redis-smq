import { RedisClient } from '../../redis-client/redis-client';
import {
  EMessageUnacknowledgedCause,
  ICallback,
  TRedisClientMulti,
} from '../../../../types';
import { Message } from '../../../lib/message/message';
import { redisKeys } from '../../redis-keys/redis-keys';
import { PanicError } from '../../errors/panic.error';

export function requeueMessage(
  mixed: TRedisClientMulti,
  message: Message,
  keyQueueProcessing: string,
  unacknowledgedCause: EMessageUnacknowledgedCause,
): void;
export function requeueMessage(
  mixed: RedisClient,
  message: Message,
  keyQueueProcessing: string,
  unacknowledgedCause: EMessageUnacknowledgedCause,
  cb: ICallback<void>,
): void;
export function requeueMessage(
  mixed: RedisClient | TRedisClientMulti,
  message: Message,
  keyQueueProcessing: string,
  unacknowledgedCause: EMessageUnacknowledgedCause,
  cb?: ICallback<void>,
): void {
  const queue = message.getRequiredQueue();
  const { keyRequeueMessages } = redisKeys.getQueueKeys(queue);
  if (mixed instanceof RedisClient) {
    if (!cb) throw new PanicError(`Expected a callback function`);
    mixed.rpoplpush(keyQueueProcessing, keyRequeueMessages, (err) => cb(err));
  } else {
    mixed.rpoplpush(keyQueueProcessing, keyRequeueMessages);
  }
}
