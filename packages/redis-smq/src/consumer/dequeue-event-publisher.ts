/*
 * packages/redis-smq/src/consumer/dequeue-message-handler-consumer-event-publisher.ts
 */

import { DequeueMessage } from './dequeue-message.js';
import { EventMultiplexer } from '../event-bus/event-multiplexer.js';

export function dequeueEventPublisher(dequeueMessage: DequeueMessage): void {
  dequeueMessage.on('messageReceived', (...args) =>
    EventMultiplexer.publish('consumer.messageReceived', ...args),
  );
}
