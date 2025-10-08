/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import ExchangesView from '@/views/ExchangesView.vue';
import HomeViewView from '@/views/HomeView.vue';
import type { RouteRecordRaw } from 'vue-router';

export const main: readonly RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: HomeViewView,
    meta: {
      title: 'Home',
    },
  },
  {
    path: '/queues',
    name: 'Queues',
    // route level code-splitting
    // this generates a separate chunk (About.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import('../views/QueuesView.vue'),
    meta: {
      title: 'Queue Management',
      breadcrumbs: 'Queues',
    },
  },
  {
    path: '/ns',
    name: 'Namespaces',
    component: () => import('../views/NamespacesView.vue'),
    meta: {
      title: 'Namespace Management',
      breadcrumbs: 'Namespaces',
    },
  },
  {
    path: '/exchanges',
    name: 'Exchanges',
    component: ExchangesView,
  },
];
