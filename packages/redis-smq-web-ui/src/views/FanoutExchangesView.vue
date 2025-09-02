<!--
  - Copyright (c)
  - Weyoss <weyoss@protonmail.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue';
import { useFanoutExchanges } from '@/composables/useFanoutExchanges.ts';
import { usePageContentStore, type PageAction } from '@/stores/pageContent';
import { getErrorMessage } from '@/lib/error.ts';
import type { IQueueParams } from '@/types/index.ts';

import PageContent from '@/components/PageContent.vue';
import CreateFanoutExchangeModal from '@/components/modals/CreateFanoutExchangeModal.vue';
import DeleteFanoutExchangeModal from '@/components/modals/DeleteFanoutExchangeModal.vue';
import BindQueueModal from '@/components/modals/BindQueueModal.vue';
import UnbindQueueModal from '@/components/modals/UnbindQueueModal.vue';

// Composables
const {
  sortedFanoutExchanges,
  isLoadingFanoutExchanges,
  isCreatingFanoutExchange,
  isDeletingFanoutExchange,
  fanoutExchangesError,
  createFanoutExchangeError,
  deleteFanoutExchangeError,
  createFanoutExchange,
  deleteFanoutExchange,
  refreshFanoutExchanges,
  createFanoutExchangeMutation,
  deleteFanoutExchangeMutation,
  selectFanOutExchange,
  selectedFanOutName,
  boundQueues,
  isLoadingBoundQueues,
  boundQueuesError,
  bindQueueToFanoutExchange,
  isBindingQueue,
  bindQueueError,
  bindQueueMutation,
  unbindQueueFromFanoutExchange,
  isUnbindingQueue,
  unbindQueueError,
  unbindQueueMutation,
} = useFanoutExchanges();

const pageContentStore = usePageContentStore();

// Local state
const showCreateModal = ref(false);
const showDeleteModal = ref(false);
const showBindModal = ref(false);
const showUnbindModal = ref(false);
const exchangeToDelete = ref<string | null>(null);
const queueToUnbind = ref<IQueueParams | null>(null);

// Page content definitions
const pageTitle = 'Fanout Exchanges';
const pageSubtitle = 'Manage fanout exchanges for broadcasting messages';

const pageActions = computed((): PageAction[] => [
  {
    id: 'refresh-exchanges',
    label: 'Refresh',
    icon: 'bi bi-arrow-clockwise',
    variant: 'secondary',
    disabled: isLoadingFanoutExchanges.value,
    loading: isLoadingFanoutExchanges.value,
    handler: handleRefresh,
  },
  {
    id: 'create-exchange',
    label: 'Create Exchange',
    icon: 'bi bi-plus-circle',
    variant: 'primary',
    disabled: isCreatingFanoutExchange.value,
    loading: isCreatingFanoutExchange.value,
    handler: openCreateForm,
  },
]);

// Event Handlers
function handleRefresh() {
  refreshFanoutExchanges();
}

function openCreateForm() {
  createFanoutExchangeMutation.reset();
  showCreateModal.value = true;
}

async function handleCreateExchange(formValues: { fanOutName: string }) {
  try {
    await createFanoutExchange({ fanOutName: formValues.fanOutName });
    showCreateModal.value = false;
  } catch (err) {
    // Error is handled by the hook and displayed in the modal
    console.log('Failed to create Exchange', err);
  }
}

function confirmDelete(exchangeName: string) {
  deleteFanoutExchangeMutation.reset();
  exchangeToDelete.value = exchangeName;
  showDeleteModal.value = true;
}

function handleCloseDeleteModal() {
  showDeleteModal.value = false;
  exchangeToDelete.value = null;
}

async function deleteExchangeConfirmed() {
  if (!exchangeToDelete.value) return;
  try {
    await deleteFanoutExchange(exchangeToDelete.value);
    handleCloseDeleteModal();
  } catch (err) {
    // Error is handled by the hook and displayed in the modal
    console.log('Failed to delete exchange ', err);
  }
}

function handleSelectExchange(exchangeName: string) {
  if (selectedFanOutName.value === exchangeName) {
    selectFanOutExchange(null); // Toggle off
  } else {
    selectFanOutExchange(exchangeName);
  }
}

function openBindForm() {
  bindQueueMutation.reset();
  showBindModal.value = true;
}

async function handleBindQueue(queue: IQueueParams) {
  if (!selectedFanOutName.value) return;
  try {
    await bindQueueToFanoutExchange(selectedFanOutName.value, {
      queue,
    });
    showBindModal.value = false;
  } catch (err) {
    // Error is handled by the hook and displayed in the modal
    console.log('Failed to bind queue', err);
  }
}

function confirmUnbind(queue: IQueueParams) {
  unbindQueueMutation.reset();
  queueToUnbind.value = queue;
  showUnbindModal.value = true;
}

function handleCloseUnbindModal() {
  showUnbindModal.value = false;
  queueToUnbind.value = null;
}

async function unbindQueueConfirmed() {
  if (!queueToUnbind.value || !selectedFanOutName.value) return;
  try {
    await unbindQueueFromFanoutExchange(
      selectedFanOutName.value,
      queueToUnbind.value,
    );
    handleCloseUnbindModal();
  } catch (err) {
    // Error is handled by the hook and displayed in the modal
    console.log('Failed to unbind queue ', err);
  }
}

// Sync component state with the page content store
watchEffect(() => {
  pageContentStore.setPageHeader({
    title: pageTitle,
    subtitle: pageSubtitle,
    icon: 'bi bi-arrows-angle-expand',
  });
  pageContentStore.setPageActions(pageActions.value);
  pageContentStore.setLoadingState(isLoadingFanoutExchanges.value);

  if (fanoutExchangesError.value) {
    pageContentStore.setErrorState(getErrorMessage(fanoutExchangesError.value));
    pageContentStore.setEmptyState(false);
  } else if (
    !isLoadingFanoutExchanges.value &&
    sortedFanoutExchanges.value.length === 0
  ) {
    pageContentStore.setErrorState(null);
    pageContentStore.setEmptyState(true, {
      icon: 'bi bi-plus-square-dotted',
      title: 'No Fanout Exchanges Found',
      message: 'Get started by creating your first fanout exchange.',
      actionLabel: 'Create Your First Exchange',
      actionHandler: openCreateForm,
    });
  } else {
    pageContentStore.setErrorState(null);
    pageContentStore.setEmptyState(false);
  }
});

onMounted(() => {
  handleRefresh();
});
</script>

<template>
  <div>
    <PageContent>
      <!-- Contextual Error Banners -->
      <div
        v-if="createFanoutExchangeError && !showCreateModal"
        class="alert alert-warning alert-dismissible fade show mb-4"
        role="alert"
      >
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        {{ getErrorMessage(createFanoutExchangeError)?.message }}
        <button
          type="button"
          class="btn-close"
          aria-label="Close"
          @click="createFanoutExchangeMutation.reset()"
        ></button>
      </div>
      <div
        v-if="deleteFanoutExchangeError && !showDeleteModal"
        class="alert alert-warning alert-dismissible fade show mb-4"
        role="alert"
      >
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        {{ getErrorMessage(deleteFanoutExchangeError)?.message }}
        <button
          type="button"
          class="btn-close"
          aria-label="Close"
          @click="deleteFanoutExchangeMutation.reset()"
        ></button>
      </div>

      <!-- Exchanges List -->
      <div class="exchanges-list-container">
        <div class="exchanges-list-header">
          <h5 class="exchanges-count">
            {{ sortedFanoutExchanges.length }} Exchange{{
              sortedFanoutExchanges.length !== 1 ? 's' : ''
            }}
          </h5>
        </div>
        <div class="exchanges-list">
          <div
            v-for="exchangeName in sortedFanoutExchanges"
            :key="exchangeName"
            class="exchange-item"
            :class="{ 'is-selected': selectedFanOutName === exchangeName }"
          >
            <div
              class="exchange-item-header"
              @click="handleSelectExchange(exchangeName)"
            >
              <div class="exchange-info">
                <i class="bi bi-arrow-left-right exchange-icon"></i>
                <span class="exchange-name">{{ exchangeName }}</span>
              </div>
              <div class="exchange-actions">
                <button
                  class="btn btn-sm btn-outline-danger"
                  @click.stop="confirmDelete(exchangeName)"
                >
                  <i class="bi bi-trash me-1"></i>
                  Delete
                </button>
                <i
                  class="bi bi-chevron-down expand-icon"
                  :class="{ 'is-rotated': selectedFanOutName === exchangeName }"
                ></i>
              </div>
            </div>
            <div
              v-if="selectedFanOutName === exchangeName"
              class="exchange-item-details"
            >
              <!-- Loading State -->
              <div v-if="isLoadingBoundQueues" class="details-state">
                <div class="spinner-border spinner-border-sm" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <span class="ms-2">Loading bound queues...</span>
              </div>
              <!-- Error State -->
              <div
                v-else-if="boundQueuesError"
                class="details-state text-danger"
              >
                <i class="bi bi-exclamation-circle-fill me-2"></i>
                {{ getErrorMessage(boundQueuesError)?.message }}
              </div>
              <!-- Content -->
              <div v-else>
                <div class="details-header">
                  <h6 class="details-title">Bound Queues</h6>
                  <button class="btn btn-sm btn-primary" @click="openBindForm">
                    <i class="bi bi-link-45deg me-1"></i>
                    Bind Queue
                  </button>
                </div>
                <ul v-if="boundQueues.length" class="bound-queues-list">
                  <li
                    v-for="queue in boundQueues"
                    :key="`${queue.ns}:${queue.name}`"
                    class="bound-queue-item"
                  >
                    <div class="bound-queue-info">
                      <i class="bi bi-grip-vertical queue-drag-icon"></i>
                      <span class="queue-name">{{ queue.name }}</span>
                      <span class="queue-separator">@</span>
                      <span class="queue-ns">{{ queue.ns }}</span>
                    </div>
                    <button
                      class="btn btn-sm btn-outline-secondary btn-unbind"
                      @click="confirmUnbind(queue)"
                    >
                      <i class="bi bi-x-lg"></i>
                    </button>
                  </li>
                </ul>
                <p v-else class="text-muted fst-italic mt-2">
                  No queues are bound to this exchange.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContent>

    <!-- Modals -->
    <CreateFanoutExchangeModal
      :is-visible="showCreateModal"
      :is-creating="isCreatingFanoutExchange"
      :create-error="getErrorMessage(createFanoutExchangeError?.error)"
      @close="showCreateModal = false"
      @create="handleCreateExchange"
    />
    <DeleteFanoutExchangeModal
      v-if="exchangeToDelete"
      :is-visible="showDeleteModal"
      :is-deleting="isDeletingFanoutExchange"
      :exchange-name="exchangeToDelete"
      :delete-error="getErrorMessage(deleteFanoutExchangeError?.error)"
      @close="handleCloseDeleteModal"
      @confirm="deleteExchangeConfirmed"
    />
    <BindQueueModal
      v-if="showBindModal"
      :is-visible="showBindModal"
      :is-binding="isBindingQueue"
      :bind-error="getErrorMessage(bindQueueError?.error)"
      @close="showBindModal = false"
      @bind="handleBindQueue"
    />
    <UnbindQueueModal
      v-if="queueToUnbind"
      :is-visible="showUnbindModal"
      :is-unbinding="isUnbindingQueue"
      :unbind-error="getErrorMessage(unbindQueueError?.error)"
      :queue="queueToUnbind"
      :exchange-name="selectedFanOutName"
      @close="handleCloseUnbindModal"
      @confirm="unbindQueueConfirmed"
    />
  </div>
</template>

<style scoped>
.exchanges-list-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
  overflow: hidden;
}

.exchanges-list-header {
  padding: 1.5rem 2rem 1rem;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
}

.exchanges-count {
  margin: 0;
  color: #495057;
  font-weight: 600;
  font-size: 1rem;
}

.exchanges-list {
  max-height: calc(100vh - 260px);
  overflow-y: auto;
}

.exchange-item {
  border-bottom: 1px solid #e9ecef;
  transition: background-color 0.2s ease;
}
.exchange-item.is-selected {
  background-color: #f8f9ff;
}
.exchange-item:last-child {
  border-bottom: none;
}

.exchange-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  cursor: pointer;
}
.exchange-item-header:hover {
  background-color: #f8f9fa;
}

.exchange-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.exchange-icon {
  font-size: 1.2rem;
  color: #6c757d;
}

.exchange-name {
  font-weight: 500;
  color: #212529;
  font-family: 'Courier New', Courier, monospace;
}

.exchange-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.exchange-actions .btn {
  font-size: 0.8rem;
  padding: 0.3rem 0.8rem;
}

.expand-icon {
  font-size: 1rem;
  color: #6c757d;
  transition: transform 0.2s ease-in-out;
}
.expand-icon.is-rotated {
  transform: rotate(180deg);
}

.exchange-item-details {
  padding: 1.5rem;
  border-top: 1px solid #e0e5f2;
  background-color: #ffffff;
}

.details-state {
  display: flex;
  align-items: center;
  padding: 1rem;
  color: #6c757d;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.details-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #495057;
}

.bound-queues-list {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

.bound-queue-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.5rem 0.5rem 1rem;
  border-radius: 8px;
  background-color: #f8f9fa;
  border: 1px solid #f1f3f5;
  margin-bottom: 0.5rem;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.bound-queue-item:hover {
  border-color: #dee2e6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.bound-queue-info {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.queue-drag-icon {
  color: #adb5bd;
  cursor: grab;
}

.queue-name {
  font-weight: 600;
  color: #212529;
}

.queue-separator {
  color: #adb5bd;
}

.queue-ns {
  font-size: 0.85em;
  color: #495057;
  background-color: #e9ecef;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.btn-unbind {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  padding: 0;
}

.btn-unbind .spinner-border {
  width: 1rem;
  height: 1rem;
}
</style>
