/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ProducibleMessage } from 'redis-smq';
import {
  TControllerRequestHandler,
  TControllerRequestPayloadEmpty,
} from '../../../lib/controller/types/index.js';
import { Container } from '../../container/Container.js';
import { PublishMessageControllerRequestBodyDTO } from '../../dto/controllers/messages/PublishMessageControllerRequestBodyDTO.js';
import { PublishMessageControllerResponseDTO } from '../../dto/controllers/messages/PublishMessageControllerResponseDTO.js';

export const publishMessageController: TControllerRequestHandler<
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  PublishMessageControllerRequestBodyDTO,
  PublishMessageControllerResponseDTO
> = async (ctx) => {
  const messagesService = Container.getInstance().resolve('messagesService');
  const { message, exchange } = ctx.scope.resolve('requestBodyDTO');
  const msg = new ProducibleMessage();
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
  if (ttl) msg.setTTL(ttl);
  if (body) msg.setBody(body);
  if (consumeTimeout) msg.setConsumeTimeout(consumeTimeout);
  if (priority) msg.setPriority(priority);
  if (retryDelay) msg.setRetryDelay(retryDelay);
  if (retryThreshold) msg.setRetryThreshold(retryThreshold);
  if (scheduledCron) msg.setScheduledCRON(scheduledCron);
  if (scheduledRepeat) msg.setScheduledRepeat(scheduledRepeat);
  if (scheduledRepeatPeriod)
    msg.setScheduledRepeatPeriod(scheduledRepeatPeriod);
  if (scheduledDelay) msg.setScheduledDelay(scheduledDelay);
  if (exchange.queue) msg.setQueue(exchange.queue);
  else if (exchange.topic) msg.setTopic(exchange.topic);
  else if (exchange.fanOut) msg.setFanOut(exchange.fanOut);
  const ids = await messagesService.publishMessage(msg);
  return [201, ids];
};
