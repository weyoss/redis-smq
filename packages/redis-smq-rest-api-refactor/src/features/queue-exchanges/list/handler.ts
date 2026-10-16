/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Controller, PathInput } from '../../../http/index.js';
import type { GetQueueExchangesControllerRequestPathDTO } from './GetQueueExchangesControllerRequestPathDTO.js';
import type { GetQueueExchangesControllerResponseDTO } from './GetQueueExchangesControllerResponseDTO.js';

export const getQueueExchanges: Controller<
  PathInput<GetQueueExchangesControllerRequestPathDTO>,
  GetQueueExchangesControllerResponseDTO
> = async (deps, input) => {
  const exchanges = await deps.exchangeManager.getQueueExchanges({
    ns: input.path.ns,
    name: input.path.name,
  });
  return [200, exchanges];
};
