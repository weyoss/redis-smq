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
  type PostApiV1NamespacesNsQueuesNameOperationalStateResumeBody,
  PostApiV1NamespacesNsQueuesNameOperationalStateResumeBodyReason,
} from '@/api/model';
import { usePostApiV1NamespacesNsQueuesNameOperationalStateResume } from '@/api/generated/queue-operational-state/queue-operational-state.ts';

export type ResumeQueueParams = {
  ns: string;
  name: string;
  reason?: PostApiV1NamespacesNsQueuesNameOperationalStateResumeBodyReason;
  description?: string;
  metadata?: Record<string, unknown>;
};

export function useResumeQueue(onSuccessCallback: () => Promise<unknown>) {
  const resumeQueueMutation =
    usePostApiV1NamespacesNsQueuesNameOperationalStateResume({
      mutation: {
        onSuccess: async () => {
          await onSuccessCallback();
        },
      },
    });

  const isResumingQueue = computed(() => resumeQueueMutation.isPending.value);
  const resumeQueueError = computed(
    () => resumeQueueMutation.error.value?.error,
  );

  /**
   * Resume a queue with optional reason, description, and metadata
   * @param params - The queue parameters
   * @param params.ns - The namespace
   * @param params.name - The queue name
   * @param params.reason - Optional reason for resuming (from predefined enum)
   * @param params.description - Optional human-readable description
   * @param params.metadata - Optional additional metadata
   */
  const resumeQueue = async (params: ResumeQueueParams) => {
    const body: PostApiV1NamespacesNsQueuesNameOperationalStateResumeBody = {
      reason:
        params.reason ||
        PostApiV1NamespacesNsQueuesNameOperationalStateResumeBodyReason.MANUAL,
      description: params.description,
      metadata: params.metadata,
    };

    return resumeQueueMutation.mutateAsync({
      ns: params.ns,
      name: params.name,
      data: body,
    });
  };

  return {
    resumeQueue,
    isResumingQueue,
    resumeQueueError,
    resumeQueueMutation,
  };
}
