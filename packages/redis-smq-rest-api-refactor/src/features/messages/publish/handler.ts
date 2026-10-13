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

/**
 * Publishes a message to a queue, topic, fanout, or direct exchange.
 */
export const publishMessage: Controller<
  BodyInput<PublishMessageControllerRequestBodyDTO>,
  string[]
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
  if (body) producible.setBody(body);
  if (consumeTimeout) producible.setConsumeTimeout(consumeTimeout);
  if (priority) producible.setPriority(priority);
  if (retryDelay) producible.setRetryDelay(retryDelay);
  if (retryThreshold) producible.setRetryThreshold(retryThreshold);
  if (scheduledCron) producible.setScheduledCRON(scheduledCron);
  if (scheduledRepeat) producible.setScheduledRepeat(scheduledRepeat);
  if (scheduledRepeatPeriod)
    producible.setScheduledRepeatPeriod(scheduledRepeatPeriod);
  if (scheduledDelay) producible.setScheduledDelay(scheduledDelay);

  if ('queue' in exchange && exchange.queue) {
    producible.setQueue(exchange.queue);
  } else if ('topic' in exchange && exchange.topic) {
    producible.setTopicExchange(exchange.topic);
  } else if ('fanOut' in exchange && exchange.fanOut) {
    producible.setFanoutExchange(exchange.fanOut);
  } else if ('direct' in exchange && exchange.direct) {
    producible.setDirectExchange(exchange.direct);
  }

  await deps.producer.run();
  const ids = await deps.producer.produce(producible);
  return [201, ids];
};
