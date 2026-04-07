<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script lang="ts" setup>
import { computed, watch } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import BaseModal from '@/components/modals/BaseModal.vue';
import {
  useDeleteApiNamespacesNs,
  getGetApiNamespacesQueryKey,
} from '@/api/generated/namespaces/namespaces';
import { getErrorMessage } from '@/lib/error.ts';

interface Props {
  isVisible: boolean;
  namespace: string | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'success'): void;
}>();

const queryClient = useQueryClient();

// Delete namespace mutation
const deleteMutation = useDeleteApiNamespacesNs({
  mutation: {
    onSuccess: () => {
      // Invalidate namespaces list query to refresh the list
      queryClient.invalidateQueries({
        queryKey: getGetApiNamespacesQueryKey(),
      });
      // Emit success and close modal
      emit('success');
    },
  },
});

const isDeleting = computed(() => deleteMutation.isPending.value);
const error = computed(() =>
  getErrorMessage(deleteMutation.error.value?.error),
);

// Reset mutation when modal closes
watch(
  () => props.isVisible,
  (visible) => {
    if (!visible) {
      deleteMutation.reset();
    }
  },
);

function handleClose() {
  if (!isDeleting.value) {
    emit('cancel');
  }
}

async function handleConfirm() {
  if (!props.namespace || isDeleting.value) return;
  await deleteMutation.mutateAsync({ ns: props.namespace });
}
</script>

<template>
  <BaseModal
    :is-visible="isVisible"
    title="Delete Namespace"
    subtitle="This action cannot be undone"
    icon="bi bi-exclamation-triangle-fill"
    size="sm"
    @close="handleClose"
  >
    <template #body>
      <div class="dialog-body">
        <!-- Confirmation -->
        <section class="confirmation-message">
          <p class="message-text">
            Are you sure you want to permanently delete the namespace
            <strong class="namespace-identifier" :title="namespace ?? ''">
              {{ namespace }}
            </strong>
            ?
          </p>
        </section>

        <!-- Warning -->
        <section class="warning-section" aria-live="polite">
          <div class="warning-content">
            <div class="warning-text">
              <div class="warning-requirements">
                <div class="requirements-title">
                  <i class="bi bi-check-circle me-1"></i>
                  Before proceeding, ensure:
                </div>
                <ul class="requirements-list">
                  <li>- All queues are empty</li>
                  <li>- No active consumers are connected to any queue</li>
                  <li>- No exchanges have bound queues</li>
                  <li>- No background processes are using this namespace</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <!-- Error Display -->
        <section v-if="error" class="error-section" role="alert">
          <div class="error-content">
            <div class="error-icon" aria-hidden="true">
              <i class="bi bi-exclamation-circle-fill"></i>
            </div>
            <div class="error-text">
              <h4 class="error-title">Deletion Failed</h4>
              <p class="error-message">{{ error }}</p>
            </div>
          </div>
        </section>
      </div>
    </template>

    <template #footer>
      <div class="actions">
        <button
          class="btn btn-outline-secondary"
          type="button"
          :disabled="isDeleting"
          @click="handleClose"
        >
          <i class="bi bi-x-circle me-2" aria-hidden="true"></i>
          Cancel
        </button>

        <button
          class="btn btn-danger"
          type="button"
          :disabled="isDeleting"
          @click="handleConfirm"
        >
          <template v-if="isDeleting">
            <span
              class="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            Deleting...
          </template>
          <template v-else>
            <i class="bi bi-trash-fill me-2" aria-hidden="true"></i>
            Delete Namespace
          </template>
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
/* Body layout and overflow safety */
.dialog-body,
.dialog-body * {
  box-sizing: border-box;
  max-width: 100%;
}

.dialog-body {
  display: grid;
  gap: clamp(12px, 2.8vw, 18px);
  padding: 0; /* BaseModal provides padding */
  overflow-x: hidden;
}

/* Confirmation section */
.confirmation-message {
  display: grid;
  gap: 0.75rem;
}

.message-text {
  font-size: 1rem;
  color: #495057;
  line-height: 1.6;
  margin: 0;
  overflow-wrap: anywhere;
}

.namespace-identifier {
  font-family: 'Courier New', monospace;
  background-color: #e9ecef;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.9em;
}

/* Requirements Section */
.warning-requirements {
  margin-bottom: 1rem;
  background: #fff8e1;
  border-radius: 8px;
  padding: 0.75rem;
  border-left: 3px solid #ffc107;
}

.requirements-title,
.consequences-title {
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  color: #856404;
}

.requirements-list,
.consequences-list {
  margin: 0;
  padding-left: 0;
  list-style: none;
}

.requirements-list li,
.consequences-list li {
  display: flex;
  align-items: center;
  font-size: 0.8125rem;
  line-height: 1.4;
  margin-bottom: 0.375rem;
  color: #856404;
}

.requirements-list li:last-child,
.consequences-list li:last-child {
  margin-bottom: 0;
}

.requirements-list li i,
.consequences-list li i {
  font-size: 0.875rem;
  width: 18px;
  flex-shrink: 0;
  color: #ffc107;
}

/* Error section */
.error-section {
  background-color: #f8d7da;
  border: 1px solid #f5c2c7;
  border-radius: 8px;
  padding: clamp(10px, 2.6vw, 14px);
}

.error-content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.error-icon {
  font-size: 1.25rem;
  color: #842029;
  flex-shrink: 0;
}

.error-title {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #842029;
}

.error-message {
  margin: 0;
  font-size: 0.875rem;
  color: #842029;
  overflow-wrap: anywhere;
}

/* Footer actions: spacing and mobile behavior */
.actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.actions .btn {
  min-width: 140px;
}

/* Allow stacking buttons on small screens */
@media (max-width: 576px) {
  .warning-content,
  .error-content,
  .detail-item {
    flex-direction: column;
    align-items: stretch;
    text-align: left;
  }

  .actions {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .actions .btn {
    width: 100%;
    min-width: 0;
    justify-content: center;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .actions .btn {
    transition: none;
  }
}
</style>
