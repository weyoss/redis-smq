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
import type { IQueueParams, IQueueStateTransition } from '@/api/model';
import Card from '@/components/ui/Card.vue';
import StateBlock from '@/components/ui/StateBlock.vue';
import { useQueueStateHistory } from '@/composables/useQueueStateHistory';
import { EQueueOperationalState } from '@/types/queues';
import { formatDate, formatSince } from '@/lib/format';

const props = defineProps<{ queue: IQueueParams }>();

const history = useQueueStateHistory(() => props.queue);

const STATE_LABELS: Record<number, string> = {
  [EQueueOperationalState.ACTIVE]: 'Active',
  [EQueueOperationalState.PAUSED]: 'Paused',
  [EQueueOperationalState.STOPPED]: 'Stopped',
  [EQueueOperationalState.LOCKED]: 'Locked',
};

function stateLabel(s: number | null): string {
  return s == null ? '—' : (STATE_LABELS[s] ?? String(s));
}

function humanizeReason(r: string): string {
  return r
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

function fromTint(s: number | null): string {
  if (s === EQueueOperationalState.ACTIVE) return 'success';
  if (s === EQueueOperationalState.PAUSED) return 'warning';
  if (s === EQueueOperationalState.STOPPED) return 'danger';
  if (s === EQueueOperationalState.LOCKED) return 'secondary';
  return 'secondary';
}

const items = computed<IQueueStateTransition[]>(() => history.history.value);
</script>

<template>
  <Card
    title="Operational state history"
    subtitle="State transitions for this queue"
    icon="bi-clock-history"
    :heading-level="2"
  >
    <template #actions>
      <button
        type="button"
        class="btn btn-refresh btn-icon"
        :disabled="history.isLoading.value"
        title="Refresh"
        @click="history.refetch()"
      >
        <i
          class="bi bi-arrow-clockwise"
          :class="{ spin: history.isLoading.value }"
        />
      </button>
    </template>

    <StateBlock v-if="history.isLoading.value" kind="loading" />
    <StateBlock
      v-else-if="history.error.value"
      kind="error"
      icon="bi-exclamation-triangle-fill"
      :message="history.error.value"
    />
    <StateBlock
      v-else-if="items.length === 0"
      kind="empty"
      icon="bi-clock-history"
      title="No history yet"
      message="State changes will appear here."
    />
    <ol v-else class="timeline">
      <li
        v-for="(item, idx) in items"
        :key="`${item.timestamp}-${idx}`"
        class="timeline__item"
      >
        <div
          class="timeline__marker"
          :class="`timeline__marker--${fromTint(item.to)}`"
        >
          <i class="bi bi-arrow-right" aria-hidden="true" />
        </div>
        <div class="timeline__body">
          <div class="timeline__head">
            <span
              class="state-badge"
              :class="`state-badge--${fromTint(item.from)}`"
            >
              {{ stateLabel(item.from) }}
            </span>
            <i class="bi bi-arrow-right state-arrow" aria-hidden="true" />
            <span
              class="state-badge"
              :class="`state-badge--${fromTint(item.to)}`"
            >
              {{ stateLabel(item.to) }}
            </span>
            <span class="timeline__time" :title="formatDate(item.timestamp)">
              {{ formatSince(item.timestamp) }}
            </span>
          </div>
          <p class="timeline__reason">{{ humanizeReason(item.reason) }}</p>
          <p v-if="item.description" class="timeline__desc">
            {{ item.description }}
          </p>
        </div>
      </li>
    </ol>
  </Card>
</template>

<style scoped>
.timeline {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--rsmq-space-3);
}
.timeline__item {
  display: flex;
  gap: var(--rsmq-space-3);
  align-items: flex-start;
}
.timeline__marker {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 0.85rem;
  color: white;
}
.timeline__marker--success {
  background: var(--rsmq-color-success);
}
.timeline__marker--warning {
  background: var(--rsmq-color-warning);
}
.timeline__marker--danger {
  background: var(--rsmq-color-danger);
}
.timeline__marker--secondary {
  background: var(--rsmq-color-text-muted);
}
.timeline__body {
  flex: 1;
  min-width: 0;
  background: var(--rsmq-color-bg);
  border-radius: var(--rsmq-radius-sm);
  padding: var(--rsmq-space-3);
}
.timeline__head {
  display: flex;
  align-items: center;
  gap: var(--rsmq-space-2);
  flex-wrap: wrap;
  margin-bottom: var(--rsmq-space-1);
}
.state-badge {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  padding: 0.15rem 0.5rem;
  border-radius: var(--rsmq-radius-sm);
}
.state-badge--success {
  background: #d4edda;
  color: #155724;
}
.state-badge--warning {
  background: #fff3cd;
  color: #856404;
}
.state-badge--danger {
  background: #f8d7da;
  color: #721c24;
}
.state-badge--secondary {
  background: var(--rsmq-color-surface);
  color: var(--rsmq-color-text-muted);
}
.state-arrow {
  color: var(--rsmq-color-text-subtle);
  font-size: 0.75rem;
}
.timeline__time {
  margin-left: auto;
  font-size: 0.75rem;
  color: var(--rsmq-color-text-muted);
}
.timeline__reason {
  margin: 0;
  font-size: 0.85rem;
  color: var(--rsmq-color-text);
  font-weight: 500;
}
.timeline__desc {
  margin: var(--rsmq-space-1) 0 0;
  font-size: 0.8rem;
  color: var(--rsmq-color-text-muted);
  overflow-wrap: anywhere;
}
</style>
