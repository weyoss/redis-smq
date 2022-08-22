import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgedCause,
  IRequiredConfig,
} from '../../../../types';
import { Message } from '../../message/message';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { ICallback, IRedisClientMulti } from 'redis-smq-common/dist/types';
import { errors, RedisClient } from 'redis-smq-common';

function deadLetterMessageTransaction(
  config: IRequiredConfig,
  mixed: IRedisClientMulti,
  message: Message,
  keyQueueProcessing: string,
): void {
  const queue = message.getDestinationQueue();
  const { keyQueueDL } = redisKeys.getQueueKeys(queue);
  const { store, expire, queueSize } = config.messages.store.deadLettered;
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
  config: IRequiredConfig,
  mixed: IRedisClientMulti,
  message: Message,
  keyQueueProcessing: string,
  unacknowledgedCause: EMessageUnacknowledgedCause,
  deadLetterCause: EMessageDeadLetterCause,
): void;
export function deadLetterMessage(
  config: IRequiredConfig,
  mixed: RedisClient,
  message: Message,
  keyQueueProcessing: string,
  unacknowledgedCause: EMessageUnacknowledgedCause,
  deadLetterCause: EMessageDeadLetterCause,
  cb: ICallback<void>,
): void;
export function deadLetterMessage(
  config: IRequiredConfig,
  mixed: RedisClient | IRedisClientMulti,
  message: Message,
  keyQueueProcessing: string,
  unacknowledgedCause: EMessageUnacknowledgedCause,
  deadLetterCause: EMessageDeadLetterCause,
  cb?: ICallback<void>,
): void {
  if (mixed instanceof RedisClient) {
    if (!cb) throw new errors.PanicError(`Expected a callback function`);
    const queue = message.getDestinationQueue();
    const { keyQueueDL } = redisKeys.getQueueKeys(queue);
    const { store, expire, queueSize } = config.messages.store.deadLettered;
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
    deadLetterMessageTransaction(config, mixed, message, keyQueueProcessing);
  }
}
