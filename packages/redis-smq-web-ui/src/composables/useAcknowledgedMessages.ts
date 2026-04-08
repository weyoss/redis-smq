/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { computed, type Ref } from 'vue';
import { useMessages, type MessagesQueryConfig } from './useMessages.ts';
import type { IQueueParams } from '@/types';
import { useGetApiConfig } from '@/api/generated/configuration/configuration';
import { getApiNamespacesNsQueuesNameMessages } from '@/api/generated/queue-messages/queue-messages';
import { getErrorMessage } from '@/lib/error.ts';

/**
 * Composable for acknowledged messages that first checks if the feature is enabled
 * in the server configuration before fetching messages.
 */
export function useAcknowledgedMessages(
  queueParams: Ref<IQueueParams | null>,
  initialPageSize = 20,
) {
  // Check if this composable is active (has valid queue params)
  const isActive = computed(() => {
    return !!(queueParams.value?.ns && queueParams.value?.name);
  });

  // Fetch config only when this composable is active
  const {
    data: configData,
    isLoading: isConfigLoading,
    error: configApiError,
    refetch: refetchConfig,
  } = useGetApiConfig({
    query: {
      enabled: isActive, // Only fetch config when this composable is active
    },
  });

  const ackEnabled = computed<boolean | null>(() => {
    // If not active, return false immediately
    if (!isActive.value) return false;
    if (isConfigLoading.value) return null;
    const enabled =
      configData.value?.data?.messageAudit?.acknowledgedMessages?.enabled;
    return typeof enabled === 'boolean' ? enabled : false;
  });

  const configError = computed(() => getErrorMessage(configApiError.value));

  // Only enable messages query if:
  // 1. This composable is active (has valid queue params)
  // 2. Acknowledged messages are enabled in config
  const isMessagesEnabled = computed(() => {
    return isActive.value && ackEnabled.value === true;
  });

  const config: MessagesQueryConfig = {
    queryFn: async ({ ns, name, page, pageSize }) => {
      return getApiNamespacesNsQueuesNameMessages(ns, name, {
        page,
        pageSize,
        status: 'acknowledged',
      });
    },
    queryKeyPrefix: 'acknowledged-messages',
    enableDelete: true,
    enableRequeue: true,
    enabled: isMessagesEnabled,
  };

  const messagesComposable = useMessages(queueParams, config, initialPageSize);

  return {
    ...messagesComposable,
    isConfigLoading,
    configError,
    ackEnabled,
    refetchConfig,
  };
}
