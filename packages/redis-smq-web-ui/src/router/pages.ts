/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import AcknowledgedMessagesView from '@/views/messages/AcknowledgedMessagesView.vue';
import DeadLetteredMessagesView from '@/views/messages/DeadLetteredMessagesView.vue';
import NamespaceQueuesView from '@/views/namespaces/NamespaceQueuesView.vue';
import NamespaceListView from '@/views/namespaces/NamespaceListView.vue';
import PendingMessagesView from '@/views/messages/PendingMessagesView.vue';
import QueueView from '@/views/queues/QueueView.vue';
import ScheduledMessagesView from '@/views/messages/ScheduledMessagesView.vue';
import type { RouteRecordRaw } from 'vue-router';
import PublishedMessagesView from '@/views/messages/PublishedMessagesView.vue';
import NamespaceExchangesView from '@/views/namespaces/NamespaceExchangesView.vue';
import ExchangeView from '@/views/exchanges/ExchangeView.vue';

export const pages: readonly RouteRecordRaw[] = [
  {
    path: '/ns',
    name: 'Namespaces',
    component: NamespaceListView,
    meta: {
      title: 'NamespacesView',
      breadcrumb: 'NamespacesView',
    },
  },
  {
    path: '/ns/:ns/queues',
    name: 'Namespace Queues',
    component: NamespaceQueuesView,
    meta: {
      title: 'Namespace Queues',
      breadcrumb: 'Namespace Queues',
    },
  },
  {
    path: '/ns/:ns/queues/:queue',
    name: 'Queue',
    component: QueueView,
    meta: {
      title: 'Queue Details',
      breadcrumb: 'Queue Details',
    },
  },
  {
    path: '/ns/:ns/queues/:queue/pending-messages',
    name: 'Pending Messages',
    component: PendingMessagesView,
    meta: {
      title: 'Queue Pending Messages',
    },
  },
  {
    path: '/ns/:ns/queues/:queue/acknowledged-messages',
    name: 'Acknowledged Messages',
    component: AcknowledgedMessagesView,
    meta: {
      title: 'Queue Acknowledged Messages',
    },
  },
  {
    path: '/ns/:ns/queues/:queue/dead-lettered-messages',
    name: 'Dead-Lettered Messages',
    component: DeadLetteredMessagesView,
    meta: {
      title: 'Queue Dead-Lettered Messages',
    },
  },
  {
    path: '/ns/:ns/queues/:queue/scheduled-messages',
    name: 'Scheduled Messages',
    component: ScheduledMessagesView,
    meta: {
      title: 'Queue Scheduled Messages',
    },
  },
  {
    path: '/ns/:ns/queues/:queue/messages',
    name: 'Messages',
    component: PublishedMessagesView,
    meta: {
      title: 'Queue Messages',
    },
  },
  {
    path: '/ns/:ns/exchanges',
    name: 'Namespace Exchanges',
    component: NamespaceExchangesView,
    meta: {
      title: 'Namespace Exchanges',
      breadcrumb: 'Namespace Exchanges',
    },
  },
  {
    path: '/ns/:ns/exchanges/:type/:exchange',
    name: 'Exchange Details',
    component: ExchangeView,
    meta: {
      title: 'Exchange Details',
      breadcrumb: 'Exchange Details',
    },
  },
];
