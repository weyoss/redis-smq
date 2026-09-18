/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MessageHandler } from './message-handler.js';
import { EventMultiplexer } from '../event-bus/event-multiplexer.js';

/**
 * Forward a MessageHandler's message-outcome events to the EventMultiplexer.
 *
 * The handler emits these events from `attachPipelineListeners`, which
 * subscribes to the AcknowledgementPipeline. So the flow is:
 *
 *   MessageAcknowledger / MessageUnacknowledger
 *     -> AcknowledgementPipeline
 *       -> MessageHandler
 *         -> this publisher -> EventMultiplexer -> public/user bus
 *
 * Only message-outcome events are published here. The handler's lifecycle
 * events — 'error' and 'shutdownRequired' — are consumed by the runner
 * and are not events an external subscriber would observe.
 *
 * Two of the handler's events (messageAcknowledged and the dead-letter/
 * requeue/delay variants) carry richer information than the user bus
 * needs. This publisher forwards the exact shape the handler emits; if a
 * future event shape needs remapping, do it here, not in the handler.
 */
export function messageHandlerEventPublisher(handler: MessageHandler): void {
  handler.on('messageAcknowledged', (...args) =>
    EventMultiplexer.publish('consumer.messageAcknowledged', ...args),
  );
  handler.on('messageUnacknowledged', (...args) =>
    EventMultiplexer.publish('consumer.messageUnacknowledged', ...args),
  );
  handler.on('messageDeadLettered', (...args) =>
    EventMultiplexer.publish('consumer.messageDeadLettered', ...args),
  );
  handler.on('messageRequeued', (...args) =>
    EventMultiplexer.publish('consumer.messageRequeued', ...args),
  );
  handler.on('messageDelayed', (...args) =>
    EventMultiplexer.publish('consumer.messageDelayed', ...args),
  );
}
