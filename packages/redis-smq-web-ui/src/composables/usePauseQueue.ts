/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { computed } from 'vue';
import {
  type PostApiV1NamespacesNsQueuesNameOperationalStatePauseBody,
  PostApiV1NamespacesNsQueuesNameOperationalStatePauseBodyReason,
} from '@/api/model';
import { usePostApiV1NamespacesNsQueuesNameOperationalStatePause } from '@/api/generated/queue-operational-state/queue-operational-state.ts';

export type PauseQueueParams = {
  ns: string;
  name: string;
  reason?: PostApiV1NamespacesNsQueuesNameOperationalStatePauseBodyReason;
  description?: string;
  metadata?: Record<string, unknown>;
};

export function usePauseQueue(onSuccessCallback: () => Promise<unknown>) {
  const pauseQueueMutation =
    usePostApiV1NamespacesNsQueuesNameOperationalStatePause({
      mutation: {
        onSuccess: async () => {
          await onSuccessCallback();
        },
      },
    });

  const isPausingQueue = computed(() => pauseQueueMutation.isPending.value);
  const pauseQueueError = computed(() => pauseQueueMutation.error.value?.error);

  /**
   * Pause a queue with optional reason, description, and metadata
   * @param params - The queue parameters
   * @param params.ns - The namespace
   * @param params.name - The queue name
   * @param params.reason - Optional reason for pausing (from predefined enum)
   * @param params.description - Optional human-readable description
   * @param params.metadata - Optional additional metadata
   */
  const pauseQueue = async (params: PauseQueueParams) => {
    const body: PostApiV1NamespacesNsQueuesNameOperationalStatePauseBody = {
      reason:
        params.reason ||
        PostApiV1NamespacesNsQueuesNameOperationalStatePauseBodyReason.MANUAL,
      description: params.description,
      metadata: params.metadata,
    };

    return pauseQueueMutation.mutateAsync({
      ns: params.ns,
      name: params.name,
      data: body,
    });
  };

  return {
    pauseQueue,
    isPausingQueue,
    pauseQueueError,
    pauseQueueMutation,
  };
}
