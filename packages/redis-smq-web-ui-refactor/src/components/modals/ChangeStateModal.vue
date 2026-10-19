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
import BaseModal from '@/components/ui/BaseModal.vue';
import { useQueueStateTransition } from '@/composables/useQueueStateTransition';
import { EStateTransitionReason } from '@/types/queues';
import type { IQueueParams, TransitQueueStateBodyState } from '@/api/model';

const props = defineProps<{
  isVisible: boolean;
  queue: IQueueParams | null;
  action: TransitQueueStateBodyState;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const reason = ref<EStateTransitionReason>(EStateTransitionReason.MANUAL);
const description = ref('');

const stateTransition = useQueueStateTransition(() => props.queue);

const configs: Record<
  TransitQueueStateBodyState,
  {
    title: string;
    subtitle: string;
    icon: string;
    confirmLabel: string;
    variant: 'primary' | 'danger' | 'warning';
  }
> = {
  pause: {
    title: 'Pause queue',
    subtitle: 'Pause message delivery',
    icon: 'bi-pause-circle',
    confirmLabel: 'Pause queue',
    variant: 'warning',
  },
  stop: {
    title: 'Stop queue',
    subtitle: 'Disconnect consumers and block production',
    icon: 'bi-stop-circle',
    confirmLabel: 'Stop queue',
    variant: 'danger',
  },
  resume: {
    title: 'Resume queue',
    subtitle: 'Restore normal operations',
    icon: 'bi-play-circle',
    confirmLabel: 'Resume queue',
    variant: 'primary',
  },
};

const config = computed(() => configs[props.action]);

const queueLabel = computed(() =>
  props.queue ? `${props.queue.name}@${props.queue.ns}` : '',
);

const reasonOptions: ReadonlyArray<{
  value: EStateTransitionReason;
  label: string;
}> = [
  { value: EStateTransitionReason.MANUAL, label: 'Manual' },
  { value: EStateTransitionReason.SCHEDULED, label: 'Scheduled maintenance' },
  { value: EStateTransitionReason.EMERGENCY, label: 'Emergency' },
  { value: EStateTransitionReason.PERFORMANCE, label: 'Performance issue' },
  { value: EStateTransitionReason.ERROR, label: 'Error' },
  {
    value: EStateTransitionReason.CONFIG_CHANGE,
    label: 'Configuration change',
  },
  { value: EStateTransitionReason.TESTING, label: 'Testing' },
  { value: EStateTransitionReason.OTHER, label: 'Other' },
];

async function onConfirm() {
  try {
    await stateTransition.changeState(props.action, {
      reason: reason.value,
      description: description.value.trim() || undefined,
    });
    emit('success');
  } catch {
    // error surfaces via stateTransition.error
  }
}

watch(
  () => props.isVisible,
  (visible) => {
    if (visible) {
      reason.value = EStateTransitionReason.MANUAL;
      description.value = '';
      stateTransition.reset();
    }
  },
);
</script>

<template>
  <BaseModal
    :is-visible="isVisible"
    :title="config.title"
    :subtitle="config.subtitle"
    :icon="config.icon"
    size="md"
    @close="emit('close')"
  >
    <template #body>
      <p class="message">
        Queue <strong class="font-mono">{{ queueLabel }}</strong>
        will be affected.
      </p>

      <div class="field">
        <label for="reason" class="form-label">Reason</label>
        <select id="reason" v-model="reason" class="form-select">
          <option
            v-for="opt in reasonOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
      </div>

      <div class="field">
        <label for="description" class="form-label">
          Description <span class="muted">(optional)</span>
        </label>
        <textarea
          id="description"
          v-model="description"
          class="form-control"
          rows="3"
          maxlength="500"
          placeholder="Additional context…"
        />
      </div>

      <div
        v-if="stateTransition.error.value"
        class="alert alert-danger mb-0"
        role="alert"
      >
        {{ stateTransition.error.value }}
      </div>
    </template>
    <template #footer>
      <button
        type="button"
        class="btn btn-secondary"
        :disabled="stateTransition.isPending.value"
        @click="emit('close')"
      >
        Cancel
      </button>
      <button
        type="button"
        :class="`btn btn-${config.variant}`"
        :disabled="stateTransition.isPending.value"
        @click="onConfirm"
      >
        <span
          v-if="stateTransition.isPending.value"
          class="spinner-border spinner-border-sm me-1"
          aria-hidden="true"
        />
        {{ stateTransition.isPending.value ? 'Working…' : config.confirmLabel }}
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.message {
  margin: 0 0 var(--rsmq-space-4);
  color: var(--rsmq-color-text);
  line-height: 1.5;
}
.field {
  margin-bottom: var(--rsmq-space-3);
}
.field:last-of-type {
  margin-bottom: var(--rsmq-space-4);
}
.muted {
  color: var(--rsmq-color-text-muted);
  font-weight: 400;
}
</style>
