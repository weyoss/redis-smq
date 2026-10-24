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
import { useQueueExchanges } from '@/composables/useQueueExchanges';
import { useTypedRouter } from '@/router/typed';
import {
  EExchangeType,
  ExchangeTypeIcon,
  ExchangeTypeLabel,
  ExchangeTypeString,
} from '@/types/exchanges';

const props = defineProps<{ queue: IQueueParams }>();

const router = useTypedRouter();
const exchanges = useQueueExchanges(() => props.queue);

const rows = computed(() => exchanges.exchanges.value);

function open(name: string, ns: string) {
  router.go('exchangeDetails', { ns, exchange: name });
}

function typeSlug(t: EExchangeType): string {
  return ExchangeTypeString[t];
}
</script>

<template>
  <Card
    title="Bound exchanges"
    subtitle="Exchanges that route messages to this queue"
    icon="bi-diagram-3"
    :heading-level="2"
  >
    <template #actions>
      <span
        class="exchange-count"
        :class="{ 'exchange-count--empty': rows.length === 0 }"
        :aria-label="`${rows.length} ${rows.length === 1 ? 'bound exchange' : 'bound exchanges'}`"
      >
        <i class="bi bi-diagram-3" aria-hidden="true" />
        <span class="exchange-count__num">{{ rows.length }}</span>
        <span class="exchange-count__label">
          {{ rows.length === 1 ? 'exchange' : 'exchanges' }}
        </span>
      </span>
      <button
        type="button"
        class="btn btn-refresh btn-icon"
        :disabled="exchanges.isLoading.value"
        title="Refresh"
        @click="exchanges.refetch()"
      >
        <i
          class="bi bi-arrow-clockwise"
          :class="{ spin: exchanges.isLoading.value }"
        />
      </button>
    </template>

    <StateBlock v-if="exchanges.isLoading.value" kind="loading" />
    <StateBlock
      v-else-if="exchanges.error.value"
      kind="error"
      icon="bi-exclamation-triangle-fill"
      :message="exchanges.error.value"
    />
    <StateBlock
      v-else-if="rows.length === 0"
      kind="empty"
      icon="bi-diagram-3"
      title="Not bound to any exchange"
      message="Messages reach this queue only via direct publish. Bind it to an exchange to route traffic from producers."
    />
    <ul v-else class="exchange-list">
      <li v-for="ex in rows" :key="`${ex.ns}-${ex.name}`">
        <button
          type="button"
          class="exchange-row"
          :aria-label="`View exchange ${ex.name}@${ex.ns}`"
          @click="open(ex.name, ex.ns)"
        >
          <span
            class="exchange-row__icon"
            :class="`exchange-row__icon--${typeSlug(ex.type)}`"
            aria-hidden="true"
          >
            <i :class="ExchangeTypeIcon[ex.type]" />
          </span>
          <span class="exchange-row__body">
            <span class="exchange-row__name font-mono">{{ ex.name }}</span>
            <span class="exchange-row__meta">
              <span class="exchange-row__type">
                {{ ExchangeTypeLabel[ex.type] }}
              </span>
              <span class="exchange-row__ns">{{ ex.ns }}</span>
            </span>
          </span>
          <i
            class="bi bi-chevron-right exchange-row__chevron"
            aria-hidden="true"
          />
        </button>
      </li>
    </ul>
  </Card>
</template>

<style scoped>
/* Align count chip and refresh button on the same baseline */
:deep(.ui-card__actions) {
  align-items: center;
}

.exchange-count {
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
.exchange-count .bi {
  font-size: 0.85rem;
}
.exchange-count__num {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.exchange-count__label {
  font-weight: 500;
}
.exchange-count--empty {
  background: var(--rsmq-color-bg);
  color: var(--rsmq-color-text-muted);
}

.exchange-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--rsmq-space-1);
}

.exchange-row {
  display: flex;
  align-items: center;
  gap: var(--rsmq-space-3);
  width: 100%;
  padding: var(--rsmq-space-3) var(--rsmq-space-3);
  background: none;
  border: 1px solid transparent;
  border-radius: var(--rsmq-radius-md);
  cursor: pointer;
  text-align: left;
  color: var(--rsmq-color-text);
  transition:
    background var(--rsmq-transition),
    border-color var(--rsmq-transition);
}
.exchange-row:hover {
  background: var(--rsmq-color-primary-tint);
  border-color: var(--rsmq-color-primary);
}
.exchange-row:focus-visible {
  outline: 2px solid var(--rsmq-color-primary);
  outline-offset: 2px;
}

.exchange-row__icon {
  width: 2rem;
  height: 2rem;
  border-radius: var(--rsmq-radius-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}
.exchange-row__icon--direct {
  background: #cff4fc;
  color: #055160;
}
.exchange-row__icon--fanout {
  background: #d1e7dd;
  color: #0f5132;
}
.exchange-row__icon--topic {
  background: #e2d9f3;
  color: #5a2a94;
}

.exchange-row__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.exchange-row__name {
  font-weight: 600;
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.exchange-row__meta {
  display: flex;
  align-items: center;
  gap: var(--rsmq-space-2);
  flex-wrap: wrap;
  font-size: 0.75rem;
  color: var(--rsmq-color-text-muted);
}

.exchange-row__type {
  font-weight: 500;
}

.exchange-row__ns {
  font-size: 0.7rem;
  padding: 0.1rem 0.4rem;
  border-radius: var(--rsmq-radius-sm);
  background: var(--rsmq-color-surface);
  color: var(--rsmq-color-text-muted);
  font-family: var(--rsmq-font-mono);
  border: 1px solid var(--rsmq-color-border);
}

.exchange-row__chevron {
  color: var(--rsmq-color-text-subtle);
  flex-shrink: 0;
}
</style>
