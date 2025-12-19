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
import BaseModal from '@/components/modals/BaseModal.vue';
import { EExchangeType } from '@/types/exchanges';
import { getErrorMessage } from '@/lib/error.ts';

/* Generated API mutations for deleting exchanges */
import { useDeleteApiV1NamespacesNsExchangesFanoutFanout } from '@/api/generated/fanout-exchange/fanout-exchange';
import { useDeleteApiV1NamespacesNsExchangesDirectDirect } from '@/api/generated/direct-exchange/direct-exchange';
import { useDeleteApiV1NamespacesNsExchangesTopicTopic } from '@/api/generated/topic-exchange/topic-exchange';

const props = defineProps<{
  isVisible: boolean;
  exchangeName: string;
  namespace: string;
  exchangeType: EExchangeType;
  totalQueues: number;
  totalRoutingKeys?: number; // direct only
  totalBindingPatterns?: number; // topic only
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'deleted'): void; // emitted after a successful deletion
}>();

/* Determine if deletion is allowed */
const canDelete = computed(() => props.totalQueues === 0);

/* Title helpers */
const typeTitle = computed(() => {
  switch (props.exchangeType) {
    case EExchangeType.DIRECT:
      return 'Direct';
    case EExchangeType.TOPIC:
      return 'Topic';
    case EExchangeType.FANOUT:
      return 'Fanout';
    default:
      return 'Exchange';
  }
});

const deleteTitle = computed(() => `Delete ${typeTitle.value} Exchange`);

/* Secondary stat for DIRECT/TOPIC types */
const secondaryStat = computed<{ label: string; value: number } | null>(() => {
  if (props.exchangeType === EExchangeType.DIRECT) {
    return { label: 'Routing Keys', value: props.totalRoutingKeys ?? 0 };
  }
  if (props.exchangeType === EExchangeType.TOPIC) {
    return {
      label: 'Binding Patterns',
      value: props.totalBindingPatterns ?? 0,
    };
  }
  return null; // fanout has no second metric
});

/* Info text when deletion is blocked */
const cannotDeleteMessage = computed(() => {
  const q = props.totalQueues;
  const qWord = q === 1 ? 'queue' : 'queues';

  if (props.exchangeType === EExchangeType.DIRECT) {
    const r = props.totalRoutingKeys ?? 0;
    const rWord = r === 1 ? 'routing key' : 'routing keys';
    return `This direct exchange cannot be deleted because it has ${q} bound ${qWord} across ${r} ${rWord}. Unbind all queues first.`;
  }

  if (props.exchangeType === EExchangeType.TOPIC) {
    const p = props.totalBindingPatterns ?? 0;
    const pWord = p === 1 ? 'binding pattern' : 'binding patterns';
    return `This topic exchange cannot be deleted because it has ${q} bound ${qWord} across ${p} ${pWord}. Unbind all queues first.`;
  }

  // fanout
  return `This fanout exchange cannot be deleted because it has ${q} bound ${qWord}. Unbind all queues first.`;
});

/* Confirmation text */
const confirmMessage = computed(() => {
  const lower = typeTitle.value.toLowerCase();
  return `Are you sure you want to delete the ${lower} exchange "${props.exchangeName}"? This will remove all queue bindings and cannot be undone.`;
});

/* delete mutations (one per type) */
const deleteFanout = useDeleteApiV1NamespacesNsExchangesFanoutFanout();
const deleteDirect = useDeleteApiV1NamespacesNsExchangesDirectDirect();
const deleteTopic = useDeleteApiV1NamespacesNsExchangesTopicTopic();

/* loading and error states derived from the active mutation */
const isDeleting = computed<boolean>(() => {
  return (
    deleteDirect.isPending.value ||
    deleteTopic.isPending.value ||
    deleteFanout.isPending.value
  );
});

/* error */
const error = computed(() =>
  getErrorMessage(
    deleteDirect.error.value?.error ||
      deleteTopic.error.value?.error ||
      deleteFanout.error.value?.error,
  ),
);

/* Local submit guard to prevent ultra-fast double clicks */
const submitting = ref(false);

/* Reset mutation state when modal opens and when it closes */
watch(
  () => props.isVisible,
  (visible) => {
    if (visible) {
      deleteDirect.reset?.();
      deleteTopic.reset?.();
      deleteFanout.reset?.();
      submitting.value = false;
    }
  },
);

/* Actions */
function onClose() {
  if (!isDeleting.value && !submitting.value) {
    // Optional: clear state on close as well
    deleteDirect.reset?.();
    deleteTopic.reset?.();
    deleteFanout.reset?.();
    submitting.value = false;
    emit('close');
  }
}

async function onConfirm() {
  if (isDeleting.value || submitting.value || !canDelete.value) return;

  submitting.value = true;
  try {
    switch (props.exchangeType) {
      case EExchangeType.FANOUT:
        await deleteFanout.mutateAsync({
          ns: props.namespace,
          fanout: props.exchangeName,
        });
        break;
      case EExchangeType.DIRECT:
        await deleteDirect.mutateAsync({
          ns: props.namespace,
          direct: props.exchangeName,
        });
        break;
      case EExchangeType.TOPIC:
        await deleteTopic.mutateAsync({
          ns: props.namespace,
          topic: props.exchangeName,
        });
        break;
      default:
        throw new Error('Unsupported exchange type');
    }

    // Notify parent (so it can refresh data or navigate) and close the modal
    emit('deleted');
    emit('close');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <BaseModal
    :is-visible="isVisible"
    :title="canDelete ? deleteTitle : 'Cannot Delete Exchange'"
    :subtitle="`Namespace: ${namespace}`"
    icon="bi bi-exclamation-triangle-fill"
    size="sm"
    @close="onClose"
  >
    <template #body>
      <div class="dialog-body">
        <!-- Cannot delete state -->
        <section v-if="!canDelete" class="cannot-delete">
          <p class="message">
            {{ cannotDeleteMessage }}
          </p>

          <div
            class="stats"
            role="group"
            aria-label="Exchange deletion blockers"
          >
            <div v-if="secondaryStat" class="stat">
              <span class="label">{{ secondaryStat.label }}</span>
              <span class="value">{{ secondaryStat.value }}</span>
            </div>
            <div class="stat">
              <span class="label">Bound Queues</span>
              <span class="value">{{ totalQueues }}</span>
            </div>
          </div>

          <div class="hint">
            Unbind all queues from this exchange to proceed with deletion.
          </div>
        </section>

        <!-- Confirmation state -->
        <section v-else class="confirmation">
          <p class="message">
            {{ confirmMessage }}
          </p>

          <div v-if="error" class="error" role="alert" aria-live="assertive">
            <i
              class="bi bi-exclamation-circle-fill me-2"
              aria-hidden="true"
            ></i>
            <span class="error-text">{{ error }}</span>
          </div>
        </section>
      </div>
    </template>

    <template #footer>
      <!-- Footer for cannot-delete info -->
      <div v-if="!canDelete" class="actions">
        <button type="button" class="btn btn-primary" @click="onClose">
          OK, got it
        </button>
      </div>

      <!-- Footer for confirmation -->
      <div v-else class="actions">
        <button
          type="button"
          class="btn btn-outline-secondary"
          :disabled="isDeleting || submitting"
          @click="onClose"
        >
          <i class="bi bi-x-circle me-2" aria-hidden="true"></i>
          Cancel
        </button>
        <button
          type="button"
          class="btn btn-danger"
          :disabled="isDeleting || submitting"
          @click="onConfirm"
        >
          <template v-if="isDeleting || submitting">
            <span
              class="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            Deleting...
          </template>
          <template v-else>
            <i class="bi bi-trash-fill me-2" aria-hidden="true"></i>
            Delete Exchange
          </template>
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
/* Mobile-first safety and overflow guards */
.dialog-body,
.dialog-body * {
  box-sizing: border-box;
  max-width: 100%;
}

.dialog-body {
  display: grid;
  gap: clamp(12px, 2.8vw, 18px);
  padding: 0; /* BaseModal provides padding */
  overflow-x: hidden;
}

.message {
  color: #495057;
  line-height: 1.5;
  margin: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.exchange {
  color: #0d6efd;
  font-family: 'Courier New', monospace;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.5rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 0.75rem;
}

.stat {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.label {
  color: #6c757d;
  font-weight: 500;
}

.value {
  color: #212529;
  font-weight: 700;
}

.hint {
  font-size: 0.9rem;
  color: #6c757d;
}

.error {
  display: flex;
  align-items: center;
  color: #842029;
  background: #f8d7da;
  border: 1px solid #f5c2c7;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
}

.actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
}

@media (max-width: 560px) {
  .actions {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
}
</style>
