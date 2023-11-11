import { errors, RedisClient, ICallback } from 'redis-smq-common';
import { IQueueParams } from '../../../../types';
import { redisKeys } from '../../../common/redis-keys/redis-keys';

export function _getQueues(
  client: RedisClient,
  cb: ICallback<IQueueParams[]>,
): void {
  const { keyQueues } = redisKeys.getMainKeys();
  client.sscanAll(keyQueues, {}, (err, reply) => {
    if (err) cb(err);
    else if (!reply) cb(new errors.EmptyCallbackReplyError());
    else {
      const queues: IQueueParams[] = reply.map((i) => JSON.parse(i));
      cb(null, queues);
    }
  });
}
