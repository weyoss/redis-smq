/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import type { IQueueParams, IQueueRateLimit } from '@/api/model';
import {
  useClearQueueRateLimit,
  useSetQueueRateLimit,
} from '@/api/generated/rate-limiting/rate-limiting';
import { getErrorMessage } from '@/lib/error';

export function useRateLimitActions(
  queue: MaybeRefOrGetter<IQueueParams | null>,
  onSuccess?: () => void,
) {
  const params = computed(() => toValue(queue));

  const setMutation = useSetQueueRateLimit({
    mutation: { onSuccess: () => onSuccess?.() },
  });
  const clearMutation = useClearQueueRateLimit({
    mutation: { onSuccess: () => onSuccess?.() },
  });

  async function setRateLimit(data: IQueueRateLimit): Promise<void> {
    const q = params.value;
    if (!q) throw new Error('Queue is required');
    await setMutation.mutateAsync({
      ns: q.ns,
      name: q.name,
      data,
    });
  }

  async function clearRateLimit(): Promise<void> {
    const q = params.value;
    if (!q) throw new Error('Queue is required');
    await clearMutation.mutateAsync({ ns: q.ns, name: q.name });
  }

  return {
    setRateLimit,
    clearRateLimit,
    isSetting: computed(() => setMutation.isPending.value),
    isClearing: computed(() => clearMutation.isPending.value),
    setError: computed(() => getErrorMessage(setMutation.error.value) || null),
    clearError: computed(
      () => getErrorMessage(clearMutation.error.value) || null,
    ),
    resetSet: setMutation.reset,
    resetClear: clearMutation.reset,
  };
}
