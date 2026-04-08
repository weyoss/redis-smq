/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { type Ref, computed } from 'vue';
import { getApiNamespacesNsQueuesNameMessages } from '@/api/generated/queue-messages/queue-messages.ts';
import {
  useMessages,
  type MessagesQueryConfig,
} from '@/composables/useMessages';
import type { IQueueParams } from '@/types/index.ts';
import { useGetApiConfig } from '@/api/generated/configuration/configuration.ts';
import { getErrorMessage } from '@/lib/error.ts';

/**
 * Composable for dead-lettered messages that first checks if the feature is enabled
 * in the server configuration before fetching messages.
 */
export function useDeadLetteredMessages(
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

  const deadLetteringEnabled = computed<boolean | null>(() => {
    // If not active, return false immediately
    if (!isActive.value) return false;
    if (isConfigLoading.value) return null;
    const enabled =
      configData.value?.data?.messageAudit?.deadLetteredMessages?.enabled;
    return typeof enabled === 'boolean' ? enabled : false;
  });

  const configError = computed(() => getErrorMessage(configApiError.value));

  // Only enable messages query if:
  // 1. This composable is active (has valid queue params)
  // 2. Dead lettering is enabled in config
  const isMessagesEnabled = computed(() => {
    return isActive.value && deadLetteringEnabled.value === true;
  });

  const config: MessagesQueryConfig = {
    queryFn: async ({ ns, name, page, pageSize }) => {
      return getApiNamespacesNsQueuesNameMessages(ns, name, {
        page,
        pageSize,
        status: 'dead-lettered',
      });
    },
    queryKeyPrefix: 'dead-lettered-messages',
    enableDelete: true,
    enableRequeue: true,
    enabled: isMessagesEnabled,
  };

  const messagesComposable = useMessages(queueParams, config, initialPageSize);

  return {
    ...messagesComposable,
    isConfigLoading,
    configError,
    deadLetteringEnabled,
    refetchConfig,
  };
}
