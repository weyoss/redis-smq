/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Configuration } from '../config/index.js';
import { TRedisSMQEvent } from '../common/index.js';
import { EventBus } from './event-bus.js';
import { InternalEventBus } from './internal-event-bus.js';
import { EEventTarget } from './types/index.js';
import { eventRoutingPolicies } from './event-routing-policies.js';
import { ICallback } from 'redis-smq-common';

/**
 * EventMultiplexer for routing events to public and/or internal buses per a routing policy.
 */
export class EventMultiplexer {
  private static instance: EventMultiplexer | null = null;
  private readonly eventBus;
  private readonly internalBus;

  protected constructor() {
    const cfg = Configuration.getConfig();
    this.eventBus = cfg.eventBus.enabled ? EventBus.getInstance() : null;
    this.internalBus = InternalEventBus.getInstance();
  }

  static getInstance(): EventMultiplexer {
    if (!EventMultiplexer.instance) {
      EventMultiplexer.instance = new EventMultiplexer();
    }
    return EventMultiplexer.instance;
  }

  static publish<Event extends keyof TRedisSMQEvent>(
    event: Event,
    ...args: Parameters<TRedisSMQEvent[Event]>
  ): void {
    const instance = EventMultiplexer.getInstance();
    instance.publish(event, ...args);
  }

  static shutdown(cb: ICallback) {
    EventMultiplexer.instance = null;
    cb();
  }

  /**
   * Returns current target for an event based on policy.
   * Unregistered events fall back to EEventTarget.USER.
   */
  getTargetFor<Event extends keyof TRedisSMQEvent>(event: Event): EEventTarget {
    return eventRoutingPolicies[event] ?? EEventTarget.USER;
  }

  /**
   * Publish an event to the target buses as per policy.
   */
  publish<Event extends keyof TRedisSMQEvent>(
    event: Event,
    ...args: Parameters<TRedisSMQEvent[Event]>
  ): void {
    const target = this.getTargetFor(event);
    if (
      this.eventBus &&
      (target === EEventTarget.USER || target === EEventTarget.BOTH)
    ) {
      this.eventBus.emit(event, ...args);
    }
    if (target === EEventTarget.SYSTEM || target === EEventTarget.BOTH) {
      this.internalBus.emit(event, ...args);
    }
  }
}
