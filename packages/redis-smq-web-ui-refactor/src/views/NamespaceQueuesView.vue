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
import { useRoute } from 'vue-router';
import PageShell from '@/components/ui/PageShell.vue';
import Card from '@/components/ui/Card.vue';
import QueueListItem from '@/components/queue/QueueListItem.vue';
import { useNamespaceQueues } from '@/composables/useNamespaceQueues';
import type { PageAction } from '@/components/ui/PageShell.vue';

const route = useRoute();
const ns = computed(() => String(route.params.ns ?? ''));

const queues = useNamespaceQueues(ns);

const isEmpty = computed(
  () =>
    !queues.isLoading.value &&
    !queues.error.value &&
    queues.queues.value.length === 0,
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
    :title="`Namespace: ${ns}`"
    subtitle="Queues in this namespace"
    icon="bi-folder-fill"
    :actions="actions"
    :loading="queues.isLoading.value"
    :error="queues.error.value"
    :empty="isEmpty"
    empty-icon="bi-inbox"
    empty-title="No queues"
    empty-message="Create a queue in this namespace to get started."
  >
    <Card
      :title="`${queues.queues.value.length} queue${queues.queues.value.length === 1 ? '' : 's'}`"
      icon="bi-list-ul"
      :heading-level="2"
    >
      <QueueListItem
        v-for="q in queues.queues.value"
        :key="`${q.ns}-${q.name}`"
        :queue="q"
      />
    </Card>
  </PageShell>
</template>
