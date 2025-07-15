/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, withRedisClient } from 'redis-smq-common';
import { IQueueParams } from '../../queue/index.js';
import { ExchangeAbstract } from '../exchange-abstract.js';
import { ITopicParams } from '../index.js';
import { _getTopicExchangeParams } from './_/_get-topic-exchange-params.js';
import { _getTopicExchangeQueues } from './_/_get-topic-exchange-queues.js';

export class ExchangeTopic extends ExchangeAbstract<string | ITopicParams> {
  constructor() {
    super();
    this.logger.info('ExchangeTopic initialized');
  }

  getQueues(
    exchangeParams: string | ITopicParams,
    cb: ICallback<IQueueParams[]>,
  ): void {
    this.logger.debug(`Getting queues for topic exchange`, { exchangeParams });

    const topic = _getTopicExchangeParams(exchangeParams);
    if (topic instanceof Error) {
      this.logger.error(`Invalid topic exchange parameters`, {
        error: topic.message,
      });
      return cb(topic);
    }
    withRedisClient(
      this.redisClient,
      (client, cb) => {
        this.logger.debug(`Getting topic exchange queues`, { topic });
        _getTopicExchangeQueues(client, topic, (err, queues) => {
          if (err) {
            this.logger.error(`Failed to get topic exchange queues`, {
              error: err.message,
            });
            cb(err);
          } else {
            this.logger.debug(`Successfully retrieved topic exchange queues`, {
              topic,
              queueCount: queues?.length || 0,
            });
            cb(null, queues);
          }
        });
      },
      cb,
    );
  }
}
