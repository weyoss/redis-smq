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
import { useRoute, RouterLink } from 'vue-router';
import type { MessageStatus } from '@/api/model';

const props = defineProps<{ ns: string; queue: string }>();

const route = useRoute();

const TABS: ReadonlyArray<{
  type: MessageStatus;
  label: string;
  icon: string;
}> = [
  { type: 'published', label: 'Published', icon: 'bi-collection' },
  { type: 'scheduled', label: 'Scheduled', icon: 'bi-calendar-plus' },
  { type: 'pending', label: 'Pending', icon: 'bi-clock-history' },
  { type: 'dead-lettered', label: 'Dead-lettered', icon: 'bi-x-octagon' },
  { type: 'acknowledged', label: 'Acknowledged', icon: 'bi-check-circle' },
];

function isValidStatus(v: unknown): v is MessageStatus {
  return (
    v === 'published' ||
    v === 'scheduled' ||
    v === 'pending' ||
    v === 'dead-lettered' ||
    v === 'acknowledged'
  );
}

const activeType = computed<MessageStatus>(() => {
  const v = route.query.type;
  return typeof v === 'string' && isValidStatus(v) ? v : 'published';
});
</script>

<template>
  <nav class="tabs" role="tablist" aria-label="Message types">
    <RouterLink
      v-for="tab in TABS"
      :key="tab.type"
      :to="{
        name: 'messages',
        params: { ns: props.ns, queue: props.queue },
        query: { type: tab.type },
      }"
      class="tabs__link"
      :class="{ 'tabs__link--active': activeType === tab.type }"
      role="tab"
      :aria-selected="activeType === tab.type"
    >
      <i :class="tab.icon" aria-hidden="true" />
      <span>{{ tab.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: var(--rsmq-space-1);
  border-bottom: 1px solid var(--rsmq-color-border);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}
.tabs__link {
  display: inline-flex;
  align-items: center;
  gap: var(--rsmq-space-2);
  padding: var(--rsmq-space-3) var(--rsmq-space-4);
  color: var(--rsmq-color-text-muted);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  white-space: nowrap;
  transition:
    color var(--rsmq-transition),
    border-color var(--rsmq-transition);
}
.tabs__link:hover {
  color: var(--rsmq-color-primary);
}
.tabs__link--active {
  color: var(--rsmq-color-primary);
  border-bottom-color: var(--rsmq-color-primary);
  font-weight: 600;
}
</style>
