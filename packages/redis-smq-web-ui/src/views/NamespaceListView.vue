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
import NamespaceCard from '@/components/namespace/NamespaceCard.vue';
import { useNamespaces } from '@/composables/useNamespaces';
import type { PageAction } from '@/components/ui/PageShell.vue';

const namespaces = useNamespaces();

const isEmpty = computed(
  () =>
    !namespaces.isLoading.value &&
    !namespaces.error.value &&
    namespaces.namespaces.value.length === 0,
);

const actions = computed<PageAction[]>(() => [
  {
    id: 'refresh',
    label: 'Refresh',
    icon: 'bi-arrow-clockwise',
    variant: 'secondary',
    loading: namespaces.isLoading.value,
    onClick: () => namespaces.refetch(),
  },
]);
</script>

<template>
  <PageShell
    title="Namespaces"
    subtitle="Organize queues and exchanges by namespace"
    icon="bi-folder"
    :actions="actions"
    :loading="namespaces.isLoading.value"
    :error="namespaces.error.value"
    :empty="isEmpty"
    empty-icon="bi-folder-plus"
    empty-title="No namespaces"
    empty-message="Namespaces are created automatically when you add queues or exchanges."
  >
    <div class="namespace-grid">
      <NamespaceCard
        v-for="ns in namespaces.namespaces.value"
        :key="ns"
        :namespace="ns"
      />
    </div>
  </PageShell>
</template>

<style scoped>
.namespace-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--rsmq-space-4);
}
</style>
