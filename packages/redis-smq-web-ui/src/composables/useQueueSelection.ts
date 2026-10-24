/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { computed, type ComputedRef } from 'vue';
import { useRoute } from 'vue-router';
import type { IQueueParams } from '@/api/model';

export interface QueueSelection {
  ns: ComputedRef<string | null>;
  name: ComputedRef<string | null>;
  params: ComputedRef<IQueueParams | null>;
}

export function useQueueSelection(): QueueSelection {
  const route = useRoute();

  const ns = computed<string | null>(() => {
    const v = route.params.ns;
    return typeof v === 'string' && v.length > 0 ? v : null;
  });

  const name = computed<string | null>(() => {
    const v = route.params.queue;
    return typeof v === 'string' && v.length > 0 ? v : null;
  });

  const params = computed<IQueueParams | null>(() =>
    ns.value && name.value ? { ns: ns.value, name: name.value } : null,
  );

  return { ns, name, params };
}
