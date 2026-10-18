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
import { useNamespaceQueues } from '@/composables/useNamespaceQueues';
import { useNamespaceExchanges } from '@/composables/useNamespaceExchanges';
import { useTypedRouter } from '@/router/typed';

const props = defineProps<{ namespace: string }>();

const router = useTypedRouter();
const queues = useNamespaceQueues(() => props.namespace);
const exchanges = useNamespaceExchanges(() => props.namespace);

const queueCount = computed(() => queues.queues.value.length);
const exchangeCount = computed(() => exchanges.exchanges.value.length);

function openQueues() {
  router.go('namespaceQueues', { ns: props.namespace });
}

function openExchanges() {
  router.go('namespaceExchanges', { ns: props.namespace });
}
</script>

<template>
  <article class="namespace-card">
    <header class="namespace-card__head">
      <div class="namespace-card__icon">
        <i class="bi bi-folder-fill" aria-hidden="true" />
      </div>
      <h3 class="namespace-card__title" :title="namespace">{{ namespace }}</h3>
    </header>
    <div class="namespace-card__body">
      <button type="button" class="namespace-card__stat" @click="openQueues">
        <i class="bi bi-list-ul" aria-hidden="true" />
        <span class="namespace-card__stat-value">{{ queueCount }}</span>
        <span class="namespace-card__stat-label">Queues</span>
      </button>
      <button type="button" class="namespace-card__stat" @click="openExchanges">
        <i class="bi bi-diagram-3" aria-hidden="true" />
        <span class="namespace-card__stat-value">{{ exchangeCount }}</span>
        <span class="namespace-card__stat-label">Exchanges</span>
      </button>
    </div>
  </article>
</template>

<style scoped>
.namespace-card {
  background: var(--rsmq-color-surface);
  border: 1px solid var(--rsmq-color-border);
  border-radius: var(--rsmq-radius-lg);
  box-shadow: var(--rsmq-shadow-sm);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.namespace-card__head {
  display: flex;
  gap: var(--rsmq-space-3);
  padding: var(--rsmq-space-4);
  background: linear-gradient(
    135deg,
    var(--rsmq-color-primary),
    var(--rsmq-color-primary-hover)
  );
  color: white;
  align-items: center;
}
.namespace-card__icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--rsmq-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(255 255 255 / 20%);
  font-size: 1.25rem;
  flex-shrink: 0;
}
.namespace-card__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--rsmq-font-mono);
  min-width: 0;
  flex: 1;
}
.namespace-card__body {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.namespace-card__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--rsmq-space-1);
  padding: var(--rsmq-space-4) var(--rsmq-space-3);
  background: none;
  border: none;
  border-right: 1px solid var(--rsmq-color-border);
  cursor: pointer;
  color: var(--rsmq-color-text);
  transition: background var(--rsmq-transition);
}
.namespace-card__stat:last-child {
  border-right: none;
}
.namespace-card__stat:hover {
  background: var(--rsmq-color-bg);
}
.namespace-card__stat .bi {
  font-size: 1.25rem;
  color: var(--rsmq-color-primary);
}
.namespace-card__stat-value {
  font-size: 1.5rem;
  font-weight: 700;
}
.namespace-card__stat-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--rsmq-color-text-muted);
}
</style>
