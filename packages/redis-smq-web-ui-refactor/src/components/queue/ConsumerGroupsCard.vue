<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { IQueueParams } from '@/api/model';
import Card from '@/components/ui/Card.vue';
import StateBlock from '@/components/ui/StateBlock.vue';
import BaseModal from '@/components/ui/BaseModal.vue';
import ConfirmationModal from '@/components/modals/ConfirmationModal.vue';
import { useQueueProperties } from '@/composables/useQueueProperties';
import { useQueueConsumerGroups } from '@/composables/useQueueConsumerGroups';
import { getErrorMessage } from '@/lib/error';

const props = defineProps<{ queue: IQueueParams }>();

const properties = useQueueProperties(() => props.queue);
const groups = useQueueConsumerGroups(() => props.queue);

const isPubSub = computed(() => properties.isPubSub.value);

// Create modal
const showCreate = ref(false);
const newName = ref('');
const createError = ref<string | null>(null);

watch(showCreate, (v) => {
  if (v) {
    newName.value = '';
    createError.value = null;
    groups.resetCreate();
  }
});

async function onCreate() {
  createError.value = null;
  try {
    await groups.createGroup(newName.value.trim());
    showCreate.value = false;
  } catch (e) {
    // Use the caught error, not `groups.createError.value` — relying on
    // TanStack's mutation.error being populated before mutateAsync
    // rejects is a timing assumption. `e` is the authoritative value.
    createError.value = getErrorMessage(e);
  }
}

// Delete modal
const deleteTarget = ref<string | null>(null);
const deleteError = ref<string | null>(null);

async function onConfirmDelete() {
  if (!deleteTarget.value) return;
  deleteError.value = null;
  try {
    await groups.removeGroup(deleteTarget.value);
    deleteTarget.value = null;
  } catch (e) {
    deleteError.value = getErrorMessage(e);
  }
}

const groupList = computed(() => groups.groups.value);
</script>

<template>
  <Card
    title="Consumer groups"
    :subtitle="
      isPubSub
        ? 'Groups for pub/sub message load-balancing'
        : 'Only available for pub/sub queues'
    "
    icon="bi-people"
    :heading-level="2"
  >
    <template #actions>
      <button
        v-if="isPubSub"
        type="button"
        class="btn btn-sm btn-primary"
        :disabled="groups.isLoading.value"
        @click="showCreate = true"
      >
        <i class="bi bi-plus-lg me-1" aria-hidden="true" />
        Create
      </button>
      <button
        type="button"
        class="btn btn-refresh btn-icon"
        :disabled="groups.isLoading.value"
        title="Refresh"
        @click="groups.refetch()"
      >
        <i
          class="bi bi-arrow-clockwise"
          :class="{ spin: groups.isLoading.value }"
        />
      </button>
    </template>

    <StateBlock
      v-if="!isPubSub"
      kind="empty"
      icon="bi-info-circle"
      message="Point-to-point queues don't use consumer groups."
    />
    <StateBlock v-else-if="groups.isLoading.value" kind="loading" />
    <StateBlock
      v-else-if="groups.error.value"
      kind="error"
      icon="bi-exclamation-triangle-fill"
      :message="groups.error.value"
    />
    <StateBlock
      v-else-if="groupList.length === 0"
      kind="empty"
      icon="bi-people"
      title="No consumer groups"
      message="Create your first group to load-balance message consumption."
    />
    <ul v-else class="group-list">
      <li v-for="g in groupList" :key="g" class="group-list__row">
        <span class="group-list__icon" aria-hidden="true">
          <i class="bi bi-people" />
        </span>
        <span class="group-list__name font-mono">{{ g }}</span>
        <button
          type="button"
          class="btn btn-icon btn-outline-danger"
          title="Delete group"
          aria-label="Delete group"
          @click="
            deleteTarget = g;
            deleteError = null;
          "
        >
          <i class="bi bi-trash" aria-hidden="true" />
        </button>
      </li>
    </ul>
  </Card>

  <BaseModal
    :is-visible="showCreate"
    title="Create consumer group"
    subtitle="Group messages by consumer pool"
    icon="bi-people-fill"
    size="sm"
    @close="showCreate = false"
  >
    <template #body>
      <label for="group-name" class="form-label">Group name</label>
      <input
        id="group-name"
        v-model="newName"
        type="text"
        class="form-control"
        maxlength="64"
        placeholder="e.g. email-processors"
        @keydown.enter="onCreate"
      />
      <div v-if="createError" class="alert alert-danger mt-3 mb-0" role="alert">
        {{ createError }}
      </div>
    </template>
    <template #footer>
      <button
        type="button"
        class="btn btn-secondary"
        :disabled="groups.isCreating.value"
        @click="showCreate = false"
      >
        Cancel
      </button>
      <button
        type="button"
        class="btn btn-primary"
        :disabled="!newName.trim() || groups.isCreating.value"
        @click="onCreate"
      >
        <span
          v-if="groups.isCreating.value"
          class="spinner-border spinner-border-sm me-1"
          aria-hidden="true"
        />
        {{ groups.isCreating.value ? 'Creating…' : 'Create' }}
      </button>
    </template>
  </BaseModal>

  <ConfirmationModal
    :is-visible="!!deleteTarget"
    title="Delete consumer group"
    icon="bi-exclamation-triangle"
    :message="`Delete consumer group ${deleteTarget ?? ''}? All consumers must be disconnected.`"
    confirm-label="Delete group"
    confirm-variant="danger"
    :is-pending="groups.isDeleting.value"
    :error="deleteError"
    @close="deleteTarget = null"
    @confirm="onConfirmDelete"
  />
</template>

<style scoped>
.group-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--rsmq-space-1);
}
.group-list__row {
  display: flex;
  align-items: center;
  gap: var(--rsmq-space-3);
  padding: var(--rsmq-space-2) var(--rsmq-space-3);
  border-radius: var(--rsmq-radius-sm);
  transition: background var(--rsmq-transition);
}
.group-list__row:hover {
  background: var(--rsmq-color-bg);
}
.group-list__icon {
  width: 2rem;
  height: 2rem;
  border-radius: var(--rsmq-radius-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--rsmq-color-primary-tint);
  color: var(--rsmq-color-primary);
  flex-shrink: 0;
}
.group-list__name {
  flex: 1;
  min-width: 0;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
