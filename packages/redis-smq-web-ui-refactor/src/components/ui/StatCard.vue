<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
defineProps<{
  label: string;
  value: string | number;
  icon?: string;
  tint?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';
  percentage?: number;
  hint?: string;
}>();
</script>

<template>
  <div class="stat-card" :class="`stat-card--${tint ?? 'primary'}`">
    <div class="stat-card__head">
      <i v-if="icon" :class="icon" class="stat-card__icon" aria-hidden="true" />
      <span class="stat-card__label">{{ label }}</span>
      <span v-if="percentage !== undefined" class="stat-card__pct">
        {{ percentage }}%
      </span>
    </div>
    <div class="stat-card__value">{{ value }}</div>
    <div
      v-if="percentage !== undefined"
      class="stat-card__bar"
      aria-hidden="true"
    >
      <div
        class="stat-card__bar-fill"
        :style="{ width: `${Math.min(100, Math.max(0, percentage))}%` }"
      />
    </div>
    <p v-if="hint" class="stat-card__hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.stat-card {
  background: var(--rsmq-color-bg);
  border: 1px solid var(--rsmq-color-border);
  border-radius: var(--rsmq-radius-md);
  padding: var(--rsmq-space-4);
  display: flex;
  flex-direction: column;
  gap: var(--rsmq-space-2);
}

.stat-card__head {
  display: flex;
  align-items: center;
  gap: var(--rsmq-space-2);
}

.stat-card__icon {
  width: 2rem;
  height: 2rem;
  border-radius: var(--rsmq-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  background: var(--rsmq-color-primary-tint);
  color: var(--rsmq-color-primary);
  flex-shrink: 0;
}

.stat-card--success .stat-card__icon {
  background: #d4edda;
  color: var(--rsmq-color-success);
}
.stat-card--warning .stat-card__icon {
  background: #fff3cd;
  color: var(--rsmq-color-warning);
}
.stat-card--danger .stat-card__icon {
  background: #f8d7da;
  color: var(--rsmq-color-danger);
}
.stat-card--info .stat-card__icon {
  background: #cff4fc;
  color: var(--rsmq-color-info);
}
.stat-card--secondary .stat-card__icon {
  background: #e2e3e5;
  color: var(--rsmq-color-text-muted);
}

.stat-card__label {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--rsmq-color-text-muted);
}

.stat-card__pct {
  font-size: 0.75rem;
  color: var(--rsmq-color-text-subtle);
}

.stat-card__value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--rsmq-color-text);
}

.stat-card__bar {
  height: 4px;
  background: var(--rsmq-color-border);
  border-radius: 2px;
  overflow: hidden;
}

.stat-card__bar-fill {
  height: 100%;
  background: var(--rsmq-color-primary);
  transition: width var(--rsmq-transition);
}

.stat-card--success .stat-card__bar-fill {
  background: var(--rsmq-color-success);
}
.stat-card--warning .stat-card__bar-fill {
  background: var(--rsmq-color-warning);
}
.stat-card--danger .stat-card__bar-fill {
  background: var(--rsmq-color-danger);
}
.stat-card--info .stat-card__bar-fill {
  background: var(--rsmq-color-info);
}

.stat-card__hint {
  margin: 0;
  font-size: 0.75rem;
  color: var(--rsmq-color-text-subtle);
}
</style>