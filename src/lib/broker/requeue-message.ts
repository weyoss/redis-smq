import { EMessageUnacknowledgedCause } from '../../../types';
import { Message } from '../message/message';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { ICallback, TRedisClientMulti } from 'redis-smq-common/dist/types';
import { errors, RedisClient } from 'redis-smq-common';

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
    if (!cb) throw new errors.PanicError(`Expected a callback function`);
    mixed.rpoplpush(keyQueueProcessing, keyRequeueMessages, (err) => cb(err));
  } else {
    mixed.rpoplpush(keyQueueProcessing, keyRequeueMessages);
  }
}
