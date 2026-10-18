<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed } from 'vue';
import PageShell from '@/components/ui/PageShell.vue';
import Card from '@/components/ui/Card.vue';
import StatCard from '@/components/ui/StatCard.vue';
import StatGrid from '@/components/ui/StatGrid.vue';
import { useListQueues } from '@/composables/useListQueues';
import { useExchanges } from '@/composables/useExchanges';
import { useNamespaces } from '@/composables/useNamespaces';
import { formatNumber } from '@/lib/format';
import type { PageAction } from '@/components/ui/PageShell.vue';

const queues = useListQueues();
const exchanges = useExchanges();
const namespaces = useNamespaces();

const isLoading = computed(
  () =>
    queues.isLoading.value ||
    exchanges.isLoading.value ||
    namespaces.isLoading.value,
);

const error = computed(
  () =>
    queues.error.value ||
    exchanges.error.value ||
    namespaces.error.value ||
    null,
);

const stats = computed(() => [
  {
    id: 'queues',
    label: 'Queues',
    value: formatNumber(queues.queues.value.length),
    icon: 'bi-collection',
    tint: 'primary' as const,
  },
  {
    id: 'exchanges',
    label: 'Exchanges',
    value: formatNumber(exchanges.exchanges.value.length),
    icon: 'bi-diagram-3',
    tint: 'info' as const,
  },
  {
    id: 'namespaces',
    label: 'Namespaces',
    value: formatNumber(namespaces.namespaces.value.length),
    icon: 'bi-folder',
    tint: 'secondary' as const,
  },
]);

const recentQueues = computed(() => queues.sortedQueues.value.slice(0, 8));

const isEmpty = computed(
  () => !isLoading.value && !error.value && queues.queues.value.length === 0,
);

const actions = computed<PageAction[]>(() => [
  {
    id: 'refresh',
    label: 'Refresh',
    icon: 'bi-arrow-clockwise',
    variant: 'secondary',
    loading: isLoading.value,
    onClick: () => {
      queues.refetch();
      exchanges.refetch();
      namespaces.refetch();
    },
  },
]);
</script>

<template>
  <PageShell
    title="Home"
    subtitle="RedisSMQ dashboard"
    icon="bi-house-door"
    :actions="actions"
    :loading="isLoading"
    :error="error"
    :empty="isEmpty"
    empty-icon="bi-rocket"
    empty-title="Nothing here yet"
    empty-message="Create a queue to get started."
  >
    <StatGrid>
      <StatCard v-for="s in stats" :key="s.id" v-bind="s" />
    </StatGrid>

    <Card
      title="Recent queues"
      subtitle="Most recently created queues across all namespaces"
      icon="bi-collection"
      :heading-level="2"
    >
      <ul v-if="recentQueues.length > 0" class="recent">
        <li v-for="q in recentQueues" :key="`${q.ns}-${q.name}`">
          <RouterLink
            :to="{ name: 'queue', params: { ns: q.ns, queue: q.name } }"
            class="recent__link"
          >
            <span class="font-mono">{{ q.name }}</span>
            <span class="recent__ns">{{ q.ns }}</span>
          </RouterLink>
        </li>
      </ul>
      <p v-else class="recent__empty">No queues yet.</p>
    </Card>
  </PageShell>
</template>

<style scoped>
.recent {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--rsmq-space-1);
}
.recent__link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--rsmq-space-2) var(--rsmq-space-3);
  border-radius: var(--rsmq-radius-sm);
  color: var(--rsmq-color-text);
  text-decoration: none;
  font-weight: 500;
  transition: background var(--rsmq-transition);
}
.recent__link:hover {
  background: var(--rsmq-color-primary-tint);
  color: var(--rsmq-color-text);
}
.recent__ns {
  font-size: 0.75rem;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  background: var(--rsmq-color-bg);
  color: var(--rsmq-color-text-muted);
  font-family: var(--rsmq-font-mono);
}
.recent__empty {
  margin: 0;
  color: var(--rsmq-color-text-muted);
}
</style>
