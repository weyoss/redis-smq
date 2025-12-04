import { type Ref, computed } from 'vue';
import { getApiV1NamespacesNsQueuesNameDeadLetteredMessages } from '@/api/generated/dead-lettered-messages/dead-lettered-messages.ts';
import {
  useMessages,
  type MessagesQueryConfig,
} from '@/composables/useMessages';
import type { IQueueParams } from '@/types/index.ts';
import { useGetApiV1Config } from '@/api/generated/configuration/configuration.ts';
import { getErrorMessage } from '@/lib/error.ts';

/**
 * Composable for dead-lettered messages that first checks if the feature is enabled
 * in the server configuration before fetching messages.
 */
export function useDeadLetteredMessages(
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
      return getApiV1NamespacesNsQueuesNameDeadLetteredMessages(ns, name, {
        page,
        pageSize,
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
