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
import { useCreateQueue } from '@/api/generated/queues/queues';
import { getErrorMessage } from '@/lib/error';
import { validateRedisKey } from '@/lib/validate';
import { EQueueDeliveryModel, EQueueType } from '@/types/queues';
import type { IQueueParams } from '@/api/model';

const props = defineProps<{
  isVisible: boolean;
  namespace?: string;
}>();

const emit = defineEmits<{
  close: [];
  created: [params: IQueueParams];
}>();

const name = ref('');
const ns = ref('');
const queueType = ref<EQueueType>(EQueueType.FIFO_QUEUE);
const deliveryModel = ref<EQueueDeliveryModel>(
  EQueueDeliveryModel.POINT_TO_POINT,
);

const nameError = ref('');
const nsError = ref('');
const submitError = ref<string | null>(null);

const mutation = useCreateQueue();
const pending = computed(() => mutation.isPending.value);

watch(
  () => props.isVisible,
  (v) => {
    if (!v) return;
    name.value = '';
    ns.value = props.namespace ?? '';
    queueType.value = EQueueType.FIFO_QUEUE;
    deliveryModel.value = EQueueDeliveryModel.POINT_TO_POINT;
    nameError.value = '';
    nsError.value = '';
    submitError.value = null;
    mutation.reset();
  },
  { immediate: true },
);

function validateKey(value: string, label: string): string {
  if (!value) return `${label} is required`;
  if (value.length > 100) return `${label} must be 100 characters or fewer`;
  if (!validateRedisKey(value)) {
    return `${label} must start with a letter and contain only letters, numbers, and single separators (-, _, .)`;
  }
  return '';
}

function validate(): boolean {
  nameError.value = validateKey(name.value.trim(), 'Queue name');
  nsError.value = validateKey(ns.value.trim(), 'Namespace');
  return !nameError.value && !nsError.value;
}

async function onSubmit() {
  submitError.value = null;
  if (!validate()) return;

  try {
    await mutation.mutateAsync({
      data: {
        queue: { ns: ns.value.trim(), name: name.value.trim() },
        queueType: queueType.value,
        queueDeliveryModel: deliveryModel.value,
      },
    });
    emit('created', { ns: ns.value.trim(), name: name.value.trim() });
  } catch (e) {
    submitError.value = getErrorMessage(e);
  }
}

const TYPE_OPTIONS = [
  { value: EQueueType.FIFO_QUEUE, label: 'FIFO — First in, first out' },
  { value: EQueueType.LIFO_QUEUE, label: 'LIFO — Last in, first out' },
  {
    value: EQueueType.PRIORITY_QUEUE,
    label: 'Priority — higher priority first',
  },
];

const DELIVERY_OPTIONS = [
  {
    value: EQueueDeliveryModel.POINT_TO_POINT,
    label: 'Point-to-Point — one consumer per message',
  },
  {
    value: EQueueDeliveryModel.PUB_SUB,
    label: 'Pub/Sub — broadcast to every consumer group',
  },
];
</script>

<template>
  <BaseModal
    :is-visible="isVisible"
    title="Create queue"
    subtitle="Configure a new message queue"
    icon="bi-plus-circle"
    size="md"
    @close="emit('close')"
  >
    <template #body>
      <form @submit.prevent="onSubmit">
        <div class="field">
          <label for="new-queue-name" class="form-label">Queue name</label>
          <input
            id="new-queue-name"
            v-model="name"
            type="text"
            class="form-control"
            :class="{ 'is-invalid': nameError }"
            placeholder="e.g. user-events"
            autocomplete="off"
            :disabled="pending"
            @blur="nameError = validateKey(name.trim(), 'Queue name')"
          />
          <div v-if="nameError" class="invalid-feedback d-block">
            {{ nameError }}
          </div>
        </div>

        <div class="field">
          <label for="new-queue-ns" class="form-label">Namespace</label>
          <input
            id="new-queue-ns"
            v-model="ns"
            type="text"
            class="form-control"
            :class="{ 'is-invalid': nsError }"
            placeholder="e.g. production"
            autocomplete="off"
            :disabled="pending"
            @blur="nsError = validateKey(ns.trim(), 'Namespace')"
          />
          <div v-if="nsError" class="invalid-feedback d-block">
            {{ nsError }}
          </div>
        </div>

        <div class="field">
          <label for="new-queue-type" class="form-label">Queue type</label>
          <select
            id="new-queue-type"
            v-model.number="queueType"
            class="form-select"
            :disabled="pending"
          >
            <option v-for="o in TYPE_OPTIONS" :key="o.value" :value="o.value">
              {{ o.label }}
            </option>
          </select>
        </div>

        <div class="field">
          <label for="new-queue-delivery" class="form-label">
            Delivery model
          </label>
          <select
            id="new-queue-delivery"
            v-model.number="deliveryModel"
            class="form-select"
            :disabled="pending"
          >
            <option
              v-for="o in DELIVERY_OPTIONS"
              :key="o.value"
              :value="o.value"
            >
              {{ o.label }}
            </option>
          </select>
        </div>

        <div v-if="submitError" class="alert alert-danger mb-0" role="alert">
          {{ submitError }}
        </div>
      </form>
    </template>
    <template #footer>
      <button
        type="button"
        class="btn btn-secondary"
        :disabled="pending"
        @click="emit('close')"
      >
        Cancel
      </button>
      <button
        type="button"
        class="btn btn-primary"
        :disabled="pending"
        @click="onSubmit"
      >
        <span
          v-if="pending"
          class="spinner-border spinner-border-sm me-1"
          aria-hidden="true"
        />
        {{ pending ? 'Creating…' : 'Create queue' }}
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
</style>
