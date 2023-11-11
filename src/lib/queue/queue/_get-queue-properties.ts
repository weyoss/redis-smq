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
  const properties: IQueueProperties = {
    queueType: EQueueType.LIFO_QUEUE,
    exchange: null,
    rateLimit: null,
    messagesCount: 0,
  };
  for (const key in raw) {
    const keyNum = Number(key);
    if (keyNum === EQueueProperty.QUEUE_TYPE) {
      properties.queueType = Number(raw[key]);
    } else if (keyNum === EQueueProperty.RATE_LIMIT) {
      properties.rateLimit = JSON.parse(raw[key]);
    } else if (keyNum === EQueueProperty.EXCHANGE) {
      properties.exchange = raw[key];
    } else if (keyNum === EQueueProperty.MESSAGES_COUNT) {
      properties.messagesCount = Number(raw[key]);
    } else {
      throw new errors.PanicError(`Unsupported queue settings type [${key}]`);
    }
  }
  return properties;
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
