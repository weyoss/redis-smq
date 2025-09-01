<!--
  - Copyright (c)
  - Weyoss <weyoss@protonmail.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed } from 'vue';
import { useEscapeKey } from '@/composables/useEscapeKey.ts';
import type { getErrorMessage } from '@/lib/error.ts';

// Props and Emits
const props = defineProps<{
  isVisible: boolean;
  isDeleting: boolean;
  exchangeName: string | null;
  deleteError: ReturnType<typeof getErrorMessage>;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm'): void;
}>();

// Event Handlers
function handleConfirm() {
  if (!props.isDeleting) {
    emit('confirm');
  }
}

function handleClose() {
  emit('close');
}

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
          <h3 class="modal-title">Delete Fanout Exchange</h3>
          <button class="btn-close" aria-label="Close" @click="handleClose">
            &times;
          </button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          <p class="confirmation-text">
            Are you sure you want to permanently delete the fanout exchange
            <strong class="exchange-name">{{ exchangeName }}</strong
            >?
          </p>
          <p class="warning-text">This action cannot be undone.</p>

          <!-- Error Display -->
          <div v-if="deleteError" class="alert alert-danger mt-3">
            <span class="me-2">⚠️</span>
            {{ deleteError.message }}
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="handleClose">Cancel</button>
          <button
            class="btn btn-danger"
            :disabled="isDeleting"
            @click="handleConfirm"
          >
            <span
              v-if="isDeleting"
              class="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            {{ isDeleting ? 'Deleting...' : 'Confirm Delete' }}
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
  color: #495057;
}

.confirmation-text {
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.exchange-name {
  color: #dc3545;
  font-family: 'Courier New', Courier, monospace;
  background-color: #f8d7da;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

.warning-text {
  font-size: 1rem;
  font-weight: 500;
  color: #856404;
  background-color: #fff3cd;
  border: 1px solid #ffeeba;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
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

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:disabled {
  background-color: #f1aeb5;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}
</style>
