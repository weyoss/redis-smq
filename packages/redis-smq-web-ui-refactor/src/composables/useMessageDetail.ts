/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import type { IMessageTransferable } from '@/api/model';
import { useGetMessageById } from '@/api/generated/messages/messages';
import { getErrorMessage } from '@/lib/error';

export function useMessageDetail(id: MaybeRefOrGetter<string | null>) {
  const idRef = computed(() => toValue(id) ?? '');

  const query = useGetMessageById(idRef, {
    query: { staleTime: 5_000 },
  });

  return {
    query,
    message: computed<IMessageTransferable | null>(
      () => query.data.value?.data ?? null,
    ),
    isLoading: computed(() => query.isLoading.value),
    error: computed(() => getErrorMessage(query.error.value) || null),
    refetch: query.refetch,
  };
}
