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
import type { GetRoutingKeysControllerRequestPathDTO } from './GetRoutingKeysControllerRequestPathDTO.js';
import type { GetRoutingKeysControllerResponseDTO } from './GetRoutingKeysControllerResponseDTO.js';
import { findExchangeOrThrow } from '../exchange-lookup.js';

/**
 * Returns the routing keys bound to a direct exchange.
 *
 * Only DIRECT exchanges have routing keys. A request against a
 * FANOUT or TOPIC exchange produces
 * `InvalidDirectExchangeParametersError` (422). The original package
 * raised this error inside `ExchangesService.getRoutingKeys`; the
 * check is preserved here so the error name reaches the client
 * unchanged.
 */
export const getRoutingKeys: Controller<
  PathInput<GetRoutingKeysControllerRequestPathDTO>,
  GetRoutingKeysControllerResponseDTO
> = async (deps, input) => {
  const params = { ns: input.path.ns, name: input.path.exchange };
  const exchange = await findExchangeOrThrow(deps, params.ns, params.name);

  if (exchange.type !== EExchangeType.DIRECT) {
    throw new errors.InvalidDirectExchangeParametersError({
      message: 'Provided exchange is not a DIRECT exchange',
    });
  }

  const keys = await deps.exchangeDirect.getRoutingKeys(params);
  return [200, keys];
};
