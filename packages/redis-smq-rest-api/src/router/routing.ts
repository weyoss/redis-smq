/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { TRouterResourceMap } from '../lib/router/types/index.js';
import { api } from './api/index.js';

export const routing: TRouterResourceMap = {
  path: '/',
  resource: [api],
};
