import {
  CallbackEmptyReplyError,
  ICallback,
  IRedisClient,
} from 'redis-smq-common';
import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
import { IQueueParams } from '../../../queue-manager/index.js';
import { IExchangeParams } from '../../types/index.js';

export function _getDirectExchangeRoutingKeyQueues(
  client: IRedisClient,
  exchange: IExchangeParams,
  routingKey: string,
  cb: ICallback<IQueueParams[]>,
) {
  const { keyRoutingKeyQueues } = redisKeys.getExchangeDirectRoutingKeyKeys(
    exchange.ns,
    exchange.name,
    routingKey,
  );
  client.smembers(keyRoutingKeyQueues, (err, res) => {
    if (err) return cb(err);
    if (!res) return cb(new CallbackEmptyReplyError());

    const queues: IQueueParams[] = [];
    for (const raw of res) {
      const q: IQueueParams = JSON.parse(raw);
      queues.push(q);
    }
    cb(null, queues);
  });
}
