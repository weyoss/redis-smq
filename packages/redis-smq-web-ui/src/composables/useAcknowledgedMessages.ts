/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { computed, type Ref } from 'vue';
import { useMessages } from './useMessages.ts';
import type { IQueueParams } from '@/types';
import { useGetApiConfig } from '@/api/generated/configuration/configuration';
import { GetApiNamespacesNsQueuesNameMessagesStatus } from '@/api/model';
import { getApiNamespacesNsQueuesNameMessages } from '@/api/generated/queue-messages/queue-messages';
import { getErrorMessage } from '@/lib/error.ts';

export function useAcknowledgedMessages(
  queueParams: Ref<IQueueParams | null>,
  initialPageSize = 20,
) {
  // First, fetch the config to check if audit is enabled
  const {
    data: configData,
    isLoading: isConfigLoading,
    error: configError,
    refetch: refetchConfig,
  } = useGetApiConfig();

  // Determine if audit is enabled
  const ackEnabled = computed(
    () =>
      configData.value?.data?.messageAudit.acknowledgedMessages.enabled ??
      false,
  );

  // Create an enabled flag for messages query
  const messagesEnabled = computed(() => {
    if (isConfigLoading.value) return false;
    if (configError.value) return false;
    return ackEnabled.value && !!queueParams.value;
  });

  // Use the messages composable with conditional enabling
  const messagesComposable = useMessages(
    queueParams,
    {
      queryFn: async ({ ns, name, page, pageSize }) => {
        return getApiNamespacesNsQueuesNameMessages(ns, name, {
          page,
          pageSize,
          status: GetApiNamespacesNsQueuesNameMessagesStatus.acknowledged,
        });
      },
      queryKeyPrefix: 'acknowledged-messages',
      enableDelete: true,
      enableRequeue: true,
      enabled: messagesEnabled,
    },
    initialPageSize,
  );

  return {
    // Config state
    isConfigLoading,
    configError: computed(() => getErrorMessage(configError)), // converting unknown to IAPIError
    ackEnabled,
    refetchConfig,

    // Messages state
    messages: messagesComposable.messages,
    pagination: messagesComposable.pagination,
    isLoading: messagesComposable.isLoading,
    isFetching: messagesComposable.isFetching,
    isDeleting: messagesComposable.isDeleting,
    isRequeuing: messagesComposable.isRequeuing,
    error: messagesComposable.error,
    goToPage: messagesComposable.goToPage,
    setPageSize: messagesComposable.setPageSize,
    refresh: messagesComposable.refresh,
    deleteMessage: messagesComposable.deleteMessage,
    requeueMessage: messagesComposable.requeueMessage,
    totalMessages: messagesComposable.totalMessages,
    hasNextPage: messagesComposable.hasNextPage,
    hasPreviousPage: messagesComposable.hasPreviousPage,
    currentPage: messagesComposable.currentPage,
  };
}
