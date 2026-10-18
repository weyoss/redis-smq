<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed, toRef } from 'vue';
import PageShell from '@/components/ui/PageShell.vue';
import Card from '@/components/ui/Card.vue';
import StatCard from '@/components/ui/StatCard.vue';
import StatGrid from '@/components/ui/StatGrid.vue';
import StateBlock from '@/components/ui/StateBlock.vue';
import { useQueueSelection } from '@/composables/useQueueSelection';
import { useQueueProperties } from '@/composables/useQueueProperties';
import { useQueueStats } from '@/composables/useQueueStats';
import { useQueueRateLimit } from '@/composables/useQueueRateLimit';
import { useTypedRouter } from '@/router/typed';
import { formatCompact, formatNumber } from '@/lib/format';
import {
  EQueueDeliveryModel,
  EQueueOperationalState,
  EQueueType,
} from '@/types/queues';
import type { PageAction } from '@/components/ui/PageShell.vue';

const router = useTypedRouter();
const { ns, name, params } = useQueueSelection();

const properties = useQueueProperties(params);
const stats = useQueueStats(params);
const rateLimit = useQueueRateLimit(params);

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
  const s = properties.data.value?.operationalState;
  if (s === EQueueOperationalState.ACTIVE) return 'Active';
  if (s === EQueueOperationalState.PAUSED) return 'Paused';
  if (s === EQueueOperationalState.STOPPED) return 'Stopped';
  if (s === EQueueOperationalState.LOCKED) return 'Locked';
  return '—';
});

const statCards = computed(() => [
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
  {
    id: 'pending',
    label: 'Pending',
    value: formatNumber(stats.pending.value),
    icon: 'bi-clock-history',
    tint: 'warning' as const,
    percentage: stats.percentages.value.pending,
  },
]);

const actions = computed<PageAction[]>(() => [
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
]);
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
        <div v-if="rateLimit.isLoading.value">
          <StateBlock kind="loading" />
        </div>
        <div v-else-if="rateLimit.error.value">
          <StateBlock
            kind="error"
            icon="bi-exclamation-triangle-fill"
            :message="rateLimit.error.value"
          />
        </div>
        <div v-else-if="rateLimit.rateLimit.value">
          <p class="rate">
            <strong>{{ rateLimit.rateLimit.value.limit }}</strong>
            messages per
            <strong>{{ rateLimit.rateLimit.value.interval }}ms</strong>
          </p>
        </div>
        <p v-else class="rate rate--none">No rate limit configured.</p>
      </Card>
    </template>
  </PageShell>
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
.rate {
  margin: 0;
  font-size: 1rem;
}
.rate--none {
  color: var(--rsmq-color-text-muted);
  font-size: 0.9rem;
}
</style>
