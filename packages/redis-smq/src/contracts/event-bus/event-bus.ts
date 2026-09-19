/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EventBus } from 'redis-smq-common';
import { TRedisSMQEvent } from './event.js';

/**
 * The user-facing distributed event bus.
 *
 * RedisSMQ publishes lifecycle and message-outcome events through this
 * bus. A caller subscribes with `.on(...)` and receives events from
 * every process connected to the same Redis instance. The bus is
 * distributed — an event emitted by one process is delivered to every
 * subscriber across all processes.
 *
 * Two buses exist in the library:
 *
 *   - The user bus (this interface). Public events that applications
 *     subscribe to: queue lifecycle, message outcomes, producer and
 *     consumer state changes.
 *
 *   - The internal bus. Coordination events between library components
 *     — configuration sync, cross-process queue state notifications.
 *     Applications never subscribe to these. The internal bus is not
 *     part of the public API.
 *
 * Some events are published on both buses via the event multiplexer.
 * `queue.queueCreated` and `queue.stateChanged`, for example, are
 * published internally for coordination and publicly for observability.
 * A caller subscribing to the public bus sees them once; the internal
 * bus's copy is consumed by the library.
 *
 * The bus is created lazily on first `getInstance()` and shut down by
 * the lifecycle manager. A caller does not normally call `run()` or
 * `shutdown()` — the library manages the lifecycle — but both are
 * exposed because the concrete class implements `Runnable`.
 *
 * @example
 * import { EventBus } from 'redis-smq';
 *
 * const eventBus = EventBus.getInstance();
 *
 * eventBus.on('consumer.messageAcknowledged', (messageId, queue, consumerId) => {
 *   console.log(`Message ${messageId} acknowledged by ${consumerId}`);
 * });
 *
 * eventBus.on('queue.queueCreated', (queue, properties) => {
 *   console.log(`Queue ${queue.name}@${queue.ns} created`);
 * });
 */
export interface IEventBus extends EventBus<TRedisSMQEvent> {} // eslint-disable-line @typescript-eslint/no-empty-object-type
