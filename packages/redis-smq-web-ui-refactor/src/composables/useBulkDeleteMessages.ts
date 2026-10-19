/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { computed } from 'vue';
import { useDeleteMessagesByIds } from '@/api/generated/messages/messages';
import { getErrorMessage } from '@/lib/error';

export function useBulkDeleteMessages(onSuccess?: () => void) {
  const mutation = useDeleteMessagesByIds({
    mutation: { onSuccess: () => onSuccess?.() },
  });

  async function deleteMany(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await mutation.mutateAsync({ params: { ids } });
  }

  return {
    deleteMany,
    isPending: computed(() => mutation.isPending.value),
    error: computed(() => getErrorMessage(mutation.error.value) || null),
    reset: mutation.reset,
  };
}
