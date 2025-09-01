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

const router = useRouter();
const queryClient = useQueryClient();

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
    color: 'primary',
    action: () => router.push({ name: 'Queues' }),
  },
  {
    title: 'View Queues',
    description: 'Manage existing queues',
    icon: 'bi-list-ul',
    color: 'info',
    action: () => router.push({ name: 'Queues' }),
  },
  {
    title: 'Monitor Activity',
    description: 'Check system performance',
    icon: 'bi-graph-up',
    color: 'success',
    action: () => router.push({ name: 'Monitoring' }),
  },
  {
    title: 'Documentation',
    description: 'Learn more about RedisSMQ',
    icon: 'bi-book-fill',
    color: 'secondary',
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

const refreshData = () => {
  loadDashboardData();
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
          <div class="spinner-border text-primary mb-3"></div>
          <h5 class="loading-title">Loading dashboard...</h5>
          <p class="loading-subtitle">Fetching system information</p>
        </div>
      </div>

      <!-- Dashboard Content -->
      <div v-else class="dashboard-content">
        <!-- System Overview Cards -->
        <section class="overview-section">
          <div class="section-header">
            <h2 class="section-title">
              <i class="bi bi-speedometer2 me-2"></i>
              System Overview
            </h2>
            <button class="btn btn-outline-primary btn-sm" @click="refreshData">
              <i class="bi bi-arrow-clockwise me-1"></i>
              Refresh
            </button>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon queues-icon">
                <i class="bi bi-list-ul"></i>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ formattedStats.totalQueues }}</div>
                <div class="stat-title">Total Queues</div>
                <div class="stat-description">Active message queues</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon messages-icon">
                <i class="bi bi-envelope-fill"></i>
              </div>
              <div class="stat-content">
                <div class="stat-number">
                  {{ formattedStats.totalMessages }}
                </div>
                <div class="stat-title">Messages Processed</div>
                <div class="stat-description">Total messages handled</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon consumers-icon">
                <i class="bi bi-gear-fill"></i>
              </div>
              <div class="stat-content">
                <div class="stat-number">
                  {{ formattedStats.currentlyInProcess }}
                </div>
                <div class="stat-title">Currently in Process</div>
                <div class="stat-description">
                  Total message being processed
                </div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon consumers-icon">
                <i class="bi bi-hourglass-split"></i>
              </div>
              <div class="stat-content">
                <div class="stat-number">
                  {{ formattedStats.pendingMessages }}
                </div>
                <div class="stat-title">Pending Messages</div>
                <div class="stat-description">
                  Total message in the waiting queue
                </div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon consumers-icon">
                <i class="bi bi-people-fill"></i>
              </div>
              <div class="stat-content">
                <div class="stat-number">
                  {{ formattedStats.activeConsumers }}
                </div>
                <div class="stat-title">Active Consumers</div>
                <div class="stat-description">Connected consumers</div>
              </div>
            </div>
          </div>
        </section>

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
                      Set up your first message queue with the desired
                      configuration
                    </p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">2</div>
                  <div class="step-content">
                    <h4 class="step-title">Configure Consumers</h4>
                    <p class="step-description">
                      Add consumer groups to process messages efficiently
                    </p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">3</div>
                  <div class="step-content">
                    <h4 class="step-title">Monitor Performance</h4>
                    <p class="step-description">
                      Track message processing and system performance
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
  </div>
</template>

<style scoped>
/* Home Page Layout */
.home-page {
  min-height: calc(100vh - 200px);
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

/* Hero Section */
.hero-section {
  background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
  color: white;
  padding: 4rem 2rem;
  margin-bottom: 2rem;
}

.hero-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 3rem;
}

.hero-text {
  flex: 1;
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.hero-icon {
  font-size: 3.5rem;
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
  font-size: 1.25rem;
  opacity: 0.9;
  margin-bottom: 2rem;
  line-height: 1.5;
}

.hero-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.hero-actions {
  flex-shrink: 0;
}

.hero-btn {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.3);
  background: white;
  color: #0d6efd;
  border: none;
  transition: all 0.2s ease;
}

.hero-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 255, 255, 0.4);
}

/* Dashboard Main */
.dashboard-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem 2rem;
}

/* Loading Section */
.loading-section {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
}

.loading-content {
  text-align: center;
  max-width: 400px;
}

.loading-title {
  color: #495057;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.loading-subtitle {
  color: #6c757d;
  margin: 0;
}

/* Dashboard Content */
.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

/* Section Headers */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #212529;
  margin: 0;
  display: flex;
  align-items: center;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: all 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
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
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #212529;
  margin-bottom: 0.25rem;
}

.stat-title {
  font-size: 1rem;
  font-weight: 600;
  color: #495057;
  margin-bottom: 0.25rem;
}

.stat-description {
  font-size: 0.85rem;
  color: #6c757d;
}

/* Actions Grid */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.action-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
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
}

.action-title {
  font-size: 1rem;
  font-weight: 600;
  color: #212529;
  margin-bottom: 0.25rem;
}

.action-description {
  font-size: 0.85rem;
  color: #6c757d;
  margin: 0;
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
  gap: 1rem;
  padding: 1.5rem;
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
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
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
}

.activity-message {
  font-size: 0.9rem;
  color: #495057;
  margin-bottom: 0.25rem;
}

.activity-time {
  font-size: 0.8rem;
  color: #6c757d;
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
  padding: 2.5rem;
}

.getting-started-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #212529;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
}

.getting-started-description {
  color: #6c757d;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.getting-started-steps {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
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
}

.step-title {
  font-size: 1rem;
  font-weight: 600;
  color: #212529;
  margin-bottom: 0.25rem;
}

.step-description {
  font-size: 0.9rem;
  color: #6c757d;
  margin: 0;
  line-height: 1.5;
}

.getting-started-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-section {
    padding: 2rem 1rem;
  }

  .hero-content {
    flex-direction: column;
    text-align: center;
    gap: 2rem;
  }

  .hero-title {
    font-size: 2rem;
    flex-direction: column;
    gap: 0.5rem;
  }

  .hero-icon {
    font-size: 2.5rem;
  }

  .hero-stats {
    justify-content: center;
    gap: 1rem;
  }

  .dashboard-main {
    padding: 0 1rem 1rem;
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
    gap: 1rem;
  }

  .getting-started-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .hero-section {
    padding: 1.5rem 0.75rem;
  }

  .hero-title {
    font-size: 1.75rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .hero-stats {
    flex-direction: column;
    gap: 1rem;
  }

  .dashboard-main {
    padding: 0 0.75rem 0.75rem;
  }

  .stat-card {
    padding: 1.5rem;
    flex-direction: column;
    text-align: center;
  }

  .action-card {
    padding: 1rem;
  }

  .activity-item {
    padding: 1rem;
  }

  .getting-started-content {
    padding: 1.5rem;
  }

  .getting-started-steps {
    gap: 1rem;
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
