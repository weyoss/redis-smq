/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { IExchangeParsedParams } from 'redis-smq';

/**
 * Response shape of `GET /api/exchanges`.
 *
 * Returns every exchange across every namespace as a flat array.
 * `IExchangeParsedParams` carries `{ ns, name, type }` — the `type`
 * field is what distinguishes direct, fanout, and topic exchanges in
 * the response, so a client can filter locally without a second
 * request.
 *
 * No error branches: `getAllExchanges()` on a running runtime returns
 * the current list or an empty array. It does not raise a domain
 * error.
 */
export type GetExchangesControllerResponseDTO = readonly [
  200,
  IExchangeParsedParams[],
];
