<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue';
import { usePageContentStore, type PageAction } from '@/stores/pageContent.ts';
import { useGetApiNamespaces } from '@/api/generated/namespaces/namespaces';
import PageContent from '@/components/PageContent.vue';
import NamespaceCard from '@/components/cards/NamespaceCard.vue';
import DeleteNamespaceModal from '@/components/modals/DeleteNamespaceModal.vue';
import { getErrorMessage } from '@/lib/error.ts';
import { useSelectedQueueStore } from '@/stores/selectedQueue.ts';
import { useTypedRouter } from '@/router/useTypeRouter.ts';

const router = useTypedRouter();
const selectedQueueStore = useSelectedQueueStore();
const pageContentStore = usePageContentStore();

// Local state
const showDeleteModal = ref(false);
const namespaceToDelete = ref<string | null>(null);

// Fetch all namespaces
const {
  data: namespacesData,
  isLoading: isLoadingNamespaces,
  error: namespacesError,
  refetch: refetchNamespaces,
} = useGetApiNamespaces({
  query: {
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  },
});

const namespaces = computed(() => namespacesData.value?.data || []);

// Combined loading state
const isLoading = computed(() => isLoadingNamespaces.value);

// Error state
const error = computed(() => namespacesError.value);

// Page actions
const pageActions = computed((): PageAction[] => [
  {
    id: 'refresh',
    label: 'Refresh',
    icon: 'bi bi-arrow-clockwise',
    variant: 'primary',
    disabled: isLoading.value,
    handler: refetchNamespaces,
  },
]);

// Delete handlers
function confirmDelete(namespace: string) {
  namespaceToDelete.value = namespace;
  showDeleteModal.value = true;
}

function handleDeleteCancel() {
  showDeleteModal.value = false;
  namespaceToDelete.value = null;
}

function handleDeleteSuccess() {
  showDeleteModal.value = false;
  namespaceToDelete.value = null;
  refetchNamespaces();
}

watchEffect(() => {
  pageContentStore.setPageHeader({
    title: 'Namespaces',
    subtitle: 'Organize and manage your message queue namespaces',
    icon: 'bi bi-folder',
  });

  pageContentStore.setPageActions(pageActions.value);
  pageContentStore.setLoadingState(isLoading.value);

  if (error.value) {
    pageContentStore.setErrorState(getErrorMessage(error.value));
  } else if (!isLoading.value && namespaces.value.length === 0) {
    pageContentStore.setEmptyState(true, {
      icon: 'bi bi-folder-plus',
      title: 'No Namespaces Found',
      message: 'Namespaces are created automatically when you create queues.',
      actionLabel: 'Create Queue',
      actionHandler: () => router.push('queues'),
    });
  } else {
    pageContentStore.setErrorState(null);
    pageContentStore.setEmptyState(false);
  }
});

onMounted(() => {
  selectedQueueStore.clearSelectedQueue();
  refetchNamespaces();
});
</script>

<template>
  <div>
    <PageContent>
      <!-- Namespaces Grid -->
      <div class="namespaces-grid">
        <NamespaceCard
          v-for="ns in namespaces"
          :key="ns"
          :namespace="ns"
          @delete="confirmDelete"
        />
      </div>
    </PageContent>

    <!-- Delete Modal (self-contained) -->
    <DeleteNamespaceModal
      :is-visible="showDeleteModal"
      :namespace="namespaceToDelete"
      @cancel="handleDeleteCancel"
      @success="handleDeleteSuccess"
    />
  </div>
</template>

<style scoped>
.namespaces-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .namespaces-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>
