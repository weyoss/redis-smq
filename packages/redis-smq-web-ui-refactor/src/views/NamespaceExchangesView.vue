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
import ExchangeCard from '@/components/exchange/ExchangeCard.vue';
import { useNamespaceExchanges } from '@/composables/useNamespaceExchanges';
import type { PageAction } from '@/components/ui/PageShell.vue';

const route = useRoute();
const ns = computed(() => String(route.params.ns ?? ''));

const exchanges = useNamespaceExchanges(ns);

const isEmpty = computed(
  () =>
    !exchanges.isLoading.value &&
    !exchanges.error.value &&
    exchanges.exchanges.value.length === 0,
);

const actions = computed<PageAction[]>(() => [
  {
    id: 'refresh',
    label: 'Refresh',
    icon: 'bi-arrow-clockwise',
    variant: 'secondary',
    loading: exchanges.isLoading.value,
    onClick: () => exchanges.refetch(),
  },
]);
</script>

<template>
  <PageShell
    :title="`Namespace: ${ns}`"
    subtitle="Exchanges in this namespace"
    icon="bi-folder-fill"
    :actions="actions"
    :loading="exchanges.isLoading.value"
    :error="exchanges.error.value"
    :empty="isEmpty"
    empty-icon="bi-diagram-3"
    empty-title="No exchanges"
    empty-message="Create an exchange by binding a queue."
  >
    <div class="exchange-grid">
      <ExchangeCard
        v-for="ex in exchanges.exchanges.value"
        :key="`${ex.ns}-${ex.name}`"
        :exchange="ex"
      />
    </div>
  </PageShell>
</template>

<style scoped>
.exchange-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: var(--rsmq-space-4);
}
</style>
