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
import BaseModal from './BaseModal.vue';

type TVariant = 'primary' | 'danger' | 'warning' | 'secondary';

const props = withDefaults(
  defineProps<{
    isVisible: boolean;
    title: string;
    message: string;
    confirmText?: string;
    variant?: TVariant;
    isLoading?: boolean;
  }>(),
  {
    confirmText: 'Confirm',
    variant: 'primary',
    isLoading: false,
  },
);

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm'): void;
}>();

function handleClose() {
  if (!props.isLoading) emit('close');
}

function handleConfirm() {
  if (!props.isLoading) emit('confirm');
}

const variantBtnClass = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'btn-danger';
    case 'warning':
      return 'btn-warning';
    case 'secondary':
      return 'btn-secondary';
    case 'primary':
    default:
      return 'btn-primary';
  }
});

const iconClass = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'bi-exclamation-triangle-fill';
    case 'warning':
      return 'bi-exclamation-circle-fill';
    default:
      return 'bi-question-circle-fill';
  }
});
</script>

<template>
  <BaseModal
    :is-visible="isVisible"
    :title="title"
    :subtitle="undefined"
    :icon="`bi ${iconClass}`"
    size="sm"
    @close="handleClose"
  >
    <template #body>
      <div class="dialog-body">
        <p class="confirmation-message">{{ message }}</p>
        <div v-if="$slots['message-preview']" class="message-preview">
          <slot name="message-preview"></slot>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="actions">
        <button
          class="btn btn-outline-secondary"
          type="button"
          :disabled="isLoading"
          @click="handleClose"
        >
          Cancel
        </button>

        <button
          class="btn"
          :class="variantBtnClass"
          type="button"
          :disabled="isLoading"
          @click="handleConfirm"
        >
          <span
            v-if="isLoading"
            class="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
          ></span>
          {{ isLoading ? 'Processing...' : confirmText }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
/* Body */
.dialog-body {
  display: grid;
  gap: 0.75rem;
  padding: 0; /* BaseModal provides body padding */
  overflow-x: hidden;
}

.confirmation-message {
  margin: 0;
  color: #495057;
  line-height: 1.5;
  text-align: center;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.message-preview {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 0.75rem;
  font-size: 0.875rem;
  text-align: center;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.message-preview code {
  background: none;
  color: #495057;
  font-weight: 600;
}

/* Footer actions: spacing and mobile behavior */
.actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.actions .btn {
  min-width: 120px;
}

@media (max-width: 576px) {
  .actions {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  .actions .btn {
    width: 100%;
    justify-content: center;
    min-width: 0;
  }
}

/* Buttons baseline (rely on global styles for variants) */
.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

/* Spinner utility */
.spinner-border {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  vertical-align: -0.125em;
  border: 0.125em solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spinner-border 0.75s linear infinite;
}
@keyframes spinner-border {
  to {
    transform: rotate(360deg);
  }
}
</style>
