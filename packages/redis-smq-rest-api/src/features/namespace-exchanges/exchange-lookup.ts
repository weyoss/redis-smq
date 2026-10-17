/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { errors } from 'redis-smq';
import type { IExchangeParsedParams } from 'redis-smq';
import type { Deps } from '../../deps/index.js';

/**
 * Looks up an exchange by `{ ns, name }` and throws
 * `ExchangeNotFoundError` if it doesn't exist.
 *
 * Six of the nine handlers in this folder need the exchange's `type`
 * to dispatch to the right type-specific manager (`exchangeDirect`,
 * `exchangeFanout`, `exchangeTopic`). The library doesn't expose a
 * direct "get one exchange" method — `getAllExchanges()` is the only
 * read — so the lookup filters the full list. Routing it through one
 * helper means the lookup-and-throw behavior is defined once.
 *
 * Not imported by any DTO. This file imports `deps/index.js` and
 * `redis-smq`, which would pull the runtime graph into the schema
 * generator's program. Only handlers import it.
 */
export async function findExchangeOrThrow(
  deps: Deps,
  ns: string,
  name: string,
): Promise<IExchangeParsedParams> {
  const exchanges = await deps.exchangeManager.getAllExchanges();
  const exchange = exchanges.find((e) => e.ns === ns && e.name === name);
  if (!exchange) {
    throw new errors.ExchangeNotFoundError();
  }
  return exchange;
}
