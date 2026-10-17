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
import type { MatchQueuesControllerRequestPathDTO } from './MatchQueuesControllerRequestPathDTO.js';
import type { MatchQueuesControllerRequestQueryDTO } from './MatchQueuesControllerRequestQueryDTO.js';
import type { MatchQueuesControllerResponseDTO } from './MatchQueuesControllerResponseDTO.js';
import { findExchangeOrThrow } from '../exchange-lookup.js';

export const matchQueues: Controller<
  RequestInput<
    MatchQueuesControllerRequestPathDTO,
    MatchQueuesControllerRequestQueryDTO,
    unknown
  >,
  MatchQueuesControllerResponseDTO
> = async (deps, input) => {
  const params = { ns: input.path.ns, name: input.path.exchange };
  const exchange = await findExchangeOrThrow(deps, params.ns, params.name);
  const routingKey = input.query.routingKey ?? '';

  if (exchange.type === EExchangeType.DIRECT) {
    const queues = await deps.exchangeDirect.matchQueues(params, routingKey);
    return [200, queues];
  }
  if (exchange.type === EExchangeType.TOPIC) {
    const queues = await deps.exchangeTopic.matchQueues(params, routingKey);
    return [200, queues];
  }
  const queues = await deps.exchangeFanout.matchQueues(params);
  return [200, queues];
};
