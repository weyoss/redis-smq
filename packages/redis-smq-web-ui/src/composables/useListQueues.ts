/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { useGetApiV1Queues } from '@/api/generated/queues/queues.js';
import { computed } from 'vue';

/**
 * @returns an object with methods and state for listing and managing queues.
 */
export function useListQueues() {
  const queuesQuery = useGetApiV1Queues();

  const queues = computed(() => queuesQuery.data.value);
  const isLoadingQueues = computed(() => queuesQuery.isLoading.value);
  const queuesError = computed(() => queuesQuery.error.value);

  const sortedQueues = computed(() => {
    if (!queues.value?.data.length) return [];
    return [...queues.value.data].sort((a, b) => a.name.localeCompare(b.name));
  });

  const getNamespaceQueueCount = computed(() => {
    return (ns: string) => {
      if (!queues.value?.data) return 0;
      return queues.value.data.filter((queue) => queue.ns === ns).length;
    };
  });

  function getQueuesInNamespace(ns: string) {
    if (!queues.value?.data) return [];
    return queues.value.data.filter((queue) => queue.ns === ns);
  }

  function findQueueInNamespace(ns: string, queueName: string) {
    const namespacedQueues = getQueuesInNamespace(ns);
    return namespacedQueues.find((queue) => queue.name === queueName);
  }

  return {
    queuesQuery,
    queues,
    isLoadingQueues,
    queuesError,
    sortedQueues,
    getNamespaceQueueCount,
    getQueuesInNamespace,
    findQueueInNamespace,
    refetchQueues: queuesQuery.refetch,
  };
}
