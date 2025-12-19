/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { usePostApiV1Queues } from '@/api/generated/queues/queues.ts';
import { computed } from 'vue';

/**
 * @param {() => Promise<unknown>} onSuccessCallback - A callback function to execute upon successful queue creation,
 * typically for refetching data.
 * @returns an object with methods and state for creating a queue.
 */
export function useCreateQueue(onSuccessCallback: () => Promise<unknown>) {
  const createQueueMutation = usePostApiV1Queues({
    mutation: {
      onSuccess: async () => {
        await onSuccessCallback();
      },
    },
  });

  const isCreatingQueue = computed(() => createQueueMutation.isPending.value);
  const createQueueError = computed(
    () => createQueueMutation.error.value?.error,
  );

  return {
    createQueue: createQueueMutation.mutateAsync,
    isCreatingQueue,
    createQueueError,
    createQueueMutation,
  };
}
