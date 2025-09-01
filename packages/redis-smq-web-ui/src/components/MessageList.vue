<!--
  - Copyright (c)
  - Weyoss <weyoss@protonmail.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed, ref } from 'vue';
import { formatDate } from '@/lib/format.js';
import {
  EMessagePropertyStatus,
  type IMessageTransferable,
} from '@/types/index.js';
import ViewMessageModal from '@/components/modals/ViewMessageModal.vue';
import type { getErrorMessage } from '@/lib/error.ts';

interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  start: number;
  end: number;
  hasItems: boolean;
}

interface Props {
  messages: IMessageTransferable[];
  isLoading: boolean;
  error: ReturnType<typeof getErrorMessage>;
  pagination: PaginationInfo;
  showPagination: boolean;
  emptyMessage?: string;
  icon?: string;

  // Mutation states are now passed from the parent
  isDeleting: boolean;
  isRequeuing: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  emptyMessage: 'No messages found',
  icon: 'bi-envelope',
});

const emit = defineEmits<{
  (e: 'refresh'): void;
  (e: 'delete-message', messageId: string): void;
  (e: 'requeue-message', messageId: string): void;
  (e: 'page-change', page: number): void;
  (e: 'page-size-change', size: number): void;
  (e: 'first-page'): void;
  (e: 'previous-page'): void;
  (e: 'next-page'): void;
  (e: 'last-page'): void;
}>();

// Modal state is managed locally, as requested.
const isModalVisible = ref(false);
const selectedMessage = ref<IMessageTransferable | null>(null);

const hasMessages = computed(() => props.messages.length > 0);

// Pagination computed properties
const canGoPrevious = computed(() => props.pagination.currentPage > 1);
const canGoNext = computed(
  () => props.pagination.currentPage < props.pagination.totalPages,
);

const visiblePages = computed(() => {
  const pages: number[] = [];
  const maxVisible = 5;
  const half = Math.floor(maxVisible / 2);
  const { currentPage, totalPages } = props.pagination;

  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
});

// Event Handlers
function handleMessageClick(message: IMessageTransferable) {
  selectedMessage.value = message;
  isModalVisible.value = true;
}

function closeMessageModal() {
  isModalVisible.value = false;
}

function handleDelete(messageId: string) {
  emit('delete-message', messageId);
  // Close the modal immediately after emitting the action.
  closeMessageModal();
}

function handleRequeue(messageId: string) {
  emit('requeue-message', messageId);
  // Close the modal immediately after emitting the action.
  closeMessageModal();
}

function handlePageSizeChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  emit('page-size-change', Number(target.value));
}

function formatMessageBody(body: unknown): string {
  if (typeof body === 'string') {
    return body.length > 100 ? `${body.substring(0, 100)}...` : body;
  }
  if (body === null || body === undefined) {
    return 'null';
  }
  try {
    const jsonString = JSON.stringify(body);
    return jsonString.length > 100
      ? `${jsonString.substring(0, 100)}...`
      : jsonString;
  } catch {
    return String(body);
  }
}
</script>

<template>
  <div class="messages-component">
    <!-- Controls Section -->
    <div v-if="hasMessages || showPagination" class="messages-controls">
      <div class="controls-left">
        <div
          v-if="showPagination && pagination && pagination.hasItems"
          class="pagination-info"
        >
          <span class="info-text">
            Showing {{ pagination.start }}-{{ pagination.end }} of
            {{ pagination.totalCount }} messages
          </span>
        </div>
      </div>

      <div class="controls-right">
        <!-- Page Size Selector -->
        <div v-if="showPagination && pagination" class="page-size-selector">
          <label for="pageSize" class="selector-label">Per page:</label>
          <select
            id="pageSize"
            class="form-select form-select-sm"
            :value="pagination.pageSize"
            @change="handlePageSizeChange"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>

        <!-- Refresh Button -->
        <button
          class="btn btn-refresh"
          :class="{ 'btn-loading': isLoading }"
          :disabled="isLoading"
          @click="emit('refresh')"
        >
          <template v-if="isLoading">
            <span class="spinner-border spinner-border-sm me-2"></span>
            Refreshing...
          </template>
          <template v-else>
            <i class="bi bi-arrow-clockwise me-2"></i>
            Refresh
          </template>
        </button>
      </div>
    </div>

    <!-- Content Section -->
    <div class="messages-content">
      <!-- Loading State -->
      <div v-if="isLoading && !hasMessages" class="state-card loading-state">
        <div class="state-content">
          <div class="spinner-border text-primary mb-3"></div>
          <h5 class="state-title">Loading messages...</h5>
          <p class="state-subtitle">Please wait while we fetch your messages</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="state-card error-state">
        <div class="state-content">
          <div class="state-icon">
            <i class="bi bi-exclamation-triangle-fill text-danger"></i>
          </div>
          <div class="state-text">
            <h5 class="state-title">Failed to load messages</h5>
            <p class="state-message">{{ error.message }}</p>
          </div>
        </div>
        <div class="state-actions">
          <button class="btn btn-primary" @click="emit('refresh')">
            <i class="bi bi-arrow-clockwise me-2"></i>
            Try Again
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!hasMessages" class="state-card empty-state">
        <div class="state-content">
          <div class="state-icon">📭</div>
          <h4 class="state-title">{{ emptyMessage }}</h4>
          <p class="state-subtitle">
            Messages will appear here when they are available
          </p>
        </div>
      </div>

      <!-- Messages List -->
      <div v-else class="messages-list">
        <div
          v-for="message in messages"
          :key="message.id"
          class="message-card"
          @click="handleMessageClick(message)"
        >
          <div class="message-header">
            <div class="message-id-section">
              <span class="message-id">{{ message.id }}</span>
              <span class="message-date">{{
                formatDate(message.createdAt)
              }}</span>
            </div>
            <div class="message-metadata">
              <div
                v-if="
                  message.priority !== undefined && message.priority !== null
                "
                class="metadata-item"
              >
                <span class="metadata-label">Priority:</span>
                <span class="metadata-value priority-badge">{{
                  message.priority
                }}</span>
              </div>
              <div v-if="message.consumerGroupId" class="metadata-item">
                <span class="metadata-label">Group:</span>
                <span class="metadata-value">{{
                  message.consumerGroupId
                }}</span>
              </div>
              <div v-if="message.status !== undefined" class="metadata-item">
                <span class="metadata-label">Status:</span>
                <span
                  class="metadata-value status-badge"
                  :class="`status-${message.status}`"
                >
                  {{ EMessagePropertyStatus[message.status] }}
                </span>
              </div>
            </div>
          </div>
          <div class="message-body">
            <pre class="body-content">{{
              formatMessageBody(message.body)
            }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination Section -->
    <div
      v-if="showPagination && pagination && pagination.totalPages > 1"
      class="messages-pagination"
    >
      <nav class="pagination-nav" aria-label="Messages pagination">
        <ul class="pagination">
          <!-- First Page -->
          <li class="page-item" :class="{ disabled: !canGoPrevious }">
            <button
              class="page-link"
              :disabled="!canGoPrevious"
              title="First page"
              @click="emit('first-page')"
            >
              <i class="bi bi-chevron-double-left"></i>
            </button>
          </li>

          <!-- Previous Page -->
          <li class="page-item" :class="{ disabled: !canGoPrevious }">
            <button
              class="page-link"
              :disabled="!canGoPrevious"
              title="Previous page"
              @click="emit('previous-page')"
            >
              <i class="bi bi-chevron-left"></i>
            </button>
          </li>

          <!-- Page Numbers -->
          <li
            v-for="page in visiblePages"
            :key="page"
            class="page-item"
            :class="{ active: page === pagination.currentPage }"
          >
            <button
              class="page-link"
              :title="`Go to page ${page}`"
              @click="emit('page-change', page)"
            >
              {{ page }}
            </button>
          </li>

          <!-- Next Page -->
          <li class="page-item" :class="{ disabled: !canGoNext }">
            <button
              class="page-link"
              :disabled="!canGoNext"
              title="Next page"
              @click="emit('next-page')"
            >
              <i class="bi bi-chevron-right"></i>
            </button>
          </li>

          <!-- Last Page -->
          <li class="page-item" :class="{ disabled: !canGoNext }">
            <button
              class="page-link"
              :disabled="!canGoNext"
              title="Last page"
              @click="emit('last-page')"
            >
              <i class="bi bi-chevron-double-right"></i>
            </button>
          </li>
        </ul>
      </nav>
    </div>

    <!-- Message Details Modal -->
    <ViewMessageModal
      :show="isModalVisible"
      :message="selectedMessage"
      :is-deleting="isDeleting"
      :is-requeuing="isRequeuing"
      @close="closeMessageModal"
      @delete-message="handleDelete"
      @requeue-message="handleRequeue"
    />
  </div>
</template>

<style scoped>
/* Component Container */
.messages-component {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Controls Section */
.messages-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.controls-left {
  flex: 1;
}

.controls-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.pagination-info .info-text {
  color: #6c757d;
  font-size: 0.9rem;
  font-weight: 500;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.selector-label {
  font-size: 0.875rem;
  color: #6c757d;
  font-weight: 500;
  margin: 0;
  white-space: nowrap;
}

.form-select {
  border-radius: 6px;
  border: 1px solid #ced4da;
  min-width: 80px;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.form-select:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

.btn-refresh {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  background: #0d6efd;
  border: 1px solid #0d6efd;
  color: white;
  transition: all 0.2s ease;
  white-space: nowrap;
  cursor: pointer;
}

.btn-refresh:hover:not(:disabled) {
  background: #0b5ed7;
  border-color: #0a58ca;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(13, 110, 253, 0.25);
}

.btn-refresh:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Content Section */
.messages-content {
  flex: 1;
}

.state-card {
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.state-content {
  max-width: 400px;
  margin: 0 auto;
}

.state-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  display: block;
}

.state-title {
  color: #495057;
  margin-bottom: 0.5rem;
  font-weight: 600;
  font-size: 1.25rem;
}

.state-subtitle {
  color: #6c757d;
  margin: 0 0 1.5rem 0;
  font-size: 1rem;
  line-height: 1.5;
}

.state-message {
  color: #6c757d;
  margin: 0 0 1.5rem 0;
  font-size: 0.95rem;
  line-height: 1.5;
}

.state-text {
  margin-bottom: 1.5rem;
  text-align: center;
}

.state-actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
}

.btn-primary {
  background: #0d6efd;
  border: 1px solid #0d6efd;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: #0b5ed7;
  border-color: #0a58ca;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(13, 110, 253, 0.25);
}

/* Loading State */
.loading-state .spinner-border {
  width: 2.5rem;
  height: 2.5rem;
}

/* Error State */
.error-state .state-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  text-align: left;
  margin-bottom: 1.5rem;
}

.error-state .state-icon {
  font-size: 2rem;
  margin: 0;
  flex-shrink: 0;
}

.error-state .state-text {
  flex: 1;
  margin: 0;
}

.error-state .state-title {
  margin-bottom: 0.25rem;
  font-size: 1.125rem;
}

/* Messages List */
.messages-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.2s ease;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.message-card:hover {
  border-color: #0d6efd;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.message-id-section {
  flex: 1;
  min-width: 0;
}

.message-id {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.875rem;
  color: #495057;
  font-weight: 600;
  display: block;
  margin-bottom: 0.25rem;
  word-break: break-all;
}

.message-date {
  font-size: 0.75rem;
  color: #6c757d;
  font-weight: 500;
}

.message-metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.metadata-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
}

.metadata-label {
  color: #6c757d;
  font-weight: 500;
}

.metadata-value {
  color: #495057;
  font-weight: 600;
}

.priority-badge {
  background: #e7f3ff;
  color: #0d6efd;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.status-badge {
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.status-0 {
  background: #f8f9fa;
  color: #6c757d;
} /* SCHEDULED */
.status-1 {
  background: #fff3cd;
  color: #856404;
} /* PENDING */
.status-2 {
  background: #cff4fc;
  color: #055160;
} /* PROCESSING */
.status-3 {
  background: #d1e7dd;
  color: #0f5132;
} /* ACKNOWLEDGED */
.status-4 {
  background: #fff3cd;
  color: #856404;
} /* UNACK_DELAYING */
.status-5 {
  background: #fff3cd;
  color: #856404;
} /* UNACK_REQUEUING */
.status-6 {
  background: #f8d7da;
  color: #721c24;
} /* DEAD_LETTERED */

.message-body {
  margin-top: 1rem;
}

.body-content {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 1rem;
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.4;
  color: #495057;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow-y: auto;
}

/* Pagination Section */
.messages-pagination {
  display: flex;
  justify-content: center;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.pagination-nav {
  display: flex;
  justify-content: center;
}

.pagination {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 0.25rem;
}

.page-item {
  display: flex;
}

.page-link {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.75rem;
  border: 1px solid #dee2e6;
  background: white;
  color: #0d6efd;
  text-decoration: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 2.5rem;
  height: 2.5rem;
}

.page-link:hover:not(:disabled) {
  background: #e9ecef;
  border-color: #adb5bd;
  color: #0a58ca;
}

.page-link:disabled {
  color: #6c757d;
  background: #e9ecef;
  border-color: #dee2e6;
  cursor: not-allowed;
  opacity: 0.6;
}

.page-item.active .page-link {
  background: #0d6efd;
  border-color: #0d6efd;
  color: white;
}

.page-item.active .page-link:hover {
  background: #0b5ed7;
  border-color: #0a58ca;
}

.page-item.disabled .page-link {
  color: #6c757d;
  background: #e9ecef;
  border-color: #dee2e6;
  cursor: not-allowed;
}

/* Responsive Design */
@media (max-width: 768px) {
  .messages-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .controls-right {
    justify-content: space-between;
  }

  .message-header {
    flex-direction: column;
    gap: 0.75rem;
  }

  .message-metadata {
    justify-content: flex-start;
  }

  .pagination {
    gap: 0.125rem;
  }

  .page-link {
    padding: 0.375rem 0.5rem;
    min-width: 2rem;
    height: 2rem;
    font-size: 0.8125rem;
  }
}

@media (max-width: 480px) {
  .messages-component {
    gap: 1rem;
  }

  .messages-controls {
    padding: 0.75rem;
  }

  .message-card {
    padding: 1rem;
  }

  .state-card {
    padding: 2rem 1rem;
  }

  .state-icon {
    font-size: 2.5rem;
  }

  .state-title {
    font-size: 1.125rem;
  }

  .page-size-selector {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .controls-right {
    flex-direction: column;
    gap: 0.75rem;
  }

  .btn-refresh {
    width: 100%;
    justify-content: center;
  }
}
</style>
