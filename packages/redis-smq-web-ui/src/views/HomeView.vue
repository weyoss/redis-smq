<!--
  - Copyright (c)
  - Weyoss <weyoss@protonmail.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQueryClient } from '@tanstack/vue-query';
import {
  getApiV1Queues,
  getGetApiV1QueuesQueryKey,
} from '@/api/generated/queues/queues.ts';
import {
  getApiV1NamespacesNsQueuesName,
  getGetApiV1NamespacesNsQueuesNameQueryKey,
} from '@/api/generated/queue/queue.ts';
import {
  getApiV1NamespacesNsQueuesNameConsumers,
  getGetApiV1NamespacesNsQueuesNameConsumersQueryKey,
} from '@/api/generated/consumers/consumers.ts';
import CreateQueueModal from '@/components/modals/CreateQueueModal.vue';

const router = useRouter();
const queryClient = useQueryClient();

// Local UI state: Create Queue modal
const showCreateQueueModal = ref(false);

const systemStats = ref({
  totalQueues: 0,
  totalMessages: 0,
  currentlyInProcess: 0,
  pendingMessages: 0,
  activeConsumers: 0,
  lastUpdated: new Date(),
});

const quickActions = [
  {
    title: 'Create Queue',
    description: 'Set up a new message queue',
    icon: 'bi-plus-circle-fill',
    color: 'info',
    // Open the self-contained modal instead of navigating away
    action: () => {
      showCreateQueueModal.value = true;
    },
  },
  {
    title: 'Set up Exchange',
    description: 'Bind your queue to an exchange',
    icon: 'bi-diagram-3',
    color: 'info',
    action: () => router.push({ name: 'Exchanges' }),
  },
  {
    title: 'View Queues',
    description: 'Manage existing queues',
    icon: 'bi-list-ul',
    color: 'info',
    action: () => router.push({ name: 'Queues' }),
  },
  {
    title: 'Documentation',
    description: 'Learn more about RedisSMQ',
    icon: 'bi-book-fill',
    color: 'info',
    action: () =>
      window.open(
        'https://github.com/weyoss/redis-smq/tree/master/packages/redis-smq/docs/README.md',
        '_blank',
      ),
  },
];

const isLoading = ref(true);

// Computed properties
const formattedStats = computed(() => ({
  totalQueues: systemStats.value.totalQueues.toLocaleString(),
  totalMessages: systemStats.value.totalMessages.toLocaleString(),
  pendingMessages: systemStats.value.pendingMessages.toLocaleString(),
  currentlyInProcess: systemStats.value.currentlyInProcess.toLocaleString(),
  activeConsumers: systemStats.value.activeConsumers.toLocaleString(),
}));

// Methods
const loadDashboardData = async () => {
  try {
    isLoading.value = true;

    // Fetch all queues imperatively using the query client
    const queuesResponse = await queryClient.fetchQuery({
      queryKey: getGetApiV1QueuesQueryKey(),
      queryFn: () => getApiV1Queues(),
    });
    const queues = queuesResponse.data;

    if (!queues || queues.length === 0) {
      Object.assign(systemStats.value, {
        totalQueues: 0,
        totalMessages: 0,
        pendingMessages: 0,
        currentlyInProcess: 0,
        activeConsumers: 0,
        lastUpdated: new Date(),
      });
      return;
    }

    // For each queue, create promises to fetch its details and consumers
    const promises = queues.map(async (queue) => {
      const detailsPromise = queryClient.fetchQuery({
        queryKey: getGetApiV1NamespacesNsQueuesNameQueryKey(
          queue.ns,
          queue.name,
        ),
        queryFn: () => getApiV1NamespacesNsQueuesName(queue.ns, queue.name),
      });

      const consumersPromise = queryClient.fetchQuery({
        queryKey: getGetApiV1NamespacesNsQueuesNameConsumersQueryKey(
          queue.ns,
          queue.name,
        ),
        queryFn: () =>
          getApiV1NamespacesNsQueuesNameConsumers(queue.ns, queue.name),
      });

      const [detailsResponse, consumersResponse] = await Promise.all([
        detailsPromise,
        consumersPromise,
      ]);

      const details = detailsResponse.data;
      const consumers = consumersResponse.data ?? {};

      return { details, consumers };
    });

    const results = await Promise.all(promises);

    // Aggregate results
    const newStats = results.reduce(
      (acc, result) => {
        if (result.details) {
          acc.totalMessages += result.details.messagesCount ?? 0;
          acc.pendingMessages += result.details.pendingMessagesCount ?? 0;
          acc.currentlyInProcess += result.details.processingMessagesCount ?? 0;
        }
        if (result.consumers) {
          acc.activeConsumers += Object.keys(result.consumers).length;
        }
        return acc;
      },
      {
        totalMessages: 0,
        pendingMessages: 0,
        currentlyInProcess: 0,
        activeConsumers: 0,
      },
    );

    systemStats.value = {
      ...newStats,
      totalQueues: queues.length,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
  } finally {
    isLoading.value = false;
  }
};

// Lifecycle
onMounted(() => {
  loadDashboardData();
});
</script>

<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">
            <span class="hero-icon">🚀</span>
            Welcome to RedisSMQ
          </h1>
          <p class="hero-subtitle">
            Powerful Redis-based message queue management made simple
          </p>
          <div class="hero-stats">
            <div class="stat-item">
              <span class="stat-value">{{ formattedStats.totalQueues }}</span>
              <span class="stat-label">Active Queues</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ formattedStats.totalMessages }}</span>
              <span class="stat-label">Messages Processed</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{
                formattedStats.activeConsumers
              }}</span>
              <span class="stat-label">Active Consumers</span>
            </div>
          </div>
        </div>
        <div class="hero-actions">
          <button
            class="btn btn-primary btn-lg hero-btn"
            @click="router.push({ name: 'Queues' })"
          >
            <i class="bi bi-plus-circle me-2"></i>
            Get Started
          </button>
        </div>
      </div>
    </section>

    <!-- Main Dashboard -->
    <main class="dashboard-main">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-section">
        <div class="loading-content">
          <div
            class="spinner-border text-primary mb-3"
            role="status"
            aria-live="polite"
            aria-label="Loading dashboard"
          ></div>
          <h5 class="loading-title">Loading dashboard...</h5>
          <p class="loading-subtitle">Fetching system information</p>
        </div>
      </div>

      <!-- Dashboard Content -->
      <div v-else class="dashboard-content">
        <!-- Quick Actions -->
        <section class="actions-section">
          <div class="section-header">
            <h2 class="section-title">
              <i class="bi bi-lightning-fill me-2"></i>
              Quick Actions
            </h2>
          </div>

          <div class="actions-grid">
            <div
              v-for="action in quickActions"
              :key="action.title"
              class="action-card"
              :class="`action-${action.color}`"
              @click="action.action"
            >
              <div class="action-icon">
                <i :class="action.icon"></i>
              </div>
              <div class="action-content">
                <h3 class="action-title">{{ action.title }}</h3>
                <p class="action-description">{{ action.description }}</p>
              </div>
              <div class="action-arrow">
                <i class="bi bi-arrow-right"></i>
              </div>
            </div>
          </div>
        </section>

        <!-- Getting Started -->
        <section class="getting-started-section">
          <div class="getting-started-card">
            <div class="getting-started-content">
              <h2 class="getting-started-title">
                <i class="bi bi-rocket-takeoff me-2"></i>
                Getting Started
              </h2>
              <p class="getting-started-description">
                New to RedisSMQ? Follow these steps to set up your first message
                queue and start processing messages.
              </p>
              <div class="getting-started-steps">
                <div class="step-item">
                  <div class="step-number">1</div>
                  <div class="step-content">
                    <h4 class="step-title">Create a Queue</h4>
                    <p class="step-description">
                      Create a new queue to hold your messages.
                    </p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">2</div>
                  <div class="step-content">
                    <h4 class="step-title">Publish a Message</h4>
                    <p class="step-description">
                      Send messages directly to your queue or publish them
                      through an exchange.
                    </p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">3</div>
                  <div class="step-content">
                    <h4 class="step-title">Consume Messages</h4>
                    <p class="step-description">
                      Build a consumer in your application to process messages
                      from the queue.
                    </p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">4</div>
                  <div class="step-content">
                    <h4 class="step-title">Monitor & Manage</h4>
                    <p class="step-description">
                      Use the Web UI to monitor your queues, exchanges, and
                      messages in real-time.
                    </p>
                  </div>
                </div>
              </div>
              <div class="getting-started-actions">
                <button
                  class="btn btn-primary"
                  @click="router.push({ name: 'Queues' })"
                >
                  <i class="bi bi-plus-circle me-2"></i>
                  Create Your First Queue
                </button>
                <a
                  href="https://github.com/weyoss/redis-smq/tree/master/packages/redis-smq/docs/README.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn btn-outline-secondary"
                >
                  <i class="bi bi-book me-2"></i>
                  Read Documentation
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Create Queue Modal -->
    <CreateQueueModal
      :is-visible="showCreateQueueModal"
      @close="showCreateQueueModal = false"
      @created="loadDashboardData"
    />
  </div>
</template>

<style scoped>
/* Mobile-first safety: sizing and overflow guards */
.home-page,
.home-page * {
  box-sizing: border-box;
}

.home-page {
  min-height: calc(100vh - 200px);
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  overflow-x: hidden;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
  touch-action: manipulation;
}

.hero-section {
  /* Use clamp + safe-area for comfortable gutters on mobile */
  padding: clamp(24px, 6vw, 64px) clamp(16px, 4vw, 32px);
  padding-top: calc(clamp(24px, 6vw, 64px) + env(safe-area-inset-top));
  padding-bottom: calc(clamp(24px, 6vw, 64px) + env(safe-area-inset-bottom));
  background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
  color: white;
  margin-bottom: clamp(16px, 3vw, 32px);
  border-radius: 16px;
}

.hero-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(16px, 4vw, 48px);
  flex-wrap: nowrap;
}

.hero-text {
  flex: 1;
  min-width: 0; /* allow children to shrink without overflow */
}

.hero-title {
  font-size: clamp(1.75rem, 4.5vw, 3rem);
  font-weight: 700;
  margin-bottom: clamp(8px, 1.5vw, 16px);
  display: flex;
  align-items: center;
  flex-wrap: wrap; /* allow wrapping to avoid overflow */
  gap: clamp(8px, 2vw, 16px);
  overflow-wrap: anywhere;
  word-break: break-word;
}

.hero-icon {
  font-size: clamp(2rem, 6vw, 3.5rem);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.hero-subtitle {
  font-size: clamp(1rem, 2.8vw, 1.25rem);
  opacity: 0.9;
  margin-bottom: clamp(16px, 3vw, 32px);
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: clamp(12px, 3vw, 24px);
  margin-bottom: clamp(12px, 2.5vw, 24px);
}

.stat-item {
  text-align: center;
  min-width: 0;
}

.stat-value {
  display: block;
  font-size: clamp(1.25rem, 4.2vw, 2rem);
  font-weight: 700;
  margin-bottom: 0.25rem;
  overflow-wrap: anywhere;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  overflow-wrap: anywhere;
}

/* Main container with safe-area bottom padding */
.dashboard-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 clamp(12px, 3vw, 32px) clamp(16px, 3vw, 32px);
  padding-bottom: calc(clamp(16px, 3vw, 32px) + env(safe-area-inset-bottom));
}

/* Loading Section */
.loading-section {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(24px, 6vw, 64px) clamp(16px, 4vw, 32px);
}

.loading-content {
  text-align: center;
  max-width: 480px;
  margin: 0 auto;
  padding: 0 clamp(8px, 2vw, 12px);
}

.loading-title {
  color: #495057;
  margin-bottom: 0.5rem;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.loading-subtitle {
  color: #6c757d;
  margin: 0;
  overflow-wrap: anywhere;
}

/* Dashboard Content */
.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: clamp(16px, 4vw, 48px);
}

/* Section Headers */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: clamp(12px, 2.5vw, 24px);
  gap: clamp(8px, 2vw, 16px);
}

.section-title {
  font-size: clamp(1.125rem, 2.8vw, 1.5rem);
  font-weight: 600;
  color: #212529;
  margin: 0;
  display: flex;
  align-items: center;
  overflow-wrap: anywhere;
}

.refresh-btn {
  white-space: nowrap;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: clamp(12px, 3vw, 24px);
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: clamp(16px, 3.5vw, 32px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  gap: clamp(12px, 2.5vw, 24px);
  transition: all 0.2s ease;
  min-width: 0;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: clamp(44px, 8vw, 60px);
  height: clamp(44px, 8vw, 60px);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(1.1rem, 3.5vw, 1.5rem);
  color: white;
  flex-shrink: 0;
}

.queues-icon {
  background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
}

.messages-icon {
  background: linear-gradient(135deg, #198754 0%, #157347 100%);
}

.consumers-icon {
  background: linear-gradient(135deg, #6f42c1 0%, #5a2d91 100%);
}

.uptime-icon {
  background: linear-gradient(135deg, #fd7e14 0%, #e55a00 100%);
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-number {
  font-size: clamp(1.25rem, 4.5vw, 2rem);
  font-weight: 700;
  color: #212529;
  margin-bottom: 0.25rem;
  overflow-wrap: anywhere;
}

.stat-title {
  font-size: 1rem;
  font-weight: 600;
  color: #495057;
  margin-bottom: 0.25rem;
  overflow-wrap: anywhere;
}

.stat-description {
  font-size: 0.85rem;
  color: #6c757d;
  overflow-wrap: anywhere;
}

/* Actions Grid */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: clamp(12px, 3vw, 24px);
}

.action-card {
  background: white;
  border-radius: 12px;
  padding: clamp(12px, 3vw, 24px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  gap: clamp(8px, 2vw, 16px);
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 0;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.action-icon {
  width: clamp(40px, 7vw, 48px);
  height: clamp(40px, 7vw, 48px);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(1rem, 3.2vw, 1.25rem);
  color: white;
  flex-shrink: 0;
}

.action-primary .action-icon {
  background: #0d6efd;
}
.action-info .action-icon {
  background: #0dcaf0;
}
.action-success .action-icon {
  background: #198754;
}
.action-secondary .action-icon {
  background: #6c757d;
}

.action-content {
  flex: 1;
  min-width: 0;
}

.action-title {
  font-size: 1rem;
  font-weight: 600;
  color: #212529;
  margin-bottom: 0.25rem;
  overflow-wrap: anywhere;
}

.action-description {
  font-size: 0.85rem;
  color: #6c757d;
  margin: 0;
  overflow-wrap: anywhere;
}

.action-arrow {
  color: #6c757d;
  font-size: 1rem;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.action-card:hover .action-arrow {
  transform: translateX(4px);
}

/* Activity Feed */
.activity-feed {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
  overflow: hidden;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: clamp(8px, 2vw, 16px);
  padding: clamp(12px, 3vw, 24px);
  border-bottom: 1px solid #e9ecef;
  transition: background-color 0.2s ease;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-item:hover {
  background: #f8f9fa;
}

.activity-icon {
  width: clamp(32px, 6vw, 40px);
  height: clamp(32px, 6vw, 40px);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(0.9rem, 3vw, 1rem);
  color: white;
  flex-shrink: 0;
}

.activity-success .activity-icon {
  background: #198754;
}
.activity-info .activity-icon {
  background: #0dcaf0;
}
.activity-primary .activity-icon {
  background: #0d6efd;
}
.activity-warning .activity-icon {
  background: #ffc107;
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-message {
  font-size: 0.9rem;
  color: #495057;
  margin-bottom: 0.25rem;
  overflow-wrap: anywhere;
}

.activity-time {
  font-size: 0.8rem;
  color: #6c757d;
  overflow-wrap: anywhere;
}

/* Getting Started Section */
.getting-started-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
  overflow: hidden;
}

.getting-started-content {
  padding: clamp(16px, 4vw, 40px);
}

.getting-started-title {
  font-size: clamp(1.125rem, 3vw, 1.5rem);
  font-weight: 600;
  color: #212529;
  margin-bottom: clamp(8px, 2vw, 16px);
  display: flex;
  align-items: center;
  overflow-wrap: anywhere;
}

.getting-started-description {
  color: #6c757d;
  margin-bottom: clamp(16px, 3vw, 32px);
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.getting-started-steps {
  display: flex;
  flex-direction: column;
  gap: clamp(12px, 3vw, 24px);
  margin-bottom: clamp(16px, 3vw, 32px);
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: clamp(8px, 2vw, 16px);
}

.step-number {
  width: 32px;
  height: 32px;
  background: #0d6efd;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
  min-width: 0;
}

.step-title {
  font-size: 1rem;
  font-weight: 600;
  color: #212529;
  margin-bottom: 0.25rem;
  overflow-wrap: anywhere;
}

.step-description {
  font-size: 0.9rem;
  color: #6c757d;
  margin: 0;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.getting-started-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.getting-started-actions .btn {
  white-space: nowrap;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-content {
    flex-direction: column;
    text-align: center;
  }

  .hero-title {
    flex-direction: column;
  }

  .hero-stats {
    justify-content: center;
  }

  .dashboard-main {
    padding: 0 clamp(12px, 3.5vw, 16px) clamp(12px, 3.5vw, 16px);
    padding-bottom: calc(
      clamp(12px, 3.5vw, 16px) + env(safe-area-inset-bottom)
    );
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .refresh-btn {
    width: 100%;
    justify-content: center;
  }

  .getting-started-actions {
    flex-direction: column;
  }
}

@media (max-width: 576px) {
  .hero-title {
    font-size: clamp(1.5rem, 6vw, 1.75rem);
  }

  .hero-subtitle {
    font-size: clamp(0.95rem, 3.5vw, 1rem);
  }

  .hero-stats {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .stat-card {
    padding: clamp(12px, 4vw, 24px);
    flex-direction: column;
    text-align: center;
  }

  .action-card {
    padding: clamp(12px, 4vw, 20px);
  }

  .activity-item {
    padding: clamp(12px, 4vw, 20px);
    align-items: flex-start;
  }

  .getting-started-content {
    padding: clamp(12px, 4vw, 24px);
  }

  .getting-started-steps {
    gap: clamp(10px, 3vw, 16px);
  }
}

/* High contrast mode support */
@media (prefers-contrast: more) {
  .stat-card,
  .action-card,
  .activity-feed,
  .getting-started-card {
    border: 2px solid #000;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .hero-icon,
  .stat-card,
  .action-card,
  .activity-item,
  .hero-btn {
    animation: none;
    transition: none;
  }

  .stat-card:hover,
  .action-card:hover,
  .hero-btn:hover {
    transform: none;
  }
}
</style>
