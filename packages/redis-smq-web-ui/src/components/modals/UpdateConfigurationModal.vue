<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { useForm } from 'vee-validate';
import { z } from 'zod';
import { toTypedSchema } from '@vee-validate/zod';
import { getErrorMessage } from '@/lib/error.ts';
import { EConsoleLoggerLevel } from '@/types/config.ts';
import { usePatchApiConfig } from '@/api/generated/configuration/configuration.ts';
import type { IRedisSMQParsedConfig } from '@/api/model/iRedisSMQParsedConfig.ts';
import type { PatchApiConfigBody } from '@/api/model/patchApiConfigBody.ts';
import BaseModal from './BaseModal.vue';

interface Props {
  isVisible: boolean;
  currentConfig?: IRedisSMQParsedConfig;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  success: [];
}>();

const queryClient = useQueryClient();

// Form error state (for API errors)
const formSubmitError = ref<string | null>(null);

// Define validation schema with zod
const validationSchema = toTypedSchema(
  z.object({
    namespace: z.string().optional(),
    loggerEnabled: z.boolean(),
    loggerLogLevel: z.number().min(0).max(3),
    loggerColorize: z.boolean(),
    loggerIncludeTimestamp: z.boolean(),
    // Acknowledged Messages
    auditAcknowledgedEnabled: z.boolean(),
    auditAcknowledgedQueueSize: z
      .number()
      .min(0, 'Queue size must be at least 0 (unlimited)')
      .max(1000000, 'Queue size must not exceed 1,000,000'),
    auditAcknowledgedExpire: z
      .number()
      .min(0, 'Expire time must be at least 0 (unlimited)')
      .max(31536000, 'Expire time must not exceed 1 year (31,536,000 seconds)'),
    // Dead Lettered Messages
    auditDeadLetteredEnabled: z.boolean(),
    auditDeadLetteredQueueSize: z
      .number()
      .min(0, 'Queue size must be at least 0 (unlimited)')
      .max(1000000, 'Queue size must not exceed 1,000,000'),
    auditDeadLetteredExpire: z
      .number()
      .min(0, 'Expire time must be at least 0 (unlimited)')
      .max(31536000, 'Expire time must not exceed 1 year (31,536,000 seconds)'),
    // Unacknowledgement History
    auditUnacknowledgementEnabled: z.boolean(),
    auditUnacknowledgementMaxSize: z
      .number()
      .min(0, 'Max size must be at least 0 (unlimited)')
      .max(100000, 'Max size must not exceed 100,000'),
  }),
);

// Define the form values type
type FormValues = {
  namespace?: string;
  loggerEnabled: boolean;
  loggerLogLevel: number;
  loggerColorize: boolean;
  loggerIncludeTimestamp: boolean;
  auditAcknowledgedEnabled: boolean;
  auditAcknowledgedQueueSize: number;
  auditAcknowledgedExpire: number;
  auditDeadLetteredEnabled: boolean;
  auditDeadLetteredQueueSize: number;
  auditDeadLetteredExpire: number;
  auditUnacknowledgementEnabled: boolean;
  auditUnacknowledgementMaxSize: number;
};

// Initialize form with useForm - use values directly
const {
  handleSubmit,
  values,
  errors,
  resetForm,
  isSubmitting,
  setFieldValue,
  setValues,
} = useForm<FormValues>({
  validationSchema,
  initialValues: {
    namespace: '',
    loggerEnabled: true,
    loggerLogLevel: EConsoleLoggerLevel.INFO,
    loggerColorize: true,
    loggerIncludeTimestamp: true,
    auditAcknowledgedEnabled: false,
    auditAcknowledgedQueueSize: 0,
    auditAcknowledgedExpire: 0,
    auditDeadLetteredEnabled: false,
    auditDeadLetteredQueueSize: 0,
    auditDeadLetteredExpire: 0,
    auditUnacknowledgementEnabled: false,
    auditUnacknowledgementMaxSize: 100,
  },
});

// Mutation for updating config
const { mutate: updateConfig, isPending: isUpdating } = usePatchApiConfig({
  mutation: {
    onSuccess: () => {
      formSubmitError.value = null;
      queryClient.invalidateQueries({ queryKey: ['api', 'config'] });
      setTimeout(() => {
        emit('success');
      }, 500);
    },
    onError: (error) => {
      formSubmitError.value = getErrorMessage(error)?.message ?? '';
    },
  },
});

// Load current config into form
watch(
  () => props.currentConfig,
  (config) => {
    if (config) {
      setValues({
        namespace: config.namespace || '',
        loggerEnabled: config.logger.enabled,
        loggerLogLevel: config.logger.options.logLevel as number,
        loggerColorize: config.logger.options.colorize ?? true,
        loggerIncludeTimestamp: config.logger.options.includeTimestamp ?? true,
        auditAcknowledgedEnabled:
          config.messageAudit.acknowledgedMessages.enabled,
        auditAcknowledgedQueueSize:
          config.messageAudit.acknowledgedMessages.queueSize,
        auditAcknowledgedExpire:
          config.messageAudit.acknowledgedMessages.expire,
        auditDeadLetteredEnabled:
          config.messageAudit.deadLetteredMessages.enabled,
        auditDeadLetteredQueueSize:
          config.messageAudit.deadLetteredMessages.queueSize,
        auditDeadLetteredExpire:
          config.messageAudit.deadLetteredMessages.expire,
        auditUnacknowledgementEnabled:
          config.messageAudit.unacknowledgementHistory.enabled,
        auditUnacknowledgementMaxSize:
          config.messageAudit.unacknowledgementHistory.maxSize,
      });
    }
  },
  { immediate: true },
);

// Reset form error when modal closes
watch(
  () => props.isVisible,
  (visible) => {
    if (!visible) {
      formSubmitError.value = null;
      resetForm();
    }
  },
);

// Handle form submission
const onSubmit = handleSubmit((formValues) => {
  formSubmitError.value = null;

  // Build payload matching PatchApiConfigBody type
  const payload: PatchApiConfigBody = {};

  // Add namespace if provided
  if (formValues.namespace) {
    payload.namespace = formValues.namespace;
  }

  // Build logger configuration
  if (formValues.loggerEnabled) {
    payload.logger = {
      enabled: true,
      options: {
        logLevel: formValues.loggerLogLevel as EConsoleLoggerLevel,
        colorize: formValues.loggerColorize,
        includeTimestamp: formValues.loggerIncludeTimestamp,
      },
    };
  } else {
    payload.logger = false;
  }

  // Build messageAudit object
  const messageAudit: PatchApiConfigBody['messageAudit'] = {};

  // Acknowledged messages configuration
  if (formValues.auditAcknowledgedEnabled) {
    messageAudit.acknowledgedMessages = {
      enabled: true,
      queueSize: formValues.auditAcknowledgedQueueSize,
      expire: formValues.auditAcknowledgedExpire,
    };
  } else {
    messageAudit.acknowledgedMessages = false;
  }

  // Dead lettered messages configuration
  if (formValues.auditDeadLetteredEnabled) {
    messageAudit.deadLetteredMessages = {
      enabled: true,
      queueSize: formValues.auditDeadLetteredQueueSize,
      expire: formValues.auditDeadLetteredExpire,
    };
  } else {
    messageAudit.deadLetteredMessages = false;
  }

  // Unacknowledgement history configuration
  if (formValues.auditUnacknowledgementEnabled) {
    messageAudit.unacknowledgementHistory = {
      enabled: true,
      maxSize: formValues.auditUnacknowledgementMaxSize,
    };
  } else {
    messageAudit.unacknowledgementHistory = false;
  }

  // Only add messageAudit if it has properties
  if (Object.keys(messageAudit).length > 0) {
    payload.messageAudit = messageAudit;
  }

  updateConfig({ data: payload });
});

const closeModal = () => {
  if (!isUpdating.value && !isSubmitting.value) {
    emit('close');
  }
};

// Helper to handle checkbox changes with proper typing
const handleCheckboxChange = (field: keyof FormValues, event: Event) => {
  const target = event.target as HTMLInputElement;
  setFieldValue(field, target.checked as any);
};

// Helper to handle input changes with proper typing
const handleInputChange = (field: keyof FormValues, event: Event) => {
  const target = event.target as HTMLInputElement;
  let value: string | number = target.value;
  if (target.type === 'number') {
    value = value === '' ? 0 : Number(value);
  }
  setFieldValue(field, value as any);
};

// Helper to handle select changes with proper typing
const handleSelectChange = (field: keyof FormValues, event: Event) => {
  const target = event.target as HTMLSelectElement;
  const value = Number(target.value);
  setFieldValue(field, value as any);
};

// Log level options
const logLevelOptions = [
  { value: EConsoleLoggerLevel.DEBUG, label: 'Debug' },
  { value: EConsoleLoggerLevel.INFO, label: 'Info' },
  { value: EConsoleLoggerLevel.WARN, label: 'Warning' },
  { value: EConsoleLoggerLevel.ERROR, label: 'Error' },
];

const hasErrors = computed(() => Object.keys(errors.value).length > 0);
const errorMessages = computed(() =>
  Object.values(errors.value).filter(Boolean),
);
const isActionInProgress = computed(
  () => isUpdating.value || isSubmitting.value,
);
</script>

<template>
  <BaseModal
    :is-visible="isVisible"
    title="Edit Configuration"
    subtitle="Update system configuration settings"
    icon="bi bi-gear-wide-connected"
    size="lg"
    @close="closeModal"
  >
    <template #body>
      <div class="ucm-body">
        <form @submit="onSubmit">
          <!-- Namespace Section -->
          <div class="card mb-4 shadow-sm border-0">
            <div class="card-header bg-light py-3 border-0">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-tag fs-5 text-primary"></i>
                <h5 class="mb-0 fw-semibold">Namespace</h5>
              </div>
            </div>
            <div class="card-body">
              <label
                for="namespace"
                class="form-label fw-medium small text-secondary mb-2"
                >Namespace</label
              >
              <input
                id="namespace"
                type="text"
                class="form-control"
                placeholder="default"
                :value="values.namespace"
                :disabled="isActionInProgress"
                @input="(e) => handleInputChange('namespace', e)"
              />
              <div class="form-text mt-2">
                <i class="bi bi-info-circle me-1"></i>
                Optional namespace for queue isolation. If omitted, the default
                namespace is used.
              </div>
            </div>
          </div>

          <!-- Logger Configuration -->
          <div class="card mb-4 shadow-sm border-0">
            <div class="card-header bg-light py-3 border-0">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-file-text fs-5 text-primary"></i>
                <h5 class="mb-0 fw-semibold">Logger Configuration</h5>
              </div>
            </div>
            <div class="card-body">
              <div class="mb-4">
                <div class="form-check form-switch">
                  <input
                    id="loggerEnabled"
                    type="checkbox"
                    role="switch"
                    class="form-check-input"
                    :checked="values.loggerEnabled"
                    :disabled="isActionInProgress"
                    @change="(e) => handleCheckboxChange('loggerEnabled', e)"
                  />
                  <label
                    class="form-check-label fw-medium ms-2"
                    for="loggerEnabled"
                  >
                    Enable Logger
                  </label>
                </div>
                <div class="form-text mt-2 ms-5">
                  When disabled, no log messages will be written to the console.
                </div>
              </div>

              <!-- Logger nested fields -->
              <div
                v-if="values.loggerEnabled"
                class="mt-3 ps-4 border-start border-3 border-primary"
              >
                <div class="mb-3">
                  <label
                    for="logLevel"
                    class="form-label fw-medium small text-secondary mb-2"
                    >Log Level</label
                  >
                  <select
                    id="logLevel"
                    class="form-select"
                    :value="values.loggerLogLevel"
                    :disabled="isActionInProgress"
                    @change="(e) => handleSelectChange('loggerLogLevel', e)"
                  >
                    <option
                      v-for="option in logLevelOptions"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                  <div class="form-text mt-2">
                    Minimum log level to display. Debug shows all messages,
                    Error shows only errors.
                  </div>
                </div>

                <div class="form-check mb-3">
                  <input
                    id="loggerColorize"
                    type="checkbox"
                    class="form-check-input"
                    :checked="values.loggerColorize"
                    :disabled="isActionInProgress"
                    @change="(e) => handleCheckboxChange('loggerColorize', e)"
                  />
                  <label class="form-check-label ms-2" for="loggerColorize">
                    Colorize Output
                  </label>
                  <div class="form-text mt-1 ms-4">
                    Adds ANSI color codes to log output for better readability.
                  </div>
                </div>

                <div class="form-check">
                  <input
                    id="loggerIncludeTimestamp"
                    type="checkbox"
                    class="form-check-input"
                    :checked="values.loggerIncludeTimestamp"
                    :disabled="isActionInProgress"
                    @change="
                      (e) => handleCheckboxChange('loggerIncludeTimestamp', e)
                    "
                  />
                  <label
                    class="form-check-label ms-2"
                    for="loggerIncludeTimestamp"
                  >
                    Include Timestamp
                  </label>
                  <div class="form-text mt-1 ms-4">
                    Adds timestamp to each log message.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Message Audit Configuration -->
          <div class="card mb-4 shadow-sm border-0">
            <div class="card-header bg-light py-3 border-0">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-bar-chart-steps fs-5 text-primary"></i>
                <h5 class="mb-0 fw-semibold">Message Audit Configuration</h5>
              </div>
            </div>
            <div class="card-body">
              <div class="alert alert-info small py-2 mb-4">
                <i class="bi bi-info-circle me-2"></i>
                Message audit creates dedicated Redis storage to track processed
                message IDs, enabling efficient monitoring and analysis of
                messages.
              </div>

              <!-- Acknowledged Messages -->
              <div class="border rounded-3 mb-4 overflow-hidden">
                <div class="bg-light px-3 py-2 border-bottom">
                  <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-check-circle text-success"></i>
                    <h6 class="mb-0 fw-semibold">Acknowledged Messages</h6>
                  </div>
                </div>
                <div class="p-3">
                  <div class="mb-4">
                    <div class="form-check form-switch">
                      <input
                        id="auditAcknowledgedEnabled"
                        type="checkbox"
                        role="switch"
                        class="form-check-input"
                        :checked="values.auditAcknowledgedEnabled"
                        :disabled="isActionInProgress"
                        @change="
                          (e) =>
                            handleCheckboxChange('auditAcknowledgedEnabled', e)
                        "
                      />
                      <label
                        class="form-check-label fw-medium ms-2"
                        for="auditAcknowledgedEnabled"
                      >
                        Track Acknowledged Messages
                      </label>
                    </div>
                    <div class="form-text mt-2 ms-5">
                      Tracks IDs of successfully processed messages per queue.
                    </div>
                  </div>

                  <!-- Acknowledged nested fields -->
                  <div
                    v-if="values.auditAcknowledgedEnabled"
                    class="mt-3 ps-4 border-start border-3 border-success"
                  >
                    <div class="row g-3">
                      <div class="col-md-6">
                        <label
                          for="ackQueueSize"
                          class="form-label small fw-medium text-secondary mb-2"
                        >
                          Queue Size
                        </label>
                        <input
                          id="ackQueueSize"
                          type="number"
                          class="form-control"
                          :class="{
                            'is-invalid': errors.auditAcknowledgedQueueSize,
                          }"
                          :value="values.auditAcknowledgedQueueSize"
                          :disabled="isActionInProgress"
                          @input="
                            (e) =>
                              handleInputChange('auditAcknowledgedQueueSize', e)
                          "
                        />
                        <div class="form-text mt-2">
                          Maximum messages to store per queue. 0 = unlimited.
                        </div>
                        <div
                          v-if="errors.auditAcknowledgedQueueSize"
                          class="invalid-feedback d-block"
                        >
                          {{ errors.auditAcknowledgedQueueSize }}
                        </div>
                      </div>
                      <div class="col-md-6">
                        <label
                          for="ackExpire"
                          class="form-label small fw-medium text-secondary mb-2"
                        >
                          Expire After (seconds)
                        </label>
                        <input
                          id="ackExpire"
                          type="number"
                          class="form-control"
                          :class="{
                            'is-invalid': errors.auditAcknowledgedExpire,
                          }"
                          :value="values.auditAcknowledgedExpire"
                          :disabled="isActionInProgress"
                          @input="
                            (e) =>
                              handleInputChange('auditAcknowledgedExpire', e)
                          "
                        />
                        <div class="form-text mt-2">
                          Messages expire after this duration. 0 = unlimited.
                        </div>
                        <div
                          v-if="errors.auditAcknowledgedExpire"
                          class="invalid-feedback d-block"
                        >
                          {{ errors.auditAcknowledgedExpire }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Dead Lettered Messages -->
              <div class="border rounded-3 mb-4 overflow-hidden">
                <div class="bg-light px-3 py-2 border-bottom">
                  <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-exclamation-triangle text-warning"></i>
                    <h6 class="mb-0 fw-semibold">Dead Lettered Messages</h6>
                  </div>
                </div>
                <div class="p-3">
                  <div class="mb-4">
                    <div class="form-check form-switch">
                      <input
                        id="auditDeadLetteredEnabled"
                        type="checkbox"
                        role="switch"
                        class="form-check-input"
                        :checked="values.auditDeadLetteredEnabled"
                        :disabled="isActionInProgress"
                        @change="
                          (e) =>
                            handleCheckboxChange('auditDeadLetteredEnabled', e)
                        "
                      />
                      <label
                        class="form-check-label fw-medium ms-2"
                        for="auditDeadLetteredEnabled"
                      >
                        Track Dead Lettered Messages
                      </label>
                    </div>
                    <div class="form-text mt-2 ms-5">
                      Tracks IDs of messages that failed processing and exceeded
                      retry limits.
                    </div>
                  </div>

                  <!-- Dead Lettered nested fields -->
                  <div
                    v-if="values.auditDeadLetteredEnabled"
                    class="mt-3 ps-4 border-start border-3 border-warning"
                  >
                    <div class="row g-3">
                      <div class="col-md-6">
                        <label
                          for="dlQueueSize"
                          class="form-label small fw-medium text-secondary mb-2"
                        >
                          Queue Size
                        </label>
                        <input
                          id="dlQueueSize"
                          type="number"
                          class="form-control"
                          :class="{
                            'is-invalid': errors.auditDeadLetteredQueueSize,
                          }"
                          :value="values.auditDeadLetteredQueueSize"
                          :disabled="isActionInProgress"
                          @input="
                            (e) =>
                              handleInputChange('auditDeadLetteredQueueSize', e)
                          "
                        />
                        <div class="form-text mt-2">
                          Maximum messages to store per queue. 0 = unlimited.
                        </div>
                        <div
                          v-if="errors.auditDeadLetteredQueueSize"
                          class="invalid-feedback d-block"
                        >
                          {{ errors.auditDeadLetteredQueueSize }}
                        </div>
                      </div>
                      <div class="col-md-6">
                        <label
                          for="dlExpire"
                          class="form-label small fw-medium text-secondary mb-2"
                        >
                          Expire After (seconds)
                        </label>
                        <input
                          id="dlExpire"
                          type="number"
                          class="form-control"
                          :class="{
                            'is-invalid': errors.auditDeadLetteredExpire,
                          }"
                          :value="values.auditDeadLetteredExpire"
                          :disabled="isActionInProgress"
                          @input="
                            (e) =>
                              handleInputChange('auditDeadLetteredExpire', e)
                          "
                        />
                        <div class="form-text mt-2">
                          Messages expire after this duration. 0 = unlimited.
                        </div>
                        <div
                          v-if="errors.auditDeadLetteredExpire"
                          class="invalid-feedback d-block"
                        >
                          {{ errors.auditDeadLetteredExpire }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Unacknowledgement History -->
              <div class="border rounded-3 overflow-hidden">
                <div class="bg-light px-3 py-2 border-bottom">
                  <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-clock-history text-info"></i>
                    <h6 class="mb-0 fw-semibold">Unacknowledgement History</h6>
                  </div>
                </div>
                <div class="p-3">
                  <div class="mb-4">
                    <div class="form-check form-switch">
                      <input
                        id="auditUnacknowledgementEnabled"
                        type="checkbox"
                        role="switch"
                        class="form-check-input"
                        :checked="values.auditUnacknowledgementEnabled"
                        :disabled="isActionInProgress"
                        @change="
                          (e) =>
                            handleCheckboxChange(
                              'auditUnacknowledgementEnabled',
                              e,
                            )
                        "
                      />
                      <label
                        class="form-check-label fw-medium ms-2"
                        for="auditUnacknowledgementEnabled"
                      >
                        Track Unacknowledgement History
                      </label>
                    </div>
                    <div class="form-text mt-2 ms-5">
                      Tracks detailed history of message processing failures per
                      message.
                    </div>
                  </div>

                  <!-- Unacknowledgement nested fields -->
                  <div
                    v-if="values.auditUnacknowledgementEnabled"
                    class="mt-3 ps-4 border-start border-3 border-info"
                  >
                    <div class="mb-0">
                      <label
                        for="unaMaxSize"
                        class="form-label small fw-medium text-secondary mb-2"
                      >
                        Maximum History Size
                      </label>
                      <input
                        id="unaMaxSize"
                        type="number"
                        class="form-control"
                        :class="{
                          'is-invalid': errors.auditUnacknowledgementMaxSize,
                        }"
                        :value="values.auditUnacknowledgementMaxSize"
                        :disabled="isActionInProgress"
                        @input="
                          (e) =>
                            handleInputChange(
                              'auditUnacknowledgementMaxSize',
                              e,
                            )
                        "
                      />
                      <div class="form-text mt-2">
                        Maximum number of failure events to store per message. 0
                        = unlimited.
                      </div>
                      <div
                        v-if="errors.auditUnacknowledgementMaxSize"
                        class="invalid-feedback d-block"
                      >
                        {{ errors.auditUnacknowledgementMaxSize }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Form Errors Section -->
          <div
            v-if="hasErrors || formSubmitError"
            class="alert alert-danger"
            role="alert"
          >
            <div
              v-if="formSubmitError"
              class="d-flex align-items-center gap-2 pb-2 mb-2 border-bottom border-danger"
            >
              <i class="bi bi-exclamation-triangle-fill"></i>
              <strong>{{ formSubmitError }}</strong>
            </div>
            <div
              v-for="(error, index) in errorMessages"
              :key="index"
              class="d-flex align-items-center gap-2 small"
            >
              <i class="bi bi-exclamation-circle-fill"></i>
              <span>{{ error }}</span>
            </div>
          </div>
        </form>
      </div>
    </template>

    <template #footer>
      <div class="d-flex align-items-center justify-content-end gap-2">
        <button
          type="button"
          class="btn btn-outline-secondary"
          :disabled="isActionInProgress"
          @click="closeModal"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="isActionInProgress"
          @click="onSubmit"
        >
          <span
            v-if="isActionInProgress"
            class="spinner-border spinner-border-sm me-2"
          ></span>
          <i v-else class="bi bi-check-lg me-2"></i>
          {{ isActionInProgress ? 'Saving...' : 'Save Configuration' }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
.ucm-body {
  max-height: 70vh;
  overflow-y: auto;
  padding: 0.25rem;
}

/* Custom scrollbar */
.ucm-body::-webkit-scrollbar {
  width: 6px;
}

.ucm-body::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.ucm-body::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.ucm-body::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Form controls styling */
.form-control:focus,
.form-select:focus,
.form-check-input:focus {
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.15);
}

.form-switch .form-check-input {
  width: 2.5em;
  height: 1.25em;
  margin-top: 0;
  cursor: pointer;
}

.form-check-input {
  cursor: pointer;
}

.form-check-label {
  cursor: pointer;
}

/* Card styling */
.card {
  border-radius: 12px;
}

.card-header {
  border-radius: 12px 12px 0 0;
}

/* Border start for nested sections */
.border-start {
  border-left-width: 3px !important;
}

/* Alert styling */
.alert-info {
  background-color: #e7f3ff;
  border-color: #b8daff;
  color: #004085;
}

/* Spacing improvements */
.form-text {
  font-size: 0.75rem;
  line-height: 1.4;
}

.ms-5 {
  margin-left: 2.5rem !important;
}

.ms-4 {
  margin-left: 1.5rem !important;
}

.ps-4 {
  padding-left: 1.5rem !important;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .ucm-body {
    max-height: 60vh;
  }

  .row.g-3 {
    --bs-gutter-y: 0.75rem;
  }

  .ms-5 {
    margin-left: 2rem !important;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .card {
    background-color: #2d2d2d;
    border-color: #404040;
  }

  .card-header {
    background-color: #242424;
    border-bottom-color: #404040;
  }

  .bg-light {
    background-color: #242424 !important;
  }

  .border {
    border-color: #404040 !important;
  }

  .border-start {
    border-left-color: #0d6efd !important;
  }

  .alert-info {
    background-color: #1a3a5f;
    border-color: #0d6efd;
    color: #9ec1ff;
  }

  .form-control,
  .form-select {
    background-color: #1f1f1f;
    border-color: #404040;
    color: #e5e7eb;
  }

  .form-control:focus,
  .form-select:focus {
    background-color: #1f1f1f;
    color: #e5e7eb;
  }

  .form-text {
    color: #9ca3af;
  }

  .btn-outline-secondary {
    color: #e5e7eb;
    border-color: #404040;
  }

  .btn-outline-secondary:hover {
    background-color: #404040;
    color: #e5e7eb;
  }
}
</style>
