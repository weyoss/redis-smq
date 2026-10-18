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
import type { IExchangeParsedParams } from '@/api/model';
import { useExchangeBindings } from '@/composables/useExchangeBindings';
import { useTypedRouter } from '@/router/typed';
import {
  EExchangeType,
  ExchangeTypeIcon,
  ExchangeTypeLabel,
} from '@/types/exchanges';
import BindQueueModal from '@/components/modals/BindQueueModal.vue';
import UnbindQueueModal from '@/components/modals/UnbindQueueModal.vue';

const props = defineProps<{ exchange: IExchangeParsedParams }>();

const router = useTypedRouter();
const bindings = useExchangeBindings(() => props.exchange);

const showBind = ref(false);
const unbindTarget = ref<{ queueName: string; bindingKey?: string } | null>(
  null,
);

const icon = computed(() => ExchangeTypeIcon[props.exchange.type]);
const typeLabel = computed(() => ExchangeTypeLabel[props.exchange.type]);
const typeSlug = computed(() => typeLabel.value.toLowerCase());

const samples = computed(() => {
  const flat: Array<{ queueName: string; bindingKey?: string }> = [];
  for (const b of bindings.bindings.value) {
    for (const q of b.queues) {
      flat.push({
        queueName: q.name,
        bindingKey: b.key === '_all' ? undefined : b.key,
      });
    }
  }
  return flat.slice(0, 3);
});

const moreCount = computed(() =>
  Math.max(0, bindings.totalQueues.value - samples.value.length),
);

function openDetail() {
  router.go('exchangeDetails', {
    ns: props.exchange.ns,
    exchange: props.exchange.name,
  });
}

function onBindSuccess() {
  showBind.value = false;
  bindings.refetch();
}

function onUnbindSuccess() {
  unbindTarget.value = null;
  bindings.refetch();
}

const exchangeForModal = computed(() => ({
  name: props.exchange.name,
  type: props.exchange.type,
}));
</script>

<template>
  <article class="exchange-card">
    <header class="exchange-card__head">
      <div
        class="exchange-card__icon"
        :class="`exchange-card__icon--${typeSlug}`"
      >
        <i :class="icon" aria-hidden="true" />
      </div>
      <div class="exchange-card__title-block">
        <h3 class="exchange-card__title" :title="exchange.name">
          {{ exchange.name }}
        </h3>
        <p class="exchange-card__subtitle">
          {{ typeLabel }} · {{ exchange.ns }}
        </p>
      </div>
    </header>

    <div class="exchange-card__body">
      <div v-if="bindings.isLoading.value" class="exchange-card__state">
        <span class="spinner-border spinner-border-sm" aria-hidden="true" />
      </div>
      <div
        v-else-if="bindings.error.value"
        class="exchange-card__state exchange-card__state--error"
      >
        {{ bindings.error.value }}
      </div>
      <template v-else>
        <p class="exchange-card__stat">
          <strong>{{ bindings.totalQueues.value }}</strong>
          bound {{ bindings.totalQueues.value === 1 ? 'queue' : 'queues' }}
        </p>
        <ul v-if="samples.length > 0" class="exchange-card__bindings">
          <li
            v-for="b in samples"
            :key="`${b.queueName}-${b.bindingKey ?? ''}`"
          >
            <i class="bi bi-collection" aria-hidden="true" />
            <span class="font-mono exchange-card__qname">{{
              b.queueName
            }}</span>
            <span
              v-if="b.bindingKey"
              class="exchange-card__key"
              :title="b.bindingKey"
              >{{ b.bindingKey }}</span
            >
            <button
              type="button"
              class="btn btn-icon btn-outline-danger exchange-card__unbind"
              title="Unbind"
              aria-label="Unbind"
              @click="unbindTarget = b"
            >
              <i class="bi bi-x" aria-hidden="true" />
            </button>
          </li>
          <li v-if="moreCount > 0" class="exchange-card__more">
            +{{ moreCount }} more
          </li>
        </ul>
        <p v-else class="exchange-card__state">No queues bound.</p>
      </template>
    </div>

    <footer class="exchange-card__foot">
      <button
        type="button"
        class="btn btn-sm btn-outline-secondary"
        @click="showBind = true"
      >
        <i class="bi bi-link-45deg me-1" aria-hidden="true" />
        Bind queue
      </button>
      <button type="button" class="btn btn-sm btn-primary" @click="openDetail">
        View details
        <i class="bi bi-arrow-right ms-1" aria-hidden="true" />
      </button>
    </footer>

    <BindQueueModal
      :is-visible="showBind"
      :namespace="exchange.ns"
      :exchange="exchangeForModal"
      @close="showBind = false"
      @success="onBindSuccess"
    />

    <UnbindQueueModal
      :is-visible="!!unbindTarget"
      :namespace="exchange.ns"
      :exchange="exchangeForModal"
      :queue-name="unbindTarget?.queueName ?? ''"
      :binding-key="unbindTarget?.bindingKey"
      @close="unbindTarget = null"
      @success="onUnbindSuccess"
    />
  </article>
</template>

<style scoped>
.exchange-card {
  background: var(--rsmq-color-surface);
  border: 1px solid var(--rsmq-color-border);
  border-radius: var(--rsmq-radius-lg);
  box-shadow: var(--rsmq-shadow-sm);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.exchange-card__head {
  display: flex;
  gap: var(--rsmq-space-3);
  padding: var(--rsmq-space-4);
  border-bottom: 1px solid var(--rsmq-color-border);
  background: linear-gradient(
    135deg,
    var(--rsmq-color-bg),
    var(--rsmq-color-surface)
  );
}
.exchange-card__icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--rsmq-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}
.exchange-card__icon--direct {
  background: #cff4fc;
  color: #055160;
}
.exchange-card__icon--fanout {
  background: #d1e7dd;
  color: #0f5132;
}
.exchange-card__icon--topic {
  background: #e2d9f3;
  color: #5a2a94;
}
.exchange-card__title-block {
  min-width: 0;
  flex: 1;
}
.exchange-card__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--rsmq-color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.exchange-card__subtitle {
  margin: var(--rsmq-space-1) 0 0;
  font-size: 0.8rem;
  color: var(--rsmq-color-text-muted);
}
.exchange-card__body {
  padding: var(--rsmq-space-4);
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--rsmq-space-2);
}
.exchange-card__stat {
  margin: 0;
  color: var(--rsmq-color-text);
  font-size: 0.9rem;
}
.exchange-card__bindings {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--rsmq-space-1);
}
.exchange-card__bindings li {
  display: flex;
  align-items: center;
  gap: var(--rsmq-space-2);
  padding: var(--rsmq-space-1) var(--rsmq-space-2);
  border-radius: var(--rsmq-radius-sm);
  background: var(--rsmq-color-bg);
  font-size: 0.85rem;
}
.exchange-card__qname {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1;
}
.exchange-card__key {
  font-size: 0.7rem;
  padding: 0.1rem 0.4rem;
  background: var(--rsmq-color-surface);
  border-radius: var(--rsmq-radius-sm);
  color: var(--rsmq-color-text-muted);
  font-family: var(--rsmq-font-mono);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 40%;
}
.exchange-card__unbind {
  min-width: 1.75rem;
  min-height: 1.75rem;
  padding: 0.1rem;
  flex-shrink: 0;
}
.exchange-card__state {
  margin: 0;
  font-size: 0.85rem;
  color: var(--rsmq-color-text-muted);
}
.exchange-card__state--error {
  color: var(--rsmq-color-danger);
}
.exchange-card__more {
  font-size: 0.8rem;
  color: var(--rsmq-color-text-muted);
  font-style: italic;
}
.exchange-card__foot {
  display: flex;
  justify-content: flex-end;
  gap: var(--rsmq-space-2);
  padding: var(--rsmq-space-3) var(--rsmq-space-4);
  border-top: 1px solid var(--rsmq-color-border);
  background: var(--rsmq-color-bg);
}
@media (max-width: 576px) {
  .exchange-card__foot {
    flex-direction: column-reverse;
  }
  .exchange-card__foot .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
