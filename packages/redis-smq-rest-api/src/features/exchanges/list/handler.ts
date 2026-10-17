/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Controller, RequestInput } from '../../../http/index.js';
import { GetExchangesControllerResponseDTO } from './GetExchangesControllerResponseDTO.js';

/**
 * Returns every exchange the runtime knows about.
 *
 * Straight projection of `deps.exchangeManager.getAllExchanges()` into
 * the response tuple. No filter, no sort, no envelope — the router
 * applies `{ data }`.
 */
export const getExchanges: Controller<
  RequestInput,
  GetExchangesControllerResponseDTO
> = async (deps) => {
  const exchanges = await deps.exchangeManager.getAllExchanges();
  return [200, exchanges];
};
