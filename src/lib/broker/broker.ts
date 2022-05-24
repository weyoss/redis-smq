import { Message } from '../message/message';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { getConfiguration } from '../../config/configuration';
import { retry } from './retry/retry';
import { scheduleMessage } from './schedule-message';
import { RedisClient } from 'redis-smq-common';
import { ICallback } from 'redis-smq-common/dist/types';

export const broker = {
  retry,

  scheduleMessage,

  acknowledgeMessage(
    redisClient: RedisClient,
    message: Message,
    keyQueueProcessing: string,
    cb: ICallback<void>,
  ): void {
    const queue = message.getRequiredQueue();
    const { store, queueSize, expire } =
      getConfiguration().messages.store.acknowledged;
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
        redisClient.lpoprpush(
          keyQueueProcessing,
          keyQueueAcknowledged,
          (err) => {
            if (err) cb(err);
            else cb();
          },
        );
      }
    } else {
      redisClient.rpop(keyQueueProcessing, (err) => cb(err));
    }
  },
};
