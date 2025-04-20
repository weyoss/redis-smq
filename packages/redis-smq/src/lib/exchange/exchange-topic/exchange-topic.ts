/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { CallbackEmptyReplyError, ICallback } from 'redis-smq-common';
import { IQueueParams } from '../../queue/index.js';
import { ExchangeAbstract } from '../exchange-abstract.js';
import { ITopicParams } from '../types/exchange.js';
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
      cb(topic);
    } else {
      this.redisClient.getSetInstance((err, client) => {
        if (err) {
          this.logger.error(`Failed to get Redis client instance`, {
            error: err.message,
          });
          cb(err);
        } else if (!client) {
          this.logger.error(`Empty Redis client reply`);
          cb(new CallbackEmptyReplyError());
        } else {
          this.logger.debug(`Getting topic exchange queues`, { topic });
          _getTopicExchangeQueues(client, topic, (err, queues) => {
            if (err) {
              this.logger.error(`Failed to get topic exchange queues`, {
                error: err.message,
              });
              cb(err);
            } else {
              this.logger.debug(
                `Successfully retrieved topic exchange queues`,
                {
                  topic,
                  queueCount: queues?.length || 0,
                },
              );
              cb(null, queues);
            }
          });
        }
      });
    }
  }
}
