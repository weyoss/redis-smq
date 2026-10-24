/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import type {
  IQueueParams,
  TQueueStateTransitionUserOptions,
  TransitQueueStateBodyState,
} from '@/api/model';
import {
  useTransitQueueState,
  getGetQueueStateHistoryQueryKey,
  getGetQueueStateQueryKey,
} from '@/api/generated/queue-operational-state/queue-operational-state';
import { getErrorMessage } from '@/lib/error';

export function useQueueStateTransition(
  queue: MaybeRefOrGetter<IQueueParams | null>,
) {
  const params = computed(() => toValue(queue));
  const queryClient = useQueryClient();

  const mutation = useTransitQueueState({
    mutation: {
      onSuccess: (_data, variables) => {
        // The transition was recorded on the server. Invalidate the state
        // history so the timeline reflects it immediately (its 30s
        // staleTime would otherwise hide the new entry), and the current
        // state so the banner can't go stale if it stays mounted across
        // a same-state transition (e.g. paused → paused with a new reason).
        //
        // Fired-and-forgotten: `mutateAsync` resolves without waiting for
        // these refetches. The UI subscribes reactively, so it updates
        // when the refetches land — the caller doesn't need to block.
        queryClient.invalidateQueries({
          queryKey: getGetQueueStateHistoryQueryKey(
            variables.ns,
            variables.name,
          ),
        });
        queryClient.invalidateQueries({
          queryKey: getGetQueueStateQueryKey(variables.ns, variables.name),
        });
      },
    },
  });

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
