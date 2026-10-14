/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EExchangeType } from 'redis-smq';
import type { Controller, PathInput } from '../../../http/index.js';
import type { DeleteExchangeControllerRequestPathDTO } from './DeleteExchangeControllerRequestPathDTO.js';
import type { DeleteExchangeControllerResponseDTO } from './DeleteExchangeControllerResponseDTO.js';
import { findExchangeOrThrow } from '../exchange-lookup.js';

/**
 * Deletes an exchange, dispatching to the type-specific manager.
 *
 * The type lookup is required because `IExchangeManager` has no
 * `delete()` — deletion lives on the per-type managers
 * (`exchangeDirect`, `exchangeFanout`, `exchangeTopic`), and the
 * correct one depends on the exchange being deleted.
 */
export const deleteExchange: Controller<
  PathInput<DeleteExchangeControllerRequestPathDTO>,
  DeleteExchangeControllerResponseDTO
> = async (deps, input) => {
  const params = { ns: input.path.ns, name: input.path.exchange };
  const exchange = await findExchangeOrThrow(deps, params.ns, params.name);

  if (exchange.type === EExchangeType.DIRECT) {
    await deps.exchangeDirect.delete(params);
  } else if (exchange.type === EExchangeType.TOPIC) {
    await deps.exchangeTopic.delete(params);
  } else {
    await deps.exchangeFanout.delete(params);
  }

  return [204, null];
};
