/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useSelectedNamespaceStore } from '@/stores/selectedNamespace.ts';

export const useSelectedQueueStore = defineStore('selectedQueue', () => {
  const selectedNamespaceStore = useSelectedNamespaceStore();
  const queueName = ref<string | null>(null);

  const selectedQueue = computed(() => {
    if (selectedNamespaceStore.selectedNamespace && queueName.value) {
      return {
        ns: selectedNamespaceStore.selectedNamespace,
        name: queueName.value,
      };
    }
    return null;
  });

  function selectQueue(ns: string, name: string): void {
    selectedNamespaceStore.selectNamespace(ns);
    queueName.value = name;
  }

  function clearSelectedQueue(): void {
    queueName.value = null;
    selectedNamespaceStore.clearSelectedNamespace();
  }

  return {
    selectedQueue,
    selectQueue,
    clearSelectedQueue,
  };
});
