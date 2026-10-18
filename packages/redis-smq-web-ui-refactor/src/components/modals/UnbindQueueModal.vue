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
import { useUnbindQueue } from '@/api/generated/namespace-exchanges/namespace-exchanges';
import { getErrorMessage } from '@/lib/error';
import { EExchangeType } from '@/types/exchanges';

const props = defineProps<{
  isVisible: boolean;
  namespace: string;
  exchange: { name: string; type: EExchangeType } | null;
  queueName: string;
  bindingKey?: string;
}>();

const emit = defineEmits<{ close: []; success: [] }>();

const errorMsg = ref<string | null>(null);
const mutation = useUnbindQueue();

watch(
  () => props.isVisible,
  (v) => {
    if (v) {
      errorMsg.value = null;
      mutation.reset();
    }
  },
  { immediate: true },
);

const message = computed(() => {
  if (!props.exchange) return '';
  const binding = props.bindingKey ? ` (${props.bindingKey})` : '';
  return `Unbind ${props.queueName}${binding} from ${props.exchange.name}?`;
});

async function onSubmit() {
  if (!props.exchange) return;
  errorMsg.value = null;

  const params: Record<string, string> = {};
  if (props.exchange.type === EExchangeType.DIRECT && props.bindingKey) {
    params.routingKey = props.bindingKey;
  } else if (props.exchange.type === EExchangeType.TOPIC && props.bindingKey) {
    params.routingPattern = props.bindingKey;
  }

  try {
    await mutation.mutateAsync({
      ns: props.namespace,
      exchange: props.exchange.name,
      queue: props.queueName,
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
    title="Unbind queue"
    icon="bi-unlink"
    size="sm"
    @close="emit('close')"
  >
    <template #body>
      <p class="message">{{ message }}</p>
      <div v-if="errorMsg" class="alert alert-danger mb-0 mt-3" role="alert">
        {{ errorMsg }}
      </div>
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
        class="btn btn-danger"
        :disabled="mutation.isPending.value"
        @click="onSubmit"
      >
        <span
          v-if="mutation.isPending.value"
          class="spinner-border spinner-border-sm me-1"
          aria-hidden="true"
        />
        Unbind
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.message {
  margin: 0;
  color: var(--rsmq-color-text);
}
</style>
