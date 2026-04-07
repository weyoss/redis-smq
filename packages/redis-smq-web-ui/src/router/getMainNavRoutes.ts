/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { routes } from '@/router/routes.ts';

export const getMainNavRoutes = () =>
  routes.filter((route) => route.meta?.mainNav === true);
