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
  exchangeCount?: number;
  recentQueues: { ns: string; name: string }[];
  isDeleting: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  exchangeCount: 0,
});

const emit = defineEmits<{
  (e: 'click', namespace: string): void;
  (e: 'delete', namespace: string): void;
  (e: 'view-exchanges', namespace: string): void;
  (e: 'queue-click', queue: IQueueParams): void;
}>();

function handleQueueClick(queue: IQueueParams) {
  emit('queue-click', queue);
}

function handleViewExchanges(event: Event) {
  event.stopPropagation();
  emit('view-exchanges', props.namespace);
}
</script>

<template>
  <article
    class="namespace-card"
    :class="{ 'is-deleting': isDeleting }"
    tabindex="0"
    :aria-label="`View details for namespace ${namespace}`"
    @click="emit('click', namespace)"
    @keydown.enter="emit('click', namespace)"
    @keydown.space.prevent="emit('click', namespace)"
  >
    <!-- Deleting Overlay -->
    <div v-if="isDeleting" class="deleting-overlay">
      <div
        class="spinner-border text-light"
        role="status"
        aria-live="polite"
        aria-label="Deleting namespace"
      ></div>
      <span class="deleting-text">Deleting...</span>
    </div>

    <!-- Card Header -->
    <header class="card-header">
      <div class="header-content">
        <div class="header-icon" aria-hidden="true">
          <i class="bi bi-folder2-open"></i>
        </div>
        <div class="header-text">
          <h3 class="namespace-name">{{ namespace }}</h3>
          <span class="namespace-label">Namespace</span>
        </div>
      </div>
      <div class="header-actions">
        <button
          type="button"
          class="btn-action btn-exchanges"
          aria-label="View exchanges"
          title="View exchanges in this namespace"
          @click.stop="handleViewExchanges"
        >
          <i class="bi bi-diagram-3" aria-hidden="true"></i>
        </button>
        <button
          type="button"
          class="btn-action btn-delete"
          aria-label="Delete namespace"
          title="Delete namespace"
          @click.stop="emit('delete', namespace)"
        >
          <i class="bi bi-trash" aria-hidden="true"></i>
        </button>
      </div>
    </header>

    <!-- Card Body -->
    <main class="card-body">
      <div class="stats-section" role="group" aria-label="Namespace stats">
        <div class="stat-item">
          <span class="stat-value">{{ queueCount }}</span>
          <span class="stat-label">
            {{ queueCount === 1 ? 'Queue' : 'Queues' }}
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ exchangeCount }}</span>
          <span class="stat-label">
            {{ exchangeCount === 1 ? 'Exchange' : 'Exchanges' }}
          </span>
        </div>
      </div>

      <div class="queues-section">
        <h4 class="queues-title">
          <i class="bi bi-card-list me-2" aria-hidden="true"></i>
          Sample Queues
        </h4>
        <ul v-if="recentQueues.length" class="queues-list" role="list">
          <li
            v-for="queue in recentQueues"
            :key="`${queue.name}@${queue.ns}`"
            class="queue-item"
            role="listitem"
          >
            <!-- prevent default to avoid jumping to top on mobile -->
            <a
              href="#"
              class="queue-link"
              @click.prevent.stop="handleQueueClick(queue)"
              @keydown.enter.prevent.stop="handleQueueClick(queue)"
            >
              <span class="queue-name">{{ queue.name }}</span>
              <i
                class="bi bi-box-arrow-up-right queue-icon"
                aria-hidden="true"
              ></i>
            </a>
          </li>
        </ul>
        <p v-else class="no-queues-message">No queues in this namespace.</p>
      </div>
    </main>

    <!-- Card Footer -->
    <footer class="card-footer">
      <div class="footer-actions">
        <button
          type="button"
          class="footer-action"
          @click.stop="emit('click', namespace)"
        >
          <span class="footer-text">View all queues</span>
          <i class="bi bi-arrow-right" aria-hidden="true"></i>
        </button>
        <button
          type="button"
          class="footer-action"
          @click.stop="handleViewExchanges"
        >
          <span class="footer-text">View exchanges</span>
          <i class="bi bi-diagram-3" aria-hidden="true"></i>
        </button>
      </div>
    </footer>
  </article>
</template>

<style scoped>
/* Mobile-first: predictable sizing and overflow guards */
.namespace-card,
.namespace-card * {
  box-sizing: border-box;
  max-width: 100%;
}

.namespace-card img,
.namespace-card svg,
.namespace-card video {
  max-width: 100%;
  height: auto;
}

.namespace-card {
  position: relative;
  background-color: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: clamp(12px, 3.5vw, 24px);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* contains inner content; children use max-width to avoid bleed */
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
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  color: white;
  gap: 0.75rem;
  border-radius: 12px;
}

.deleting-text {
  font-weight: 500;
}

/* Card Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: clamp(8px, 2.8vw, 16px);
  margin-bottom: clamp(12px, 3vw, 24px);
  flex-wrap: wrap; /* allows actions to wrap below title on small screens */
}

.header-content {
  display: flex;
  align-items: center;
  gap: clamp(10px, 3vw, 16px);
  min-width: 0;
  flex: 1 1 auto;
}

.header-icon {
  width: clamp(40px, 7vw, 48px);
  height: clamp(40px, 7vw, 48px);
  background: linear-gradient(135deg, #e7f3ff 0%, #f8f9fa 100%);
  color: #0d6efd;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(1.1rem, 3.2vw, 1.5rem);
  flex-shrink: 0;
}

.header-text {
  min-width: 0;
}

.namespace-name {
  margin: 0;
  font-size: clamp(1.05rem, 3.2vw, 1.25rem);
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

/* Header actions: ensure comfortable tap targets */
.header-actions {
  display: flex;
  gap: clamp(6px, 2vw, 8px);
}

.btn-action {
  background: none;
  border: 1px solid transparent;
  color: #6c757d;
  font-size: 1.25rem;
  padding: 0; /* rely on min size */
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 10px;
  width: 44px; /* 44x44 recommended touch target */
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}

.btn-action:hover {
  background-color: #f1f3f5;
}

.btn-exchanges:hover {
  color: #0d6efd;
  background-color: #e7f3ff;
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
  gap: clamp(12px, 3vw, 24px);
}

/* Use a responsive grid for stats to avoid overflow on small screens */
.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: clamp(10px, 2.5vw, 16px);
  padding: clamp(10px, 2.8vw, 16px);
  background-color: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}

.stat-value {
  font-size: clamp(1.35rem, 4.2vw, 1.75rem);
  font-weight: 700;
  color: #0d6efd;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.8rem;
  color: #6c757d;
  font-weight: 500;
  overflow-wrap: anywhere;
}

/* Queues section with safe paddings */
.queues-section {
  flex-grow: 1;
}

.queues-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #495057;
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.queues-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: clamp(6px, 2vw, 8px);
}

.queue-item {
  min-width: 0; /* allow children to shrink */
}

.queue-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: clamp(8px, 2.5vw, 12px) clamp(10px, 3vw, 12px);
  background-color: #f8f9fa;
  border-radius: 8px;
  text-decoration: none;
  color: #495057;
  transition: all 0.2s ease;
  gap: 0.75rem;
  min-width: 0;
}

.queue-link:hover {
  background-color: #e7f3ff;
  color: #0d6efd;
}

.queue-name {
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1 1 auto;
  min-width: 0;
}

.queue-icon {
  font-size: 0.9rem;
  opacity: 0.6;
  flex-shrink: 0;
  transition: opacity 0.2s ease;
}

.queue-link:hover .queue-icon {
  opacity: 1;
}

.no-queues-message {
  font-size: 0.9rem;
  color: #6c757d;
  padding: clamp(10px, 2.8vw, 16px);
  background-color: #f8f9fa;
  border-radius: 8px;
  text-align: center;
  overflow-wrap: anywhere;
}

/* Card Footer */
.card-footer {
  margin-top: clamp(12px, 3vw, 24px);
  padding-top: clamp(10px, 2.5vw, 16px);
  border-top: 1px solid #e9ecef;
}

.footer-actions {
  display: flex;
  gap: clamp(8px, 2.5vw, 16px);
  flex-wrap: wrap; /* allow wrapping instead of overflow */
}

.footer-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1 1 240px;
  background: none;
  border: 1px solid transparent;
  color: #0d6efd;
  font-weight: 600;
  font-size: 0.95rem;
  padding: clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 16px);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px; /* improve tap target */
}

.footer-action:hover {
  background-color: #e7f3ff;
  color: #0a58ca;
  border-color: #cfe2ff;
}

.footer-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Responsive Design */
@media (max-width: 768px) {
  .namespace-name {
    /* still ellipsis on tablets */
    white-space: nowrap;
  }

  .footer-actions {
    /* make actions full width nicely on mid-small screens */
    gap: 0.75rem;
  }

  .footer-action {
    flex: 1 1 100%;
  }
}

@media (max-width: 576px) {
  /* Allow title to wrap to avoid ultra-narrow overflow */
  .namespace-name {
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .stats-section {
    grid-template-columns: 1fr;
  }

  .queue-link {
    align-items: flex-start;
  }

  .queue-name {
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
}

/* High contrast mode support */
@media (prefers-contrast: more) {
  .namespace-card {
    border-width: 2px;
  }

  .btn-action:focus-visible,
  .footer-action:focus-visible,
  .queue-link:focus-visible {
    outline: 3px solid;
    outline-offset: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .namespace-card,
  .btn-action,
  .footer-action,
  .queue-link {
    transition: none;
  }

  .namespace-card:hover {
    transform: none;
  }
}
</style>
