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
  useDeleteMessageById,
  useRequeueMessageById,
} from '@/api/generated/messages/messages';
import { getErrorMessage } from '@/lib/error';

export function useMessageActions(onSuccess?: () => void) {
  const deleteMutation = useDeleteMessageById({
    mutation: { onSuccess: () => onSuccess?.() },
  });
  const requeueMutation = useRequeueMessageById({
    mutation: { onSuccess: () => onSuccess?.() },
  });

  return {
    deleteMessage: (id: string) => deleteMutation.mutateAsync({ id }),
    requeueMessage: (id: string) => requeueMutation.mutateAsync({ id }),
    isDeleting: computed(() => deleteMutation.isPending.value),
    isRequeuing: computed(() => requeueMutation.isPending.value),
    deleteError: computed(
      () => getErrorMessage(deleteMutation.error.value) || null,
    ),
    requeueError: computed(
      () => getErrorMessage(requeueMutation.error.value) || null,
    ),
    resetDelete: deleteMutation.reset,
    resetRequeue: requeueMutation.reset,
  };
}
