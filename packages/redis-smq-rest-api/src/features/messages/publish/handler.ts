/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQ } from 'redis-smq';
import type { BodyInput, Controller } from '../../../http/index.js';
import type { PublishMessageControllerRequestBodyDTO } from './PublishMessageControllerRequestBodyDTO.js';
import { PublishMessageControllerResponseDTO } from './PublishMessageControllerResponseDTO.js';

/**
 * Publishes a message to a queue, topic, fanout, or direct exchange.
 *
 * Each branch of the `exchange` union maps to a destination setter
 * on the producible message. The `topic` and `direct` branches also
 * call `setExchangeRoutingKey` — their destinations route by key, and
 * omitting the call would produce a `RoutingKeyRequiredError` at
 * publish time.
 *
 * The `queue` and `fanOut` branches have no routing-key call,
 * matching the library's behavior: fanout exchanges deliver to every
 * bound queue, and a direct-to-queue publish bypasses exchange
 * routing entirely.
 *
 * ## Fix vs. the original package
 *
 * The original handler resolved the `topic` and `direct` branches
 * without setting a routing key, and the DTO couldn't supply one.
 * Every publish to either exchange type failed with
 * `RoutingKeyRequiredError`. The `direct` branch was also missing
 * entirely in the original — a `{ exchange: { direct: … } }` body
 * passed validation, then reached `producer.produce()` with no
 * destination set. Both gaps are closed here.
 */
export const publishMessage: Controller<
  BodyInput<PublishMessageControllerRequestBodyDTO>,
  PublishMessageControllerResponseDTO
> = async (deps, input) => {
  const { message, exchange } = input.body;

  const producible = RedisSMQ.newProducibleMessage();

  const {
    ttl,
    body,
    consumeTimeout,
    priority,
    retryDelay,
    retryThreshold,
    scheduledCron,
    scheduledRepeat,
    scheduledRepeatPeriod,
    scheduledDelay,
  } = message;

  if (ttl) producible.setTTL(ttl);
  if (body !== undefined) producible.setBody(body);
  if (consumeTimeout) producible.setConsumeTimeout(consumeTimeout);
  if (priority != null) producible.setPriority(priority);
  if (retryDelay) producible.setRetryDelay(retryDelay);
  if (retryThreshold !== undefined)
    producible.setRetryThreshold(retryThreshold);
  if (scheduledCron) producible.setScheduledCRON(scheduledCron);
  if (scheduledRepeat) producible.setScheduledRepeat(scheduledRepeat);
  if (scheduledRepeatPeriod)
    producible.setScheduledRepeatPeriod(scheduledRepeatPeriod);
  if (scheduledDelay) producible.setScheduledDelay(scheduledDelay);

  if ('queue' in exchange && exchange.queue) {
    producible.setQueue(exchange.queue);
  } else if ('topic' in exchange && exchange.topic) {
    producible.setTopicExchange(exchange.topic);
    producible.setExchangeRoutingKey(exchange.routingKey);
  } else if ('fanOut' in exchange && exchange.fanOut) {
    producible.setFanoutExchange(exchange.fanOut);
  } else if (exchange.direct) {
    producible.setDirectExchange(exchange.direct);
    producible.setExchangeRoutingKey(exchange.routingKey);
  }

  await deps.producer.run();
  const ids = await deps.producer.produce(producible);
  return [201, ids];
};
