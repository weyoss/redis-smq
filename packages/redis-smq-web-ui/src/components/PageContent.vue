<!--
  - Copyright (c)
  - Weyoss <weyoss@protonmail.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { usePageContentStore, type PageAction } from '@/stores/pageContent.ts';
import { computed } from 'vue';

interface Props {
  showPageHeader?: boolean;
  showSectionHeader?: boolean;
  loadingMessage?: string;
  loadingTitle?: string;
}

const props = withDefaults(defineProps<Props>(), {
  showPageHeader: true,
  showSectionHeader: true,
  loadingMessage: 'Please wait while we load the content...',
  loadingTitle: 'Loading',
});

const pageContentStore = usePageContentStore();

// Computed properties from store
const state = computed(() => pageContentStore.state);
const hasPageActions = computed(() => pageContentStore.hasPageActions);
const hasSectionHeader = computed(() => pageContentStore.hasSectionHeader);
const hasError = computed(() => pageContentStore.hasError);
const showEmptyState = computed(() => pageContentStore.showEmptyState);

// Helper function to determine if icon is emoji or Bootstrap icon
function isEmoji(icon: string): boolean {
  if (!icon) return false;

  // Bootstrap icon classes always contain 'bi' and dashes/spaces
  if (
    icon.includes('bi-') ||
    icon.includes('bi ') ||
    icon.includes('-') ||
    icon.includes(' ')
  ) {
    return false;
  }

  // Simple check: if it's 1-4 characters and doesn't contain typical CSS class patterns
  // Most emojis are 1-2 characters, some complex ones can be up to 4 with modifiers
  const trimmed = icon.trim();
  return (
    trimmed.length >= 1 &&
    trimmed.length <= 4 &&
    !/^[a-zA-Z]/.test(trimmed) && // Doesn't start with letter (CSS classes do)
    !/\d+$/.test(trimmed)
  ); // Doesn't end with numbers only
}

// Handle action clicks
function handleActionClick(action: PageAction) {
  if (!action.disabled && !action.loading) {
    action.handler();
  }
}

// Handle action for empty state only
function handleEmptyStateAction() {
  if (state.value.emptyStateConfig?.actionHandler) {
    state.value.emptyStateConfig.actionHandler();
  }
}

// Get action button classes
function getActionButtonClass(action: PageAction) {
  const baseClass = 'btn';
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    refresh: 'btn-refresh',
  }[action.variant || 'refresh'];

  return `${baseClass} ${variantClass}`;
}
</script>

<template>
  <div class="page-content">
    <!-- Page Header -->
    <div v-if="showPageHeader" class="page-header">
      <div class="page-header-content">
        <div class="page-title-section">
          <!-- Page Icon -->
          <div v-if="state.pageIcon" class="page-icon">
            <span v-if="isEmoji(state.pageIcon)" class="emoji-icon">
              {{ state.pageIcon }}
            </span>
            <i v-else :class="state.pageIcon"></i>
          </div>
          <div class="title-content">
            <h1 class="page-title">{{ state.pageTitle }}</h1>
            <p v-if="state.pageSubtitle" class="page-subtitle">
              {{ state.pageSubtitle }}
            </p>
          </div>
        </div>
      </div>
      <div v-if="hasPageActions" class="page-actions">
        <button
          v-for="action in state.pageActions"
          :key="action.id"
          :class="getActionButtonClass(action)"
          :disabled="action.disabled || action.loading"
          :title="action.tooltip || action.label"
          @click="handleActionClick(action)"
        >
          <!-- Icon rendering with emoji/Bootstrap icon support -->
          <span
            v-if="action.icon && isEmoji(action.icon)"
            :class="{ 'spin-emoji': action.loading }"
            class="action-emoji"
          >
            {{ action.icon }}
          </span>
          <i
            v-else-if="action.icon"
            :class="[action.icon, { spin: action.loading }]"
          ></i>

          <span class="btn-text">{{ action.label }}</span>
        </button>
      </div>
    </div>

    <!-- Content Section -->
    <div class="content-section">
      <!-- Section Header -->
      <div
        v-if="props.showSectionHeader && hasSectionHeader"
        class="section-header"
      >
        <h2 v-if="state.sectionTitle" class="section-title">
          {{ state.sectionTitle }}
        </h2>
        <div v-if="state.sectionMeta" class="section-meta">
          {{ state.sectionMeta }}
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="state.isLoading" class="state-container loading-state">
        <div class="state-content">
          <div class="loading-spinner">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">{{ props.loadingMessage }}</span>
            </div>
          </div>
          <h3 class="state-title">{{ props.loadingTitle }}</h3>
          <p class="state-message">{{ props.loadingMessage }}</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="hasError" class="state-container error-state">
        <div class="state-content">
          <div class="state-icon error-icon">
            <span class="emoji-icon">⚠️</span>
          </div>
          <h3 class="state-title">
            {{ state.error?.title || 'An unexpected error occurred' }}
          </h3>
          <p class="state-message">{{ state.error?.message }}</p>
          <p v-if="state.error?.details" class="state-details">
            {{ state.error.details }}
          </p>
          <div class="state-actions">
            <slot name="error-actions">
              <!-- Error state has no default retry button since it doesn't have retryHandler -->
            </slot>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="showEmptyState && state.emptyStateConfig"
        class="state-container empty-state"
      >
        <div class="state-content">
          <div class="state-icon empty-icon">
            <span
              v-if="isEmoji(state.emptyStateConfig.icon)"
              class="emoji-icon"
            >
              {{ state.emptyStateConfig.icon }}
            </span>
            <i v-else :class="state.emptyStateConfig.icon"></i>
          </div>
          <h3 class="state-title">{{ state.emptyStateConfig.title }}</h3>
          <p class="state-message">{{ state.emptyStateConfig.message }}</p>
          <div class="state-actions">
            <slot name="empty-actions">
              <button
                v-if="state.emptyStateConfig.actionHandler"
                class="btn btn-primary"
                @click="handleEmptyStateAction"
              >
                {{ state.emptyStateConfig.actionLabel || 'Refresh' }}
              </button>
            </slot>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div v-else class="main-content">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Main Container */
.page-content {
  min-height: 100vh;
  background: #f8f9fa;
  /* Guard against accidental horizontal scroll from deeply nested content */
  overflow-x: hidden;
}

/* Page Header */
.page-header {
  background: white;
  border-bottom: 1px solid #e9ecef;
  padding: 2rem 2rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}

.page-header-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex: 1;
  /* Allow flex children to shrink and wrap text without causing overflow */
  min-width: 0;
}

.page-title-section {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex: 1;
  min-width: 0; /* prevent overflow due to min-content sizing */
}

.page-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.75rem;
  flex-shrink: 0;
}

.emoji-icon {
  font-size: 2rem;
  line-height: 1;
}

.title-content {
  flex: 1;
  min-width: 0; /* allow wrapping/ellipsis inside title area */
}

.page-title {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.2;
  /* Long titles should wrap gracefully */
  overflow-wrap: anywhere;
  word-break: break-word;
}

.page-subtitle {
  margin: 0;
  color: #6c757d;
  font-size: 1rem;
  line-height: 1.4;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.page-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap; /* wrap buttons to next line instead of overflowing */
  align-items: center;
}

.page-actions .btn {
  max-width: 100%;
}

/* Button Styles */
.btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: 2px solid;
  border-radius: 10px;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
  text-decoration: none;
  line-height: 1.2;
  /* Let button text wrap if needed to avoid overflow on small screens */
  white-space: normal;
}

.btn-refresh {
  background: white;
  border-color: #e9ecef;
  color: #495057;
}

.btn-refresh:hover:not(:disabled) {
  border-color: #0d6efd;
  color: #0d6efd;
  background: #f8f9ff;
}

.btn-primary {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5a6fd8;
  border-color: #5a6fd8;
  transform: translateY(-1px);
}

.btn-secondary {
  background: white;
  border-color: #6c757d;
  color: #6c757d;
}

.btn-secondary:hover:not(:disabled) {
  background: #6c757d;
  color: white;
}

.btn-danger {
  background: #dc3545;
  border-color: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
  border-color: #c82333;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-text {
  font-size: 0.875rem;
}

.btn-retry {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
}

.action-emoji {
  font-size: 1rem;
  line-height: 1;
}

/* Content Section */
.content-section {
  padding: 2rem;
  /* Respect safe area on devices with a home indicator */
  padding-bottom: calc(2rem + env(safe-area-inset-bottom));
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
}

.section-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.section-meta {
  color: #6c757d;
  font-size: 0.875rem;
  font-weight: 500;
  overflow-wrap: anywhere;
  word-break: break-word;
  min-width: 0;
  text-align: right;
}

/* State Containers */
.state-container {
  background: white;
  border-radius: 16px;
  padding: 4rem 2rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.state-content {
  max-width: 400px;
  margin: 0 auto;
}

.loading-spinner {
  margin-bottom: 1.5rem;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
  color: #667eea;
}

.state-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  margin: 0 auto 1.5rem;
}

.error-icon {
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
  color: white;
}

.empty-icon {
  background: #f1f3f4;
  color: #9aa0a6;
}

.state-icon .emoji-icon {
  font-size: 3rem;
}

.state-title {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.state-message {
  color: #6c757d;
  margin: 0 0 1rem 0;
  line-height: 1.5;
  font-size: 1rem;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.state-details {
  color: #6c757d;
  margin: 0 0 2rem 0;
  line-height: 1.4;
  font-size: 0.875rem;
  font-style: italic;
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* State Actions - Centered */
.state-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
  gap: 1rem;
}

/* Main Content */
.main-content {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  /* Keep content within bounds on small screens */
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* Make media fluid to avoid overflow from images/videos in slotted content */
.main-content img,
.state-content img,
.main-content video,
.state-content video {
  max-width: 100%;
  height: auto;
}

/* Animations */
.spin {
  animation: spin 1s linear infinite;
}

.spin-emoji {
  display: inline-block;
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

/* Responsive Design */
@media (max-width: 768px) {
  .page-header {
    padding: 1.5rem 1rem 1rem;
    flex-direction: column;
    align-items: stretch;
    gap: 1.5rem;
  }

  .page-header-content {
    gap: 1rem;
  }

  .page-icon {
    width: 48px;
    height: 48px;
    font-size: 1.5rem;
  }

  .page-title {
    font-size: 1.75rem;
  }

  .page-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .page-actions .btn {
    width: 100%;
    justify-content: center;
  }

  .content-section {
    padding: 1.5rem 1rem;
    padding-bottom: calc(1.5rem + env(safe-area-inset-bottom));
  }

  .main-content {
    padding: 1.5rem;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .section-meta {
    text-align: left;
  }

  .state-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .state-actions .btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 576px) {
  .page-header {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .content-section {
    padding: 1rem;
    padding-bottom: calc(1rem + env(safe-area-inset-bottom));
  }

  .state-container {
    padding: 3rem 1.5rem;
  }
}

/* Accessibility & Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .btn:hover {
    transform: none;
  }

  .spin,
  .spin-emoji {
    animation: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: more) {
  .page-icon {
    background: #000;
  }
}
</style>
