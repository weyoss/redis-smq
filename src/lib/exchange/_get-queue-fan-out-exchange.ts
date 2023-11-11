import { EQueueProperty, IQueueParams } from '../../../types';
import { errors, ICallback, RedisClient } from 'redis-smq-common';
import { ExchangeFanOut } from './exchange-fan-out';
import { _getQueueProperties } from '../queue/queue/_get-queue-properties';

export function _getQueueFanOutExchange(
  redisClient: RedisClient,
  queue: IQueueParams,
  cb: ICallback<ExchangeFanOut | null>,
): void {
  _getQueueProperties(redisClient, queue, (err, reply) => {
    if (err) cb(err);
    else if (!reply) cb(new errors.EmptyCallbackReplyError());
    else {
      const eName = reply[EQueueProperty.EXCHANGE];
      cb(null, eName ? new ExchangeFanOut(eName) : null);
    }
  });
}
