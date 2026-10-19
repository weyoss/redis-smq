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
import MessageTabs from '@/components/message/MessageTabs.vue';
import MessageListItem from '@/components/message/MessageListItem.vue';
import { useQueueSelection } from '@/composables/useQueueSelection';
import { useMessages } from '@/composables/useMessages';
import { useMessageActions } from '@/composables/useMessageActions';
import { getQueueMessages } from '@/api/generated/queue-messages/queue-messages';
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

// --- Messages query ---
const messages = useMessages(params, {
  queryKeyPrefix: () => `queue-messages-${messageType.value}`,
  queryFn: ({ ns, name, page, pageSize }) =>
    getQueueMessages(ns, name, {
      page,
      pageSize,
      status: messageType.value,
    }),
});

// --- Mutations (used by both row actions and the detail modal) ---
const actions = useMessageActions(() => messages.refresh());

// --- Delete modal (row actions) ---
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

// --- Requeue modal (row actions) ---
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

// --- View detail modal ---
const selectedMessageId = ref<string | null>(null);

function onDetailDeleted() {
  // Detail modal already closed itself; just refresh the list.
  selectedMessageId.value = null;
  messages.refresh();
}

function onDetailRequeued() {
  // Detail modal stays open on requeue — the user can see the new state.
  // Only the underlying list needs to refresh.
  messages.refresh();
}

// --- Publish modal ---
const showPublishModal = ref(false);

function onPublished() {
  showPublishModal.value = false;
  messages.refresh();
}

// Close all action modals when the user switches tabs.
watch(messageType, () => {
  deleteTarget.value = null;
  requeueTarget.value = null;
  selectedMessageId.value = null;
});

// Requeue is meaningful for everything except scheduled.
const canRequeue = computed(() => messageType.value !== 'scheduled');

const queueLabel = computed(() =>
  name.value && ns.value ? `${name.value}@${ns.value}` : '',
);

const pageTitle = computed(
  () =>
    `${messageType.value.charAt(0).toUpperCase()}${messageType.value.slice(1)} messages`,
);

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

    <Card>
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
        :message="`No ${messageType} messages found.`"
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

  <!-- Publish -->
  <PublishMessageModal
    :is-visible="showPublishModal"
    :queue="params"
    @close="showPublishModal = false"
    @published="onPublished"
  />

  <!-- Message detail view -->
  <ViewMessageModal
    :is-visible="!!selectedMessageId"
    :message-id="selectedMessageId"
    @close="selectedMessageId = null"
    @deleted="onDetailDeleted"
    @requeued="onDetailRequeued"
  />

  <!-- Delete confirmation (row action) -->
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

  <!-- Requeue confirmation (row action) -->
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
