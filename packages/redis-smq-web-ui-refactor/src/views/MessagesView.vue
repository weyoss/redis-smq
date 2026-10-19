<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageShell from '@/components/ui/PageShell.vue';
import Card from '@/components/ui/Card.vue';
import Pagination from '@/components/ui/Pagination.vue';
import StateBlock from '@/components/ui/StateBlock.vue';
import ConfirmationModal from '@/components/modals/ConfirmationModal.vue';
import PublishMessageModal from '@/components/modals/PublishMessageModal.vue';
import ViewMessageModal from '@/components/modals/ViewMessageModal.vue';
import PurgeQueueModal from '@/components/modals/PurgeQueueModal.vue';
import MessageTabs from '@/components/message/MessageTabs.vue';
import MessageListItem from '@/components/message/MessageListItem.vue';
import ConsumerGroupSelector from '@/components/message/ConsumerGroupSelector.vue';
import { useQueueSelection } from '@/composables/useQueueSelection';
import { useQueueProperties } from '@/composables/useQueueProperties';
import { useMessages } from '@/composables/useMessages';
import { useMessageActions } from '@/composables/useMessageActions';
import { useBulkDeleteMessages } from '@/composables/useBulkDeleteMessages';
import { getQueueMessages } from '@/api/generated/queue-messages/queue-messages';
import { getConsumerGroupPendingMessages } from '@/api/generated/consumer-groups/consumer-groups';
import { getErrorMessage } from '@/lib/error';
import type { MessageStatus } from '@/api/model';
import type { PageAction } from '@/components/ui/PageShell.vue';

const route = useRoute();
const router = useRouter();
const { ns, name, params } = useQueueSelection();

// --- Message type from query param ---
function isValidStatus(v: unknown): v is MessageStatus {
  return (
    v === 'published' ||
    v === 'scheduled' ||
    v === 'pending' ||
    v === 'dead-lettered' ||
    v === 'acknowledged'
  );
}

const messageType = computed<MessageStatus>(() => {
  const v = route.query.type;
  return typeof v === 'string' && isValidStatus(v) ? v : 'published';
});

const consumerGroupId = computed<string | null>(() => {
  const v = route.query.consumerGroupId;
  return typeof v === 'string' && v.length > 0 ? v : null;
});

// --- Queue properties (to know if pub/sub) ---
const queueProperties = useQueueProperties(params);
const isPubSub = computed(() => queueProperties.isPubSub.value);

const showGroupSelector = computed(() => {
  if (!params.value) return false;
  if (messageType.value !== 'pending') return false;
  if (queueProperties.isLoading.value) return false;
  if (!isPubSub.value) return false;
  return !consumerGroupId.value;
});

// --- Messages query ---
const messages = useMessages(params, {
  queryKeyPrefix: () => {
    const base = `queue-messages-${messageType.value}`;
    return consumerGroupId.value && messageType.value === 'pending'
      ? `${base}-cg-${consumerGroupId.value}`
      : base;
  },
  queryFn: ({ ns, name, page, pageSize }) => {
    if (consumerGroupId.value && messageType.value === 'pending') {
      return getConsumerGroupPendingMessages(ns, name, consumerGroupId.value, {
        page,
        pageSize,
      });
    }
    return getQueueMessages(ns, name, {
      page,
      pageSize,
      status: messageType.value,
    });
  },
  enabled: computed(() => {
    if (!params.value) return false;
    if (messageType.value !== 'pending') return true;
    if (queueProperties.isLoading.value) return false;
    if (!isPubSub.value) return true;
    return !!consumerGroupId.value;
  }),
});

// --- Mutations ---
const actions = useMessageActions(() => messages.refresh());

const deleteTarget = ref<string | null>(null);
const deleteError = ref<string | null>(null);

async function onConfirmDelete() {
  if (!deleteTarget.value) return;
  deleteError.value = null;
  try {
    await actions.deleteMessage(deleteTarget.value);
    deleteTarget.value = null;
  } catch (e) {
    deleteError.value = getErrorMessage(e);
  }
}

const requeueTarget = ref<string | null>(null);
const requeueError = ref<string | null>(null);

async function onConfirmRequeue() {
  if (!requeueTarget.value) return;
  requeueError.value = null;
  try {
    await actions.requeueMessage(requeueTarget.value);
    requeueTarget.value = null;
  } catch (e) {
    requeueError.value = getErrorMessage(e);
  }
}

// --- Detail modal ---
const selectedMessageId = ref<string | null>(null);

function onDetailDeleted() {
  selectedMessageId.value = null;
  messages.refresh();
}

function onDetailRequeued() {
  messages.refresh();
}

// --- Publish modal ---
const showPublishModal = ref(false);

function onPublished() {
  showPublishModal.value = false;
  messages.refresh();
}

// --- Purge modal ---
const showPurge = ref(false);

function onPurged() {
  showPurge.value = false;
  messages.refresh();
}

// --- Bulk selection ---
const selectedIds = ref<Set<string>>(new Set());

const items = computed(() => messages.items.value);

const allSelected = computed(() => {
  const list = items.value;
  if (list.length === 0) return false;
  return list.every((m) => selectedIds.value.has(m.id));
});

const someSelected = computed(() => {
  const list = items.value;
  if (list.length === 0) return false;
  const count = list.filter((m) => selectedIds.value.has(m.id)).length;
  return count > 0 && count < list.length;
});

const selectionCount = computed(() => selectedIds.value.size);

function toggleOne(id: string) {
  const next = new Set(selectedIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  selectedIds.value = next;
}

function toggleAll() {
  if (allSelected.value) {
    selectedIds.value = new Set();
  } else {
    selectedIds.value = new Set(items.value.map((m) => m.id));
  }
}

function clearSelection() {
  selectedIds.value = new Set();
}

// Master checkbox indeterminate state is a DOM property, not an attribute.
const masterCheckbox = ref<HTMLInputElement | null>(null);
watchEffect(() => {
  if (masterCheckbox.value) {
    masterCheckbox.value.indeterminate = someSelected.value;
  }
});

// Clear selection on any context change (tab, group, page).
watch(
  [messageType, consumerGroupId, () => messages.pagination.value.currentPage],
  () => {
    selectedIds.value = new Set();
    deleteTarget.value = null;
    requeueTarget.value = null;
    selectedMessageId.value = null;
    showPurge.value = false;
    showBulkDelete.value = false;
  },
);

// --- Bulk delete ---
const showBulkDelete = ref(false);
const bulkDeleteError = ref<string | null>(null);
const bulkDelete = useBulkDeleteMessages(() => messages.refresh());

const bulkPreviewIds = computed(() =>
  Array.from(selectedIds.value).slice(0, 5),
);
const bulkExtraCount = computed(() => Math.max(0, selectedIds.value.size - 5));

async function onConfirmBulkDelete() {
  bulkDeleteError.value = null;
  const ids = Array.from(selectedIds.value);
  if (ids.length === 0) return;
  try {
    await bulkDelete.deleteMany(ids);
    showBulkDelete.value = false;
    selectedIds.value = new Set();
  } catch (e) {
    bulkDeleteError.value = getErrorMessage(e);
  }
}

// --- Group selection ---
function onSelectGroup(id: string) {
  router.replace({ query: { ...route.query, consumerGroupId: id } });
}

function onChangeGroup() {
  const { consumerGroupId: _drop, ...rest } = route.query;
  router.replace({ query: rest });
}

// --- Display ---
const canRequeue = computed(() => messageType.value !== 'scheduled');

const queueLabel = computed(() =>
  name.value && ns.value ? `${name.value}@${ns.value}` : '',
);

const pageTitle = computed(() => {
  const base = `${messageType.value.charAt(0).toUpperCase()}${messageType.value.slice(1)} messages`;
  if (messageType.value === 'pending' && consumerGroupId.value) {
    return `${base} in group ${consumerGroupId.value}`;
  }
  return base;
});

const pageActions = computed<PageAction[]>(() => [
  {
    id: 'publish',
    label: 'Publish',
    icon: 'bi-send',
    variant: 'primary',
    disabled: !params.value,
    onClick: () => {
      showPublishModal.value = true;
    },
  },
  {
    id: 'refresh',
    label: 'Refresh',
    icon: 'bi-arrow-clockwise',
    variant: 'secondary',
    loading: messages.isLoading.value,
    onClick: () => messages.refresh(),
  },
  {
    id: 'purge',
    label: 'Purge',
    icon: 'bi-trash',
    variant: 'danger',
    disabled: !params.value,
    onClick: () => {
      showPurge.value = true;
    },
  },
]);
</script>

<template>
  <PageShell
    :title="`Messages: ${queueLabel}`"
    :subtitle="pageTitle"
    icon="bi-envelope"
    :actions="pageActions"
  >
    <MessageTabs v-if="ns && name" :ns="ns" :queue="name" />

    <Card v-if="messageType === 'pending' && queueProperties.isLoading.value">
      <StateBlock kind="loading" />
    </Card>

    <ConsumerGroupSelector
      v-else-if="showGroupSelector && params"
      :queue="params"
      @select="onSelectGroup"
    />

    <Card v-else>
      <div
        v-if="consumerGroupId && messageType === 'pending'"
        class="group-banner"
      >
        <i class="bi bi-people-fill" aria-hidden="true" />
        <span>
          Viewing group <strong class="font-mono">{{ consumerGroupId }}</strong>
        </span>
        <button
          type="button"
          class="btn btn-sm btn-outline-secondary group-banner__change"
          @click="onChangeGroup"
        >
          Change group
        </button>
      </div>

      <StateBlock v-if="messages.isLoading.value" kind="loading" />
      <StateBlock
        v-else-if="messages.error.value"
        kind="error"
        icon="bi-exclamation-triangle-fill"
        title="Failed to load messages"
        :message="messages.error.value"
      />
      <StateBlock
        v-else-if="messages.items.value.length === 0"
        kind="empty"
        icon="bi-inbox"
        title="No messages"
        :message="
          consumerGroupId && messageType === 'pending'
            ? `No pending messages in group ${consumerGroupId}.`
            : `No ${messageType} messages found.`
        "
      />
      <template v-else>
        <!-- Bulk toolbar (appears when any row is selected) -->
        <div
          v-if="selectionCount > 0"
          class="bulk-bar"
          role="region"
          aria-label="Bulk actions"
        >
          <label class="bulk-bar__master">
            <input
              ref="masterCheckbox"
              type="checkbox"
              :checked="allSelected"
              :aria-label="
                allSelected ? 'Deselect all on page' : 'Select all on page'
              "
              @change="toggleAll"
            />
            <span>{{
              allSelected ? 'Deselect all' : 'Select all on page'
            }}</span>
          </label>
          <span class="bulk-bar__count"> {{ selectionCount }} selected </span>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            @click="clearSelection"
          >
            Clear
          </button>
          <button
            type="button"
            class="btn btn-sm btn-danger"
            :disabled="bulkDelete.isPending.value"
            @click="showBulkDelete = true"
          >
            <i class="bi bi-trash me-1" aria-hidden="true" />
            Delete selected
          </button>
        </div>

        <Pagination
          :current-page="messages.pagination.value.currentPage"
          :total-pages="messages.pagination.value.totalPages"
          :page-size="messages.pagination.value.pageSize"
          :total-count="messages.pagination.value.totalCount"
          :start="messages.pagination.value.start"
          :end="messages.pagination.value.end"
          @page-change="messages.goToPage"
          @page-size-change="messages.setPageSize"
        />
        <MessageListItem
          v-for="m in messages.items.value"
          :key="m.id"
          :message="m"
          :can-requeue="canRequeue"
          :selected="selectedIds.has(m.id)"
          @toggle="toggleOne"
          @view="(id) => (selectedMessageId = id)"
          @delete="
            (id) => {
              deleteTarget = id;
              deleteError = null;
            }
          "
          @requeue="
            (id) => {
              requeueTarget = id;
              requeueError = null;
            }
          "
        />
      </template>
    </Card>
  </PageShell>

  <PublishMessageModal
    :is-visible="showPublishModal"
    :queue="params"
    @close="showPublishModal = false"
    @published="onPublished"
  />

  <ViewMessageModal
    :is-visible="!!selectedMessageId"
    :message-id="selectedMessageId"
    @close="selectedMessageId = null"
    @deleted="onDetailDeleted"
    @requeued="onDetailRequeued"
  />

  <PurgeQueueModal
    :is-visible="showPurge"
    :queue="params"
    :default-status="messageType"
    :consumer-group-id="messageType === 'pending' ? consumerGroupId : null"
    @close="showPurge = false"
    @purged="onPurged"
  />

  <!-- Bulk delete confirmation -->
  <ConfirmationModal
    :is-visible="showBulkDelete"
    title="Delete selected messages"
    subtitle="This action cannot be undone"
    icon="bi-exclamation-triangle"
    :message="`Delete ${selectionCount} message${selectionCount === 1 ? '' : 's'}?`"
    confirm-label="Delete selected"
    confirm-variant="danger"
    :is-pending="bulkDelete.isPending.value"
    :error="bulkDeleteError"
    @close="showBulkDelete = false"
    @confirm="onConfirmBulkDelete"
  >
    <template #extra>
      <ul class="bulk-preview">
        <li v-for="id in bulkPreviewIds" :key="id" class="font-mono">
          {{ id }}
        </li>
        <li v-if="bulkExtraCount > 0" class="bulk-preview__more">
          …and {{ bulkExtraCount }} more
        </li>
      </ul>
    </template>
  </ConfirmationModal>

  <!-- Row-level single delete -->
  <ConfirmationModal
    :is-visible="!!deleteTarget"
    title="Delete message"
    subtitle="This action cannot be undone"
    icon="bi-exclamation-triangle"
    :message="`Delete message ${deleteTarget ?? ''}?`"
    confirm-label="Delete"
    confirm-variant="danger"
    :is-pending="actions.isDeleting.value"
    :error="deleteError"
    @close="deleteTarget = null"
    @confirm="onConfirmDelete"
  />

  <!-- Row-level single requeue -->
  <ConfirmationModal
    :is-visible="!!requeueTarget"
    title="Requeue message"
    icon="bi-arrow-clockwise"
    :message="`Requeue message ${requeueTarget ?? ''}? It will become available for processing again.`"
    confirm-label="Requeue"
    confirm-variant="primary"
    :is-pending="actions.isRequeuing.value"
    :error="requeueError"
    @close="requeueTarget = null"
    @confirm="onConfirmRequeue"
  />
</template>

<style scoped>
.group-banner {
  display: flex;
  align-items: center;
  gap: var(--rsmq-space-2);
  padding: var(--rsmq-space-2) var(--rsmq-space-3);
  background: var(--rsmq-color-primary-tint);
  border-radius: var(--rsmq-radius-md);
  color: var(--rsmq-color-primary);
  font-size: 0.85rem;
  margin-bottom: var(--rsmq-space-3);
  flex-wrap: wrap;
}
.group-banner__change {
  margin-left: auto;
}

.bulk-bar {
  display: flex;
  align-items: center;
  gap: var(--rsmq-space-3);
  padding: var(--rsmq-space-2) var(--rsmq-space-3);
  background: var(--rsmq-color-primary-tint);
  border: 1px solid var(--rsmq-color-primary);
  border-radius: var(--rsmq-radius-md);
  margin-bottom: var(--rsmq-space-3);
  flex-wrap: wrap;
  font-size: 0.85rem;
}

.bulk-bar__master {
  display: inline-flex;
  align-items: center;
  gap: var(--rsmq-space-2);
  cursor: pointer;
  font-weight: 500;
  color: var(--rsmq-color-primary);
}
.bulk-bar__master input {
  accent-color: var(--rsmq-color-primary);
  width: 1rem;
  height: 1rem;
  cursor: pointer;
  margin: 0;
}

.bulk-bar__count {
  font-weight: 600;
  color: var(--rsmq-color-primary);
}

.bulk-bar > button:nth-last-child(2) {
  margin-left: auto;
}

.bulk-preview {
  list-style: none;
  margin: var(--rsmq-space-3) 0 0;
  padding: var(--rsmq-space-2) var(--rsmq-space-3);
  background: var(--rsmq-color-bg);
  border-radius: var(--rsmq-radius-sm);
  font-size: 0.75rem;
  max-height: 12rem;
  overflow-y: auto;
}
.bulk-preview li {
  padding: 2px 0;
  overflow-wrap: anywhere;
}
.bulk-preview__more {
  color: var(--rsmq-color-text-muted);
  font-style: italic;
}

@media (max-width: 576px) {
  .group-banner__change {
    margin-left: 0;
    width: 100%;
  }
  .bulk-bar > button {
    flex: 1;
    justify-content: center;
  }
  .bulk-bar > button:nth-last-child(2) {
    margin-left: 0;
  }
}
</style>
