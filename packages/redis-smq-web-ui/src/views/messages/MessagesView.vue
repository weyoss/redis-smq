<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed, watch, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import PageContent from '@/components/PageContent.vue';
import MessageList from '@/components/MessageList.vue';
import ConsumerGroupSelector from '@/components/ConsumerGroupSelector.vue';
import { usePageContentStore } from '@/stores/pageContent.ts';
import { useSelectedQueueStore } from '@/stores/selectedQueue.ts';
import { useSelectedQueuePropertiesStore } from '@/stores/selectedQueueProperties.ts';
import { EMessageType, type IQueueParams } from '@/types';
import { useQueuePublishedMessages } from '@/composables/useQueuePublishedMessages.ts';
import { useScheduledMessages } from '@/composables/useScheduledMessages.ts';
import { usePendingMessages } from '@/composables/usePendingMessages.ts';
import { useDeadLetteredMessages } from '@/composables/useDeadLetteredMessages.ts';
import { useAcknowledgedMessages } from '@/composables/useAcknowledgedMessages.ts';
import { useTypedRouter } from '@/router/useTypeRouter.ts';

const route = useRoute();
const router = useTypedRouter();
const pageContentStore = usePageContentStore();
const selectedQueueStore = useSelectedQueueStore();
const queuePropertiesStore = useSelectedQueuePropertiesStore();

// --- Route Parameters ---
const ns = computed(() => route.params.ns as string);
const name = computed(() => route.params.queue as string);
const consumerGroupId = computed(
  () => route.query.consumerGroupId as string | null,
);

// --- Message Type Validation and Redirection ---
const isValidMessageType = (type: string): type is EMessageType => {
  return Object.values(EMessageType).includes(type as EMessageType);
};

const messageType = computed(() => {
  const type = route.query.type as string;

  if (!type || !isValidMessageType(type)) {
    const { type: _, ...restQuery } = route.query;

    router.replace('messages', {
      params: {
        ns: ns.value,
        queue: name.value,
      },
      query: {
        ...restQuery,
        type: EMessageType.PUBLISHED,
      },
    });
    return EMessageType.PUBLISHED;
  }

  return type as EMessageType;
});

// --- Queue Parameters ---
const queueParams = computed<IQueueParams>(() => ({
  ns: ns.value,
  name: name.value,
}));

// --- Queue Selection Sync ---
watch(
  [ns, name],
  ([newNs, newName]) => {
    if (newNs && newName) {
      selectedQueueStore.selectQueue(newNs, newName);
    }
  },
  { immediate: true },
);

// --- Queue State ---
const selectedQueue = computed(() => selectedQueueStore.selectedQueue);
const isPubSubQueue = computed(() => queuePropertiesStore.isPubSubQueue);
const queueProperties = computed(() => queuePropertiesStore.queueProperties);
const isLoadingQueueProperties = computed(
  () => queuePropertiesStore.isLoadingQueueProperties,
);
const queuePropertiesError = computed(
  () => queuePropertiesStore.queuePropertiesError?.error,
);

// --- Consumer Group Selector Logic ---
const shouldShowConsumerGroupSelector = computed(() => {
  return (
    messageType.value === EMessageType.PENDING &&
    selectedQueue.value &&
    queueProperties.value &&
    isPubSubQueue.value &&
    !consumerGroupId.value
  );
});

// --- Message Type Configuration ---
const MESSAGE_TYPE_CONFIGS = {
  [EMessageType.PUBLISHED]: {
    title: 'Published Messages',
    subtitle: 'View all messages published to this queue.',
    icon: 'bi-collection-fill',
    emptyMessage: 'No published messages found for this queue.',
    enableRequeue: true,
    requiresConfig: false,
    configCheck: null,
  },
  [EMessageType.SCHEDULED]: {
    title: 'Scheduled Messages',
    subtitle: 'View messages scheduled for future delivery.',
    icon: 'bi-calendar-plus-fill',
    emptyMessage: 'No scheduled messages found for this queue.',
    enableRequeue: false,
    requiresConfig: false,
    configCheck: null,
  },
  [EMessageType.PENDING]: {
    title: 'Pending Messages',
    subtitle: 'View messages waiting to be processed.',
    icon: 'bi-clock-history',
    emptyMessage: 'No pending messages found for this queue.',
    enableRequeue: true,
    requiresConfig: false,
    configCheck: null,
  },
  [EMessageType.DEAD_LETTERED]: {
    title: 'Dead-Lettered Messages',
    subtitle: 'View messages that have failed all processing attempts.',
    icon: 'bi-x-octagon-fill',
    emptyMessage: 'No dead-lettered messages found for this queue.',
    enableRequeue: true,
    requiresConfig: true,
    configCheck: {
      featureName: 'Dead-lettered messages',
      enableMessage:
        'Dead-lettered message auditing is disabled in the RedisSMQ configuration. This view will remain empty until auditing is enabled.',
    },
  },
  [EMessageType.ACKNOWLEDGED]: {
    title: 'Acknowledged Messages',
    subtitle: 'View messages that have been successfully processed.',
    icon: 'bi-check-circle-fill',
    emptyMessage: 'No acknowledged messages found for this queue.',
    enableRequeue: true,
    requiresConfig: true,
    configCheck: {
      featureName: 'Acknowledged messages',
      enableMessage:
        'Acknowledged message auditing is disabled in the RedisSMQ configuration. This view will remain empty until auditing is enabled.',
    },
  },
} as const;

const messageConfig = computed(() => MESSAGE_TYPE_CONFIGS[messageType.value]);

const isPublishedActive = computed(
  () => messageType.value === EMessageType.PUBLISHED,
);
const isScheduledActive = computed(
  () => messageType.value === EMessageType.SCHEDULED,
);
const isPendingActive = computed(
  () => messageType.value === EMessageType.PENDING,
);
const isDeadLetteredActive = computed(
  () => messageType.value === EMessageType.DEAD_LETTERED,
);
const isAcknowledgedActive = computed(
  () => messageType.value === EMessageType.ACKNOWLEDGED,
);

// For pending messages, only pass queueParams when a consumer group is selected
// Otherwise pass null to prevent queries
const publishedQueueParams = computed(() =>
  isPublishedActive.value ? queueParams.value : null,
);
const scheduledQueueParams = computed(() =>
  isScheduledActive.value ? queueParams.value : null,
);
const pendingQueueParams = computed(() => {
  // Only enable pending messages query if:
  // 1. We're on the pending view
  // 2. Queue properties is loaded
  // 3. AND (queue is not Pub/Sub OR consumer group is selected)
  if (!isPendingActive.value) return null;

  // Queue properties is not loaded
  if (!queueProperties.value) return null;

  // For non-Pub/Sub queues, we can query immediately
  if (!isPubSubQueue.value) return queueParams.value;

  // For Pub/Sub queues, only query if a consumer group is selected
  return consumerGroupId.value ? queueParams.value : null;
});
const deadLetteredQueueParams = computed(() =>
  isDeadLetteredActive.value ? queueParams.value : null,
);
const acknowledgedQueueParams = computed(() =>
  isAcknowledgedActive.value ? queueParams.value : null,
);

// Initialize all composables - but inactive ones get null queueParams
const publishedComposable = useQueuePublishedMessages(publishedQueueParams, 20);
const scheduledComposable = useScheduledMessages(scheduledQueueParams, 20);
const pendingComposable = usePendingMessages(
  pendingQueueParams,
  consumerGroupId,
  20,
);
const deadLetteredComposable = useDeadLetteredMessages(
  deadLetteredQueueParams,
  20,
);
const acknowledgedComposable = useAcknowledgedMessages(
  acknowledgedQueueParams,
  20,
);

// --- Active Composable Selection ---
const activeComposable = computed(() => {
  switch (messageType.value) {
    case EMessageType.PUBLISHED:
      return publishedComposable;
    case EMessageType.SCHEDULED:
      return scheduledComposable;
    case EMessageType.PENDING:
      return pendingComposable;
    case EMessageType.DEAD_LETTERED:
      return deadLetteredComposable;
    case EMessageType.ACKNOWLEDGED:
      return acknowledgedComposable;
    default:
      return publishedComposable;
  }
});

// --- Reactive State from Active Composable ---
const messages = computed(() => activeComposable.value.messages.value);
const pagination = computed(() => activeComposable.value.pagination.value);
const isLoading = computed(() => activeComposable.value.isLoading.value);
const isDeleting = computed(() => activeComposable.value.isDeleting.value);
const isRequeuing = computed(() => activeComposable.value.isRequeuing.value);
const error = computed(() => activeComposable.value.error.value);

// --- Actions ---
const goToPage = (page: number) => activeComposable.value.goToPage(page);
const setPageSize = (size: number) => activeComposable.value.setPageSize(size);
const refresh = () => activeComposable.value.refresh();

// --- Feature-Specific State (Dead-lettered & Acknowledged) ---
const requiresConfig = computed(() => messageConfig.value.requiresConfig);

const isConfigLoading = computed(() => {
  if (messageType.value === EMessageType.DEAD_LETTERED) {
    return deadLetteredComposable.isConfigLoading?.value ?? false;
  }
  if (messageType.value === EMessageType.ACKNOWLEDGED) {
    return acknowledgedComposable.isConfigLoading?.value ?? false;
  }
  return false;
});

const configError = computed(() => {
  if (messageType.value === EMessageType.DEAD_LETTERED) {
    return deadLetteredComposable.configError?.value ?? null;
  }
  if (messageType.value === EMessageType.ACKNOWLEDGED) {
    return acknowledgedComposable.configError?.value ?? null;
  }
  return null;
});

const isFeatureEnabled = computed(() => {
  if (messageType.value === EMessageType.DEAD_LETTERED) {
    return deadLetteredComposable.deadLetteringEnabled?.value ?? false;
  }
  if (messageType.value === EMessageType.ACKNOWLEDGED) {
    return acknowledgedComposable.ackEnabled?.value ?? false;
  }
  return true;
});

const refetchConfig = () => {
  if (
    messageType.value === EMessageType.DEAD_LETTERED &&
    deadLetteredComposable.refetchConfig
  ) {
    deadLetteredComposable.refetchConfig();
  }
  if (
    messageType.value === EMessageType.ACKNOWLEDGED &&
    acknowledgedComposable.refetchConfig
  ) {
    acknowledgedComposable.refetchConfig();
  }
};

// --- No Messages Info ---
const noMessagesInfo = computed(() => {
  if (messageConfig.value.requiresConfig && !isFeatureEnabled.value) {
    return (
      messageConfig.value.configCheck?.enableMessage ||
      messageConfig.value.emptyMessage
    );
  }

  if (
    messageType.value === EMessageType.PENDING &&
    isPubSubQueue.value &&
    consumerGroupId.value
  ) {
    return `No pending messages found for consumer group "${consumerGroupId.value}".`;
  }

  return messageConfig.value.emptyMessage;
});

// --- Page Header ---
const pageTitle = computed(() => {
  if (!selectedQueue.value) return messageConfig.value.title;

  const queueContext = `${selectedQueue.value.name}@${selectedQueue.value.ns}`;

  if (
    messageType.value === EMessageType.PENDING &&
    isPubSubQueue.value &&
    consumerGroupId.value
  ) {
    return `${messageConfig.value.title}: ${queueContext} (${consumerGroupId.value})`;
  }

  return `${messageConfig.value.title}: ${queueContext}`;
});

watchEffect(() => {
  pageContentStore.setPageHeader({
    title: pageTitle.value,
    subtitle: messageConfig.value.subtitle,
    icon: `bi ${messageConfig.value.icon}`,
  });
  pageContentStore.setPageActions([]);
});

// --- Event Handlers ---
const handleRetryQueueProperties = () => {
  queuePropertiesStore.refreshQueueProperties();
};

const handleRetryConfig = () => {
  refetchConfig();
};
</script>

<template>
  <PageContent :show-section-header="false">
    <!-- Consumer Group Selection for Pub/Sub Queues (Pending Messages only) -->
    <ConsumerGroupSelector
      v-if="shouldShowConsumerGroupSelector"
      :show-section-header="false"
    />

    <!-- Messages Display -->
    <MessageList
      v-else
      :messages="messages"
      :pagination="pagination"
      :is-loading="isLoading"
      :error="error"
      :is-deleting="isDeleting"
      :is-requeuing="isRequeuing"
      :is-loading-queue-properties="isLoadingQueueProperties"
      :queue-properties-error="queuePropertiesError"
      :is-config-loading="isConfigLoading"
      :config-error="configError"
      :is-feature-enabled="isFeatureEnabled"
      :has-selected-queue="!!selectedQueue"
      :feature-name="messageConfig.configCheck?.featureName"
      :enable-message="messageConfig.configCheck?.enableMessage"
      :empty-message="noMessagesInfo"
      :icon="messageConfig.icon"
      :enable-requeue="messageConfig.enableRequeue"
      :on-refresh="refresh"
      :on-page-change="goToPage"
      :on-page-size-change="setPageSize"
      :on-first-page="() => goToPage(1)"
      :on-previous-page="() => goToPage(pagination.currentPage - 1)"
      :on-next-page="() => goToPage(pagination.currentPage + 1)"
      :on-last-page="() => goToPage(pagination.totalPages)"
      :on-retry-queue-properties="handleRetryQueueProperties"
      :on-retry-config="requiresConfig ? handleRetryConfig : undefined"
    />
  </PageContent>
</template>
