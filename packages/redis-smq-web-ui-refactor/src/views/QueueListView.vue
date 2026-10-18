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
import QueueListItem from '@/components/queue/QueueListItem.vue';
import { useListQueues } from '@/composables/useListQueues';
import type { PageAction } from '@/components/ui/PageShell.vue';

const queues = useListQueues();

const isEmpty = computed(
  () =>
    !queues.isLoading.value &&
    !queues.error.value &&
    queues.sortedQueues.value.length === 0,
);

const actions = computed<PageAction[]>(() => [
  {
    id: 'refresh',
    label: 'Refresh',
    icon: 'bi-arrow-clockwise',
    variant: 'secondary',
    loading: queues.isLoading.value,
    onClick: () => queues.refetch(),
  },
]);
</script>

<template>
  <PageShell
    title="Queues"
    subtitle="Manage all available message queues"
    icon="bi-list-ul"
    :actions="actions"
    :loading="queues.isLoading.value"
    :error="queues.error.value"
    :empty="isEmpty"
    empty-icon="bi-inbox"
    empty-title="No queues"
    empty-message="No queues have been created yet."
  >
    <Card
      :title="`${queues.sortedQueues.value.length} queue${queues.sortedQueues.value.length === 1 ? '' : 's'}`"
      icon="bi-list-ul"
      :heading-level="2"
    >
      <QueueListItem
        v-for="q in queues.sortedQueues.value"
        :key="`${q.ns}-${q.name}`"
        :queue="q"
      />
    </Card>
  </PageShell>
</template>
