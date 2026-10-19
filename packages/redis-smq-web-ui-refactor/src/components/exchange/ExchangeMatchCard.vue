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
import type { IQueueParams } from '@/api/model';
import Card from '@/components/ui/Card.vue';
import StateBlock from '@/components/ui/StateBlock.vue';
import { useExchangeMatch } from '@/composables/useExchangeMatch';
import { EExchangeType, ExchangeTypeLabel } from '@/types/exchanges';

const props = defineProps<{
  ns: string;
  exchange: string;
  type: EExchangeType;
}>();

const isFanout = computed(() => props.type === EExchangeType.FANOUT);
const needsKey = computed(() => !isFanout.value);

const inputKey = ref('');
const submittedKey = ref('');

// Query fires when `submittedKey` (part of the query params) changes,
// or on fanout where routing key is irrelevant.
const match = useExchangeMatch(
  () => props.ns,
  () => props.exchange,
  () => submittedKey.value,
  () => isFanout.value || submittedKey.value.length > 0,
);

const canPreview = computed(
  () =>
    !match.isLoading.value &&
    (!needsKey.value || inputKey.value.trim().length > 0),
);

function preview() {
  const next = inputKey.value.trim();
  if (next === submittedKey.value) {
    // Same input — force a fresh fetch (user may have changed server state).
    if (needsKey.value && next === '') return;
    match.refetch();
    return;
  }
  submittedKey.value = next;
}

const hasRun = computed(() => isFanout.value || submittedKey.value.length > 0);

const results = computed(() => match.queues.value);

const placeholder = computed(() =>
  isFanout.value
    ? 'Fanout — every bound queue receives the message'
    : props.type === EExchangeType.DIRECT
      ? 'e.g. user.created'
      : 'e.g. user.* or orders.#',
);
</script>

<template>
  <Card
    title="Match preview"
    subtitle="Which queues would receive a message with this routing key?"
    icon="bi-search"
    :heading-level="2"
  >
    <form class="mp-form" @submit.prevent="preview">
      <div class="mp-form__field">
        <label for="mp-routing-key" class="form-label">
          Routing key
          <span v-if="needsKey" class="mp-form__hint">
            ({{ ExchangeTypeLabel[type] }} requires one)
          </span>
        </label>
        <div class="mp-form__row">
          <input
            id="mp-routing-key"
            v-model="inputKey"
            type="text"
            class="form-control font-mono"
            :placeholder="placeholder"
            :disabled="isFanout || match.isLoading.value"
          />
          <button type="submit" class="btn btn-primary" :disabled="!canPreview">
            <i class="bi bi-search me-1" aria-hidden="true" />
            {{ match.isLoading.value ? 'Checking…' : 'Preview' }}
          </button>
        </div>
      </div>
    </form>

    <StateBlock v-if="match.isLoading.value" kind="loading" />
    <StateBlock
      v-else-if="match.error.value"
      kind="error"
      icon="bi-exclamation-triangle-fill"
      :message="match.error.value"
    />
    <div v-else-if="!hasRun" class="mp-idle">
      <i class="bi bi-info-circle" aria-hidden="true" />
      <p>
        {{
          isFanout
            ? 'Click Preview to list all queues this fanout exchange broadcasts to.'
            : 'Enter a routing key and click Preview to see the matching queues.'
        }}
      </p>
    </div>
    <StateBlock
      v-else-if="results.length === 0"
      kind="empty"
      icon="bi-slash-circle"
      title="No matches"
      :message="`No queues would receive a message with routing key '${submittedKey}'.`"
    />
    <div v-else class="mp-results">
      <p class="mp-results__summary">
        <i
          class="bi bi-check-circle-fill text-success me-1"
          aria-hidden="true"
        />
        {{ results.length }}
        {{
          results.length === 1 ? 'queue would receive' : 'queues would receive'
        }}
        this message
      </p>
      <ul class="mp-results__list">
        <li
          v-for="q in results"
          :key="`${q.ns}-${q.name}`"
          class="mp-results__item"
        >
          <i class="bi bi-collection" aria-hidden="true" />
          <span class="font-mono">{{ q.name }}</span>
          <span class="mp-results__ns">{{ q.ns }}</span>
        </li>
      </ul>
    </div>
  </Card>
</template>

<style scoped>
.mp-form {
  margin-bottom: var(--rsmq-space-4);
}
.mp-form__field {
  margin: 0;
}
.mp-form__hint {
  color: var(--rsmq-color-text-muted);
  font-weight: 400;
  font-size: 0.75rem;
  margin-left: 4px;
}
.mp-form__row {
  display: flex;
  gap: var(--rsmq-space-2);
  align-items: stretch;
}
.mp-form__row .form-control {
  flex: 1;
  min-width: 0;
}

.mp-idle {
  display: flex;
  align-items: flex-start;
  gap: var(--rsmq-space-2);
  padding: var(--rsmq-space-3);
  background: var(--rsmq-color-bg);
  border-radius: var(--rsmq-radius-sm);
  font-size: 0.85rem;
  color: var(--rsmq-color-text-muted);
}
.mp-idle p {
  margin: 0;
  line-height: 1.5;
}

.mp-results__summary {
  margin: 0 0 var(--rsmq-space-3);
  font-size: 0.9rem;
  color: var(--rsmq-color-text);
}
.mp-results__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--rsmq-space-1);
}
.mp-results__item {
  display: flex;
  align-items: center;
  gap: var(--rsmq-space-2);
  padding: var(--rsmq-space-2) var(--rsmq-space-3);
  background: var(--rsmq-color-bg);
  border-radius: var(--rsmq-radius-sm);
  font-size: 0.85rem;
}
.mp-results__item .bi {
  color: var(--rsmq-color-primary);
  flex-shrink: 0;
}
.mp-results__item > span:nth-child(2) {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mp-results__ns {
  font-size: 0.7rem;
  padding: 0.1rem 0.4rem;
  border-radius: var(--rsmq-radius-sm);
  background: var(--rsmq-color-surface);
  color: var(--rsmq-color-text-muted);
  font-family: var(--rsmq-font-mono);
  flex-shrink: 0;
}

@media (max-width: 576px) {
  .mp-form__row {
    flex-direction: column;
  }
  .mp-form__row .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
