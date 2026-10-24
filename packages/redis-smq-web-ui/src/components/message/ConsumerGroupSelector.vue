<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed } from 'vue';
import type { IQueueParams } from '@/api/model';
import Card from '@/components/ui/Card.vue';
import StateBlock from '@/components/ui/StateBlock.vue';
import { useQueueConsumerGroups } from '@/composables/useQueueConsumerGroups';

const props = defineProps<{ queue: IQueueParams }>();

const emit = defineEmits<{ select: [id: string] }>();

const groups = useQueueConsumerGroups(() => props.queue);

const list = computed(() => groups.groups.value);
</script>

<template>
  <Card
    title="Select a consumer group"
    subtitle="Pending messages are tracked per consumer group on pub/sub queues"
    icon="bi-people-fill"
    :heading-level="2"
  >
    <template #actions>
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

    <StateBlock v-if="groups.isLoading.value" kind="loading" />
    <StateBlock
      v-else-if="groups.error.value"
      kind="error"
      icon="bi-exclamation-triangle-fill"
      :message="groups.error.value"
    />
    <StateBlock
      v-else-if="list.length === 0"
      kind="empty"
      icon="bi-people"
      title="No consumer groups"
      message="Create a consumer group on the queue detail page first, then return here to view its pending messages."
    />
    <ul v-else class="cg-list">
      <li v-for="g in list" :key="g">
        <button
          type="button"
          class="cg-row"
          :aria-label="`View pending messages for consumer group ${g}`"
          @click="emit('select', g)"
        >
          <span class="cg-row__icon" aria-hidden="true">
            <i class="bi bi-people" />
          </span>
          <span class="cg-row__name font-mono">{{ g }}</span>
          <i class="bi bi-chevron-right cg-row__chevron" aria-hidden="true" />
        </button>
      </li>
    </ul>
  </Card>
</template>

<style scoped>
.cg-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--rsmq-space-1);
}

.cg-row {
  display: flex;
  align-items: center;
  gap: var(--rsmq-space-3);
  width: 100%;
  padding: var(--rsmq-space-3) var(--rsmq-space-4);
  background: none;
  border: 1px solid var(--rsmq-color-border);
  border-radius: var(--rsmq-radius-md);
  cursor: pointer;
  text-align: left;
  color: var(--rsmq-color-text);
  transition:
    background var(--rsmq-transition),
    border-color var(--rsmq-transition);
}

.cg-row:hover {
  background: var(--rsmq-color-primary-tint);
  border-color: var(--rsmq-color-primary);
}

.cg-row__icon {
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

.cg-row__name {
  flex: 1;
  min-width: 0;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cg-row__chevron {
  color: var(--rsmq-color-text-subtle);
  flex-shrink: 0;
}
</style>
