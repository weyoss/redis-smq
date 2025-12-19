/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import AcknowledgedMessagesView from '@/views/AcknowledgedMessagesView.vue';
import DeadLetteredMessagesView from '@/views/DeadLetteredMessagesView.vue';
import NamespaceQueuesView from '@/views/NamespaceQueuesView.vue';
import NamespacesView from '@/views/NamespacesView.vue';
import PendingMessagesView from '@/views/PendingMessagesView.vue';
import QueuePropertiesView from '@/views/QueuePropertiesView.vue';
import ScheduledMessagesView from '@/views/ScheduledMessagesView.vue';
import type { RouteRecordRaw } from 'vue-router';
import QueueMessagesView from '@/views/QueueMessagesView.vue';
import ExchangeDirectView from '@/views/ExchangeDirectView.vue';
import ExchangeTopicView from '@/views/ExchangeTopicView.vue';
import ExchangeFanoutViewView from '@/views/ExchangeFanoutView.vue';
import NamespaceExchangesView from '@/views/NamespaceExchangesView.vue';

export const pages: readonly RouteRecordRaw[] = [
  {
    path: '/ns',
    name: 'Namespaces',
    component: NamespacesView,
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
    component: QueuePropertiesView,
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
    component: QueueMessagesView,
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
    path: '/ns/:ns/exchanges/direct/:exchange',
    name: 'Direct Exchange',
    component: ExchangeDirectView,
    meta: {
      title: 'Direct Exchange Details',
      breadcrumb: 'Direct Exchange Details',
    },
  },
  {
    path: '/ns/:ns/exchanges/topic/:exchange',
    name: 'Topic Exchange',
    component: ExchangeTopicView,
    meta: {
      title: 'Topic Exchange Details',
      breadcrumb: 'Topic Exchange Details',
    },
  },
  {
    path: '/ns/:ns/exchanges/fanout/:exchange',
    name: 'Fanout Exchange',
    component: ExchangeFanoutViewView,
    meta: {
      title: 'Fanout Exchange Details',
      breadcrumb: 'Fanout Exchange Details',
    },
  },
];
