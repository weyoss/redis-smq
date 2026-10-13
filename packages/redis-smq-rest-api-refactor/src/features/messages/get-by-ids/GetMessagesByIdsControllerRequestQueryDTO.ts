/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * Query parameters of `GET /api/messages`.
 *
 * `ids` arrives as `?ids=<a>&ids=<b>&…` and is parsed by Node's
 * querystring module into `['a', 'b', …]`. A single id also arrives
 * as an array of length one — the DTO type is `string[]` unconditionally.
 */
export type GetMessagesByIdsControllerRequestQueryDTO = {
  ids: string[];
};
