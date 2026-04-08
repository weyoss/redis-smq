/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { type RouteRecordRaw } from 'vue-router';
import HomeViewView from '@/views/HomeView.vue';
import ExchangeListView from '@/views/exchanges/ExchangeListView.vue';
import type { RouteName } from './types';
import { EMessageType } from '@/types';

export interface BreadcrumbMeta {
  label: string;
  path?: string;
  parent?: RouteName;
}

export interface AppRouteMeta {
  title: string;
  mainNav?: boolean;
  icon?: string;
  breadcrumb?: BreadcrumbMeta;
  messageType?: EMessageType;
  systemRoute?: boolean;
}

export type AppRouteRecord = RouteRecordRaw & {
  name: RouteName;
  meta: AppRouteMeta;
};

const asRoute = (route: AppRouteRecord): AppRouteRecord => route;

export const routes = [
  // Top-level routes
  asRoute({
    path: '/',
    name: 'home',
    component: HomeViewView,
    meta: {
      title: 'Home',
      mainNav: true,
      icon: 'bi-house-door',
      breadcrumb: { label: 'Home', path: '/' },
    },
  }),
  asRoute({
    path: '/ns',
    name: 'namespaces',
    component: () => import('@/views/namespaces/NamespaceListView.vue'),
    meta: {
      title: 'Namespaces',
      mainNav: true,
      icon: 'bi-folder',
      breadcrumb: { label: 'Namespaces', path: '/ns' },
    },
  }),
  asRoute({
    path: '/queues',
    name: 'queues',
    component: () => import('@/views/queues/QueueListView.vue'),
    meta: {
      title: 'Queues',
      mainNav: true,
      icon: 'bi-list-ul',
      breadcrumb: { label: 'Queues', path: '/queues' },
    },
  }),
  asRoute({
    path: '/exchanges',
    name: 'exchanges',
    component: ExchangeListView,
    meta: {
      title: 'Exchanges',
      mainNav: true,
      icon: 'bi-diagram-3',
      breadcrumb: { label: 'Exchanges', path: '/exchanges' },
    },
  }),

  // Namespace-scoped routes
  asRoute({
    path: '/ns/:ns/queues',
    name: 'namespaceQueues',
    component: () => import('@/views/namespaces/NamespaceQueuesView.vue'),
    meta: {
      title: 'Namespace Queues',
      breadcrumb: { label: 'Namespace Queues: :ns', parent: 'namespaces' },
    },
  }),
  asRoute({
    path: '/ns/:ns/exchanges',
    name: 'namespaceExchanges',
    component: () => import('@/views/namespaces/NamespaceExchangesView.vue'),
    meta: {
      title: 'Namespace Exchanges',
      breadcrumb: { label: 'Namespace Exchanges: :ns', parent: 'namespaces' },
    },
  }),

  // Queue routes
  asRoute({
    path: '/ns/:ns/queues/:queue',
    name: 'queue',
    component: () => import('@/views/queues/QueueView.vue'),
    meta: {
      title: 'Queue Details',
      breadcrumb: {
        label: 'Queue: :queue@:ns',
        parent: 'namespaceQueues',
      },
    },
  }),
  asRoute({
    path: '/ns/:ns/queues/:queue/messages',
    name: 'messages',
    component: () => import('@/views/messages/MessagesView.vue'),
    meta: {
      title: 'Queue Messages',
      breadcrumb: {
        label: 'Messages',
        parent: 'queue',
      },
    },
  }),

  // Exchange route
  asRoute({
    path: '/ns/:ns/exchanges/:exchange',
    name: 'exchangeDetails',
    component: () => import('@/views/exchanges/ExchangeView.vue'),
    meta: {
      title: 'Exchange Details',
      breadcrumb: {
        label: 'Exchange: :exchange@:ns',
        parent: 'namespaceExchanges',
      },
    },
  }),

  // System routes
  asRoute({
    path: '/config',
    name: 'configuration',
    component: () => import('@/views/configuration/ConfigurationView.vue'),
    meta: {
      title: 'Configuration',
      icon: 'bi-gear-wide-connected',
      systemRoute: true,
      breadcrumb: { label: 'Configuration', path: '/config' },
    },
  }),

  // 404 handler
  asRoute({
    path: '/:pathMatch(.*)*',
    name: 'notFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: 'Page Not Found' },
  }),
] as const;
