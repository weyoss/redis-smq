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
import { usePing } from '@/composables/usePing';

const ping = usePing();

const state = computed<'checking' | 'up' | 'down'>(() => {
  if (ping.isChecking.value) return 'checking';
  return ping.isUp.value ? 'up' : 'down';
});

const label = computed(() => {
  switch (state.value) {
    case 'checking':
      return 'Checking API';
    case 'up':
      return 'API connected';
    case 'down':
    default:
      return 'API unreachable';
  }
});

const tooltip = computed(() => {
  switch (state.value) {
    case 'checking':
      return 'Checking API status…';
    case 'up':
      return ping.uptimeFormatted.value
        ? `API up for ${ping.uptimeFormatted.value} — click to refresh`
        : 'API is reachable — click to refresh';
    case 'down':
    default:
      return `${ping.error.value || 'API is unreachable'} — click to retry`;
  }
});
</script>

<template>
  <button
    type="button"
    class="api-health"
    :class="`api-health--${state}`"
    :title="tooltip"
    :aria-label="`API status: ${label}`"
    @click="ping.refetch()"
  >
    <span class="api-health__dot" aria-hidden="true" />
    <span class="api-health__label">{{ label }}</span>
  </button>
</template>

<style scoped>
.api-health {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 6px;
  background: none;
  border: none;
  border-radius: var(--rsmq-radius-sm);
  color: var(--rsmq-color-text-muted);
  font-size: inherit;
  font-weight: 500;
  cursor: pointer;
  transition:
    background var(--rsmq-transition),
    color var(--rsmq-transition);
}

.api-health:hover {
  background: var(--rsmq-color-bg);
  color: var(--rsmq-color-text);
}

.api-health:focus-visible {
  outline: 2px solid var(--rsmq-color-primary);
  outline-offset: 2px;
}

.api-health__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: background var(--rsmq-transition);
}

.api-health--up .api-health__dot {
  background: var(--rsmq-color-success);
}

.api-health--down .api-health__dot {
  background: var(--rsmq-color-danger);
}

.api-health--checking .api-health__dot {
  background: var(--rsmq-color-warning);
  animation: api-pulse 1.2s ease-in-out infinite;
}

@keyframes api-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
</style>
