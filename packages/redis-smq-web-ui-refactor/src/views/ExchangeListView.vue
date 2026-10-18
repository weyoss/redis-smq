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
import ExchangeCard from '@/components/exchange/ExchangeCard.vue';
import BindQueueModal from '@/components/modals/BindQueueModal.vue';
import { useExchanges } from '@/composables/useExchanges';
import type { PageAction } from '@/components/ui/PageShell.vue';

const exchanges = useExchanges();
const showCreate = ref(false);

const isEmpty = computed(
  () =>
    !exchanges.isLoading.value &&
    !exchanges.error.value &&
    exchanges.exchanges.value.length === 0,
);

const actions = computed<PageAction[]>(() => [
  {
    id: 'create',
    label: 'Create exchange',
    icon: 'bi-plus-lg',
    variant: 'primary',
    onClick: () => (showCreate.value = true),
  },
  {
    id: 'refresh',
    label: 'Refresh',
    icon: 'bi-arrow-clockwise',
    variant: 'secondary',
    loading: exchanges.isLoading.value,
    onClick: () => exchanges.refetch(),
  },
]);

function onCreated() {
  showCreate.value = false;
  exchanges.refetch();
}

function openCreate() {
  showCreate.value = true;
}
</script>

<template>
  <PageShell
    title="Exchanges"
    subtitle="View and manage message exchanges across all namespaces"
    icon="bi-diagram-3"
    :actions="actions"
    :loading="exchanges.isLoading.value"
    :error="exchanges.error.value"
    :empty="isEmpty"
    empty-icon="bi-diagram-3"
    empty-title="No exchanges"
    empty-message="Create an exchange to route messages to queues."
    empty-action-label="Create exchange"
    :on-empty-action="openCreate"
  >
    <div class="exchange-grid">
      <ExchangeCard
        v-for="ex in exchanges.exchanges.value"
        :key="`${ex.ns}-${ex.name}`"
        :exchange="ex"
      />
    </div>
  </PageShell>

  <BindQueueModal
    :is-visible="showCreate"
    :exchange="null"
    @close="showCreate = false"
    @success="onCreated"
  />
</template>

<style scoped>
.exchange-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: var(--rsmq-space-4);
}
</style>
