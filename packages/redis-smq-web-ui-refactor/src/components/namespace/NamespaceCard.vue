<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useNamespaceQueues } from '@/composables/useNamespaceQueues';
import { useNamespaceExchanges } from '@/composables/useNamespaceExchanges';
import { useDeleteNamespace } from '@/composables/useDeleteNamespace';
import { useTypedRouter } from '@/router/typed';
import ConfirmationModal from '@/components/modals/ConfirmationModal.vue';

const props = defineProps<{ namespace: string }>();

const router = useTypedRouter();
const queues = useNamespaceQueues(() => props.namespace);
const exchanges = useNamespaceExchanges(() => props.namespace);
const del = useDeleteNamespace();

const queueCount = computed(() => queues.queues.value.length);
const exchangeCount = computed(() => exchanges.exchanges.value.length);

const showDelete = ref(false);

watch(showDelete, (v) => {
  if (v) del.reset();
});

function openQueues() {
  router.go('namespaceQueues', { ns: props.namespace });
}

function openExchanges() {
  router.go('namespaceExchanges', { ns: props.namespace });
}

function openDelete() {
  showDelete.value = true;
}

async function onConfirmDelete() {
  try {
    await del.remove(props.namespace);
    showDelete.value = false;
  } catch {
    // error renders inline in the modal; keep it open so the user can retry
  }
}
</script>

<template>
  <article class="namespace-card">
    <header class="namespace-card__head">
      <div class="namespace-card__icon">
        <i class="bi bi-folder-fill" aria-hidden="true" />
      </div>
      <h3 class="namespace-card__title" :title="namespace">{{ namespace }}</h3>
      <button
        type="button"
        class="namespace-card__delete"
        :aria-label="`Delete namespace ${namespace}`"
        title="Delete namespace"
        @click="openDelete"
      >
        <i class="bi bi-trash" aria-hidden="true" />
      </button>
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

    <ConfirmationModal
      :is-visible="showDelete"
      title="Delete namespace"
      subtitle="This action cannot be undone"
      icon="bi-exclamation-triangle"
      :message="`Delete namespace '${namespace}'?`"
      confirm-label="Delete namespace"
      confirm-variant="danger"
      :is-pending="del.isPending.value"
      :error="del.error.value"
      @close="showDelete = false"
      @confirm="onConfirmDelete"
    >
      <template #extra>
        <div class="ns-summary">
          <p class="ns-summary__counts">
            Contains
            <strong
              >{{ queueCount }} queue{{ queueCount === 1 ? '' : 's' }}</strong
            >
            and
            <strong
              >{{ exchangeCount }} exchange{{
                exchangeCount === 1 ? '' : 's'
              }}</strong
            >.
          </p>
          <p class="ns-summary__warning">
            <i class="bi bi-info-circle" aria-hidden="true" />
            The namespace must be empty before deletion. All queues must be
            message-free with no active consumers, and no exchange may have
            bound queues — otherwise the server will reject the request.
          </p>
        </div>
      </template>
    </ConfirmationModal>
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

.namespace-card__delete {
  background: rgb(255 255 255 / 0%);
  border: none;
  color: rgb(255 255 255 / 75%);
  padding: 4px;
  border-radius: var(--rsmq-radius-sm);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    background var(--rsmq-transition),
    color var(--rsmq-transition);
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  -webkit-tap-highlight-color: transparent;
}

.namespace-card__delete:hover {
  background: rgb(255 255 255 / 20%);
  color: white;
}

.namespace-card__delete:focus-visible {
  outline: 2px solid white;
  outline-offset: 2px;
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

.namespace-card__stat:focus-visible {
  outline: 2px solid var(--rsmq-color-primary);
  outline-offset: -2px;
}

.namespace-card__stat .bi {
  font-size: 1.25rem;
  color: var(--rsmq-color-primary);
}

.namespace-card__stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.namespace-card__stat-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--rsmq-color-text-muted);
}

/* Modal extras */
.ns-summary {
  margin-top: var(--rsmq-space-3);
  padding: var(--rsmq-space-3);
  background: var(--rsmq-color-bg);
  border-radius: var(--rsmq-radius-sm);
  font-size: 0.85rem;
}

.ns-summary__counts {
  margin: 0 0 var(--rsmq-space-2);
  color: var(--rsmq-color-text);
}

.ns-summary__counts strong {
  font-variant-numeric: tabular-nums;
}

.ns-summary__warning {
  margin: 0;
  display: flex;
  align-items: flex-start;
  gap: var(--rsmq-space-2);
  color: var(--rsmq-color-text-muted);
  line-height: 1.5;
}

.ns-summary__warning .bi {
  color: var(--rsmq-color-warning);
  flex-shrink: 0;
  margin-top: 2px;
}
</style>
