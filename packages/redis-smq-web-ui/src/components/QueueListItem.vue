<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { ref } from 'vue';
import { useSelectedQueueStore } from '@/stores/selectedQueue';
import DeleteQueueModal from '@/components/modals/DeleteQueueModal.vue';
import { useTypedRouter } from '@/router/useTypeRouter.ts';

const props = defineProps<{
  ns: string;
  name: string;
}>();

const router = useTypedRouter();
const selectedQueueStore = useSelectedQueueStore();

// Modal state
const showDeleteModal = ref(false);

// Navigation
function handleView() {
  selectedQueueStore.selectQueue(props.ns, props.name);
  router.push('queue', { params: { ns: props.ns, queue: props.name } });
}

// Delete handlers
function handleDeleteClick() {
  showDeleteModal.value = true;
}

function handleDeleteClose() {
  showDeleteModal.value = false;
}

function handleDeleteSuccess() {
  showDeleteModal.value = false;
  emit('deleted');
}

const emit = defineEmits<{
  (e: 'deleted'): void;
}>();
</script>

<template>
  <li
    class="queue-item"
    tabindex="0"
    @click="handleView"
    @keydown.enter="handleView"
    @keydown.space.prevent="handleView"
  >
    <!-- Icon -->
    <div class="queue-icon">
      <i class="bi bi-collection"></i>
    </div>

    <!-- Queue Info -->
    <div class="queue-info">
      <div class="queue-name-wrapper">
        <span class="queue-name">{{ name }}</span>
        <span class="queue-namespace">{{ ns }}</span>
      </div>
    </div>

    <!-- Actions -->
    <div class="queue-actions">
      <button
        class="btn-icon view-btn"
        title="View Queue Details"
        :disabled="showDeleteModal"
        @click.stop="handleView"
      >
        <i class="bi bi-eye-fill"></i>
      </button>
      <button
        class="btn-icon delete-btn"
        title="Delete Queue"
        :disabled="showDeleteModal"
        @click.stop="handleDeleteClick"
      >
        <i v-if="showDeleteModal" class="bi bi-arrow-repeat spin"></i>
        <i v-else class="bi bi-trash3-fill"></i>
      </button>
    </div>

    <!-- Delete Modal (self-contained) -->
    <DeleteQueueModal
      :is-visible="showDeleteModal"
      :queue="{ ns, name }"
      @close="handleDeleteClose"
      @success="handleDeleteSuccess"
    />
  </li>
</template>

<style scoped>
.queue-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: white;
  border-bottom: 1px solid #e9ecef;
  cursor: pointer;
  transition: all 0.2s ease;
  list-style: none;
  position: relative;
}

.queue-item:hover {
  background: #f8f9fa;
}

.queue-item:focus {
  outline: 2px solid #0d6efd;
  outline-offset: -2px;
  background: #f8f9fa;
}

/* Icon */
.queue-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #e7f3ff 0%, #cce7ff 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0d6efd;
  font-size: 1.1rem;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.queue-item:hover .queue-icon {
  background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
  color: white;
}

/* Info */
.queue-info {
  flex: 1;
  min-width: 0;
}

.queue-name-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.queue-name {
  font-size: 1rem;
  font-weight: 600;
  color: #212529;
  font-family: 'Courier New', monospace;
  word-break: break-word;
}

.queue-namespace {
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
  background: #e8f5e8;
  color: #0f5132;
  border-radius: 12px;
  font-weight: 500;
  font-family: 'Courier New', monospace;
  white-space: nowrap;
}

/* Actions */
.queue-actions {
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.queue-item:hover .queue-actions {
  opacity: 1;
}

.btn-icon {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
}

.btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.view-btn {
  color: #0d6efd;
}

.view-btn:hover:not(:disabled) {
  background: #0d6efd;
  color: white;
}

.delete-btn {
  color: #dc3545;
}

.delete-btn:hover:not(:disabled) {
  background: #dc3545;
  color: white;
}

.btn-icon:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

/* Spinner animation */
.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .queue-item {
    padding: 0.875rem 1rem;
  }

  .queue-actions {
    opacity: 1;
  }
}

@media (max-width: 576px) {
  .queue-item {
    flex-wrap: wrap;
  }

  .queue-name-wrapper {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .queue-namespace {
    white-space: normal;
    word-break: break-word;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .queue-item,
  .queue-icon,
  .queue-actions,
  .btn-icon,
  .spin {
    transition: none;
    animation: none;
  }
}
</style>
