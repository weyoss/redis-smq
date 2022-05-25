import { RedisClient } from 'redis-smq-common';
import { Message } from '../message/message';
import { ICallback } from 'redis-smq-common/dist/types';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { IRequiredConfig } from '../../../types';

export function acknowledgeMessage(
  config: IRequiredConfig,
  redisClient: RedisClient,
  message: Message,
  keyQueueProcessing: string,
  cb: ICallback<void>,
): void {
  const queue = message.getRequiredQueue();
  const { store, queueSize, expire } = config.messages.store.acknowledged;
  if (store) {
    const { keyQueueAcknowledged } = redisKeys.getQueueKeys(queue);
    if (queueSize || expire) {
      redisClient.lpoprpushextra(
        keyQueueProcessing,
        keyQueueAcknowledged,
        queueSize > 0 ? queueSize * -1 : queueSize,
        expire,
        (err) => {
          if (err) cb(err);
          else cb();
        },
      );
    } else {
      redisClient.lpoprpush(keyQueueProcessing, keyQueueAcknowledged, (err) => {
        if (err) cb(err);
        else cb();
      });
    }
  } else {
    redisClient.rpop(keyQueueProcessing, (err) => cb(err));
  }
}
