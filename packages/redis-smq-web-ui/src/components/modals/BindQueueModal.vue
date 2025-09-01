<!--
  - Copyright (c)
  - Weyoss <weyoss@protonmail.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useEscapeKey } from '@/composables/useEscapeKey.ts';
import type { IQueueParams } from '@/types';
import type { getErrorMessage } from '@/lib/error.ts';

// Props and Emits
const props = defineProps<{
  isVisible: boolean;
  isBinding: boolean;
  bindError: ReturnType<typeof getErrorMessage>;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'bind', values: IQueueParams): void;
}>();

// Component State
const queue = ref('');

const isFormValid = computed(() => {
  // Validate that the queue name is in the format "name@ns"
  const parts = queue.value.trim().split('@');
  return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
});

// Event Handlers
function handleSubmit() {
  if (isFormValid.value && !props.isBinding) {
    const parts = queue.value.trim().split('@');
    const queueParams: IQueueParams = {
      name: parts[0],
      ns: parts[1],
    };
    emit('bind', queueParams);
  }
}

function handleClose() {
  emit('close');
}

// Reset form state when modal becomes visible
watch(
  () => props.isVisible,
  (newVal) => {
    if (newVal) {
      queue.value = '';
    }
  },
);

// Close modal on escape key press
useEscapeKey([
  {
    isVisible: computed(() => props.isVisible),
    onEscape: handleClose,
  },
]);
</script>

<template>
  <teleport to="body">
    <div v-if="isVisible" class="modal-overlay" @click.self="handleClose">
      <div class="modal-container" role="dialog" aria-modal="true">
        <!-- Modal Header -->
        <div class="modal-header">
          <h3 class="modal-title">Bind Queue to Exchange</h3>
          <button class="btn-close" aria-label="Close" @click="handleClose">
            &times;
          </button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          <form @submit.prevent="handleSubmit">
            <div class="form-group">
              <label for="queue" class="form-label">Queue</label>
              <input
                id="queue"
                v-model="queue"
                type="text"
                class="form-control"
                placeholder="e.g., my-queue@my-namespace"
                required
              />
              <small class="form-text">
                The queue to bind, in the format
                <strong>name@ns</strong>.
              </small>
            </div>
          </form>

          <!-- Error Display -->
          <div v-if="bindError" class="alert alert-danger mt-3">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            {{ bindError.message }}
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="handleClose">Cancel</button>
          <button
            class="btn btn-primary"
            :disabled="!isFormValid || isBinding"
            @click="handleSubmit"
          >
            <span
              v-if="isBinding"
              class="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            {{ isBinding ? 'Binding...' : 'Bind Queue' }}
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}

.modal-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.modal-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #343a40;
}

.btn-close {
  background: none;
  border: none;
  font-size: 2rem;
  font-weight: 300;
  line-height: 1;
  color: #6c757d;
  cursor: pointer;
  padding: 0;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
}

.form-control {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 1px solid #ced4da;
  border-radius: 8px;
  transition:
    border-color 0.15s ease-in-out,
    box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-text {
  font-size: 0.875rem;
  color: #6c757d;
  margin-top: 0.25rem;
}

.alert-danger {
  padding: 1rem;
  border-radius: 8px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e9ecef;
  background-color: #f8f9fa;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background-color: #0d6efd;
  color: white;
}

.btn-primary:disabled {
  background-color: #a1c9ff;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}
</style>
