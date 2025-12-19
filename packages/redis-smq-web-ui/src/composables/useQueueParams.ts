/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { computed } from 'vue';
import { useRoute } from 'vue-router';

export function useQueueParams() {
  const route = useRoute();

  // Extract parameters from route
  const ns = computed(() => {
    const param = route.params.ns;
    return Array.isArray(param) ? param[0] : param;
  });

  const queueName = computed(() => {
    const param = route.params.queue;
    return Array.isArray(param) ? param[0] : param;
  });

  // Validation helpers
  const hasValidParams = computed(() => Boolean(ns.value && queueName.value));

  const isValidNamespace = computed(() =>
    Boolean(ns.value && ns.value.length > 0),
  );

  const isValidQueueName = computed(() =>
    Boolean(queueName.value && queueName.value.length > 0),
  );

  // Formatted values for display
  const displayNamespace = computed(() => ns.value || 'Unknown');
  const displayQueueName = computed(() => queueName.value || 'Unknown');

  return {
    // Raw parameters
    ns,
    queueName,

    // Validation
    hasValidParams,
    isValidNamespace,
    isValidQueueName,

    // Display values
    displayNamespace,
    displayQueueName,
  };
}
