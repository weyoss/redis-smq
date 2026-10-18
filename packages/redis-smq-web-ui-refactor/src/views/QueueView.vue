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
import PageShell from '@/components/ui/PageShell.vue';
import Card from '@/components/ui/Card.vue';
import StatCard from '@/components/ui/StatCard.vue';
import StatGrid from '@/components/ui/StatGrid.vue';
import StateBlock from '@/components/ui/StateBlock.vue';
import ConfirmationModal from '@/components/modals/ConfirmationModal.vue';
import ChangeStateModal from '@/components/modals/ChangeStateModal.vue';
import { useQueueSelection } from '@/composables/useQueueSelection';
import { useQueueProperties } from '@/composables/useQueueProperties';
import { useQueueStats } from '@/composables/useQueueStats';
import { useQueueRateLimit } from '@/composables/useQueueRateLimit';
import { useRateLimitActions } from '@/composables/useRateLimitActions';
import { useTypedRouter } from '@/router/typed';
import { formatCompact, formatNumber } from '@/lib/format';
import { getErrorMessage } from '@/lib/error';
import { useDeleteQueue } from '@/api/generated/queue/queue';
import {
  EQueueDeliveryModel,
  EQueueOperationalState,
  EQueueType,
} from '@/types/queues';
import type { PageAction } from '@/components/ui/PageShell.vue';
import type { QueueStateAction } from '@/composables/useQueueStateTransition';

const router = useTypedRouter();
const { ns, name, params } = useQueueSelection();

const properties = useQueueProperties(params);
const stats = useQueueStats(params);
const rateLimit = useQueueRateLimit(params);
const rateLimitActions = useRateLimitActions(params, () => rateLimit.refetch());

// --- State-transition modal ---
const showStateModal = ref(false);
const stateAction = ref<QueueStateAction>('pause');

function openStateModal(action: QueueStateAction) {
  stateAction.value = action;
  showStateModal.value = true;
}

function onStateSuccess() {
  showStateModal.value = false;
  properties.refetch();
  stats.refetch();
}

// --- Delete modal ---
const showDeleteModal = ref(false);
const deleteError = ref<string | null>(null);

const deleteMutation = useDeleteQueue({
  mutation: {
    onSuccess: () => {
      showDeleteModal.value = false;
      router.go('queues');
    },
  },
});

async function onConfirmDelete() {
  const q = params.value;
  if (!q) return;
  deleteError.value = null;
  try {
    await deleteMutation.mutateAsync({ ns: q.ns, name: q.name });
  } catch (e) {
    deleteError.value = getErrorMessage(e);
  }
}

// --- Clear rate-limit modal ---
const showClearLimitModal = ref(false);
const clearLimitError = ref<string | null>(null);

async function onConfirmClearLimit() {
  clearLimitError.value = null;
  try {
    await rateLimitActions.clearRateLimit();
    showClearLimitModal.value = false;
  } catch (e) {
    clearLimitError.value = getErrorMessage(e);
  }
}

// --- Derived labels ---
const operational = computed(() => properties.data.value?.operationalState);

const isActive = computed(
  () => operational.value === EQueueOperationalState.ACTIVE,
);
const isPausedOrStopped = computed(
  () =>
    operational.value === EQueueOperationalState.PAUSED ||
    operational.value === EQueueOperationalState.STOPPED,
);

const queueLabel = computed(() =>
  name.value && ns.value ? `${name.value}@${ns.value}` : '',
);

const queueTypeLabel = computed(() => {
  const t = properties.data.value?.queueType;
  if (t === EQueueType.FIFO_QUEUE) return 'FIFO';
  if (t === EQueueType.LIFO_QUEUE) return 'LIFO';
  if (t === EQueueType.PRIORITY_QUEUE) return 'Priority';
  return '—';
});

const deliveryLabel = computed(() => {
  const m = properties.data.value?.deliveryModel;
  if (m === EQueueDeliveryModel.POINT_TO_POINT) return 'Point-to-Point';
  if (m === EQueueDeliveryModel.PUB_SUB) return 'Pub/Sub';
  return '—';
});

const operationalLabel = computed(() => {
  const s = operational.value;
  if (s === EQueueOperationalState.ACTIVE) return 'Active';
  if (s === EQueueOperationalState.PAUSED) return 'Paused';
  if (s === EQueueOperationalState.STOPPED) return 'Stopped';
  if (s === EQueueOperationalState.LOCKED) return 'Locked';
  return '—';
});

// --- Stat tiles ---
const statCards = computed(() => [
  {
    id: 'pending',
    label: 'Pending',
    value: formatNumber(stats.pending.value),
    icon: 'bi-clock-history',
    tint: 'warning' as const,
    percentage: stats.percentages.value.pending,
  },
  {
    id: 'acknowledged',
    label: 'Acknowledged',
    value: formatNumber(stats.acknowledged.value),
    icon: 'bi-check-circle',
    tint: 'success' as const,
    percentage: stats.percentages.value.acknowledged,
  },
  {
    id: 'dead',
    label: 'Dead-lettered',
    value: formatNumber(stats.deadLettered.value),
    icon: 'bi-x-octagon',
    tint: 'danger' as const,
    percentage: stats.percentages.value.deadLettered,
  },
  {
    id: 'scheduled',
    label: 'Scheduled',
    value: formatNumber(stats.scheduled.value),
    icon: 'bi-calendar-plus',
    tint: 'secondary' as const,
    percentage: stats.percentages.value.scheduled,
  },
]);

// --- Actions ---
const actions = computed<PageAction[]>(() => {
  const list: PageAction[] = [
    {
      id: 'view-messages',
      label: 'View messages',
      icon: 'bi-envelope',
      variant: 'primary',
      disabled: !params.value,
      onClick: () => {
        if (!params.value) return;
        router.go('messages', {
          ns: params.value.ns,
          queue: params.value.name,
        });
      },
    },
  ];

  if (isActive.value) {
    list.push(
      {
        id: 'pause',
        label: 'Pause',
        icon: 'bi-pause-circle',
        variant: 'secondary',
        onClick: () => openStateModal('pause'),
      },
      {
        id: 'stop',
        label: 'Stop',
        icon: 'bi-stop-circle',
        variant: 'secondary',
        onClick: () => openStateModal('stop'),
      },
    );
  } else if (isPausedOrStopped.value) {
    list.push({
      id: 'resume',
      label: 'Resume',
      icon: 'bi-play-circle',
      variant: 'secondary',
      onClick: () => openStateModal('resume'),
    });
  }

  list.push(
    {
      id: 'refresh',
      label: 'Refresh',
      icon: 'bi-arrow-clockwise',
      variant: 'secondary',
      loading: properties.isLoading.value || stats.isLoading.value,
      onClick: () => {
        properties.refetch();
        stats.refetch();
        rateLimit.refetch();
      },
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'bi-trash',
      variant: 'danger',
      onClick: () => {
        deleteError.value = null;
        showDeleteModal.value = true;
      },
    },
  );

  return list;
});
</script>

<template>
  <PageShell
    :title="`Queue: ${queueLabel}`"
    subtitle="Queue details"
    icon="bi-collection"
    :actions="actions"
    :loading="properties.isLoading.value"
    :error="properties.error.value"
  >
    <template v-if="properties.data.value">
      <StatGrid :loading="stats.isLoading.value" :error="stats.error.value">
        <StatCard v-for="s in statCards" :key="s.id" v-bind="s" />
      </StatGrid>

      <Card title="Configuration" icon="bi-gear" :heading-level="2">
        <dl class="config-grid">
          <div>
            <dt>Queue name</dt>
            <dd class="font-mono">{{ name }}</dd>
          </div>
          <div>
            <dt>Namespace</dt>
            <dd class="font-mono">{{ ns }}</dd>
          </div>
          <div>
            <dt>Queue type</dt>
            <dd>{{ queueTypeLabel }}</dd>
          </div>
          <div>
            <dt>Delivery model</dt>
            <dd>{{ deliveryLabel }}</dd>
          </div>
          <div>
            <dt>Operational state</dt>
            <dd>{{ operationalLabel }}</dd>
          </div>
          <div>
            <dt>Total messages</dt>
            <dd>{{ formatCompact(stats.total.value) }}</dd>
          </div>
        </dl>
      </Card>

      <Card title="Rate limiting" icon="bi-speedometer2" :heading-level="2">
        <StateBlock v-if="rateLimit.isLoading.value" kind="loading" />
        <StateBlock
          v-else-if="rateLimit.error.value"
          kind="error"
          icon="bi-exclamation-triangle-fill"
          :message="rateLimit.error.value"
        />
        <div v-else-if="rateLimit.rateLimit.value" class="rate-limit-row">
          <p class="rate">
            <strong>{{ rateLimit.rateLimit.value.limit }}</strong>
            messages per
            <strong>{{ rateLimit.rateLimit.value.interval }}ms</strong>
          </p>
          <button
            type="button"
            class="btn btn-sm btn-outline-danger"
            :disabled="rateLimitActions.isClearing.value"
            @click="showClearLimitModal = true"
          >
            <i class="bi bi-trash me-1" aria-hidden="true" />
            Clear
          </button>
        </div>
        <p v-else class="rate rate--none">No rate limit configured.</p>
      </Card>
    </template>
  </PageShell>

  <ChangeStateModal
    :is-visible="showStateModal"
    :queue="params"
    :action="stateAction"
    @close="showStateModal = false"
    @success="onStateSuccess"
  />

  <ConfirmationModal
    :is-visible="showDeleteModal"
    title="Delete queue"
    subtitle="This action cannot be undone"
    icon="bi-exclamation-triangle"
    :message="`Delete queue ${queueLabel}? All messages will be lost.`"
    confirm-label="Delete queue"
    confirm-variant="danger"
    :is-pending="deleteMutation.isPending.value"
    :error="deleteError"
    @close="showDeleteModal = false"
    @confirm="onConfirmDelete"
  />

  <ConfirmationModal
    :is-visible="showClearLimitModal"
    title="Clear rate limit"
    icon="bi-speedometer2"
    :message="`Remove rate limiting from ${queueLabel}?`"
    confirm-label="Clear rate limit"
    confirm-variant="warning"
    :is-pending="rateLimitActions.isClearing.value"
    :error="clearLimitError"
    @close="showClearLimitModal = false"
    @confirm="onConfirmClearLimit"
  />
</template>

<style scoped>
.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--rsmq-space-4);
  margin: 0;
}
.config-grid dt {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--rsmq-color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin-bottom: var(--rsmq-space-1);
}
.config-grid dd {
  margin: 0;
  color: var(--rsmq-color-text);
  font-weight: 600;
  overflow-wrap: anywhere;
}
.rate-limit-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--rsmq-space-3);
  flex-wrap: wrap;
}
.rate {
  margin: 0;
  font-size: 1rem;
}
.rate--none {
  margin: 0;
  color: var(--rsmq-color-text-muted);
  font-size: 0.9rem;
}
</style>
