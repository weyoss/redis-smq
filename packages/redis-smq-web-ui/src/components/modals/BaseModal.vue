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

const props = defineProps<{
  isVisible: boolean;
  title: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const modalSizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'modal-sm';
    case 'lg':
      return 'modal-lg';
    case 'xl':
      return 'modal-xl';
    default:
      return '';
  }
});

function handleClose() {
  emit('close');
}

function handleOverlayClick() {
  emit('close');
}
</script>

<template>
  <Teleport v-if="isVisible" to="body">
    <div
      class="modal-overlay"
      role="dialog"
      :aria-labelledby="`modal-title-${title.replace(/\s+/g, '-').toLowerCase()}`"
      aria-modal="true"
      @click="handleOverlayClick"
      @keydown.esc="handleClose"
    >
      <div class="modal-container" :class="modalSizeClass" @click.stop>
        <div class="modal-content">
          <!-- Header -->
          <header class="modal-header">
            <div v-if="icon" class="header-icon">
              <i :class="icon"></i>
            </div>
            <div class="header-content">
              <h2
                :id="`modal-title-${title.replace(/\s+/g, '-').toLowerCase()}`"
                class="modal-title"
              >
                {{ title }}
              </h2>
              <p v-if="subtitle" class="modal-subtitle">
                {{ subtitle }}
              </p>
            </div>
            <button
              type="button"
              class="btn-close"
              aria-label="Close modal"
              @click="handleClose"
            >
              <i class="bi bi-x"></i>
            </button>
          </header>

          <!-- Body -->
          <main class="modal-body">
            <slot name="body"></slot>
          </main>

          <!-- Footer -->
          <footer v-if="$slots.footer" class="modal-footer">
            <slot name="footer"></slot>
          </footer>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Modal Overlay - Exact match from CreateQueueModal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 0.75rem;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Modal Container - Exact match from CreateQueueModal */
.modal-container {
  max-width: 550px;
  width: 100%;
  max-height: 95vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
  overflow: hidden;
}

.modal-container.modal-sm {
  max-width: 400px;
}

.modal-container.modal-lg {
  max-width: 700px;
}

.modal-container.modal-xl {
  max-width: 900px;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Modal Content - Exact match from CreateQueueModal */
.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  border: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  max-height: 100%;
  height: 100%;
}

/* Header - Exact match from CreateQueueModal */
.modal-header {
  background: linear-gradient(135deg, #e7f3ff 0%, #cce7ff 100%);
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  border-bottom: 1px solid #cce7ff;
  position: relative;
  flex-shrink: 0;
}

.header-icon {
  width: 40px;
  height: 40px;
  background: #0d6efd;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.header-content {
  flex: 1;
  min-width: 0;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
  line-height: 1.2;
}

.modal-subtitle {
  color: #6b7280;
  font-size: 0.85rem;
  margin: 0;
  font-weight: 500;
}

.btn-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
}

.btn-close:hover {
  background: white;
  color: #374151;
  border-color: #d1d5db;
  transform: scale(1.05);
}

/* Body - Exact match from CreateQueueModal */
.modal-body {
  padding: 0;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

/* Footer - Exact match from CreateQueueModal */
.modal-footer {
  background: #f9fafb;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-shrink: 0;
}

/* Responsive Design - Exact match from CreateQueueModal */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 0.5rem;
  }

  .modal-container {
    max-height: 98vh;
    height: 98vh;
  }

  .modal-header {
    padding: 1rem;
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }

  .btn-close {
    position: static;
    align-self: flex-end;
    margin-top: -0.5rem;
  }

  .modal-body {
    padding: 0;
  }

  .modal-footer {
    padding: 0.75rem 1rem;
    flex-direction: column;
    gap: 0.5rem;
  }
}

/* Focus states for accessibility - Exact match from CreateQueueModal */
.btn-close:focus {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
}

/* Reduced motion support - Exact match from CreateQueueModal */
@media (prefers-reduced-motion: reduce) {
  .modal-overlay,
  .modal-container,
  .btn-close {
    animation: none;
    transition: none;
  }

  .btn-close:hover {
    transform: none;
  }
}
</style>
