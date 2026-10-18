<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed, ref } from 'vue';
import PageShell from '@/components/ui/PageShell.vue';
import Card from '@/components/ui/Card.vue';
import QueueListItem from '@/components/queue/QueueListItem.vue';
import CreateQueueModal from '@/components/modals/CreateQueueModal.vue';
import { useListQueues } from '@/composables/useListQueues';
import { useTypedRouter } from '@/router/typed';
import type { IQueueParams } from '@/api/model';
import type { PageAction } from '@/components/ui/PageShell.vue';

const router = useTypedRouter();
const queues = useListQueues();

const showCreate = ref(false);

const isEmpty = computed(
  () =>
    !queues.isLoading.value &&
    !queues.error.value &&
    queues.sortedQueues.value.length === 0,
);

function openCreate() {
  showCreate.value = true;
}

function onCreated(params: IQueueParams) {
  showCreate.value = false;
  queues.refetch();
  router.go('queue', { ns: params.ns, queue: params.name });
}

const actions = computed<PageAction[]>(() => [
  {
    id: 'create',
    label: 'Create queue',
    icon: 'bi-plus-lg',
    variant: 'primary',
    onClick: openCreate,
  },
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
    empty-message="Create your first queue to start producing and consuming messages."
    empty-action-label="Create queue"
    :on-empty-action="openCreate"
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
        @deleted="queues.refetch()"
      />
    </Card>
  </PageShell>

  <CreateQueueModal
    :is-visible="showCreate"
    @close="showCreate = false"
    @created="onCreated"
  />
</template>
