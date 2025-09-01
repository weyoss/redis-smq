<!--
  - Copyright (c)
  - Weyoss <weyoss@protonmail.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import type { IQueueParams } from '@/types';

interface Props {
  namespace: string;
  queueCount: number;
  recentQueues: { ns: string; name: string }[];
  isDeleting: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: 'click', namespace: string): void;
  (e: 'delete', namespace: string): void;
  (e: 'queue-click', queue: IQueueParams): void;
}>();

function handleQueueClick(queue: IQueueParams) {
  emit('queue-click', queue);
}
</script>

<template>
  <article
    class="namespace-card"
    :class="{ 'is-deleting': isDeleting }"
    role="button"
    tabindex="0"
    :aria-label="`View details for namespace ${namespace}`"
    @click="emit('click', namespace)"
    @keydown.enter="emit('click', namespace)"
    @keydown.space.prevent="emit('click', namespace)"
  >
    <!-- Deleting Overlay -->
    <div v-if="isDeleting" class="deleting-overlay">
      <div class="spinner-border text-light" role="status"></div>
      <span class="deleting-text">Deleting...</span>
    </div>

    <!-- Card Header -->
    <header class="card-header">
      <div class="header-content">
        <div class="header-icon">
          <i class="bi bi-folder2-open"></i>
        </div>
        <div class="header-text">
          <h3 class="namespace-name">{{ namespace }}</h3>
          <span class="namespace-label">Namespace</span>
        </div>
      </div>
      <button
        type="button"
        class="btn-delete"
        aria-label="Delete namespace"
        title="Delete namespace"
        @click.stop="emit('delete', namespace)"
      >
        <i class="bi bi-trash"></i>
      </button>
    </header>

    <!-- Card Body -->
    <main class="card-body">
      <div class="stats-section">
        <div class="stat-item">
          <span class="stat-value">{{ queueCount }}</span>
          <span class="stat-label">
            {{ queueCount === 1 ? 'Queue' : 'Queues' }}
          </span>
        </div>
      </div>

      <div class="queues-section">
        <h4 class="queues-title">
          <i class="bi bi-card-list me-2"></i>
          Sample Queues
        </h4>
        <ul v-if="recentQueues.length" class="queues-list">
          <li
            v-for="queue in recentQueues"
            :key="`${queue.name}@${queue.ns}`"
            class="queue-item"
          >
            <a
              href="#"
              class="queue-link"
              @click.stop="handleQueueClick(queue)"
              @keydown.enter.stop="handleQueueClick(queue)"
            >
              <span class="queue-name">{{ queue.name }}</span>
              <i class="bi bi-box-arrow-up-right queue-icon"></i>
            </a>
          </li>
        </ul>
        <p v-else class="no-queues-message">No queues in this namespace.</p>
      </div>
    </main>

    <!-- Card Footer -->
    <footer class="card-footer">
      <span class="footer-text">View all queues</span>
      <i class="bi bi-arrow-right"></i>
    </footer>
  </article>
</template>

<style scoped>
.namespace-card {
  position: relative;
  background-color: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.namespace-card:hover,
.namespace-card:focus-visible {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: #0d6efd;
}

.namespace-card:focus-visible {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
}

/* Deleting Overlay */
.deleting-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  color: white;
  gap: 0.75rem;
}

.deleting-text {
  font-weight: 500;
}

/* Card Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}

.header-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #e7f3ff 0%, #f8f9fa 100%);
  color: #0d6efd;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.header-text {
  min-width: 0;
}

.namespace-name {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #212529;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.namespace-label {
  font-size: 0.8rem;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-delete {
  background: none;
  border: none;
  color: #6c757d;
  font-size: 1.25rem;
  padding: 0.25rem;
  cursor: pointer;
  transition: color 0.2s ease;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-delete:hover {
  color: #dc3545;
  background-color: #f8d7da;
}

/* Card Body */
.card-body {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.stats-section {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-grow: 1;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #0d6efd;
}

.stat-label {
  font-size: 0.8rem;
  color: #6c757d;
  font-weight: 500;
}

.queues-section {
  flex-grow: 1;
}

.queues-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #495057;
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.queues-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.queue-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background-color: #f8f9fa;
  border-radius: 6px;
  text-decoration: none;
  color: #495057;
  transition: all 0.2s ease;
}

.queue-link:hover {
  background-color: #e7f3ff;
  color: #0d6efd;
}

.queue-name {
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.queue-icon {
  font-size: 0.8rem;
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.queue-link:hover .queue-icon {
  opacity: 1;
}

.no-queues-message {
  font-size: 0.9rem;
  color: #6c757d;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 6px;
  text-align: center;
}

/* Card Footer */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
  color: #0d6efd;
  font-weight: 500;
  font-size: 0.9rem;
  transition: color 0.2s ease;
}

.namespace-card:hover .card-footer {
  color: #0a58ca;
}
</style>
