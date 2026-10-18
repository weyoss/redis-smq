<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed } from 'vue';
import type { IQueueParams } from '@/api/model';
import { useQueueState } from '@/composables/useQueueState';
import { EQueueOperationalState } from '@/types/queues';
import { formatDate, formatSince } from '@/lib/format';

const props = defineProps<{
  queue: IQueueParams;
  state: EQueueOperationalState;
}>();

const emit = defineEmits<{ resume: [] }>();

const stateDetails = useQueueState(
  () => props.queue,
  () => props.state !== EQueueOperationalState.ACTIVE,
);

const config = computed(() => {
  switch (props.state) {
    case EQueueOperationalState.PAUSED:
      return {
        variant: 'warning' as const,
        icon: 'bi-pause-circle-fill',
        title: 'Queue is paused',
        message:
          'Messages are still accepted but not delivered to consumers. Resume when ready.',
        canResume: true,
      };
    case EQueueOperationalState.STOPPED:
      return {
        variant: 'danger' as const,
        icon: 'bi-stop-circle-fill',
        title: 'Queue is stopped',
        message:
          'Message production and consumption are both blocked. Consumers were disconnected.',
        canResume: true,
      };
    case EQueueOperationalState.LOCKED:
      return {
        variant: 'secondary' as const,
        icon: 'bi-lock-fill',
        title: 'Queue is locked',
        message:
          'Operations are restricted until the lock is released by its owner or it expires.',
        canResume: false,
      };
    default:
      return null;
  }
});

const details = computed(() => stateDetails.data.value);

function humanizeReason(r: string): string {
  return r
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}
</script>

<template>
  <div
    v-if="config"
    class="state-banner"
    :class="`state-banner--${config.variant}`"
    role="alert"
  >
    <div class="state-banner__icon" aria-hidden="true">
      <i :class="config.icon" />
    </div>

    <div class="state-banner__body">
      <h2 class="state-banner__title">{{ config.title }}</h2>
      <p class="state-banner__message">{{ config.message }}</p>

      <div v-if="details" class="state-banner__details">
        <span class="state-banner__chip">
          <i class="bi bi-flag" aria-hidden="true" />
          {{ humanizeReason(String(details.reason)) }}
        </span>
        <span class="state-banner__chip" :title="formatDate(details.timestamp)">
          <i class="bi bi-clock" aria-hidden="true" />
          {{ formatSince(details.timestamp) }}
        </span>
        <span v-if="details.description" class="state-banner__description">
          <i class="bi bi-info-circle" aria-hidden="true" />
          {{ details.description }}
        </span>
      </div>
      <div v-else-if="stateDetails.isLoading.value" class="state-banner__meta">
        <span class="spinner-border spinner-border-sm" aria-hidden="true" />
        Loading state details…
      </div>
      <div
        v-else-if="stateDetails.error.value"
        class="state-banner__meta state-banner__meta--error"
      >
        <i class="bi bi-exclamation-triangle" aria-hidden="true" />
        {{ stateDetails.error.value }}
      </div>
    </div>

    <div class="state-banner__actions">
      <button
        type="button"
        class="btn btn-sm btn-outline-secondary"
        :disabled="stateDetails.isLoading.value"
        title="Refresh state details"
        aria-label="Refresh state details"
        @click="stateDetails.refetch()"
      >
        <i
          class="bi bi-arrow-clockwise"
          :class="{ spin: stateDetails.isLoading.value }"
          aria-hidden="true"
        />
      </button>
      <button
        v-if="config.canResume"
        type="button"
        class="btn btn-sm btn-primary"
        @click="emit('resume')"
      >
        <i class="bi bi-play-fill me-1" aria-hidden="true" />
        Resume queue
      </button>
    </div>
  </div>
</template>

<style scoped>
.state-banner {
  display: flex;
  align-items: flex-start;
  gap: var(--rsmq-space-4);
  padding: var(--rsmq-space-4) var(--rsmq-space-5);
  border-radius: var(--rsmq-radius-lg);
  border: 1px solid;
  flex-wrap: wrap;
}

.state-banner--warning {
  background: #fff3cd;
  border-color: #ffc107;
  color: #664d03;
}

.state-banner--danger {
  background: #f8d7da;
  border-color: #dc3545;
  color: #721c24;
}

.state-banner--secondary {
  background: var(--rsmq-color-bg);
  border-color: var(--rsmq-color-border-strong);
  color: var(--rsmq-color-text);
}

.state-banner__icon {
  font-size: 1.5rem;
  line-height: 1;
  flex-shrink: 0;
  margin-top: 2px;
}

.state-banner__body {
  flex: 1;
  min-width: 0;
}

.state-banner__title {
  margin: 0 0 var(--rsmq-space-1);
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.2;
}

.state-banner__message {
  margin: 0 0 var(--rsmq-space-2);
  font-size: 0.9rem;
  line-height: 1.4;
  opacity: 0.9;
}

.state-banner__details {
  display: flex;
  align-items: center;
  gap: var(--rsmq-space-2);
  flex-wrap: wrap;
  font-size: 0.8rem;
}

.state-banner__chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgb(0 0 0 / 6%);
  white-space: nowrap;
}

.state-banner__chip .bi,
.state-banner__description .bi,
.state-banner__meta .bi {
  font-size: 0.75rem;
}

.state-banner__description {
  display: inline-flex;
  align-items: flex-start;
  gap: 4px;
  overflow-wrap: anywhere;
}

.state-banner__meta {
  display: flex;
  align-items: center;
  gap: var(--rsmq-space-2);
  font-size: 0.8rem;
  opacity: 0.85;
}

.state-banner__meta--error {
  color: #721c24;
  opacity: 1;
  font-weight: 500;
}

.state-banner__actions {
  display: flex;
  gap: var(--rsmq-space-2);
  flex-shrink: 0;
  margin-left: auto;
}

.state-banner__actions .btn {
  display: inline-flex;
  align-items: center;
}

@media (max-width: 768px) {
  .state-banner {
    padding: var(--rsmq-space-3) var(--rsmq-space-4);
  }

  .state-banner__actions {
    width: 100%;
    margin-left: 0;
  }

  .state-banner__actions .btn-primary {
    flex: 1;
    justify-content: center;
  }
}
</style>
