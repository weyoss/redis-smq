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
import CreateQueueModal from '@/components/modals/CreateQueueModal.vue';
import { useListQueues } from '@/composables/useListQueues';
import { useExchanges } from '@/composables/useExchanges';
import { useNamespaces } from '@/composables/useNamespaces';
import { useTypedRouter } from '@/router/typed';
import { formatNumber } from '@/lib/format';
import type { IQueueParams } from '@/api/model';
import type { PageAction } from '@/components/ui/PageShell.vue';

const router = useTypedRouter();

const queues = useListQueues();
const exchanges = useExchanges();
const namespaces = useNamespaces();

const showCreate = ref(false);
function openCreate() {
  showCreate.value = true;
}

function onCreated(params: IQueueParams) {
  showCreate.value = false;
  queues.refetch();
  exchanges.refetch();
  namespaces.refetch();
  router.go('queue', { ns: params.ns, queue: params.name });
}

const isLoading = computed(
  () =>
    queues.isLoading.value ||
    exchanges.isLoading.value ||
    namespaces.isLoading.value,
);

const error = computed(
  () =>
    queues.error.value ||
    exchanges.error.value ||
    namespaces.error.value ||
    null,
);

const stats = computed(() => [
  {
    id: 'queues',
    label: 'Queues',
    value: formatNumber(queues.queues.value.length),
    icon: 'bi-collection',
    tint: 'primary' as const,
  },
  {
    id: 'exchanges',
    label: 'Exchanges',
    value: formatNumber(exchanges.exchanges.value.length),
    icon: 'bi-diagram-3',
    tint: 'info' as const,
  },
  {
    id: 'namespaces',
    label: 'Namespaces',
    value: formatNumber(namespaces.namespaces.value.length),
    icon: 'bi-folder',
    tint: 'secondary' as const,
  },
]);

const recentQueues = computed(() => queues.sortedQueues.value.slice(0, 8));

const hasQueues = computed(() => queues.queues.value.length > 0);

// Quick actions — spec §C.2
const quickActions = computed(() => [
  {
    id: 'create-queue',
    title: 'Create queue',
    description: 'Set up a new message queue',
    icon: 'bi-plus-circle',
    onClick: openCreate,
  },
  {
    id: 'exchanges',
    title: 'Set up exchange',
    description: 'Route messages to queues',
    icon: 'bi-diagram-3',
    onClick: () => router.go('exchanges'),
  },
  {
    id: 'queues',
    title: 'View queues',
    description: 'Manage existing queues',
    icon: 'bi-list-ul',
    onClick: () => router.go('queues'),
  },
  {
    id: 'docs',
    title: 'Documentation',
    description: 'Learn more about RedisSMQ',
    icon: 'bi-book',
    onClick: () =>
      window.open(
        'https://github.com/weyoss/redis-smq/tree/master/packages/redis-smq/docs',
        '_blank',
        'noopener,noreferrer',
      ),
  },
]);

// Getting started steps — spec §C.2
const gettingStartedSteps = [
  {
    title: 'Create a queue',
    description: 'Create a new queue to hold your messages.',
  },
  {
    title: 'Publish a message',
    description: 'Send messages directly to your queue or through an exchange.',
  },
  {
    title: 'Consume messages',
    description: 'Build a consumer application to process messages.',
  },
  {
    title: 'Monitor & manage',
    description: 'Use the UI to monitor queues, exchanges, and messages.',
  },
];

const actions = computed<PageAction[]>(() => [
  {
    id: 'refresh',
    label: 'Refresh',
    icon: 'bi-arrow-clockwise',
    variant: 'secondary',
    loading: isLoading.value,
    onClick: () => {
      queues.refetch();
      exchanges.refetch();
      namespaces.refetch();
    },
  },
]);

const heroCtaLabel = computed(() =>
  hasQueues.value ? 'Create queue' : 'Get started',
);
</script>

<template>
  <PageShell
    title="Home"
    subtitle="RedisSMQ dashboard"
    icon="bi-house-door"
    :actions="actions"
    :loading="isLoading"
    :error="error"
  >
    <!-- Hero strip -->
    <section class="hero">
      <div class="hero__text">
        <div class="hero__icon" aria-hidden="true">
          <i class="bi bi-rocket-takeoff" />
        </div>
        <div class="hero__titles">
          <h2 class="hero__title">Welcome to RedisSMQ</h2>
          <p class="hero__subtitle">
            Powerful Redis-based message queue management
          </p>
        </div>
      </div>
      <button type="button" class="btn btn-light hero__cta" @click="openCreate">
        <i class="bi bi-plus-circle me-1" aria-hidden="true" />
        {{ heroCtaLabel }}
      </button>
    </section>

    <!-- Aggregate stats -->
    <StatGrid>
      <StatCard v-for="s in stats" :key="s.id" v-bind="s" />
    </StatGrid>

    <!-- Quick actions -->
    <Card title="Quick actions" icon="bi-lightning" :heading-level="2">
      <div class="quick-grid">
        <button
          v-for="action in quickActions"
          :key="action.id"
          type="button"
          class="quick-tile"
          @click="action.onClick"
        >
          <span class="quick-tile__icon" aria-hidden="true">
            <i :class="action.icon" />
          </span>
          <span class="quick-tile__text">
            <span class="quick-tile__title">{{ action.title }}</span>
            <span class="quick-tile__desc">{{ action.description }}</span>
          </span>
          <i class="bi bi-arrow-right quick-tile__chevron" aria-hidden="true" />
        </button>
      </div>
    </Card>

    <!-- Recent queues (when there are queues) -->
    <Card
      v-if="hasQueues"
      title="Recent queues"
      subtitle="Jump back into your most recently created queues"
      icon="bi-collection"
      :heading-level="2"
    >
      <template #actions>
        <RouterLink
          :to="{ name: 'queues' }"
          class="btn btn-sm btn-outline-secondary"
        >
          View all
          <i class="bi bi-arrow-right ms-1" aria-hidden="true" />
        </RouterLink>
      </template>
      <ul class="recent">
        <li v-for="q in recentQueues" :key="`${q.ns}-${q.name}`">
          <RouterLink
            :to="{ name: 'queue', params: { ns: q.ns, queue: q.name } }"
            class="recent__link"
          >
            <i class="bi bi-collection recent__icon" aria-hidden="true" />
            <span class="font-mono recent__name">{{ q.name }}</span>
            <span class="recent__ns">{{ q.ns }}</span>
            <i class="bi bi-chevron-right recent__chevron" aria-hidden="true" />
          </RouterLink>
        </li>
      </ul>
    </Card>

    <!-- Getting started (only when no queues yet) -->
    <Card
      v-if="!hasQueues"
      title="Getting started"
      subtitle="Four steps to your first message"
      icon="bi-signpost-2"
      :heading-level="2"
    >
      <ol class="steps">
        <li
          v-for="(step, i) in gettingStartedSteps"
          :key="step.title"
          class="steps__item"
        >
          <span class="steps__number" aria-hidden="true">{{ i + 1 }}</span>
          <div class="steps__text">
            <div class="steps__title">{{ step.title }}</div>
            <div class="steps__desc">{{ step.description }}</div>
          </div>
        </li>
      </ol>
      <div class="steps__actions">
        <button type="button" class="btn btn-primary" @click="openCreate">
          <i class="bi bi-plus-circle me-1" aria-hidden="true" />
          Create your first queue
        </button>
        <a
          href="https://github.com/weyoss/redis-smq/tree/master/packages/redis-smq/docs"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-outline-secondary"
        >
          <i class="bi bi-book me-1" aria-hidden="true" />
          Read documentation
        </a>
      </div>
    </Card>
  </PageShell>

  <CreateQueueModal
    :is-visible="showCreate"
    @close="showCreate = false"
    @created="onCreated"
  />
</template>

<style scoped>
/* Hero strip */
.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--rsmq-space-4);
  flex-wrap: wrap;
  padding: var(--rsmq-space-5);
  border-radius: var(--rsmq-radius-lg);
  background: linear-gradient(
    135deg,
    var(--rsmq-color-primary),
    var(--rsmq-color-primary-hover)
  );
  color: white;
  box-shadow: var(--rsmq-shadow-md);
}
.hero__text {
  display: flex;
  align-items: center;
  gap: var(--rsmq-space-4);
  min-width: 0;
  flex: 1 1 auto;
}
.hero__icon {
  width: 3rem;
  height: 3rem;
  border-radius: var(--rsmq-radius-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgb(255 255 255 / 20%);
  font-size: 1.5rem;
  flex-shrink: 0;
}
.hero__titles {
  min-width: 0;
}
.hero__title {
  margin: 0 0 var(--rsmq-space-1);
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  overflow-wrap: anywhere;
}
.hero__subtitle {
  margin: 0;
  font-size: 0.95rem;
  opacity: 0.9;
  overflow-wrap: anywhere;
}
.hero__cta {
  flex-shrink: 0;
  font-weight: 600;
}
@media (max-width: 576px) {
  .hero {
    flex-direction: column;
    align-items: stretch;
  }
  .hero__cta {
    width: 100%;
    justify-content: center;
  }
}

/* Quick actions */
.quick-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--rsmq-space-3);
}
.quick-tile {
  display: flex;
  align-items: center;
  gap: var(--rsmq-space-3);
  padding: var(--rsmq-space-3) var(--rsmq-space-4);
  background: var(--rsmq-color-bg);
  border: 1px solid var(--rsmq-color-border);
  border-radius: var(--rsmq-radius-md);
  text-align: left;
  color: var(--rsmq-color-text);
  cursor: pointer;
  font-size: 0.95rem;
  transition:
    transform var(--rsmq-transition),
    box-shadow var(--rsmq-transition),
    border-color var(--rsmq-transition);
  min-width: 0;
}
.quick-tile:hover {
  transform: translateY(-2px);
  box-shadow: var(--rsmq-shadow-md);
  border-color: var(--rsmq-color-primary);
}
.quick-tile__icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--rsmq-radius-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--rsmq-color-primary-tint);
  color: var(--rsmq-color-primary);
  font-size: 1.15rem;
  flex-shrink: 0;
}
.quick-tile__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.quick-tile__title {
  font-weight: 600;
  color: var(--rsmq-color-text);
  overflow-wrap: anywhere;
}
.quick-tile__desc {
  font-size: 0.8rem;
  color: var(--rsmq-color-text-muted);
  overflow-wrap: anywhere;
}
.quick-tile__chevron {
  color: var(--rsmq-color-text-subtle);
  font-size: 0.9rem;
  flex-shrink: 0;
}

/* Recent queues */
.recent {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--rsmq-space-1);
}
.recent__link {
  display: flex;
  align-items: center;
  gap: var(--rsmq-space-3);
  padding: var(--rsmq-space-2) var(--rsmq-space-3);
  border-radius: var(--rsmq-radius-sm);
  color: var(--rsmq-color-text);
  text-decoration: none;
  font-weight: 500;
  transition: background var(--rsmq-transition);
}
.recent__link:hover {
  background: var(--rsmq-color-primary-tint);
  color: var(--rsmq-color-text);
}
.recent__icon {
  color: var(--rsmq-color-primary);
  flex-shrink: 0;
}
.recent__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.recent__ns {
  font-size: 0.75rem;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  background: var(--rsmq-color-bg);
  color: var(--rsmq-color-text-muted);
  font-family: var(--rsmq-font-mono);
  flex-shrink: 0;
}
.recent__chevron {
  color: var(--rsmq-color-text-subtle);
  font-size: 0.8rem;
  flex-shrink: 0;
}

/* Getting started */
.steps {
  list-style: none;
  margin: 0 0 var(--rsmq-space-4);
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--rsmq-space-3);
}
.steps__item {
  display: flex;
  gap: var(--rsmq-space-3);
  align-items: flex-start;
}
.steps__number {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: var(--rsmq-color-primary);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  flex-shrink: 0;
}
.steps__text {
  min-width: 0;
}
.steps__title {
  font-weight: 600;
  color: var(--rsmq-color-text);
  margin-bottom: 2px;
}
.steps__desc {
  font-size: 0.875rem;
  color: var(--rsmq-color-text-muted);
  overflow-wrap: anywhere;
}
.steps__actions {
  display: flex;
  gap: var(--rsmq-space-2);
  flex-wrap: wrap;
}
@media (max-width: 576px) {
  .steps__actions {
    flex-direction: column;
  }
  .steps__actions .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
