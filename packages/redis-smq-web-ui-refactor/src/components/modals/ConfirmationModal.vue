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
import BaseModal from '@/components/ui/BaseModal.vue';

type Variant = 'primary' | 'danger' | 'warning';

const props = withDefaults(
  defineProps<{
    isVisible: boolean;
    title: string;
    subtitle?: string;
    icon?: string;
    message: string;
    confirmLabel?: string;
    confirmVariant?: Variant;
    isPending?: boolean;
    error?: string | null;
  }>(),
  {
    confirmLabel: 'Confirm',
    confirmVariant: 'danger',
    isPending: false,
    error: null,
  },
);

const emit = defineEmits<{
  close: [];
  confirm: [];
}>();

const buttonClass = computed(() => `btn btn-${props.confirmVariant}`);

function onClose() {
  if (!props.isPending) emit('close');
}
</script>

<template>
  <BaseModal
    :is-visible="isVisible"
    :title="title"
    :subtitle="subtitle"
    :icon="icon"
    size="sm"
    @close="onClose"
  >
    <template #body>
      <p class="confirm-message">{{ message }}</p>
      <slot name="extra" />
      <div
        v-if="error"
        class="alert alert-danger mt-3 mb-0"
        role="alert"
        aria-live="assertive"
      >
        {{ error }}
      </div>
    </template>
    <template #footer>
      <button
        type="button"
        class="btn btn-secondary"
        :disabled="isPending"
        @click="onClose"
      >
        Cancel
      </button>
      <button
        type="button"
        :class="buttonClass"
        :disabled="isPending"
        @click="emit('confirm')"
      >
        <span
          v-if="isPending"
          class="spinner-border spinner-border-sm me-1"
          aria-hidden="true"
        />
        {{ isPending ? 'Working…' : confirmLabel }}
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.confirm-message {
  margin: 0;
  color: var(--rsmq-color-text);
  line-height: 1.5;
}
</style>
