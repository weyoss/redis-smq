<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
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
import { getQueueMessages } from '@/api/generated/queue-messages/queue-messages';
import { getConsumerGroupPendingMessages } from '@/api/generated/consumer-groups/consumer-groups';
import { getErrorMessage } from '@/lib/error';
import type { MessageStatus } from '@/api/model';
import type { PageAction } from '@/components/ui/PageShell.vue';

const route = useRoute();
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

// Show the group selector: pending tab on pub/sub queue with no group selected.
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

// Row delete
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

// Row requeue
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

// Detail modal
const selectedMessageId = ref<string | null>(null);

function onDetailDeleted() {
  selectedMessageId.value = null;
  messages.refresh();
}

function onDetailRequeued() {
  messages.refresh();
}

// Publish modal
const showPublishModal = ref(false);

function onPublished() {
  showPublishModal.value = false;
  messages.refresh();
}

// Purge modal
const showPurge = ref(false);

function onPurged() {
  showPurge.value = false;
  messages.refresh();
}

// Close action modals on tab switch or group change.
watch([messageType, consumerGroupId], () => {
  deleteTarget.value = null;
  requeueTarget.value = null;
  selectedMessageId.value = null;
  showPurge.value = false;
});

// --- Group selection ---
function onSelectGroup(id: string) {
  const query = { ...route.query, consumerGroupId: id };
  // push so the browser back button returns to the selector
  router.replace({ query });
}

function onChangeGroup() {
  const { consumerGroupId: _drop, ...rest } = route.query;
  router.replace({ query: rest });
}

import { useRouter } from 'vue-router';
const router = useRouter();

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

    <!-- Queue properties loading (only relevant to the pending tab) -->
    <Card v-if="messageType === 'pending' && queueProperties.isLoading.value">
      <StateBlock kind="loading" />
    </Card>

    <!-- Consumer group selector -->
    <ConsumerGroupSelector
      v-else-if="showGroupSelector && params"
      :queue="params"
      @select="onSelectGroup"
    />

    <!-- Message list -->
    <Card v-else>
      <!-- Active group banner -->
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
@media (max-width: 576px) {
  .group-banner__change {
    margin-left: 0;
    width: 100%;
  }
}
</style>
