/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import type { IQueueParams } from '@/api/model';
import {
  useDeleteConsumerGroup,
  useGetConsumerGroups,
  useSaveConsumerGroup,
} from '@/api/generated/consumer-groups/consumer-groups';
import { getErrorMessage } from '@/lib/error';

export function useQueueConsumerGroups(
  queue: MaybeRefOrGetter<IQueueParams | null>,
) {
  const params = computed(() => toValue(queue));
  const enabled = computed(() => params.value !== null);

  const query = useGetConsumerGroups(
    computed(() => params.value?.ns ?? ''),
    computed(() => params.value?.name ?? ''),
    { query: { enabled } },
  );

  const saveMutation = useSaveConsumerGroup({
    mutation: { onSuccess: () => query.refetch() },
  });
  const deleteMutation = useDeleteConsumerGroup({
    mutation: { onSuccess: () => query.refetch() },
  });

  const groups = computed(() => query.data.value?.data ?? []);

  async function createGroup(id: string): Promise<void> {
    const q = params.value;
    if (!q) throw new Error('Queue is required');
    await saveMutation.mutateAsync({
      ns: q.ns,
      name: q.name,
      data: { consumerGroupId: id },
    });
  }

  async function removeGroup(id: string): Promise<void> {
    const q = params.value;
    if (!q) throw new Error('Queue is required');
    await deleteMutation.mutateAsync({
      ns: q.ns,
      name: q.name,
      consumerGroupId: id,
    });
  }

  return {
    query,
    groups,
    isLoading: computed(() => query.isLoading.value),
    error: computed(() => getErrorMessage(query.error.value) || null),
    refetch: query.refetch,
    createGroup,
    removeGroup,
    isCreating: computed(() => saveMutation.isPending.value),
    isDeleting: computed(() => deleteMutation.isPending.value),
    createError: computed(
      () => getErrorMessage(saveMutation.error.value) || null,
    ),
    deleteError: computed(
      () => getErrorMessage(deleteMutation.error.value) || null,
    ),
    resetCreate: saveMutation.reset,
    resetDelete: deleteMutation.reset,
  };
}
