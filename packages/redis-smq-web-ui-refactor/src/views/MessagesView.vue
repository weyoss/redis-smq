<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import PageShell from '@/components/ui/PageShell.vue';
import Card from '@/components/ui/Card.vue';
import Pagination from '@/components/ui/Pagination.vue';
import StateBlock from '@/components/ui/StateBlock.vue';
import MessageTabs from '@/components/message/MessageTabs.vue';
import MessageListItem from '@/components/message/MessageListItem.vue';
import { useQueueSelection } from '@/composables/useQueueSelection';
import { useMessages } from '@/composables/useMessages';
import { getQueueMessages } from '@/api/generated/queue-messages/queue-messages';
import type { MessageStatus } from '@/api/model';
import type { PageAction } from '@/components/ui/PageShell.vue';

const route = useRoute();
const { ns, name, params } = useQueueSelection();

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

const messages = useMessages(params, {
  queryKeyPrefix: () => `queue-messages-${messageType.value}`,
  queryFn: ({ ns, name, page, pageSize }) =>
    getQueueMessages(ns, name, {
      page,
      pageSize,
      status: messageType.value,
    }),
});

const queueLabel = computed(() =>
  name.value && ns.value ? `${name.value}@${ns.value}` : '',
);

const actions = computed<PageAction[]>(() => [
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
    :subtitle="`${messageType.charAt(0).toUpperCase()}${messageType.slice(1)} messages`"
    icon="bi-envelope"
    :actions="actions"
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
        />
      </template>
    </Card>
  </PageShell>
</template>
