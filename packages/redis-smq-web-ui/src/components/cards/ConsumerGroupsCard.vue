<!--
  - Copyright (c)
  - Weyoss <weyoss@protonmail.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import CreateConsumerGroupModal from '@/components/modals/CreateConsumerGroupModal.vue';
import DeleteConsumerGroupModal from '@/components/modals/DeleteConsumerGroupModal.vue';
import type { FormValues } from '@/composables/useCreateConsumerGroupForm.ts';
import { useQueueParams } from '@/composables/useQueueParams.ts';
import { useSelectedQueuePropertiesStore } from '@/stores/selectedQueueProperties.ts';
import { ref, computed, watch } from 'vue';
import { useQueueConsumerGroups } from '@/composables/useQueueConsumerGroups.ts';
import { type GenericObject } from 'vee-validate';
import { useSelectedQueueStore } from '@/stores/selectedQueue.ts';

const selectedQueue = useSelectedQueueStore();
const selectedQueueProperties = useSelectedQueuePropertiesStore();
const queueConsumerGroups = useQueueConsumerGroups();
const showCreateModal = ref(false);
const showDeleteModalFlag = ref(false);
const groupToDelete = ref<string | null>(null);

const { ns, queueName } = useQueueParams();

// Watch for queue params changes and sync with consumer groups store
watch(
  [ns, queueName],
  ([namespace, name]) => {
    if (namespace && name) {
      selectedQueue.selectQueue(namespace, name);
    }
  },
  { immediate: true },
);

function showDeleteModal(groupName: string) {
  groupToDelete.value = groupName;
  showDeleteModalFlag.value = true;
}

function closeDeleteModal() {
  showDeleteModalFlag.value = false;
  groupToDelete.value = null;
}

// Use queues store for pub/sub check (queue properties)
const supportsConsumerGroups = computed(
  () => selectedQueueProperties.isPubSubQueue,
);

// Use consumer groups store for consumer groups data
const consumerGroupsList = computed(() => {
  if (
    !supportsConsumerGroups.value ||
    !queueConsumerGroups.consumerGroups.value?.data
  ) {
    return [];
  }
  return queueConsumerGroups.sortedConsumerGroups.value;
});

const hasConsumerGroups = computed(
  () => queueConsumerGroups.hasConsumerGroups.value,
);

// Use consumer groups store for error states with better error handling
const getConsumerGroupError = computed(() => {
  const error = queueConsumerGroups.consumerGroupsError.value?.error;
  if (!error) return;
  if (error.message) return error.message;
  return 'Failed to load consumer groups';
});

const createConsumerGroupError = computed(() => {
  const error = queueConsumerGroups.createConsumerGroupError.value?.error;
  if (!error) return;
  if (error.message) return error.message;
  return 'Failed to create consumer group';
});

const deleteConsumerGroupError = computed(() => {
  const error = queueConsumerGroups.deleteConsumerGroupError.value?.error;
  if (!error) return;
  if (error.message) return error.message;
  return 'Failed to delete consumer group';
});

// Use consumer groups store for loading states
const isDeletingConsumerGroup = computed(() => {
  return queueConsumerGroups.isDeletingConsumerGroup.value;
});

const isCreatingConsumerGroup = computed(() => {
  return queueConsumerGroups.isCreatingConsumerGroup.value;
});

const isLoadingConsumerGroups = computed(() => {
  return queueConsumerGroups.isLoadingConsumerGroups.value;
});

// Use consumer groups store methods
function refreshConsumerGroups() {
  queueConsumerGroups.refreshConsumerGroups();
}

async function onSubmit(values: GenericObject) {
  try {
    const formValues = values as FormValues;
    await queueConsumerGroups.createConsumerGroup(formValues.consumerGroupName);
    showCreateModal.value = false;
  } catch (err) {
    // Error is handled by the store and displayed via createConsumerGroupError
    console.error('Failed to create consumer group:', err);
  }
}

async function onConfirmDeleteConsumerGroup() {
  if (!groupToDelete.value) return;
  try {
    await queueConsumerGroups.deleteConsumerGroup(groupToDelete.value);
    closeDeleteModal();
  } catch (err) {
    // Error is handled by the store and displayed via deleteConsumerGroupError
    console.error('Failed to delete consumer group:', err);
  }
}

// Enhanced modal close handlers with error reset
function onCloseCreateModal() {
  showCreateModal.value = false;
  queueConsumerGroups.resetCreateConsumerGroupMutation();
}

function onCloseDeleteModal() {
  closeDeleteModal();
  queueConsumerGroups.resetDeleteConsumerGroupMutation();
}
</script>

<template>
  <div v-if="selectedQueue.selectedQueue" class="consumer-groups-card">
    <!-- Header -->
    <header class="card-header">
      <div class="header-content">
        <h3 class="card-title">
          <i class="bi bi-people-fill title-icon"></i>
          Consumer Groups
        </h3>
        <p class="card-subtitle">
          Manage message consumer groups for pub/sub queues
        </p>
      </div>
      <div class="header-actions">
        <button
          v-if="supportsConsumerGroups"
          class="btn btn-refresh"
          :disabled="isLoadingConsumerGroups"
          title="Refresh consumer groups"
          @click="refreshConsumerGroups"
        >
          <i
            class="bi bi-arrow-clockwise"
            :class="{ spinning: isLoadingConsumerGroups }"
          ></i>
        </button>
      </div>
    </header>

    <!-- Content -->
    <main class="card-content">
      <!-- Point-to-point not supported -->
      <div
        v-if="!supportsConsumerGroups"
        class="content-state not-supported-state"
      >
        <div class="state-content">
          <div class="not-supported-icon">
            <i class="bi bi-info-circle-fill"></i>
          </div>
          <h4 class="state-title">Consumer Groups Not Supported</h4>
          <p class="state-subtitle">
            Point-to-point queues use direct messaging where messages are
            delivered directly to individual consumers.
          </p>
          <div class="state-info">
            <div class="info-item">
              <i class="bi bi-arrow-right me-2"></i>
              <span>Messages are consumed by a single consumer</span>
            </div>
            <div class="info-item">
              <i class="bi bi-arrow-right me-2"></i>
              <span>No message broadcasting or group management needed</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pub/Sub Queue Consumer Groups -->
      <template v-else>
        <!-- Loading State -->
        <div v-if="isLoadingConsumerGroups" class="content-state loading-state">
          <div class="state-content">
            <div class="spinner-border text-primary mb-3"></div>
            <h5 class="state-title">Loading consumer groups...</h5>
            <p class="state-subtitle">
              Please wait while we fetch the consumer groups
            </p>
          </div>
        </div>

        <!-- Error State -->
        <div
          v-else-if="getConsumerGroupError"
          class="content-state error-state"
        >
          <div class="error-content">
            <div class="error-icon">
              <i class="bi bi-exclamation-triangle-fill text-danger"></i>
            </div>
            <div class="error-text">
              <h5 class="error-title">Failed to load consumer groups</h5>
              <p class="error-message">{{ getConsumerGroupError }}</p>
            </div>
          </div>
          <div class="error-actions">
            <button class="btn btn-primary" @click="refreshConsumerGroups">
              <i class="bi bi-arrow-clockwise me-2"></i>
              Try Again
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="!hasConsumerGroups" class="content-state empty-state">
          <div class="state-content">
            <div class="empty-icon">👥</div>
            <h4 class="state-title">No Consumer Groups</h4>
            <p class="state-subtitle">
              Organize consumers into groups to load-balance message consumption
              from a queue. Each message is delivered to only one consumer
              within a group.
            </p>
            <div class="empty-benefits">
              <div class="benefit-item">
                <i class="bi bi-check-circle-fill benefit-icon"></i>
                <span>Load-balance message processing within a group</span>
              </div>
              <div class="benefit-item">
                <i class="bi bi-check-circle-fill benefit-icon"></i>
                <span
                  >Ensure each message is processed only once per group</span
                >
              </div>
              <div class="benefit-item">
                <i class="bi bi-check-circle-fill benefit-icon"></i>
                <span>Build fault-tolerant and scalable consumer systems</span>
              </div>
            </div>
            <button
              class="btn btn-primary btn-create-first"
              :disabled="isCreatingConsumerGroup"
              @click="showCreateModal = true"
            >
              <template v-if="isCreatingConsumerGroup">
                <span class="spinner-border spinner-border-sm me-2"></span>
                Creating...
              </template>
              <template v-else>
                <i class="bi bi-plus-circle me-2"></i>
                Create Your First Consumer Group
              </template>
            </button>
          </div>
        </div>

        <!-- Consumer Groups List -->
        <div v-else class="consumer-groups-content">
          <div class="groups-header">
            <div class="groups-count">
              <span class="count-number">{{ consumerGroupsList.length }}</span>
              <span class="count-label"
                >Consumer Group{{
                  consumerGroupsList.length !== 1 ? 's' : ''
                }}</span
              >
            </div>
            <button
              class="btn btn-primary btn-create"
              :disabled="isCreatingConsumerGroup"
              @click="showCreateModal = true"
            >
              <template v-if="isCreatingConsumerGroup">
                <span class="spinner-border spinner-border-sm me-2"></span>
                Creating...
              </template>
              <template v-else>
                <i class="bi bi-plus-circle me-2"></i>
                Create Group
              </template>
            </button>
          </div>

          <div class="consumer-groups-list">
            <div
              v-for="group in consumerGroupsList"
              :key="group"
              class="consumer-group-item"
            >
              <div class="group-info">
                <div class="group-icon">
                  <i class="bi bi-people-fill"></i>
                </div>
                <div class="group-details">
                  <div class="group-name">{{ group }}</div>
                  <div class="group-description">
                    Consumer group for message processing
                  </div>
                </div>
              </div>
              <div class="group-actions">
                <button
                  class="btn btn-outline-danger btn-delete"
                  :disabled="isDeletingConsumerGroup"
                  title="Delete consumer group"
                  @click="showDeleteModal(group)"
                >
                  <template
                    v-if="isDeletingConsumerGroup && groupToDelete === group"
                  >
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    Deleting...
                  </template>
                  <template v-else>
                    <i class="bi bi-trash me-2"></i>
                    Delete
                  </template>
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </main>

    <!-- Create Modal -->
    <CreateConsumerGroupModal
      :is-visible="showCreateModal"
      :is-creating="isCreatingConsumerGroup"
      :create-error="createConsumerGroupError"
      @submit="onSubmit"
      @close="onCloseCreateModal"
    />

    <!-- Delete Confirmation Modal -->
    <DeleteConsumerGroupModal
      :error="deleteConsumerGroupError"
      :is-pending="isDeletingConsumerGroup"
      :consumer-group="String(groupToDelete)"
      :is-visible="showDeleteModalFlag"
      @close="onCloseDeleteModal"
      @delete="onConfirmDeleteConsumerGroup"
    />
  </div>
</template>

<style scoped>
/* Card Container */
.consumer-groups-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
  overflow: hidden;
  transition: box-shadow 0.2s ease;
}

.consumer-groups-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

/* Header */
.card-header {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content {
  flex: 1;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #212529;
  margin: 0 0 0.25rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.title-icon {
  color: #6f42c1;
  font-size: 1.1rem;
}

.card-subtitle {
  color: #6c757d;
  font-size: 0.875rem;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-refresh {
  background: white;
  border: 1px solid #ced4da;
  border-radius: 8px;
  padding: 0.5rem;
  color: #6c757d;
  transition: all 0.2s ease;
  cursor: pointer;
}

.btn-refresh:hover:not(:disabled) {
  background: #6f42c1;
  border-color: #6f42c1;
  color: white;
}

.spinning {
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

/* Content */
.card-content {
  padding: 2rem;
}

/* Content States */
.content-state {
  text-align: center;
  padding: 2rem;
}

.state-content {
  max-width: 500px;
  margin: 0 auto;
}

.state-title {
  color: #495057;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.state-subtitle {
  color: #6c757d;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
}

/* Not Supported State */
.not-supported-state {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 2rem;
}

.not-supported-icon {
  width: 60px;
  height: 60px;
  background: #e7f3ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  font-size: 1.5rem;
  color: #0d6efd;
}

.state-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  text-align: left;
  max-width: 400px;
  margin: 0 auto;
}

.info-item {
  display: flex;
  align-items: center;
  color: #495057;
  font-size: 0.9rem;
}

/* Loading State */
.loading-state .state-title {
  margin-bottom: 0.5rem;
}

/* Error State */
.error-state {
  padding: 2rem;
}

.error-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.error-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.error-text {
  text-align: center;
}

.error-title {
  color: #495057;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.error-message {
  color: #6c757d;
  margin: 0;
  line-height: 1.5;
}

.error-actions {
  text-align: center;
}

/* Empty State */
.empty-state {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 2rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  display: block;
}

.empty-benefits {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  text-align: left;
  max-width: 350px;
  margin: 0 auto 2rem;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #495057;
  font-size: 0.9rem;
}

.benefit-icon {
  color: #198754;
  font-size: 1rem;
  flex-shrink: 0;
}

.btn-create-first {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
}

/* Consumer Groups Content */
.consumer-groups-content {
  padding: 0;
}

.groups-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.groups-count {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.count-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #6f42c1;
}

.count-label {
  color: #6c757d;
  font-size: 0.9rem;
  font-weight: 500;
}

.btn-create {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
}

/* Consumer Groups List */
.consumer-groups-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.consumer-group-item {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;
}

.consumer-group-item:hover {
  background: #f1f3f4;
  border-color: #6f42c1;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(111, 66, 193, 0.15);
}

.group-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.group-icon {
  width: 40px;
  height: 40px;
  background: #e8f5e8;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #198754;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.group-details {
  flex: 1;
}

.group-name {
  font-size: 1rem;
  font-weight: 600;
  color: #212529;
  margin-bottom: 0.25rem;
  font-family: 'Courier New', monospace;
}

.group-description {
  font-size: 0.85rem;
  color: #6c757d;
  margin: 0;
}

.group-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-delete {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.875rem;
  white-space: nowrap;
}

.btn-delete:hover:not(:disabled) {
  background: #dc3545;
  border-color: #dc3545;
  color: white;
}

/* Responsive Design */
@media (max-width: 768px) {
  .card-header {
    padding: 1rem 1.5rem;
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .card-content {
    padding: 1.5rem;
  }

  .groups-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .btn-create {
    width: 100%;
  }

  .consumer-group-item {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    padding: 1rem;
  }

  .group-info {
    justify-content: flex-start;
  }

  .group-actions {
    justify-content: stretch;
  }

  .btn-delete {
    width: 100%;
  }

  .content-state {
    padding: 1.5rem;
  }

  .state-info,
  .empty-benefits {
    text-align: center;
  }
}

@media (max-width: 480px) {
  .card-header {
    padding: 1rem;
  }

  .card-content {
    padding: 1rem;
  }

  .consumer-group-item {
    padding: 0.75rem;
  }

  .group-icon {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }

  .content-state {
    padding: 1rem;
  }

  .empty-icon {
    font-size: 3rem;
  }

  .not-supported-icon {
    width: 50px;
    height: 50px;
    font-size: 1.25rem;
  }
}

/* Focus states for accessibility */
.btn-refresh:focus,
.btn-create:focus,
.btn-create-first:focus,
.btn-delete:focus {
  outline: 2px solid #6f42c1;
  outline-offset: 2px;
}
</style>
