/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { useDeleteApiV1NamespacesNsQueuesName } from '@/api/generated/queue/queue.ts';
import { computed } from 'vue';

/**
 * @param {() => Promise<unknown>} onSuccessCallback - A callback function to execute upon successful queue deletion,
 * typically for refetching data and clearing state.
 * @returns an object with methods and state for deleting a queue.
 */
export function useDeleteQueue(onSuccessCallback: () => Promise<unknown>) {
  const deleteQueueMutation = useDeleteApiV1NamespacesNsQueuesName({
    mutation: {
      onSuccess: async () => {
        await onSuccessCallback();
      },
    },
  });

  const isDeletingQueue = computed(() => deleteQueueMutation.isPending.value);
  const deleteQueueError = computed(
    () => deleteQueueMutation.error.value?.error,
  );

  return {
    deleteQueue: deleteQueueMutation.mutateAsync,
    isDeletingQueue,
    deleteQueueError,
    deleteQueueMutation,
  };
}
