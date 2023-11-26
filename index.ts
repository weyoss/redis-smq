/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from 'redis-smq-common';
import { _destroyCommonRedisClient } from './src/common/_get-common-redis-client';

export * from './types/index';
export * from './src/lib/consumer/errors';
export * from './src/lib/queue/errors';
export * from './src/lib/exchange/errors';
export * from './src/lib/producer/errors';
export * from './src/lib/message/errors';
export { Consumer } from './src/lib/consumer/consumer';
export { Producer } from './src/lib/producer/producer';
export { Message } from './src/lib/message/message';
export { ExchangeDirect } from './src/lib/exchange/exchange-direct';
export { ExchangeTopic } from './src/lib/exchange/exchange-topic';
export { ExchangeFanOut } from './src/lib/exchange/exchange-fan-out';
export { Namespace } from './src/lib/queue/namespace';
export { Queue } from './src/lib/queue/queue/queue';
export { QueueMessages } from './src/lib/queue/queue-messages/queue-messages';
export { QueueAcknowledgedMessages } from './src/lib/queue/queue-acknowledged-messages';
export { QueueDeadLetteredMessages } from './src/lib/queue/queue-dead-lettered-messages';
export { QueuePendingMessages } from './src/lib/queue/queue-pending-messages';
export { QueueScheduledMessages } from './src/lib/queue/queue-scheduled-messages';
export { QueueRateLimit } from './src/lib/queue/queue-rate-limit';
export { Configuration } from './src/config/configuration';
export function disconnect(cb: ICallback<void>): void {
  _destroyCommonRedisClient(cb);
}
