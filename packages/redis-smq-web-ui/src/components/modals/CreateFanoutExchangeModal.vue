<!--
  - Copyright (c)
  - Weyoss <weyoss@protonmail.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useEscapeKey } from '@/composables/useEscapeKey.ts';
import { useFanoutExchangeForm } from '@/composables/useFanoutExchangeForm.ts';
import type { getErrorMessage } from '@/lib/error.ts';

// Props and Emits
const props = defineProps<{
  isVisible: boolean;
  isCreating: boolean;
  createError: ReturnType<typeof getErrorMessage>;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'create', values: { fanOutName: string }): void;
}>();

// Form Management
const { errors, handleSubmit, resetForm, meta, fanOutName, fanOutNameAttrs } =
  useFanoutExchangeForm();

const handleCreate = handleSubmit((values) => {
  if (!props.isCreating) {
    emit('create', { fanOutName: values.fanOutName.trim() });
  }
});

function handleClose() {
  emit('close');
}

// Reset form state when modal becomes visible
watch(
  () => props.isVisible,
  (newVal) => {
    if (newVal) {
      resetForm();
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
          <h3 class="modal-title">Create Fanout Exchange</h3>
          <button class="btn-close" aria-label="Close" @click="handleClose">
            &times;
          </button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          <form @submit.prevent="handleCreate">
            <div class="form-group">
              <label for="fanOutName" class="form-label">Exchange Name</label>
              <input
                id="fanOutName"
                v-model="fanOutName"
                v-bind="fanOutNameAttrs"
                type="text"
                class="form-control"
                :class="{ 'is-invalid': errors.fanOutName }"
                placeholder="e.g., user-events, order-updates"
                required
              />
              <div v-if="errors.fanOutName" class="invalid-feedback">
                {{ errors.fanOutName }}
              </div>
              <small v-else class="form-text"
                >A unique name for the fanout exchange.</small
              >
            </div>
          </form>

          <!-- API Error Display -->
          <div v-if="createError" class="alert alert-danger mt-3">
            <span class="me-2">⚠️</span>
            {{ createError.message }}
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="handleClose">Cancel</button>
          <button
            class="btn btn-primary"
            :disabled="!meta.valid || isCreating"
            @click="handleCreate"
          >
            <span
              v-if="isCreating"
              class="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            {{ isCreating ? 'Creating...' : 'Create Exchange' }}
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

.form-control.is-invalid {
  border-color: #dc3545;
}

.form-control.is-invalid:focus {
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

.invalid-feedback {
  color: #dc3545;
  font-size: 0.875rem;
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
