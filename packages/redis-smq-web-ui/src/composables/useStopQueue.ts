/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { computed } from 'vue';
import { usePostApiV1NamespacesNsQueuesNameOperationalStateStop } from '@/api/generated/queue-operational-state/queue-operational-state.ts';
import {
  type PostApiV1NamespacesNsQueuesNameOperationalStateStopBody,
  PostApiV1NamespacesNsQueuesNameOperationalStateStopBodyReason,
} from '@/api/model';

export type StopQueueParams = {
  ns: string;
  name: string;
  reason?: PostApiV1NamespacesNsQueuesNameOperationalStateStopBodyReason;
  description?: string;
  metadata?: Record<string, unknown>;
};

export function useStopQueue(onSuccessCallback: () => Promise<unknown>) {
  const stopQueueMutation =
    usePostApiV1NamespacesNsQueuesNameOperationalStateStop({
      mutation: {
        onSuccess: async () => {
          await onSuccessCallback();
        },
      },
    });

  const isStoppingQueue = computed(() => stopQueueMutation.isPending.value);
  const stopQueueError = computed(() => stopQueueMutation.error.value?.error);

  /**
   * Stop a queue with optional reason, description, and metadata
   * @param params - The queue parameters
   * @param params.ns - The namespace
   * @param params.name - The queue name
   * @param params.reason - Optional reason for stopping (from predefined enum)
   * @param params.description - Optional human-readable description
   * @param params.metadata - Optional additional metadata
   */
  const stopQueue = async (params: StopQueueParams) => {
    const body: PostApiV1NamespacesNsQueuesNameOperationalStateStopBody = {
      reason:
        params.reason ||
        PostApiV1NamespacesNsQueuesNameOperationalStateStopBodyReason.MANUAL,
      description: params.description,
      metadata: params.metadata,
    };

    return stopQueueMutation.mutateAsync({
      ns: params.ns,
      name: params.name,
      data: body,
    });
  };

  return {
    stopQueue,
    isStoppingQueue,
    stopQueueError,
    stopQueueMutation,
  };
}
