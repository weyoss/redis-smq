/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EExchangeType, errors } from 'redis-smq';
import type { Controller, PathInput } from '../../../http/index.js';
import type { GetRoutingPatternsControllerRequestPathDTO } from './GetRoutingPatternsControllerRequestPathDTO.js';
import type { GetRoutingPatternsControllerResponseDTO } from './GetRoutingPatternsControllerResponseDTO.js';
import { findExchangeOrThrow } from '../exchange-lookup.js';

export const getRoutingPatterns: Controller<
  PathInput<GetRoutingPatternsControllerRequestPathDTO>,
  GetRoutingPatternsControllerResponseDTO
> = async (deps, input) => {
  const params = { ns: input.path.ns, name: input.path.exchange };
  const exchange = await findExchangeOrThrow(deps, params.ns, params.name);

  if (exchange.type !== EExchangeType.TOPIC) {
    throw new errors.InvalidTopicExchangeParamsError({
      message: 'Provided exchange is not a TOPIC exchange',
    });
  }

  const patterns = await deps.exchangeTopic.getRoutingPatterns(params);
  return [200, patterns];
};
