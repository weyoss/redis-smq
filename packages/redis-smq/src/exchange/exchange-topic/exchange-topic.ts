/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from 'redis-smq-common';
import { withSharedPoolConnection } from '../../common/redis-connection-pool/with-shared-pool-connection.js';
import { IQueueParams } from '../../queue-manager/index.js';
import { ExchangeAbstract } from '../exchange-abstract.js';
import { ITopicParams } from '../index.js';
import { _getTopicExchangeParams } from './_/_get-topic-exchange-params.js';
import { _getTopicExchangeQueues } from './_/_get-topic-exchange-queues.js';

/**
 * Topic Exchange implementation for RedisSMQ.
 *
 * A topic exchange routes messages to queues based on regular expression pattern matching
 * between the topic pattern and queue names. This provides flexible message routing
 * capabilities using the full power of JavaScript regular expressions.
 *
 * @example
 * ```typescript
 * const topicExchange = new ExchangeTopic();
 *
 * // Get queues matching a simple pattern
 * topicExchange.getQueues('user', (err, queues) => {
 *   if (err) console.error('Error:', err);
 *   else console.log('Matching queues:', queues);
 * });
 *
 * // Get queues matching a regex pattern
 * topicExchange.getQueues('user\\.(created|updated)', (err, queues) => {
 *   if (err) console.error('Error:', err);
 *   else console.log('Matching queues:', queues);
 * });
 *
 * // Get queues with namespace-specific pattern
 * topicExchange.getQueues({
 *   ns: 'my-app',
 *   topic: '^notification\\.(email|sms)$'
 * }, (err, queues) => {
 *   if (err) console.error('Error:', err);
 *   else console.log('Matching queues:', queues);
 * });
 * ```
 */
export class ExchangeTopic extends ExchangeAbstract<string | ITopicParams> {
  /**
   * Creates a new ExchangeTopic instance.
   *
   * Initializes the topic exchange with logging capabilities.
   */
  constructor() {
    super();
    this.logger.info('ExchangeTopic initialized');
  }

  /**
   * Retrieves all queues that match the specified topic pattern.
   *
   * The topic pattern is treated as a regular expression and matched against
   * existing queue names within the specified namespace. This allows for
   * powerful and flexible queue selection using regex features like:
   * - Character classes: `[a-z]`, `[0-9]`
   * - Quantifiers: `*`, `+`, `?`, `{n,m}`
   * - Anchors: `^`, `$`
   * - Groups: `(pattern1|pattern2)`
   * - Escape sequences: `\\.`, `\\d`, `\\w`
   *
   * @param exchangeParams - The topic pattern configuration. Can be:
   *   - A string representing the regex pattern (uses default namespace)
   *   - An ITopicParams object with namespace and topic pattern
   * @param cb - Callback function that receives the matching queues or an error
   *
   * @example
   * ```typescript
   * const exchange = new ExchangeTopic();
   *
   * // Simple prefix matching
   * exchange.getQueues('user', (err, queues) => {
   *   // Matches: "user", "user.created", "user.updated", etc.
   * });
   *
   * // Exact matching with anchors
   * exchange.getQueues('^order\\.created$', (err, queues) => {
   *   // Matches: "order.created" only
   * });
   *
   * // Pattern with alternatives
   * exchange.getQueues('notification\\.(email|sms|push)', (err, queues) => {
   *   // Matches: "notification.email", "notification.sms", "notification.push"
   * });
   *
   * // Complex pattern with character classes
   * exchange.getQueues('queue-[0-9]+\\.(high|low)', (err, queues) => {
   *   // Matches: "queue-1.high", "queue-42.low", etc.
   * });
   *
   * // Namespace-specific pattern
   * exchange.getQueues({
   *   ns: 'production',
   *   topic: '^critical\\.'
   * }, (err, queues) => {
   *   // Matches queues in 'production' namespace starting with "critical."
   * });
   * ```
   *
   * @throws {InvalidTopicExchangeParamsError} When the topic pattern is not a valid regular expression
   * @throws {Error} When Redis connection or query operations fail
   */
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
    withSharedPoolConnection((client, cb) => {
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
    }, cb);
  }
}
