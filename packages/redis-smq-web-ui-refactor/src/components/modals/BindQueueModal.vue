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
import BaseModal from '@/components/ui/BaseModal.vue';
import { useBindQueue } from '@/api/generated/namespace-exchanges/namespace-exchanges';
import { getErrorMessage } from '@/lib/error';
import { EExchangeType, ExchangeTypeLabel } from '@/types/exchanges';

const props = defineProps<{
  isVisible: boolean;
  namespace?: string;
  exchange: { name: string; type: EExchangeType } | null;
}>();

const emit = defineEmits<{ close: []; success: [] }>();

const isCreate = computed(() => props.exchange === null);
const askNamespace = computed(() => !props.namespace);

const namespaceInput = ref('');
const exchangeName = ref('');
const exchangeType = ref<EExchangeType>(EExchangeType.DIRECT);
const queueName = ref('');
const routingKey = ref('');
const routingPattern = ref('');
const errorMsg = ref<string | null>(null);

const mutation = useBindQueue();

const needsRoutingKey = computed(
  () => exchangeType.value === EExchangeType.DIRECT,
);
const needsRoutingPattern = computed(
  () => exchangeType.value === EExchangeType.TOPIC,
);

watch(
  () => props.isVisible,
  (v) => {
    if (!v) return;
    namespaceInput.value = 'default';
    exchangeName.value = props.exchange?.name ?? '';
    exchangeType.value = props.exchange?.type ?? EExchangeType.DIRECT;
    queueName.value = '';
    routingKey.value = '';
    routingPattern.value = '';
    errorMsg.value = null;
    mutation.reset();
  },
  { immediate: true },
);

const canSubmit = computed(() => {
  const ns = props.namespace ?? namespaceInput.value.trim();
  if (!ns) return false;
  if (!exchangeName.value.trim()) return false;
  if (!queueName.value.trim()) return false;
  if (needsRoutingKey.value && !routingKey.value.trim()) return false;
  if (needsRoutingPattern.value && !routingPattern.value.trim()) return false;
  return true;
});

async function onSubmit() {
  errorMsg.value = null;
  const ns = props.namespace ?? namespaceInput.value.trim();
  const params: Record<string, string> = {};
  if (needsRoutingKey.value) params.routingKey = routingKey.value.trim();
  if (needsRoutingPattern.value)
    params.routingPattern = routingPattern.value.trim();

  try {
    await mutation.mutateAsync({
      ns,
      exchange: exchangeName.value.trim(),
      queue: queueName.value.trim(),
      params,
    });
    emit('success');
  } catch (e) {
    errorMsg.value = getErrorMessage(e);
  }
}

const TYPES: EExchangeType[] = [
  EExchangeType.DIRECT,
  EExchangeType.FANOUT,
  EExchangeType.TOPIC,
];
</script>

<template>
  <BaseModal
    :is-visible="isVisible"
    :title="isCreate ? 'Create exchange' : 'Bind queue'"
    :subtitle="
      isCreate
        ? 'Exchanges are created when you bind the first queue'
        : `Bind a queue to ${exchangeName}`
    "
    icon="bi-link-45deg"
    size="md"
    @close="emit('close')"
  >
    <template #body>
      <form @submit.prevent="onSubmit">
        <div v-if="askNamespace" class="field">
          <label for="bind-ns" class="form-label">Namespace</label>
          <input
            id="bind-ns"
            v-model="namespaceInput"
            type="text"
            class="form-control"
            required
          />
        </div>

        <div v-if="isCreate" class="field">
          <label for="bind-exchange-name" class="form-label"
            >Exchange name</label
          >
          <input
            id="bind-exchange-name"
            v-model="exchangeName"
            type="text"
            class="form-control"
            required
          />
        </div>

        <div v-if="isCreate" class="field">
          <label for="bind-exchange-type" class="form-label">Type</label>
          <select
            id="bind-exchange-type"
            v-model.number="exchangeType"
            class="form-select"
          >
            <option v-for="t in TYPES" :key="t" :value="t">
              {{ ExchangeTypeLabel[t] }}
            </option>
          </select>
        </div>

        <div class="field">
          <label for="bind-queue-name" class="form-label">Queue name</label>
          <input
            id="bind-queue-name"
            v-model="queueName"
            type="text"
            class="form-control"
            required
          />
        </div>

        <div v-if="needsRoutingKey" class="field">
          <label for="bind-routing-key" class="form-label">Routing key</label>
          <input
            id="bind-routing-key"
            v-model="routingKey"
            type="text"
            class="form-control"
            placeholder="e.g. user.created"
          />
        </div>

        <div v-if="needsRoutingPattern" class="field">
          <label for="bind-routing-pattern" class="form-label"
            >Routing pattern</label
          >
          <input
            id="bind-routing-pattern"
            v-model="routingPattern"
            type="text"
            class="form-control"
            placeholder="e.g. user.* or orders.#"
          />
        </div>

        <div v-if="errorMsg" class="alert alert-danger mb-0 mt-3" role="alert">
          {{ errorMsg }}
        </div>
      </form>
    </template>
    <template #footer>
      <button
        type="button"
        class="btn btn-secondary"
        :disabled="mutation.isPending.value"
        @click="emit('close')"
      >
        Cancel
      </button>
      <button
        type="button"
        class="btn btn-primary"
        :disabled="!canSubmit || mutation.isPending.value"
        @click="onSubmit"
      >
        <span
          v-if="mutation.isPending.value"
          class="spinner-border spinner-border-sm me-1"
          aria-hidden="true"
        />
        {{ isCreate ? 'Create exchange' : 'Bind queue' }}
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.field {
  margin-bottom: var(--rsmq-space-3);
}
.field:last-of-type {
  margin-bottom: 0;
}
</style>
