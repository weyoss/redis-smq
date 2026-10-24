/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { createRouter, createWebHistory } from 'vue-router';
import { BASE_PATH } from '@/config';
import { routes } from './routes';

const router = createRouter({
  history: createWebHistory(BASE_PATH),
  routes,
});

export default router;
