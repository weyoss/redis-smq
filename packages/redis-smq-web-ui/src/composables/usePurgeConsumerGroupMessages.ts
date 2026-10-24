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
import { usePurgeConsumerGroupPendingMessages } from '@/api/generated/consumer-groups/consumer-groups';
import { getErrorMessage } from '@/lib/error';

export function usePurgeConsumerGroupMessages(
  queue: MaybeRefOrGetter<IQueueParams | null>,
  consumerGroupId: MaybeRefOrGetter<string | null>,
  onSuccess?: () => void,
) {
  const params = computed(() => toValue(queue));
  const groupId = computed(() => toValue(consumerGroupId));

  const mutation = usePurgeConsumerGroupPendingMessages({
    mutation: { onSuccess: () => onSuccess?.() },
  });

  async function purge(): Promise<void> {
    const q = params.value;
    const g = groupId.value;
    if (!q) throw new Error('Queue is required');
    if (!g) throw new Error('Consumer group is required');
    await mutation.mutateAsync({
      ns: q.ns,
      name: q.name,
      consumerGroupId: g,
    });
  }

  return {
    purge,
    isPending: computed(() => mutation.isPending.value),
    error: computed(() => getErrorMessage(mutation.error.value) || null),
    reset: mutation.reset,
  };
}
