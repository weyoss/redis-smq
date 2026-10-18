<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { ref } from 'vue';
import BaseModal from '@/components/ui/BaseModal.vue';
import StatCard from '@/components/ui/StatCard.vue';
import StatGrid from '@/components/ui/StatGrid.vue';

const showModal = ref(false);
const gridState = ref<'ok' | 'loading' | 'error' | 'empty'>('ok');

type StatCardTint =
  'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';

interface DemoStat {
  id: string;
  label: string;
  value: string;
  icon: string;
  tint: StatCardTint;
  percentage: number;
}

const stats: DemoStat[] = [
  {
    id: 'pending',
    label: 'Pending',
    value: '1,234',
    icon: 'bi-clock-history',
    tint: 'warning',
    percentage: 45,
  },
  {
    id: 'acknowledged',
    label: 'Acknowledged',
    value: '1,200',
    icon: 'bi-check-circle',
    tint: 'success',
    percentage: 40,
  },
  {
    id: 'dead',
    label: 'Dead-lettered',
    value: '12',
    icon: 'bi-x-octagon',
    tint: 'danger',
    percentage: 5,
  },
  {
    id: 'scheduled',
    label: 'Scheduled',
    value: '89',
    icon: 'bi-calendar-plus',
    tint: 'secondary',
    percentage: 10,
  },
];
</script>

<template>
  <div class="rsmq-container demo">
    <h1 class="demo__title">Refactor primitives — phase 1.1</h1>
    <p class="demo__lede">
      Every primitive below is phase-1.1 code. Toggle states to verify behavior;
      open the modal to verify focus trap, ESC, scrim click, scroll lock, and
      focus restore.
    </p>

    <section class="demo__section">
      <h2 class="demo__h2">StatGrid + StatCard</h2>
      <div class="demo__tabs" role="tablist">
        <button
          v-for="state in ['ok', 'loading', 'error', 'empty']"
          :key="state"
          type="button"
          class="btn btn-sm"
          :class="gridState === state ? 'btn-primary' : 'btn-outline-secondary'"
          @click="gridState = state"
        >
          {{ state }}
        </button>
      </div>

      <StatGrid
        :loading="gridState === 'loading'"
        :error="gridState === 'error' ? 'Failed to load statistics' : null"
        :empty="gridState === 'empty'"
        empty-message="No data available"
      >
        <StatCard
          v-for="s in stats"
          :key="s.id"
          :label="s.label"
          :value="s.value"
          :icon="s.icon"
          :tint="s.tint"
          :percentage="s.percentage"
        />
      </StatGrid>
    </section>

    <section class="demo__section">
      <h2 class="demo__h2">BaseModal</h2>
      <button class="btn btn-primary" @click="showModal = true">
        Open modal
      </button>

      <BaseModal
        :is-visible="showModal"
        title="Example modal"
        subtitle="Proves ESC, focus trap, scrim click, and scroll lock"
        icon="bi bi-info-circle"
        @close="showModal = false"
      >
        <template #body>
          <p>
            Press <kbd>Escape</kbd>, tab through the controls, or click the
            scrim — each one closes this modal.
          </p>
          <p>The page behind cannot scroll while this is open.</p>
        </template>
        <template #footer>
          <button class="btn btn-secondary" @click="showModal = false">
            Cancel
          </button>
          <button class="btn btn-primary" @click="showModal = false">
            Confirm
          </button>
        </template>
      </BaseModal>
    </section>
  </div>
</template>

<style scoped>
.demo {
  padding-block: var(--rsmq-space-6);
}

.demo__title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 var(--rsmq-space-2);
  color: var(--rsmq-color-text);
}

.demo__lede {
  color: var(--rsmq-color-text-muted);
  margin: 0 0 var(--rsmq-space-6);
  max-width: 60ch;
}

.demo__section {
  margin-bottom: var(--rsmq-space-6);
}

.demo__h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 var(--rsmq-space-3);
  color: var(--rsmq-color-text);
}

.demo__tabs {
  display: flex;
  gap: var(--rsmq-space-2);
  margin-bottom: var(--rsmq-space-3);
}
</style>
