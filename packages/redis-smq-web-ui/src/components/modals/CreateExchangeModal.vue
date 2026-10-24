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
import { useCreateExchange } from '@/api/generated/exchanges/exchanges';
import { getErrorMessage } from '@/lib/error';
import { validateRedisKey } from '@/lib/validate';
import {
  EExchangeType,
  EExchangeQueuePolicy,
  ExchangeTypeLabel,
  ExchangeTypeIcon,
  ExchangeQueuePolicyLabel,
  ExchangeQueuePolicyHint,
} from '@/types/exchanges';
import type { IExchangeParams } from '@/api/model';

const props = defineProps<{
  isVisible: boolean;
  namespace?: string;
}>();

const emit = defineEmits<{
  close: [];
  created: [exchange: IExchangeParams];
}>();

const ns = ref('');
const name = ref('');
const type = ref<EExchangeType>(EExchangeType.DIRECT);
const queuePolicy = ref<EExchangeQueuePolicy>(EExchangeQueuePolicy.STANDARD);

const nsError = ref('');
const nameError = ref('');
const submitError = ref<string | null>(null);

const mutation = useCreateExchange();
const pending = computed(() => mutation.isPending.value);

watch(
  () => props.isVisible,
  (v) => {
    if (!v) return;
    ns.value = props.namespace ?? '';
    name.value = '';
    type.value = EExchangeType.DIRECT;
    queuePolicy.value = EExchangeQueuePolicy.STANDARD;
    nsError.value = '';
    nameError.value = '';
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
  nsError.value = validateKey(ns.value.trim(), 'Namespace');
  nameError.value = validateKey(name.value.trim(), 'Exchange name');
  return !nsError.value && !nameError.value;
}

async function onSubmit() {
  submitError.value = null;
  if (!validate()) return;

  try {
    await mutation.mutateAsync({
      data: {
        exchange: { ns: ns.value.trim(), name: name.value.trim() },
        type: type.value,
        queuePolicy: queuePolicy.value,
      },
    });
    emit('created', { ns: ns.value.trim(), name: name.value.trim() });
  } catch (e) {
    submitError.value = getErrorMessage(e);
  }
}

const TYPE_OPTIONS = [
  {
    value: EExchangeType.DIRECT,
    label: ExchangeTypeLabel[EExchangeType.DIRECT],
    icon: ExchangeTypeIcon[EExchangeType.DIRECT],
    hint: 'Routes on exact routing key match',
  },
  {
    value: EExchangeType.FANOUT,
    label: ExchangeTypeLabel[EExchangeType.FANOUT],
    icon: ExchangeTypeIcon[EExchangeType.FANOUT],
    hint: 'Broadcasts to all bound queues',
  },
  {
    value: EExchangeType.TOPIC,
    label: ExchangeTypeLabel[EExchangeType.TOPIC],
    icon: ExchangeTypeIcon[EExchangeType.TOPIC],
    hint: 'Routes on wildcard pattern matching',
  },
];

const POLICY_OPTIONS = [
  {
    value: EExchangeQueuePolicy.STANDARD,
    label: ExchangeQueuePolicyLabel[EExchangeQueuePolicy.STANDARD],
    hint: ExchangeQueuePolicyHint[EExchangeQueuePolicy.STANDARD],
  },
  {
    value: EExchangeQueuePolicy.PRIORITY,
    label: ExchangeQueuePolicyLabel[EExchangeQueuePolicy.PRIORITY],
    hint: ExchangeQueuePolicyHint[EExchangeQueuePolicy.PRIORITY],
  },
];
</script>

<template>
  <BaseModal
    :is-visible="isVisible"
    title="Create exchange"
    subtitle="Create an exchange, then bind queues to it"
    icon="bi-diagram-3"
    size="md"
    @close="emit('close')"
  >
    <template #body>
      <form @submit.prevent="onSubmit">
        <div class="field">
          <label for="ex-ns" class="form-label">Namespace</label>
          <input
            id="ex-ns"
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
          <label for="ex-name" class="form-label">Exchange name</label>
          <input
            id="ex-name"
            v-model="name"
            type="text"
            class="form-control"
            :class="{ 'is-invalid': nameError }"
            placeholder="e.g. user-events"
            autocomplete="off"
            :disabled="pending"
            @blur="nameError = validateKey(name.trim(), 'Exchange name')"
          />
          <div v-if="nameError" class="invalid-feedback d-block">
            {{ nameError }}
          </div>
        </div>

        <div class="field">
          <label for="ex-type" class="form-label">Type</label>
          <select
            id="ex-type"
            v-model.number="type"
            class="form-select"
            :disabled="pending"
          >
            <option v-for="o in TYPE_OPTIONS" :key="o.value" :value="o.value">
              {{ o.label }}
            </option>
          </select>
          <p class="hint">
            {{ TYPE_OPTIONS.find((o) => o.value === type)?.hint }}
          </p>
        </div>

        <div class="field">
          <label for="ex-policy" class="form-label">Queue policy</label>
          <select
            id="ex-policy"
            v-model.number="queuePolicy"
            class="form-select"
            :disabled="pending"
          >
            <option v-for="o in POLICY_OPTIONS" :key="o.value" :value="o.value">
              {{ o.label }}
            </option>
          </select>
          <p class="hint">
            {{ POLICY_OPTIONS.find((o) => o.value === queuePolicy)?.hint }}
          </p>
        </div>

        <div
          v-if="submitError"
          class="alert alert-danger mb-0 mt-3"
          role="alert"
        >
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
        {{ pending ? 'Creating…' : 'Create exchange' }}
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
</style>
