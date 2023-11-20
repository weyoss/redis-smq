import { IQueueParams } from '../../../types';
import {
  CallbackEmptyReplyError,
  ICallback,
  RedisClient,
} from 'redis-smq-common';
import { ExchangeFanOut } from './exchange-fan-out';
import { _getQueueProperties } from '../queue/queue/_get-queue-properties';

export function _getQueueFanOutExchange(
  redisClient: RedisClient,
  queue: IQueueParams,
  cb: ICallback<ExchangeFanOut | null>,
): void {
  _getQueueProperties(redisClient, queue, (err, reply) => {
    if (err) cb(err);
    else if (!reply) cb(new CallbackEmptyReplyError());
    else {
      const eName = reply.exchange;
      cb(null, eName ? new ExchangeFanOut(eName) : null);
    }
  });
}
