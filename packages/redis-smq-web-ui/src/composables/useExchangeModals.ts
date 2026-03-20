import { ref } from 'vue';
import type { IExchangeParsedParams } from '@/types';

export function useExchangeModals() {
  // Modal visibility states
  const showBindModal = ref(false);
  const showUnbindModal = ref(false);
  const showDeleteModal = ref(false);

  // Selected items
  const selectedExchange = ref<IExchangeParsedParams | null>(null);
  const selectedQueue = ref<string | null>(null);
  const selectedBindingKey = ref<string | null>(null);

  const openBindModal = (exchange: IExchangeParsedParams) => {
    selectedExchange.value = exchange;
    showBindModal.value = true;
  };

  const openUnbindModal = (
    exchange: IExchangeParsedParams,
    queueName: string,
    bindingKey?: string,
  ) => {
    selectedExchange.value = exchange;
    selectedQueue.value = queueName;
    selectedBindingKey.value = bindingKey || null;
    showUnbindModal.value = true;
  };

  const openDeleteModal = (exchange: IExchangeParsedParams) => {
    selectedExchange.value = exchange;
    showDeleteModal.value = true;
  };

  const closeModals = () => {
    showBindModal.value = false;
    showUnbindModal.value = false;
    showDeleteModal.value = false;
    selectedExchange.value = null;
    selectedQueue.value = null;
    selectedBindingKey.value = null;
  };

  return {
    // States
    showBindModal,
    showUnbindModal,
    showDeleteModal,
    selectedExchange,
    selectedQueue,
    selectedBindingKey,

    // Actions
    openBindModal,
    openUnbindModal,
    openDeleteModal,
    closeModals,
  };
}
