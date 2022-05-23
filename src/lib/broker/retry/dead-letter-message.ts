import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgedCause,
  ICallback,
  TRedisClientMulti,
} from '../../../../types';
import { Message } from '../../message/message';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { getConfiguration } from '../../../config/configuration';
import { RedisClient } from '../../../common/redis-client/redis-client';
import { PanicError } from '../../../common/errors/panic.error';

function deadLetterMessageTransaction(
  mixed: TRedisClientMulti,
  message: Message,
  keyQueueProcessing: string,
): void {
  const queue = message.getRequiredQueue();
  const { keyQueueDL } = redisKeys.getQueueKeys(queue);
  const { store, expire, queueSize } =
    getConfiguration().messages.store.deadLettered;
  if (store) {
    mixed.lpop(keyQueueProcessing);
    mixed.rpush(keyQueueDL, JSON.stringify(message));
    if (expire) {
      mixed.pexpire(keyQueueDL, expire);
    }
    if (queueSize) {
      mixed.ltrim(keyQueueDL, queueSize * -1, -1);
    }
  } else {
    mixed.rpop(keyQueueProcessing);
  }
}

export function deadLetterMessage(
  mixed: TRedisClientMulti,
  message: Message,
  keyQueueProcessing: string,
  unacknowledgedCause: EMessageUnacknowledgedCause,
  deadLetterCause: EMessageDeadLetterCause,
): void;
export function deadLetterMessage(
  mixed: RedisClient,
  message: Message,
  keyQueueProcessing: string,
  unacknowledgedCause: EMessageUnacknowledgedCause,
  deadLetterCause: EMessageDeadLetterCause,
  cb: ICallback<void>,
): void;
export function deadLetterMessage(
  mixed: RedisClient | TRedisClientMulti,
  message: Message,
  keyQueueProcessing: string,
  unacknowledgedCause: EMessageUnacknowledgedCause,
  deadLetterCause: EMessageDeadLetterCause,
  cb?: ICallback<void>,
): void {
  if (mixed instanceof RedisClient) {
    if (!cb) throw new PanicError(`Expected a callback function`);
    const queue = message.getRequiredQueue();
    const { keyQueueDL } = redisKeys.getQueueKeys(queue);
    const { store, expire, queueSize } =
      getConfiguration().messages.store.deadLettered;
    if (store) {
      if (expire || queueSize) {
        mixed.lpoprpushextra(
          keyQueueProcessing,
          keyQueueDL,
          queueSize ? queueSize * -1 : queueSize,
          expire,
          (err) => {
            if (err) cb(err);
            else cb();
          },
        );
      } else {
        mixed.lpoprpush(keyQueueProcessing, keyQueueDL, (err) => {
          if (err) cb(err);
          else cb();
        });
      }
    } else {
      mixed.rpop(keyQueueProcessing, (err) => cb(err));
    }
  } else {
    deadLetterMessageTransaction(mixed, message, keyQueueProcessing);
  }
}
