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
import type { BindQueueParams } from '@/api/model';

const props = defineProps<{
  isVisible: boolean;
  namespace: string;
  exchange: { name: string; type: EExchangeType };
}>();

const emit = defineEmits<{ close: []; success: [] }>();

const queueName = ref('');
const routingKey = ref('');
const routingPattern = ref('');
const errorMsg = ref<string | null>(null);

const mutation = useBindQueue();

const needsRoutingKey = computed(
  () => props.exchange.type === EExchangeType.DIRECT,
);
const needsRoutingPattern = computed(
  () => props.exchange.type === EExchangeType.TOPIC,
);

watch(
  () => props.isVisible,
  (v) => {
    if (!v) return;
    queueName.value = '';
    routingKey.value = '';
    routingPattern.value = '';
    errorMsg.value = null;
    mutation.reset();
  },
  { immediate: true },
);

const canSubmit = computed(() => {
  if (!queueName.value.trim()) return false;
  if (needsRoutingKey.value && !routingKey.value.trim()) return false;
  if (needsRoutingPattern.value && !routingPattern.value.trim()) return false;
  return true;
});

async function onSubmit() {
  errorMsg.value = null;
  const params: BindQueueParams = {};
  if (needsRoutingKey.value) params.routingKey = routingKey.value.trim();
  if (needsRoutingPattern.value) {
    params.routingPattern = routingPattern.value.trim();
  }

  try {
    await mutation.mutateAsync({
      ns: props.namespace,
      exchange: props.exchange.name,
      queue: queueName.value.trim(),
      params,
    });
    emit('success');
  } catch (e) {
    errorMsg.value = getErrorMessage(e);
  }
}
</script>

<template>
  <BaseModal
    :is-visible="isVisible"
    :title="`Bind queue to ${ExchangeTypeLabel[exchange.type]} exchange`"
    :subtitle="`${exchange.name} • ${namespace}`"
    icon="bi-link-45deg"
    size="md"
    @close="emit('close')"
  >
    <template #body>
      <form @submit.prevent="onSubmit">
        <div class="field">
          <label for="bind-queue-name" class="form-label">Queue name</label>
          <input
            id="bind-queue-name"
            v-model="queueName"
            type="text"
            class="form-control"
            placeholder="e.g. user-notifications"
            required
            :disabled="mutation.isPending.value"
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
            :disabled="mutation.isPending.value"
          />
          <p class="hint">Messages with this exact key route to this queue.</p>
        </div>

        <div v-if="needsRoutingPattern" class="field">
          <label for="bind-routing-pattern" class="form-label">
            Routing pattern
          </label>
          <input
            id="bind-routing-pattern"
            v-model="routingPattern"
            type="text"
            class="form-control"
            placeholder="e.g. user.* or orders.#"
            :disabled="mutation.isPending.value"
          />
          <p class="hint">
            <code>*</code> matches one word, <code>#</code> matches zero or
            more.
          </p>
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
        Bind queue
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.field {
  margin-bottom: var(--rsmq-space-3);
}
.field:last-of-type {
  margin-bottom: var(--rsmq-space-4);
}
.hint {
  margin: var(--rsmq-space-1) 0 0;
  font-size: 0.75rem;
  color: var(--rsmq-color-text-muted);
}
.hint code {
  background: var(--rsmq-color-bg);
  padding: 0 4px;
  border-radius: 3px;
}
</style>
