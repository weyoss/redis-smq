/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { RouteRecordRaw } from 'vue-router';

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/ns',
    name: 'namespaces',
    component: () => import('@/views/PlaceholderView.vue'),
  },
  {
    path: '/queues',
    name: 'queues',
    component: () => import('@/views/PlaceholderView.vue'),
  },
  {
    path: '/exchanges',
    name: 'exchanges',
    component: () => import('@/views/PlaceholderView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'notFound',
    component: () => import('@/views/NotFoundView.vue'),
  },
];
