<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { ref } from 'vue';
import type { IQueueParams } from '@/api/model';
import ConfirmationModal from '@/components/modals/ConfirmationModal.vue';
import { useDeleteQueue } from '@/api/generated/queue/queue';
import { getErrorMessage } from '@/lib/error';
import { useTypedRouter } from '@/router/typed';

const props = defineProps<{ queue: IQueueParams }>();
const emit = defineEmits<{ deleted: [] }>();

const router = useTypedRouter();
const showDelete = ref(false);
const deleteError = ref<string | null>(null);

const deleteMutation = useDeleteQueue({
  mutation: {
    onSuccess: () => {
      showDelete.value = false;
      emit('deleted');
    },
  },
});

function open() {
  router.go('queue', { ns: props.queue.ns, queue: props.queue.name });
}

async function onConfirmDelete() {
  deleteError.value = null;
  try {
    await deleteMutation.mutateAsync({
      ns: props.queue.ns,
      name: props.queue.name,
    });
  } catch (e) {
    deleteError.value = getErrorMessage(e);
  }
}
</script>

<template>
  <div class="queue-row">
    <button
      type="button"
      class="queue-row__main"
      :aria-label="`Open queue ${queue.name}`"
      @click="open"
    >
      <span class="queue-row__icon" aria-hidden="true">
        <i class="bi bi-collection" />
      </span>
      <span class="queue-row__name font-mono">{{ queue.name }}</span>
      <span class="queue-row__ns">{{ queue.ns }}</span>
    </button>
    <div class="queue-row__actions">
      <button
        type="button"
        class="btn btn-icon btn-outline-secondary"
        title="View"
        aria-label="View queue"
        @click="open"
      >
        <i class="bi bi-eye" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="btn btn-icon btn-outline-danger"
        title="Delete"
        aria-label="Delete queue"
        @click="
          deleteError = null;
          showDelete = true;
        "
      >
        <i class="bi bi-trash" aria-hidden="true" />
      </button>
    </div>
  </div>

  <ConfirmationModal
    :is-visible="showDelete"
    title="Delete queue"
    subtitle="This action cannot be undone"
    icon="bi-exclamation-triangle"
    :message="`Delete queue ${queue.name}@${queue.ns}? All messages will be lost.`"
    confirm-label="Delete queue"
    confirm-variant="danger"
    :is-pending="deleteMutation.isPending.value"
    :error="deleteError"
    @close="showDelete = false"
    @confirm="onConfirmDelete"
  />
</template>

<style scoped>
.queue-row {
  display: flex;
  align-items: center;
  gap: var(--rsmq-space-2);
  border-radius: var(--rsmq-radius-md);
  transition: background var(--rsmq-transition);
}
.queue-row:hover,
.queue-row:focus-within {
  background: var(--rsmq-color-primary-tint);
}
.queue-row__main {
  display: flex;
  align-items: center;
  gap: var(--rsmq-space-3);
  padding: var(--rsmq-space-3) var(--rsmq-space-4);
  flex: 1;
  min-width: 0;
  background: none;
  border: none;
  text-align: left;
  color: var(--rsmq-color-text);
  cursor: pointer;
  font-size: 1rem;
}
.queue-row__icon {
  width: 2rem;
  height: 2rem;
  border-radius: var(--rsmq-radius-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--rsmq-color-surface);
  color: var(--rsmq-color-primary);
  flex-shrink: 0;
}
.queue-row__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}
.queue-row__ns {
  font-size: 0.75rem;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  background: var(--rsmq-color-bg);
  color: var(--rsmq-color-text-muted);
  font-weight: 500;
  font-family: var(--rsmq-font-mono);
  flex-shrink: 0;
}
.queue-row__actions {
  display: flex;
  gap: var(--rsmq-space-1);
  padding-right: var(--rsmq-space-3);
  opacity: 0;
  transition: opacity var(--rsmq-transition);
}
.queue-row:hover .queue-row__actions,
.queue-row:focus-within .queue-row__actions {
  opacity: 1;
}
.queue-row__actions .btn {
  min-width: 2rem;
  min-height: 2rem;
  padding: var(--rsmq-space-1);
}
@media (max-width: 576px) {
  .queue-row__actions {
    opacity: 1;
  }
  .queue-row__main {
    flex-wrap: wrap;
  }
}
</style>
