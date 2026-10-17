/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Controller, PathInput } from '../../../http/index.js';
import type { GetExchangeControllerRequestPathDTO } from './GetExchangeControllerRequestPathDTO.js';
import type { GetExchangeControllerResponseDTO } from './GetExchangeControllerResponseDTO.js';
import { findExchangeOrThrow } from '../exchange-lookup.js';

export const getExchange: Controller<
  PathInput<GetExchangeControllerRequestPathDTO>,
  GetExchangeControllerResponseDTO
> = async (deps, input) => {
  const exchange = await findExchangeOrThrow(
    deps,
    input.path.ns,
    input.path.exchange,
  );
  return [200, exchange];
};
