<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
export interface PageAction {
  id: string;
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  tooltip?: string;
  onClick: () => void;
}

withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    icon?: string;
    actions?: PageAction[];
    loading?: boolean;
    loadingMessage?: string;
    error?: string | null;
    empty?: boolean;
    emptyIcon?: string;
    emptyTitle?: string;
    emptyMessage?: string;
    emptyActionLabel?: string;
    onEmptyAction?: () => void;
  }>(),
  {
    actions: () => [],
    loading: false,
    loadingMessage: 'Loading…',
    error: null,
    empty: false,
  },
);

function buttonClass(variant: PageAction['variant']): string {
  switch (variant) {
    case 'primary':
      return 'btn btn-primary';
    case 'danger':
      return 'btn btn-danger';
    case 'secondary':
    default:
      return 'btn btn-secondary';
  }
}
</script>

<template>
  <div class="page-shell">
    <header class="page-header">
      <div class="page-title-section">
        <div v-if="icon" class="page-icon">
          <i :class="icon" aria-hidden="true" />
        </div>
        <div class="page-title-content">
          <h1 class="page-title">{{ title }}</h1>
          <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
        </div>
      </div>
      <div v-if="actions.length" class="page-actions">
        <button
          v-for="action in actions"
          :key="action.id"
          :class="[buttonClass(action.variant), 'page-action']"
          :disabled="action.disabled || action.loading"
          :title="action.tooltip || action.label"
          @click="action.onClick"
        >
          <span
            v-if="action.loading"
            class="spinner-border spinner-border-sm me-1"
            aria-hidden="true"
          />
          <i
            v-else-if="action.icon"
            :class="action.icon"
            class="me-1"
            aria-hidden="true"
          />
          {{ action.label }}
        </button>
      </div>
    </header>

    <div class="page-body">
      <div v-if="loading" class="state-block">
        <div class="spinner-border text-primary" role="status" />
        <p class="state-message">{{ loadingMessage }}</p>
      </div>

      <div
        v-else-if="error"
        class="state-block state-block--error"
        role="alert"
      >
        <i
          class="bi bi-exclamation-triangle-fill state-icon"
          aria-hidden="true"
        />
        <p class="state-message">{{ error }}</p>
        <slot name="error-action" />
      </div>

      <div v-else-if="empty" class="state-block">
        <i
          v-if="emptyIcon"
          :class="[emptyIcon, 'state-icon']"
          aria-hidden="true"
        />
        <h2 v-if="emptyTitle" class="state-title">{{ emptyTitle }}</h2>
        <p v-if="emptyMessage" class="state-message">{{ emptyMessage }}</p>
        <button
          v-if="emptyActionLabel && onEmptyAction"
          class="btn btn-primary"
          @click="onEmptyAction"
        >
          {{ emptyActionLabel }}
        </button>
      </div>

      <slot v-else />
    </div>
  </div>
</template>

<style scoped>
.page-shell {
  overflow-x: hidden;
}

.page-header {
  background: var(--rsmq-color-surface);
  border-bottom: 1px solid var(--rsmq-color-border);
  padding: var(--rsmq-space-5);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--rsmq-space-5);
}
.page-title-section {
  display: flex;
  gap: var(--rsmq-space-4);
  align-items: center;
  min-width: 0;
  flex: 1;
}
.page-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--rsmq-radius-lg);
  background: linear-gradient(
    135deg,
    var(--rsmq-color-primary),
    var(--rsmq-color-primary-hover)
  );
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  flex-shrink: 0;
}
.page-title-content {
  min-width: 0;
}
.page-title {
  margin: 0 0 var(--rsmq-space-2);
  font-size: 2rem;
  font-weight: 700;
  color: var(--rsmq-color-text);
  overflow-wrap: anywhere;
}
.page-subtitle {
  margin: 0;
  color: var(--rsmq-color-text-muted);
  overflow-wrap: anywhere;
}
.page-actions {
  display: flex;
  gap: var(--rsmq-space-2);
  flex-wrap: wrap;
  flex-shrink: 0;
}

.page-body {
  padding: var(--rsmq-space-5);
  padding-bottom: calc(var(--rsmq-space-5) + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: var(--rsmq-space-4);
}

.state-block {
  background: var(--rsmq-color-surface);
  border-radius: var(--rsmq-radius-lg);
  padding: var(--rsmq-space-7) var(--rsmq-space-5);
  text-align: center;
  box-shadow: var(--rsmq-shadow-sm);
  max-width: 560px;
  margin: 0 auto;
}
.state-block .state-icon {
  font-size: 2.5rem;
  display: block;
  margin: 0 auto var(--rsmq-space-3);
  color: var(--rsmq-color-text-muted);
}
.state-block--error .state-icon {
  color: var(--rsmq-color-danger);
}
.state-title {
  margin: 0 0 var(--rsmq-space-3);
  font-size: 1.25rem;
  color: var(--rsmq-color-text);
}
.state-message {
  margin: 0;
  color: var(--rsmq-color-text-muted);
  line-height: 1.5;
  overflow-wrap: anywhere;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    padding: var(--rsmq-space-4);
  }
  .page-body {
    padding: var(--rsmq-space-4);
  }
  .page-icon {
    width: 48px;
    height: 48px;
    font-size: 1.5rem;
  }
  .page-title {
    font-size: 1.5rem;
  }
  .page-actions {
    width: 100%;
  }
  .page-actions .page-action {
    flex: 1 1 auto;
    justify-content: center;
  }
}
</style>
