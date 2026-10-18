<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import StateBlock from './StateBlock.vue';

defineProps<{
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
}>();
</script>

<template>
  <StateBlock v-if="loading" kind="loading" />

  <StateBlock
    v-else-if="error"
    kind="error"
    icon="bi bi-exclamation-triangle-fill"
    :message="error"
  />

  <StateBlock
    v-else-if="empty"
    kind="empty"
    icon="bi bi-inbox"
    :message="emptyMessage ?? 'No data'"
  />

  <div v-else class="stat-grid">
    <slot />
  </div>
</template>

<style scoped>
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--rsmq-space-3);
}
</style>
