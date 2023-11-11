import { IQueueParams, TTopicParams } from '../../../types';
import { async, errors, ICallback, RedisClient } from 'redis-smq-common';
import { _getQueues } from '../queue/queue/_get-queues';
import { _getTopicExchangeParams } from './_get-topic-exchange-params';

export function _getTopicExchangeQueues(
  redisClient: RedisClient,
  topic: TTopicParams | string,
  cb: ICallback<IQueueParams[]>,
): void {
  _getQueues(redisClient, (err, queues) => {
    if (err) cb(err);
    else if (!queues) cb(new errors.EmptyCallbackReplyError());
    else {
      const topicParams = _getTopicExchangeParams(topic);
      const matched: IQueueParams[] = [];
      const regExp = new RegExp(topicParams.topic);
      async.eachOf(
        queues,
        (queue, index, done) => {
          if (queue.ns === topicParams.ns && regExp.test(queue.name))
            matched.push(queue);
          done();
        },
        (err) => cb(err, matched),
      );
    }
  });
}
