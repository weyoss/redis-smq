/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import type {
  IQueueParams,
  TQueueStateTransitionUserOptions,
  TransitQueueStateBodyState,
} from '@/api/model';
import { useTransitQueueState } from '@/api/generated/queue-operational-state/queue-operational-state';
import { getErrorMessage } from '@/lib/error';

export function useQueueStateTransition(
  queue: MaybeRefOrGetter<IQueueParams | null>,
) {
  const params = computed(() => toValue(queue));
  const mutation = useTransitQueueState();

  async function changeState(
    state: TransitQueueStateBodyState,
    options: TQueueStateTransitionUserOptions = {},
  ): Promise<void> {
    const q = params.value;
    if (!q) throw new Error('Queue is required');
    await mutation.mutateAsync({
      ns: q.ns,
      name: q.name,
      data: {
        state,
        options: {
          reason: options.reason ?? 'MANUAL',
          description: options.description,
          metadata: options.metadata,
        },
      },
    });
  }

  return {
    changeState,
    isPending: computed(() => mutation.isPending.value),
    error: computed(() => getErrorMessage(mutation.error.value) || null),
    reset: mutation.reset,
  };
}
