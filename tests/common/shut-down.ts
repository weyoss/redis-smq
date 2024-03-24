/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { shutDownConsumers } from './consumer.js';
import { shutDownEventBus } from './event-bus-redis.js';
import {
  shutDownDirectExchange,
  shutDownFanOutExchange,
  shutDownTopicExchange,
} from './exchange.js';
import { shutDownMessage } from './message.js';
import { shutDownNamespace } from './namespace.js';
import { shutDownProducers } from './producer.js';
import { shutDownQueue } from './queue.js';
import { shutDownQueueAcknowledgedMessages } from './queue-acknowledged-messages.js';
import { shutDownQueueDeadLetteredMessages } from './queue-dead-lettered-messages.js';
import { shutDownQueueMessages } from './queue-messages.js';
import { shutDownQueuePendingMessages } from './queue-pending-messages.js';
import { shutDownQueueRateLimit } from './queue-rate-limit.js';
import { shutDownQueueScheduledMessages } from './queue-scheduled-messages.js';
import { shutDownRedisClients } from './redis.js';
import { stopScheduleWorker } from './schedule-worker.js';

export async function shutdown(): Promise<void> {
  await shutDownConsumers();
  await shutDownProducers();
  await stopScheduleWorker();
  await shutDownEventBus();
  await shutDownQueueScheduledMessages();
  await shutDownQueueRateLimit();
  await shutDownQueuePendingMessages();
  await shutDownQueueMessages();
  await shutDownQueueDeadLetteredMessages();
  await shutDownQueueAcknowledgedMessages();
  await shutDownQueue();
  await shutDownNamespace();
  await shutDownMessage();
  await shutDownDirectExchange();
  await shutDownTopicExchange();
  await shutDownFanOutExchange();

  // Redis clients should be stopped in the last step, to avoid random errors from different
  // dependant components.
  await shutDownRedisClients();
}
