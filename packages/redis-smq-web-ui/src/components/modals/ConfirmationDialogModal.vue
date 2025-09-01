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
  if (!props.isLoading) {
    emit('close');
  }
}

function handleConfirm() {
  if (!props.isLoading) {
    emit('confirm');
  }
}

const variantClasses = computed(() => {
  const base = {
    primary: 'btn-primary',
    danger: 'btn-danger',
    warning: 'btn-warning',
    secondary: 'btn-secondary',
  };
  const header = {
    primary: 'header-primary',
    danger: 'header-danger',
    warning: 'header-warning',
    secondary: 'header-secondary',
  };
  return {
    btn: base[props.variant] || 'btn-primary',
    header: header[props.variant] || 'header-secondary',
  };
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

useEscapeKey([
  {
    isVisible: computed(() => props.isVisible),
    onEscape: handleClose,
  },
]);
</script>

<template>
  <teleport to="body">
    <div
      v-if="isVisible"
      class="confirmation-backdrop"
      @click.self="handleClose"
    >
      <div
        class="confirmation-dialog"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title"
      >
        <div class="confirmation-content">
          <header class="confirmation-header" :class="variantClasses.header">
            <div class="confirmation-icon">
              <i :class="iconClass"></i>
            </div>
            <h4 class="confirmation-title">{{ title }}</h4>
          </header>
          <main class="confirmation-body">
            <p class="confirmation-message">{{ message }}</p>
            <div v-if="$slots['message-preview']" class="message-preview">
              <slot name="message-preview"></slot>
            </div>
          </main>
          <footer class="confirmation-actions">
            <button
              class="btn btn-outline-secondary"
              :disabled="isLoading"
              @click="handleClose"
            >
              Cancel
            </button>
            <button
              class="btn"
              :class="variantClasses.btn"
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
          </footer>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.confirmation-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1060;
  backdrop-filter: blur(2px);
}

.confirmation-dialog {
  width: 90%;
  max-width: 500px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  transform: scale(0.95);
  opacity: 0;
  animation: zoomIn 0.2s ease forwards;
}

@keyframes zoomIn {
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.confirmation-content {
  padding: 0;
}

.confirmation-header {
  padding: 1.5rem 2rem 1rem;
  text-align: center;
  transition: background-color 0.2s ease;
}

/* Variant-specific header styles */
.confirmation-header.header-secondary {
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}
.confirmation-header.header-secondary .confirmation-title {
  color: #212529;
}
.confirmation-header.header-secondary .confirmation-icon {
  color: #41464b;
}

.confirmation-header.header-danger {
  background-color: #f8d7da;
  border-bottom: 1px solid #f5c2c7;
}
.confirmation-header.header-danger .confirmation-title {
  color: #58151c;
}
.confirmation-header.header-danger .confirmation-icon {
  color: #721c24;
}

.confirmation-header.header-warning {
  background-color: #fff3cd;
  border-bottom: 1px solid #ffecb5;
}
.confirmation-header.header-warning .confirmation-title {
  color: #664d03;
}
.confirmation-header.header-warning .confirmation-icon {
  color: #856404;
}

.confirmation-header.header-primary {
  background-color: #cfe2ff;
  border-bottom: 1px solid #b6d4fe;
}
.confirmation-header.header-primary .confirmation-title {
  color: #052c65;
}
.confirmation-header.header-primary .confirmation-icon {
  color: #084298;
}

.confirmation-icon {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  font-size: 1.5rem;
}

.confirmation-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.confirmation-body {
  padding: 1.5rem 2rem;
}

.confirmation-message {
  margin: 0 0 1rem 0;
  color: #495057;
  line-height: 1.5;
  text-align: center;
}

.message-preview {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 0.75rem;
  font-size: 0.875rem;
  text-align: center;
}

.message-preview code {
  background: none;
  color: #495057;
  font-weight: 600;
}

.confirmation-actions {
  padding: 1rem 2rem 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
}

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

.btn-primary {
  background-color: #0d6efd;
  border-color: #0d6efd;
  color: #ffffff;
}
.btn-danger {
  background-color: #dc3545;
  border-color: #dc3545;
  color: #ffffff;
}
.btn-warning {
  background-color: #ffc107;
  border-color: #ffc107;
  color: #212529;
}
.btn-secondary {
  background-color: #6c757d;
  border-color: #6c757d;
  color: #ffffff;
}

.btn-outline-secondary {
  background: transparent;
  border-color: #6c757d;
  color: #6c757d;
}
.btn-outline-secondary:hover:not(:disabled) {
  background: #6c757d;
  color: #ffffff;
}
</style>
