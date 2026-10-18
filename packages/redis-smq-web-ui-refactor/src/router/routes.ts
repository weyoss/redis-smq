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
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
  {
    path: '/ns',
    name: 'namespaces',
    component: () => import('@/views/NamespaceListView.vue'),
  },
  {
    path: '/ns/:ns/queues',
    name: 'namespaceQueues',
    component: () => import('@/views/NamespaceQueuesView.vue'),
  },
  {
    path: '/ns/:ns/exchanges',
    name: 'namespaceExchanges',
    component: () => import('@/views/NamespaceExchangesView.vue'),
  },
  {
    path: '/ns/:ns/queues/:queue',
    name: 'queue',
    component: () => import('@/views/QueueView.vue'),
  },
  {
    path: '/ns/:ns/queues/:queue/messages',
    name: 'messages',
    component: () => import('@/views/MessagesView.vue'),
  },
  {
    path: '/ns/:ns/exchanges/:exchange',
    name: 'exchangeDetails',
    component: () => import('@/views/ExchangeView.vue'),
  },
  {
    path: '/queues',
    name: 'queues',
    component: () => import('@/views/QueueListView.vue'),
  },
  {
    path: '/exchanges',
    name: 'exchanges',
    component: () => import('@/views/ExchangeListView.vue'),
  },
  {
    path: '/config',
    name: 'configuration',
    component: () => import('@/views/ConfigurationView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'notFound',
    component: () => import('@/views/NotFoundView.vue'),
  },
];
