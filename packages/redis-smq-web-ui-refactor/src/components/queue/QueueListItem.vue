<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import type { IQueueParams } from '@/api/model';

defineProps<{ queue: IQueueParams }>();
</script>

<template>
  <RouterLink
    :to="{ name: 'queue', params: { ns: queue.ns, queue: queue.name } }"
    class="queue-row"
  >
    <span class="queue-row__icon" aria-hidden="true">
      <i class="bi bi-collection" />
    </span>
    <span class="queue-row__name font-mono">{{ queue.name }}</span>
    <span class="queue-row__ns">{{ queue.ns }}</span>
    <i class="bi bi-chevron-right queue-row__chevron" aria-hidden="true" />
  </RouterLink>
</template>

<style scoped>
.queue-row {
  display: flex;
  align-items: center;
  gap: var(--rsmq-space-3);
  padding: var(--rsmq-space-3) var(--rsmq-space-4);
  border-radius: var(--rsmq-radius-md);
  color: var(--rsmq-color-text);
  text-decoration: none;
  transition: background var(--rsmq-transition);
}
.queue-row:hover {
  background: var(--rsmq-color-primary-tint);
  color: var(--rsmq-color-text);
}
.queue-row__icon {
  width: 2rem;
  height: 2rem;
  border-radius: var(--rsmq-radius-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--rsmq-color-primary-tint);
  color: var(--rsmq-color-primary);
  flex-shrink: 0;
}
.queue-row__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}
.queue-row__ns {
  font-size: 0.75rem;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  background: var(--rsmq-color-bg);
  color: var(--rsmq-color-text-muted);
  font-weight: 500;
  font-family: var(--rsmq-font-mono);
  flex-shrink: 0;
}
.queue-row__chevron {
  color: var(--rsmq-color-text-subtle);
  flex-shrink: 0;
}
</style>
