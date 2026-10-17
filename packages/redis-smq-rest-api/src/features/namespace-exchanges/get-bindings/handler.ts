/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EExchangeType } from 'redis-smq';
import type { Controller, RequestInput } from '../../../http/index.js';
import type { GetBindingsControllerRequestPathDTO } from './GetBindingsControllerRequestPathDTO.js';
import type { GetBindingsControllerRequestQueryDTO } from './GetBindingsControllerRequestQueryDTO.js';
import type { GetBindingsControllerResponseDTO } from './GetBindingsControllerResponseDTO.js';
import { findExchangeOrThrow } from '../exchange-lookup.js';

/**
 * Returns the queues bound to an exchange, optionally filtered.
 *
 * The response shape depends on the exchange type and the query:
 *
 *   - FANOUT: always `IQueueParams[]` (the list of bound queues).
 *   - DIRECT without `routingKey`: a map of `{ routingKey: queues[] }`.
 *   - DIRECT with `routingKey`: the queues bound to that key.
 *   - TOPIC without `routingPattern`: a map of `{ routingPattern: queues[] }`.
 *   - TOPIC with `routingPattern`: the queues bound to that pattern.
 *
 * The `{ [key]: queues[] }` shape for the unfiltered form is
 * preserved from the original package; a future version might split
 * the responses into separate DTOs, but that would be a wire-breaking
 * change.
 */
export const getBindings: Controller<
  RequestInput<
    GetBindingsControllerRequestPathDTO,
    GetBindingsControllerRequestQueryDTO,
    unknown
  >,
  GetBindingsControllerResponseDTO
> = async (deps, input) => {
  const params = { ns: input.path.ns, name: input.path.exchange };
  const exchange = await findExchangeOrThrow(deps, params.ns, params.name);
  const { routingKey, routingPattern } = input.query;

  if (exchange.type === EExchangeType.DIRECT) {
    if (!routingKey) {
      const bindings = await deps.exchangeDirect.getBindings(params);
      return [200, bindings];
    }
    const queues = await deps.exchangeDirect.getRoutingKeyBoundQueues(
      params,
      routingKey,
    );
    return [200, queues];
  }

  if (exchange.type === EExchangeType.TOPIC) {
    if (!routingPattern) {
      const bindings = await deps.exchangeTopic.getBindings(params);
      return [200, bindings];
    }
    const queues = await deps.exchangeTopic.getRoutingPatternBoundQueues(
      params,
      routingPattern,
    );
    return [200, queues];
  }

  const bindings = await deps.exchangeFanout.getBindings(params);
  return [200, bindings];
};
