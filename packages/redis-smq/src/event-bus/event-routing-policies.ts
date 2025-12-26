/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EEventTarget, TEventRoutingPolicy } from './types/index.js';

/**
 * Event routing policies
 *
 * This map defines where each event should be published:
 * - EEventTarget.SYSTEM   -> publish to InternalEventBus only
 * - EEventTarget.USER     -> publish to EventBus only
 * - EEventTarget.BOTH     -> publish to both buses
 *
 * Notes:
 * - Only the events listed here are explicitly routed; unlisted events should
 *   be treated by the caller’s default behavior (typically USER/public).
 * - This file centralizes routing to keep QueueManager and other publishers
 *   free of per-event branching logic.
 * - Both buses are initialized during bootstrap; publishing code does not need
 *   to lazy-start them. If the public bus is disabled by configuration, events
 *   targeted to USER/BOTH should be skipped gracefully by the publisher.
 */
export const eventRoutingPolicies: TEventRoutingPolicy = {
  'queue.queueCreated': EEventTarget.BOTH,
  'queue.queueDeleted': EEventTarget.BOTH,
  'queue.consumerGroupCreated': EEventTarget.BOTH,
  'queue.consumerGroupDeleted': EEventTarget.BOTH,
};
