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
import type { IQueueParams } from '@/api/model';
import Card from '@/components/ui/Card.vue';
import StateBlock from '@/components/ui/StateBlock.vue';
import { useQueueConsumers } from '@/composables/useQueueConsumers';
import { formatDate, formatSince } from '@/lib/format';

const props = defineProps<{ queue: IQueueParams }>();

const consumers = useQueueConsumers(() => props.queue);

const rows = computed(() => consumers.consumers.value);
const count = computed(() => rows.value.length);
</script>

<template>
  <Card
    title="Active consumers"
    subtitle="Consumers currently connected to this queue"
    icon="bi-people-fill"
    :heading-level="2"
  >
    <template #actions>
      <span
        class="consumer-count"
        :class="{ 'consumer-count--empty': count === 0 }"
        :aria-label="`${count} active ${count === 1 ? 'consumer' : 'consumers'}`"
      >
        <i class="bi bi-people-fill" aria-hidden="true" />
        <span class="consumer-count__num">{{ count }}</span>
        <span class="consumer-count__label">
          {{ count === 1 ? 'consumer' : 'consumers' }}
        </span>
      </span>
      <button
        type="button"
        class="btn btn-refresh btn-icon"
        :disabled="consumers.isLoading.value"
        title="Refresh"
        @click="consumers.refetch()"
      >
        <i
          class="bi bi-arrow-clockwise"
          :class="{ spin: consumers.isLoading.value }"
        />
      </button>
    </template>

    <StateBlock v-if="consumers.isLoading.value" kind="loading" />
    <StateBlock
      v-else-if="consumers.error.value"
      kind="error"
      icon="bi-exclamation-triangle-fill"
      :message="consumers.error.value"
    />
    <StateBlock
      v-else-if="rows.length === 0"
      kind="empty"
      icon="bi-people"
      title="No active consumers"
      message="Start a consumer application to connect to this queue."
    />
    <ul v-else class="consumer-list">
      <li v-for="c in rows" :key="c.id" class="consumer-list__row">
        <div class="consumer-list__main">
          <div class="consumer-list__id font-mono" :title="c.id">
            {{ c.id }}
          </div>
          <div class="consumer-list__meta">
            <span>
              <i class="bi bi-hdd-network me-1" aria-hidden="true" />
              {{ c.hostname }}
            </span>
            <span>
              <i class="bi bi-cpu me-1" aria-hidden="true" />
              PID {{ c.pid }}
            </span>
            <span :title="formatDate(c.createdAt)">
              <i class="bi bi-clock me-1" aria-hidden="true" />
              {{ formatSince(c.createdAt) }}
            </span>
          </div>
        </div>
        <div class="consumer-list__ips">
          <span v-for="ip in c.ipAddress" :key="ip" class="ip-badge">
            {{ ip }}
          </span>
        </div>
      </li>
    </ul>
  </Card>
</template>

<style scoped>
/* Align the count chip and the icon button on the same baseline */
:deep(.ui-card__actions) {
  align-items: center;
}

/* Count chip */
.consumer-count {
  display: inline-flex;
  align-items: center;
  gap: var(--rsmq-space-1);
  padding: var(--rsmq-space-1) var(--rsmq-space-3);
  border-radius: 999px;
  background: var(--rsmq-color-primary-tint);
  color: var(--rsmq-color-primary);
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  transition:
    background var(--rsmq-transition),
    color var(--rsmq-transition);
}

.consumer-count .bi {
  font-size: 0.85rem;
}

.consumer-count__num {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.consumer-count__label {
  font-weight: 500;
}

.consumer-count--empty {
  background: var(--rsmq-color-bg);
  color: var(--rsmq-color-text-muted);
}

/* Consumer list */
.consumer-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--rsmq-space-2);
}

.consumer-list__row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--rsmq-space-3);
  padding: var(--rsmq-space-3);
  background: var(--rsmq-color-bg);
  border-radius: var(--rsmq-radius-md);
  flex-wrap: wrap;
}

.consumer-list__main {
  min-width: 0;
  flex: 1;
}

.consumer-list__id {
  font-weight: 600;
  font-size: 0.85rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.consumer-list__meta {
  display: flex;
  gap: var(--rsmq-space-4);
  font-size: 0.75rem;
  color: var(--rsmq-color-text-muted);
  margin-top: var(--rsmq-space-1);
  flex-wrap: wrap;
}

.consumer-list__ips {
  display: flex;
  gap: var(--rsmq-space-1);
  flex-wrap: wrap;
}

.ip-badge {
  font-size: 0.7rem;
  padding: 0.15rem 0.5rem;
  background: var(--rsmq-color-surface);
  border: 1px solid var(--rsmq-color-border);
  border-radius: var(--rsmq-radius-sm);
  font-family: var(--rsmq-font-mono);
  color: var(--rsmq-color-text-muted);
}

@media (max-width: 576px) {
  .consumer-list__row {
    flex-direction: column;
  }
}
</style>
