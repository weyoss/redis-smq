<!--
  - Copyright (c)
  - Weyoss <weyoss@protonmail.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
const props = defineProps<{
  queue: {
    ns: string;
    name: string;
  };
}>();

const emit = defineEmits<{
  (e: 'select', ns: string, name: string): void;
  (e: 'delete', ns: string, name: string): void;
}>();

function handleView() {
  emit('select', props.queue.ns, props.queue.name);
}

function handleDelete() {
  emit('delete', props.queue.ns, props.queue.name);
}
</script>

<template>
  <li
    class="queue-item"
    tabindex="0"
    @click="handleView"
    @keydown.enter="handleView"
    @keydown.space.prevent="handleView"
  >
    <!-- Main Content Block -->
    <div class="queue-content">
      <!-- Icon -->
      <div class="queue-icon">
        <i class="bi bi-collection"></i>
      </div>

      <!-- Info Section -->
      <div class="queue-info">
        <div class="queue-header">
          <h5 class="queue-name" :title="`${queue.ns}:${queue.name}`">
            {{ queue.name }}
          </h5>
        </div>
        <div class="queue-details">
          <div class="queue-namespace">
            <i class="bi bi-tag-fill namespace-icon"></i>
            <span class="namespace-text">{{ queue.ns }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Status Indicator -->
    <div class="queue-status">
      <span class="status-indicator active" title="Queue is active">
        <i class="bi bi-circle-fill"></i>
      </span>
    </div>

    <!-- Action Buttons -->
    <div class="queue-actions">
      <button
        class="action-btn view-btn"
        title="View Queue Details"
        @click.stop="handleView"
      >
        <i class="bi bi-eye-fill"></i>
      </button>
      <button
        class="action-btn delete-btn"
        title="Delete Queue"
        @click.stop="handleDelete"
      >
        <i class="bi bi-trash3-fill"></i>
      </button>
    </div>

    <!-- Hover Arrow -->
    <div class="hover-indicator">
      <i class="bi bi-chevron-right"></i>
    </div>
  </li>
</template>

<style scoped>
/* Queue Item Container */
.queue-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  margin: 0;
  background: white;
  border: none;
  border-bottom: 1px solid #e9ecef;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  list-style: none;
}

.queue-item:first-child {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

.queue-item:last-child {
  border-bottom: none;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.queue-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #0d6efd;
  transform: scaleY(0);
  transition: transform 0.2s ease;
}

.queue-item:hover {
  background: #f8f9fa;
  border-color: #0d6efd;
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.15);
}

.queue-item:hover::before {
  transform: scaleY(1);
}

.queue-item:focus {
  outline: 2px solid #0d6efd;
  outline-offset: -2px;
  background: #f8f9fa;
}

.queue-item:focus::before {
  transform: scaleY(1);
}

/* Queue Content */
.queue-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

/* Queue Icon */
.queue-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #e7f3ff 0%, #cce7ff 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0d6efd;
  font-size: 1.2rem;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.queue-item:hover .queue-icon {
  background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
  color: white;
  transform: scale(1.05);
}

/* Queue Info */
.queue-info {
  flex: 1;
  min-width: 0;
}

.queue-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.queue-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #212529;
  margin: 0;
  font-family: 'Courier New', monospace;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  flex: 1;
}

.queue-status {
  flex-shrink: 0;
  margin: 0 1rem;
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  font-size: 0.6rem;
  color: #198754;
}

.status-indicator.active {
  color: #198754;
}

.queue-details {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.queue-namespace {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  background: #e8f5e8;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
}

.namespace-icon {
  color: #198754;
  font-size: 0.75rem;
}

.namespace-text {
  color: #0f5132;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

/* Queue Actions */
.queue-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  opacity: 0;
  transform: translateX(10px);
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.queue-item:hover .queue-actions {
  opacity: 1;
  transform: translateX(0);
}

.action-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.view-btn {
  background: #e7f3ff;
  color: #0d6efd;
}

.view-btn:hover {
  background: #0d6efd;
  color: white;
  transform: scale(1.1);
}

.delete-btn {
  background: #ffeaea;
  color: #dc3545;
}

.delete-btn:hover {
  background: #dc3545;
  color: white;
  transform: scale(1.1);
}

/* Hover Indicator */
.hover-indicator {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%) translateX(20px);
  opacity: 0;
  color: #0d6efd;
  font-size: 1rem;
  transition: all 0.2s ease;
  pointer-events: none;
}

.queue-item:hover .hover-indicator {
  opacity: 1;
  transform: translateY(-50%) translateX(0);
}

.queue-item:hover .queue-actions ~ .hover-indicator {
  opacity: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .queue-item {
    padding: 1.25rem 1.5rem;
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .queue-content {
    gap: 0.75rem;
  }

  .queue-icon {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }

  .queue-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .queue-name {
    font-size: 1rem;
  }

  .queue-details {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .queue-actions {
    opacity: 1;
    transform: translateX(0);
    justify-content: flex-end;
    margin-top: 0.5rem;
  }

  .hover-indicator {
    display: none;
  }
}

@media (max-width: 480px) {
  .queue-item {
    padding: 1rem;
  }

  .queue-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .queue-icon {
    width: 36px;
    height: 36px;
    font-size: 0.9rem;
  }

  .queue-name {
    font-size: 0.95rem;
  }

  .queue-namespace {
    font-size: 0.75rem;
    padding: 0.2rem 0.6rem;
  }

  .action-btn {
    width: 32px;
    height: 32px;
    font-size: 0.8rem;
  }
}

/* Focus and Active States */
.action-btn:focus {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
}

.delete-btn:focus {
  outline-color: #dc3545;
}

/* Animation for smooth interactions */
@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.queue-item:active .queue-icon {
  animation: pulse 0.3s ease;
}

/* High contrast mode support */
@media (prefers-contrast: more) {
  .queue-item {
    border-color: #000;
  }

  .queue-item:hover {
    background: #f0f0f0;
    border-color: #000;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .queue-item,
  .queue-icon,
  .queue-actions,
  .hover-indicator,
  .action-btn {
    transition: none;
  }

  .queue-item:hover .queue-icon {
    transform: none;
  }
}
</style>
