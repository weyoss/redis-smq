/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { type Ref, computed } from 'vue';
import { getApiV1NamespacesNsQueuesNameAcknowledgedMessages } from '@/api/generated/acknowledged-messages/acknowledged-messages.ts';
import {
  useMessages,
  type MessagesQueryConfig,
} from '@/composables/useMessages';
import type { IQueueParams } from '@/types/index.ts';
import { useGetApiV1Config } from '@/api/generated/configuration/configuration.ts';
import { getErrorMessage } from '@/lib/error.ts';

/**
 * Composable for acknowledged messages that first checks if the feature is enabled
 * in the server configuration before fetching messages.
 */
export function useAcknowledgedMessages(
  queueParams: Ref<IQueueParams>,
  initialPageSize = 20,
) {
  // --- Configuration Fetching ---
  const {
    data: configData,
    isLoading: isConfigLoading,
    error: configApiError,
    refetch: refetchConfig,
  } = useGetApiV1Config();

  const ackEnabled = computed<boolean | null>(() => {
    if (isConfigLoading.value) return null; // Indeterminate state while loading
    const enabled =
      configData.value?.data?.messageAudit?.acknowledgedMessages?.enabled;
    return typeof enabled === 'boolean' ? enabled : false;
  });

  const configError = computed(() => getErrorMessage(configApiError.value));

  // --- Messages Composable Setup ---
  const config: MessagesQueryConfig = {
    queryFn: async ({ ns, name, page, pageSize }) => {
      return getApiV1NamespacesNsQueuesNameAcknowledgedMessages(ns, name, {
        page,
        pageSize,
      });
    },
    queryKeyPrefix: 'acknowledged-messages',
    enableDelete: true,
    enableRequeue: true, // Acknowledged messages can be requeued
    enabled: ackEnabled, // Pass the computed enabled flag to useMessages
  };

  const messagesComposable = useMessages(queueParams, config, initialPageSize);

  // --- Combined State for the View ---
  return {
    ...messagesComposable,

    // Configuration state
    isConfigLoading,
    configError,
    ackEnabled,
    refetchConfig,
  };
}
