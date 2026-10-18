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
import type { IQueueParams } from '@/api/model';
import Card from '@/components/ui/Card.vue';
import StateBlock from '@/components/ui/StateBlock.vue';
import ConfirmationModal from '@/components/modals/ConfirmationModal.vue';
import { useQueueRateLimit } from '@/composables/useQueueRateLimit';
import { useRateLimitActions } from '@/composables/useRateLimitActions';
import { getErrorMessage } from '@/lib/error';

const props = defineProps<{ queue: IQueueParams }>();

const rateLimit = useQueueRateLimit(() => props.queue);
const actions = useRateLimitActions(
  () => props.queue,
  () => {
    rateLimit.refetch();
  },
);

const isEditing = ref(false);
const limitInput = ref<number>(100);
const intervalInput = ref<number>(1000);
const formError = ref<string | null>(null);

watch(
  () => rateLimit.rateLimit.value,
  (rl) => {
    if (rl) {
      limitInput.value = rl.limit;
      intervalInput.value = rl.interval;
    } else {
      limitInput.value = 100;
      intervalInput.value = 1000;
    }
  },
  { immediate: true },
);

function startEdit() {
  formError.value = null;
  isEditing.value = true;
}

function cancelEdit() {
  isEditing.value = false;
  formError.value = null;
}

async function onSave() {
  formError.value = null;
  if (limitInput.value <= 0 || intervalInput.value <= 0) {
    formError.value = 'Both values must be greater than zero.';
    return;
  }
  try {
    await actions.setRateLimit({
      limit: limitInput.value,
      interval: intervalInput.value,
    });
    isEditing.value = false;
  } catch (e) {
    formError.value = getErrorMessage(e);
  }
}

// Clear modal
const showClearModal = ref(false);
const clearError = ref<string | null>(null);

async function onConfirmClear() {
  clearError.value = null;
  try {
    await actions.clearRateLimit();
    showClearModal.value = false;
  } catch (e) {
    clearError.value = getErrorMessage(e);
  }
}

const hasLimit = computed(() => rateLimit.rateLimit.value !== null);
</script>

<template>
  <Card title="Rate limiting" icon="bi-speedometer2" :heading-level="2">
    <template #actions>
      <button
        v-if="!isEditing && !hasLimit"
        type="button"
        class="btn btn-sm btn-primary"
        :disabled="rateLimit.isLoading.value"
        @click="startEdit"
      >
        <i class="bi bi-plus-lg me-1" aria-hidden="true" />
        Set
      </button>
      <button
        v-else-if="!isEditing && hasLimit"
        type="button"
        class="btn btn-sm btn-outline-primary"
        @click="startEdit"
      >
        <i class="bi bi-pencil me-1" aria-hidden="true" />
        Edit
      </button>
      <button
        v-if="!isEditing"
        type="button"
        class="btn btn-refresh btn-icon"
        :disabled="rateLimit.isLoading.value"
        title="Refresh"
        @click="rateLimit.refetch()"
      >
        <i
          class="bi bi-arrow-clockwise"
          :class="{ spin: rateLimit.isLoading.value }"
        />
      </button>
    </template>

    <StateBlock v-if="rateLimit.isLoading.value" kind="loading" />
    <StateBlock
      v-else-if="rateLimit.error.value"
      kind="error"
      icon="bi-exclamation-triangle-fill"
      :message="rateLimit.error.value"
    />

    <!-- Inline edit form -->
    <form v-else-if="isEditing" class="rate-form" @submit.prevent="onSave">
      <div class="rate-form__row">
        <div class="rate-form__field">
          <label for="rate-limit" class="form-label">Limit</label>
          <input
            id="rate-limit"
            v-model.number="limitInput"
            type="number"
            min="1"
            class="form-control"
            required
          />
        </div>
        <div class="rate-form__field">
          <label for="rate-interval" class="form-label"> Interval (ms) </label>
          <input
            id="rate-interval"
            v-model.number="intervalInput"
            type="number"
            min="1"
            class="form-control"
            required
          />
        </div>
      </div>
      <p class="rate-form__preview">
        Will allow
        <strong>{{ limitInput || 0 }}</strong> messages per
        <strong>{{ intervalInput || 0 }}ms</strong>.
      </p>
      <div v-if="formError" class="alert alert-danger mb-0" role="alert">
        {{ formError }}
      </div>
      <div class="rate-form__actions">
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="actions.isSetting.value"
          @click="cancelEdit"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="actions.isSetting.value"
        >
          <span
            v-if="actions.isSetting.value"
            class="spinner-border spinner-border-sm me-1"
            aria-hidden="true"
          />
          {{ actions.isSetting.value ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </form>

    <!-- Display mode -->
    <div v-else-if="hasLimit" class="rate-display">
      <p class="rate-display__value">
        <strong>{{ rateLimit.rateLimit.value!.limit }}</strong>
        messages per
        <strong>{{ rateLimit.rateLimit.value!.interval }}ms</strong>
      </p>
      <button
        type="button"
        class="btn btn-sm btn-outline-danger"
        :disabled="actions.isClearing.value"
        @click="showClearModal = true"
      >
        <i class="bi bi-trash me-1" aria-hidden="true" />
        Clear
      </button>
    </div>
    <p v-else class="rate-empty">No rate limit configured.</p>
  </Card>

  <ConfirmationModal
    :is-visible="showClearModal"
    title="Clear rate limit"
    icon="bi-speedometer2"
    :message="`Remove rate limiting from ${props.queue.name}@${props.queue.ns}?`"
    confirm-label="Clear rate limit"
    confirm-variant="warning"
    :is-pending="actions.isClearing.value"
    :error="clearError"
    @close="showClearModal = false"
    @confirm="onConfirmClear"
  />
</template>

<style scoped>
.rate-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--rsmq-space-3);
  flex-wrap: wrap;
}
.rate-display__value {
  margin: 0;
  font-size: 1rem;
}
.rate-empty {
  margin: 0;
  color: var(--rsmq-color-text-muted);
  font-size: 0.9rem;
}

.rate-form {
  display: flex;
  flex-direction: column;
  gap: var(--rsmq-space-3);
}
.rate-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--rsmq-space-3);
}
.rate-form__field {
  display: flex;
  flex-direction: column;
  gap: var(--rsmq-space-1);
}
.rate-form__preview {
  margin: 0;
  font-size: 0.875rem;
  color: var(--rsmq-color-text-muted);
}
.rate-form__actions {
  display: flex;
  gap: var(--rsmq-space-2);
  justify-content: flex-end;
}
@media (max-width: 576px) {
  .rate-form__row {
    grid-template-columns: 1fr;
  }
  .rate-form__actions {
    flex-direction: column;
  }
  .rate-form__actions .btn {
    width: 100%;
  }
}
</style>
