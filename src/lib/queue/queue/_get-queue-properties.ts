import {
  EQueueProperty,
  EQueueType,
  IQueueParams,
  IQueueProperties,
} from '../../../../types';
import { errors, RedisClient, ICallback } from 'redis-smq-common';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { QueueNotFoundError } from '../errors/queue-not-found.error';

function parseProperties(raw: Record<string, string>): IQueueProperties {
  const queueSettings: IQueueProperties = {
    [EQueueProperty.QUEUE_TYPE]: EQueueType.LIFO_QUEUE,
    [EQueueProperty.EXCHANGE]: null,
    [EQueueProperty.RATE_LIMIT]: null,
    [EQueueProperty.MESSAGES_COUNT]: 0,
  };
  for (const key in raw) {
    const keyNum = Number(key);
    if (keyNum === EQueueProperty.QUEUE_TYPE) {
      queueSettings[keyNum] = Number(raw[key]);
    } else if (keyNum === EQueueProperty.RATE_LIMIT) {
      queueSettings[keyNum] = JSON.parse(raw[key]);
    } else if (keyNum === EQueueProperty.EXCHANGE) {
      queueSettings[keyNum] = raw[key];
    } else if (keyNum === EQueueProperty.MESSAGES_COUNT) {
      queueSettings[keyNum] = Number(raw[key]);
    } else {
      throw new errors.PanicError(`Unsupported queue settings type [${key}]`);
    }
  }
  return queueSettings;
}

export function _getQueueProperties(
  redisClient: RedisClient,
  queueParams: IQueueParams,
  cb: ICallback<IQueueProperties>,
): void {
  const { keyQueueProperties } = redisKeys.getQueueKeys(queueParams);
  redisClient.hgetall(keyQueueProperties, (err, reply) => {
    if (err) cb(err);
    else if (!reply || !Object.keys(reply).length) cb(new QueueNotFoundError());
    else {
      const queueProperties = parseProperties(reply);
      cb(null, queueProperties);
    }
  });
}
