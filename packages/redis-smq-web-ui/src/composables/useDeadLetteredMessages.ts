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
  queueParams: Ref<IQueueParams>,
  initialPageSize = 20,
) {
  // First, fetch the config to check if audit is enabled
  const {
    data: configData,
    isLoading: isConfigLoading,
    error: configApiError,
    refetch: refetchConfig,
  } = useGetApiConfig();

  const deadLetteringEnabled = computed<boolean | null>(() => {
    if (isConfigLoading.value) return null; // Indeterminate state
    const enabled =
      configData.value?.data?.messageAudit?.deadLetteredMessages?.enabled;
    return typeof enabled === 'boolean' ? enabled : false;
  });

  const configError = computed(() => getErrorMessage(configApiError.value));

  // --- Messages Composable Setup ---
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
    enableRequeue: true, // Dead-lettered messages can be requeued
    enabled: deadLetteringEnabled, // Pass the computed enabled flag
  };

  const messagesComposable = useMessages(queueParams, config, initialPageSize);

  // --- Combined State for the View ---
  return {
    ...messagesComposable,

    // Configuration state
    isConfigLoading,
    configError,
    deadLetteringEnabled,
    refetchConfig,
  };
}
