<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed, ref } from 'vue';
import { formatDate } from '@/lib/format.ts';
import { EMessagePropertyStatus, type IAPIError } from '@/types/index.ts';
import ViewMessageModal from '@/components/modals/ViewMessageModal.vue';
import type { IMessageTransferable } from '@/api/model';

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
  // Core props
  messages: IMessageTransferable[];
  pagination: PaginationInfo;

  // Navigation functions
  onPageChange?: (page: number) => void | Promise<void>;
  onPageSizeChange?: (size: number) => void | Promise<void>;
  onFirstPage?: () => void | Promise<void>;
  onPreviousPage?: () => void | Promise<void>;
  onNextPage?: () => void | Promise<void>;
  onLastPage?: () => void | Promise<void>;
  onRefresh?: () => void | Promise<void>;
  onRetryConfig?: () => void | Promise<void>;
  onRetryQueueProperties?: () => void | Promise<void>;

  // Loading states
  isLoading?: boolean;
  isLoadingQueueProperties?: boolean;
  isConfigLoading?: boolean;

  // Error states
  error?: IAPIError | null;
  queuePropertiesError?: IAPIError | null;
  configError?: IAPIError | null;

  // Feature state
  isFeatureEnabled?: boolean | null;
  featureName?: string;
  enableRequeue?: boolean;

  // Queue selection
  hasSelectedQueue?: boolean;

  // UI customization
  showPagination?: boolean;
  emptyMessage?: string;
  icon?: string;
  noQueueMessage?: string;
  noQueueIcon?: string;
  enableMessage?: string;
}

const props = withDefaults(defineProps<Props>(), {
  onPageChange: undefined,
  onPageSizeChange: undefined,
  onFirstPage: undefined,
  onPreviousPage: undefined,
  onNextPage: undefined,
  onLastPage: undefined,
  onRefresh: undefined,
  onDeleteMessage: undefined,
  onRequeueMessage: undefined,
  onRetryConfig: undefined,
  onRetryQueueProperties: undefined,

  isLoading: false,
  isDeleting: false,
  isRequeuing: false,
  isLoadingQueueProperties: false,
  isConfigLoading: false,

  error: null,
  queuePropertiesError: null,
  configError: null,

  isFeatureEnabled: null,
  featureName: 'Feature',
  enableRequeue: false,

  hasSelectedQueue: true,

  showPagination: true,
  emptyMessage: 'No messages found',
  icon: 'bi-envelope',
  noQueueMessage: 'Please select a queue to view messages.',
  noQueueIcon: 'bi-inbox',
  enableMessage: 'This feature is disabled in the server configuration.',
});

// Modal state
const isModalVisible = ref(false);
const selectedMessage = ref<IMessageTransferable | null>(null);

const hasMessages = computed(() => props.messages.length > 0);

// Determine what to show
const showNoQueue = computed(() => !props.hasSelectedQueue);
const showQueuePropertiesLoading = computed(
  () => props.isLoadingQueueProperties,
);
const showQueuePropertiesError = computed(() => !!props.queuePropertiesError);
const showConfigLoading = computed(() => props.isConfigLoading);
const showConfigError = computed(() => !!props.configError);
const showFeatureDisabled = computed(() => props.isFeatureEnabled === false);
const showContent = computed(
  () =>
    props.hasSelectedQueue &&
    !props.isLoadingQueueProperties &&
    !props.queuePropertiesError &&
    !props.isConfigLoading &&
    !props.configError &&
    props.isFeatureEnabled !== false,
);

// Pagination
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

// Handlers
function handleMessageClick(message: IMessageTransferable) {
  selectedMessage.value = message;
  isModalVisible.value = true;
}

function closeMessageModal() {
  isModalVisible.value = false;
}

function onMessageDeleted() {
  closeMessageModal();
  props.onRefresh?.();
}

function onMessageRequeued() {
  closeMessageModal();
  props.onRefresh?.();
}

function handlePageSizeChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  if (props.onPageSizeChange) {
    props.onPageSizeChange(Number(target.value));
  }
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

function handleCardKeydown(
  e: KeyboardEvent,
  message: IMessageTransferable,
): void {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleMessageClick(message);
  }
}

// Controls visibility
const showControls = computed(() => {
  return showContent.value && (hasMessages.value || props.showPagination);
});
</script>

<template>
  <section class="messages-component" aria-live="polite">
    <!-- No Queue Selected -->
    <div v-if="showNoQueue" class="state-card">
      <div class="state-icon">
        <i :class="`bi ${noQueueIcon}`"></i>
      </div>
      <h4>No Queue Selected</h4>
      <p>{{ noQueueMessage }}</p>
    </div>

    <!-- Queue Properties Loading -->
    <div v-else-if="showQueuePropertiesLoading" class="loading-container">
      <div class="loading-content">
        <div class="spinner-border text-primary mb-3" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <h4>Loading queue properties...</h4>
        <p class="text-muted">Please wait while we fetch queue information</p>
      </div>
    </div>

    <!-- Queue Properties Error -->
    <div v-else-if="showQueuePropertiesError" class="error-container">
      <div class="error-content">
        <div class="error-icon">
          <i class="bi bi-exclamation-triangle-fill"></i>
        </div>
        <h4>Failed to load queue properties</h4>
        <p>
          {{ queuePropertiesError?.message || 'An unknown error occurred' }}
        </p>
        <button
          v-if="onRetryQueueProperties"
          class="btn btn-primary"
          @click="onRetryQueueProperties"
        >
          <i class="bi bi-arrow-clockwise me-2"></i>
          Try Again
        </button>
      </div>
    </div>

    <!-- Config Loading -->
    <div v-else-if="showConfigLoading" class="config-loading-alert">
      <div class="config-alert-row">
        <i class="bi bi-arrow-repeat config-alert-icon" aria-hidden="true"></i>
        <div class="config-alert-text">
          <strong>Loading configuration…</strong>
          <p class="config-alert-message">
            Checking server settings for {{ featureName?.toLowerCase() }}.
          </p>
        </div>
        <div class="config-alert-actions">
          <span
            class="spinner-border spinner-border-sm"
            aria-hidden="true"
          ></span>
        </div>
      </div>
    </div>

    <!-- Config Error -->
    <div v-else-if="showConfigError" class="config-error-alert">
      <div class="config-alert-row">
        <i
          class="bi bi-exclamation-triangle-fill config-alert-icon"
          aria-hidden="true"
        ></i>
        <div class="config-alert-text">
          <strong>Could not load server configuration</strong>
          <p class="config-alert-message">{{ configError?.message }}</p>
        </div>
        <div class="config-alert-actions">
          <button
            v-if="onRetryConfig"
            class="btn btn-sm btn-outline-primary"
            type="button"
            @click="onRetryConfig"
          >
            <i class="bi bi-arrow-clockwise me-1"></i>
            Retry
          </button>
        </div>
      </div>
    </div>

    <!-- Feature Disabled -->
    <div v-else-if="showFeatureDisabled" class="config-disabled-alert">
      <div class="config-alert-row">
        <i
          class="bi bi-info-circle-fill config-alert-icon"
          aria-hidden="true"
        ></i>
        <div class="config-alert-text">
          <strong>{{ featureName }} is disabled</strong>
          <p class="config-alert-message">{{ enableMessage }}</p>
        </div>
      </div>
    </div>

    <!-- Content -->
    <template v-else-if="showContent">
      <!-- Controls Bar -->
      <div v-if="showControls" class="controls-bar">
        <div class="controls-left">
          <span v-if="pagination.hasItems" class="results-info">
            {{ pagination.start }}-{{ pagination.end }} of
            {{ pagination.totalCount }} messages
          </span>
        </div>

        <div class="controls-right">
          <div class="control-group">
            <select
              v-if="showPagination"
              class="page-size-select"
              :value="pagination.pageSize"
              @change="handlePageSizeChange"
            >
              <option value="10">10 per page</option>
              <option value="20">20 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>

            <button
              v-if="onRefresh"
              class="refresh-btn"
              :class="{ 'is-loading': isLoading }"
              :disabled="isLoading"
              @click="onRefresh"
            >
              <i v-if="!isLoading" class="bi bi-arrow-clockwise"></i>
              <span
                v-if="isLoading"
                class="spinner-border spinner-border-sm"
              ></span>
              <span class="btn-text">{{
                isLoading ? 'Refreshing...' : 'Refresh'
              }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading && !hasMessages" class="state-card">
        <div class="spinner-border text-primary mb-3" role="status" />
        <h4>Loading messages...</h4>
        <p>Please wait while we fetch your messages</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="state-card error">
        <div class="error-icon">
          <i class="bi bi-exclamation-triangle-fill"></i>
        </div>
        <h4>Failed to load messages</h4>
        <p>{{ error.message }}</p>
        <button v-if="onRefresh" class="retry-btn" @click="onRefresh">
          <i class="bi bi-arrow-clockwise me-2"></i>
          Try Again
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="!hasMessages" class="state-card">
        <div class="empty-icon"><i :class="`bi ${icon}`"></i></div>
        <h4>{{ emptyMessage }}</h4>
        <p>Messages will appear here when they are available</p>
      </div>

      <!-- Messages List -->
      <div v-else class="messages-grid">
        <div
          v-for="message in messages"
          :key="message.id"
          class="message-card"
          tabindex="0"
          @click="handleMessageClick(message)"
          @keydown="handleCardKeydown($event, message)"
        >
          <div class="card-header">
            <div class="id-section">
              <span class="message-id">{{ message.id }}</span>
              <span class="message-date">{{
                formatDate(message.createdAt)
              }}</span>
            </div>
            <div class="badges">
              <span v-if="message.priority != null" class="badge priority">
                P{{ message.priority }}
              </span>
              <span
                v-if="message.status != null"
                class="badge"
                :class="`status-${message.status}`"
              >
                {{ EMessagePropertyStatus[message.status] }}
              </span>
            </div>
          </div>
          <div class="message-body">
            <pre>{{ formatMessageBody(message.body) }}</pre>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="showPagination && pagination.totalPages > 1"
        class="pagination-bar"
      >
        <button
          v-if="onFirstPage"
          class="page-nav"
          :disabled="!canGoPrevious"
          title="First page"
          @click="onFirstPage"
        >
          <i class="bi bi-chevron-double-left"></i>
        </button>
        <button
          v-if="onPreviousPage"
          class="page-nav"
          :disabled="!canGoPrevious"
          title="Previous page"
          @click="onPreviousPage"
        >
          <i class="bi bi-chevron-left"></i>
        </button>

        <div class="page-numbers">
          <button
            v-for="page in visiblePages"
            :key="page"
            class="page-number"
            :class="{ active: page === pagination.currentPage }"
            @click="onPageChange ? onPageChange(page) : null"
          >
            {{ page }}
          </button>
        </div>

        <button
          v-if="onNextPage"
          class="page-nav"
          :disabled="!canGoNext"
          title="Next page"
          @click="onNextPage"
        >
          <i class="bi bi-chevron-right"></i>
        </button>
        <button
          v-if="onLastPage"
          class="page-nav"
          :disabled="!canGoNext"
          title="Last page"
          @click="onLastPage"
        >
          <i class="bi bi-chevron-double-right"></i>
        </button>
      </div>
    </template>

    <!-- Message Modal -->
    <ViewMessageModal
      :show="isModalVisible"
      :message="selectedMessage"
      :enable-requeue="props.enableRequeue"
      @close="closeMessageModal"
      @message-deleted="onMessageDeleted"
      @message-requeued="onMessageRequeued"
    />
  </section>
</template>

<style scoped>
.messages-component {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
}

/* State Cards */
.state-card {
  text-align: center;
  padding: 3rem 2rem;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  max-width: 400px;
  margin: 0 auto;
}

.state-card h4 {
  margin: 1rem 0 0.5rem;
  color: #212529;
  font-size: 1.1rem;
  font-weight: 600;
}

.state-card p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.state-card.error {
  border-color: #f5c6cb;
  background: #fff5f5;
}

.state-card.error h4 {
  color: #721c24;
}

.state-card.error p {
  color: #856404;
}

.state-icon {
  font-size: 3rem;
  color: #6c757d;
  margin-bottom: 1rem;
}

.empty-icon {
  font-size: 3rem;
  color: #6c757d;
  margin-bottom: 1rem;
}

.error-icon {
  font-size: 3rem;
  color: #dc3545;
  margin-bottom: 1rem;
}

.retry-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 6px;
  background: #0d6efd;
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
  margin-top: 1.5rem;
}

.retry-btn:hover {
  background: #0b5ed7;
}

/* Loading Container */
.loading-container {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-content {
  text-align: center;
  max-width: 300px;
}

.loading-content h4 {
  margin: 1rem 0 0.5rem;
  color: #212529;
  font-size: 1.1rem;
  font-weight: 600;
}

.loading-content p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

/* Error Container */
.error-container {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-content {
  text-align: center;
  max-width: 400px;
  padding: 2rem;
}

.error-content h4 {
  margin: 0 0 0.5rem;
  color: #212529;
  font-size: 1.25rem;
  font-weight: 600;
}

.error-content p {
  margin: 0 0 1.5rem;
  color: #6c757d;
  font-size: 0.95rem;
}

/* Config Alerts */
.config-alert-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.config-alert-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.config-loading-alert {
  background: #cff4fc;
  border: 1px solid #b6effb;
  color: #055160;
  border-radius: 12px;
  padding: clamp(10px, 2.5vw, 16px);
  margin-bottom: clamp(12px, 2.5vw, 16px);
  box-shadow: 0 2px 4px rgba(5, 81, 96, 0.06);
}

.config-error-alert {
  background: #f8d7da;
  border: 1px solid #f5c2c7;
  color: #842029;
  border-radius: 12px;
  padding: clamp(10px, 2.5vw, 16px);
  margin-bottom: clamp(12px, 2.5vw, 16px);
  box-shadow: 0 2px 4px rgba(132, 32, 41, 0.06);
}

.config-disabled-alert {
  background: #fff3cd;
  border: 1px solid #ffe69c;
  color: #664d03;
  border-radius: 12px;
  padding: clamp(10px, 2.5vw, 16px);
  margin-bottom: clamp(12px, 2.5vw, 16px);
  box-shadow: 0 2px 4px rgba(102, 77, 3, 0.06);
}

.config-alert-text {
  display: grid;
  gap: 0.25rem;
  min-width: 0;
}

.config-alert-message {
  margin: 0;
  line-height: 1.4;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.config-alert-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
}

/* Controls Bar */
.controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
}

.results-info {
  color: #6c757d;
  font-size: 0.9rem;
  font-weight: 500;
}

.control-group {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.page-size-select {
  padding: 0.375rem 0.75rem;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #495057;
  background: white;
  cursor: pointer;
}

.page-size-select:focus {
  outline: none;
  border-color: #0d6efd;
  box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: white;
  color: #495057;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-btn:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #adb5bd;
}

.refresh-btn.is-loading {
  opacity: 0.7;
  cursor: not-allowed;
}

.refresh-btn i {
  font-size: 0.9rem;
}

/* Messages Grid */
.messages-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.message-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1rem 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
}

.message-card:hover {
  border-color: #0d6efd;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.message-card:focus-visible {
  border-color: #0d6efd;
  box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.25);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  gap: 1rem;
}

.id-section {
  flex: 1;
  min-width: 0;
}

.message-id {
  display: block;
  font-family: monospace;
  font-size: 0.85rem;
  color: #212529;
  font-weight: 600;
  word-break: break-all;
  margin-bottom: 0.25rem;
}

.message-date {
  font-size: 0.75rem;
  color: #6c757d;
}

.badges {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.badge.priority {
  background: #e7f3ff;
  color: #0d6efd;
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

.message-body pre {
  margin: 0;
  font-size: 0.85rem;
  color: #495057;
  white-space: pre-wrap;
  word-break: break-word;
  background: #f8f9fa;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  max-height: 150px;
  overflow-y: auto;
}

/* Pagination Bar */
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
  margin: 0 0.5rem;
}

.page-number {
  min-width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: white;
  color: #0d6efd;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-number:hover:not(.active) {
  background: #f8f9fa;
  border-color: #adb5bd;
}

.page-number.active {
  background: #0d6efd;
  border-color: #0d6efd;
  color: white;
}

.page-nav {
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: white;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-nav:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #adb5bd;
}

.page-nav:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .controls-bar {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }

  .control-group {
    justify-content: flex-end;
  }

  .pagination-bar {
    flex-wrap: wrap;
  }

  .page-numbers {
    order: -1;
    width: 100%;
    justify-content: center;
    margin-bottom: 0.5rem;
  }

  .config-alert-row {
    gap: 0.5rem;
  }
}

@media (max-width: 576px) {
  .control-group {
    flex-direction: column;
    gap: 0.5rem;
  }

  .page-size-select {
    width: 100%;
  }

  .refresh-btn {
    width: 100%;
    justify-content: center;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .badges {
    width: 100%;
    justify-content: flex-start;
  }

  .state-card,
  .error-content {
    padding: 2rem 1rem;
  }

  .error-content h4 {
    font-size: 1.1rem;
  }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .state-card,
  .controls-bar,
  .message-card,
  .pagination-bar,
  .config-loading-alert,
  .config-error-alert,
  .config-disabled-alert {
    background: #1a1a1a;
    border-color: #404040;
    color: #e6e6e6;
  }

  .state-card h4,
  .error-content h4,
  .loading-content h4 {
    color: #e6e6e6;
  }

  .state-card p,
  .error-content p,
  .loading-content p,
  .results-info,
  .message-date {
    color: #9ca3af;
  }

  .page-size-select,
  .refresh-btn,
  .page-number,
  .page-nav {
    background: #1a1a1a;
    border-color: #404040;
    color: #e6e6e6;
  }

  .page-number.active {
    background: #0b5ed7;
    border-color: #0b5ed7;
  }

  .message-body pre {
    background: #121212;
    border-color: #404040;
    color: #e6e6e6;
  }

  .state-card.error {
    background: #2a1a1a;
    border-color: #742a2a;
  }

  .state-card.error h4 {
    color: #f8d7da;
  }

  .state-card.error p {
    color: #f5c6cb;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .message-card,
  .refresh-btn,
  .page-number,
  .page-nav {
    transition: none;
  }
}
</style>
