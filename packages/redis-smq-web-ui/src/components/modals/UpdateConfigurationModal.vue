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
import { useConfiguration } from '@/composables/useConfiguration';
import { getErrorMessage } from '@/lib/error';
import type { IRedisSMQParsedConfig } from '@/api/model';

type LogLevelName = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const props = defineProps<{
  isVisible: boolean;
  current: IRedisSMQParsedConfig | null;
}>();

const emit = defineEmits<{ close: []; success: [] }>();

const config = useConfiguration();

// Form state
const namespace = ref('');

const loggerEnabled = ref(true);
const loggerLogLevel = ref<LogLevelName>('INFO');
const loggerColorize = ref(true);
const loggerIncludeTimestamp = ref(true);

const ackEnabled = ref(false);
const ackQueueSize = ref(0);
const ackExpire = ref(0);

const dlEnabled = ref(false);
const dlQueueSize = ref(0);
const dlExpire = ref(0);

const unackEnabled = ref(false);
const unackMaxSize = ref(100);

const saveError = ref<string | null>(null);

// Hydrate from current config whenever the modal opens or the config changes.
watch(
  () => props.isVisible,
  (v) => {
    if (!v) return;
    saveError.value = null;
    config.resetUpdate();
    hydrate(props.current);
  },
  { immediate: true },
);

watch(
  () => props.current,
  (c) => {
    if (props.isVisible) hydrate(c);
  },
);

function hydrate(c: IRedisSMQParsedConfig | null) {
  if (!c) return;

  namespace.value = c.namespace ?? '';

  // Logger
  loggerEnabled.value = c.logger?.enabled ?? false;
  const rawLevel = c.logger?.options?.logLevel;
  loggerLogLevel.value = normalizeLogLevel(rawLevel);
  loggerColorize.value = c.logger?.options?.colorize ?? true;
  loggerIncludeTimestamp.value = c.logger?.options?.includeTimestamp ?? true;

  // Message audit
  const audit = c.messageAudit;
  ackEnabled.value = audit?.acknowledgedMessages?.enabled ?? false;
  ackQueueSize.value = audit?.acknowledgedMessages?.queueSize ?? 0;
  ackExpire.value = audit?.acknowledgedMessages?.expire ?? 0;

  dlEnabled.value = audit?.deadLetteredMessages?.enabled ?? false;
  dlQueueSize.value = audit?.deadLetteredMessages?.queueSize ?? 0;
  dlExpire.value = audit?.deadLetteredMessages?.expire ?? 0;

  unackEnabled.value = audit?.unacknowledgementHistory?.enabled ?? false;
  unackMaxSize.value = audit?.unacknowledgementHistory?.maxSize ?? 100;
}

function normalizeLogLevel(v: unknown): LogLevelName {
  if (v === 'DEBUG' || v === 'INFO' || v === 'WARN' || v === 'ERROR') {
    return v;
  }
  // Numeric fallback (0=DEBUG..3=ERROR)
  if (typeof v === 'number') {
    const map: Record<number, LogLevelName> = {
      0: 'DEBUG',
      1: 'INFO',
      2: 'WARN',
      3: 'ERROR',
    };
    return map[v] ?? 'INFO';
  }
  return 'INFO';
}

const LOG_LEVELS: LogLevelName[] = ['DEBUG', 'INFO', 'WARN', 'ERROR'];

const canSave = computed(() => !config.isUpdating.value);

async function onSave() {
  saveError.value = null;

  const payload = {
    ...(namespace.value.trim() && { namespace: namespace.value.trim() }),
    logger: loggerEnabled.value
      ? {
          enabled: true as const,
          options: {
            logLevel: loggerLogLevel.value,
            colorize: loggerColorize.value,
            includeTimestamp: loggerIncludeTimestamp.value,
          },
        }
      : false,
    messageAudit: {
      acknowledgedMessages: ackEnabled.value
        ? {
            enabled: true as const,
            queueSize: ackQueueSize.value,
            expire: ackExpire.value,
          }
        : false,
      deadLetteredMessages: dlEnabled.value
        ? {
            enabled: true as const,
            queueSize: dlQueueSize.value,
            expire: dlExpire.value,
          }
        : false,
      unacknowledgementHistory: unackEnabled.value
        ? { enabled: true as const, maxSize: unackMaxSize.value }
        : false,
    },
  };

  try {
    await config.update(payload);
    emit('success');
  } catch (e) {
    saveError.value = config.updateError.value ?? getErrorMessage(e);
  }
}
</script>

<template>
  <BaseModal
    :is-visible="isVisible"
    title="Edit configuration"
    subtitle="Update RedisSMQ system settings"
    icon="bi-gear"
    size="lg"
    @close="emit('close')"
  >
    <template #body>
      <!-- Namespace -->
      <section class="section">
        <h3 class="section__title">
          <i class="bi bi-tag" aria-hidden="true" />
          Namespace
        </h3>
        <div class="field">
          <label for="cfg-ns" class="form-label">Namespace</label>
          <input
            id="cfg-ns"
            v-model="namespace"
            type="text"
            class="form-control"
            placeholder="default"
            :disabled="config.isUpdating.value"
          />
          <p class="hint">
            Optional. Leave empty to use the default namespace.
          </p>
        </div>
      </section>

      <!-- Logger -->
      <section class="section">
        <h3 class="section__title">
          <i class="bi bi-file-text" aria-hidden="true" />
          Logger
        </h3>
        <div class="form-check form-switch">
          <input
            id="cfg-logger-enabled"
            v-model="loggerEnabled"
            class="form-check-input"
            type="checkbox"
            role="switch"
            :disabled="config.isUpdating.value"
          />
          <label for="cfg-logger-enabled" class="form-check-label">
            Enable logger
          </label>
        </div>

        <div v-if="loggerEnabled" class="nested">
          <div class="field">
            <label for="cfg-log-level" class="form-label">Log level</label>
            <select
              id="cfg-log-level"
              v-model="loggerLogLevel"
              class="form-select"
              :disabled="config.isUpdating.value"
            >
              <option v-for="l in LOG_LEVELS" :key="l" :value="l">
                {{ l }}
              </option>
            </select>
          </div>
          <div class="form-check">
            <input
              id="cfg-colorize"
              v-model="loggerColorize"
              class="form-check-input"
              type="checkbox"
              :disabled="config.isUpdating.value"
            />
            <label for="cfg-colorize" class="form-check-label"
              >Colorize output</label
            >
          </div>
          <div class="form-check">
            <input
              id="cfg-timestamp"
              v-model="loggerIncludeTimestamp"
              class="form-check-input"
              type="checkbox"
              :disabled="config.isUpdating.value"
            />
            <label for="cfg-timestamp" class="form-check-label"
              >Include timestamp</label
            >
          </div>
        </div>
      </section>

      <!-- Message audit -->
      <section class="section">
        <h3 class="section__title">
          <i class="bi bi-bar-chart-steps" aria-hidden="true" />
          Message audit
        </h3>

        <!-- Acknowledged -->
        <div class="audit-block">
          <div class="form-check form-switch">
            <input
              id="cfg-ack-enabled"
              v-model="ackEnabled"
              class="form-check-input"
              type="checkbox"
              role="switch"
              :disabled="config.isUpdating.value"
            />
            <label for="cfg-ack-enabled" class="form-check-label">
              Acknowledged messages
            </label>
          </div>
          <div v-if="ackEnabled" class="nested nested--grid">
            <div class="field">
              <label for="cfg-ack-size" class="form-label">Queue size</label>
              <input
                id="cfg-ack-size"
                v-model.number="ackQueueSize"
                type="number"
                min="0"
                class="form-control"
                :disabled="config.isUpdating.value"
              />
              <p class="hint">0 = unlimited</p>
            </div>
            <div class="field">
              <label for="cfg-ack-expire" class="form-label"
                >Expire (seconds)</label
              >
              <input
                id="cfg-ack-expire"
                v-model.number="ackExpire"
                type="number"
                min="0"
                class="form-control"
                :disabled="config.isUpdating.value"
              />
              <p class="hint">0 = never expires</p>
            </div>
          </div>
        </div>

        <!-- Dead-lettered -->
        <div class="audit-block">
          <div class="form-check form-switch">
            <input
              id="cfg-dl-enabled"
              v-model="dlEnabled"
              class="form-check-input"
              type="checkbox"
              role="switch"
              :disabled="config.isUpdating.value"
            />
            <label for="cfg-dl-enabled" class="form-check-label">
              Dead-lettered messages
            </label>
          </div>
          <div v-if="dlEnabled" class="nested nested--grid">
            <div class="field">
              <label for="cfg-dl-size" class="form-label">Queue size</label>
              <input
                id="cfg-dl-size"
                v-model.number="dlQueueSize"
                type="number"
                min="0"
                class="form-control"
                :disabled="config.isUpdating.value"
              />
              <p class="hint">0 = unlimited</p>
            </div>
            <div class="field">
              <label for="cfg-dl-expire" class="form-label"
                >Expire (seconds)</label
              >
              <input
                id="cfg-dl-expire"
                v-model.number="dlExpire"
                type="number"
                min="0"
                class="form-control"
                :disabled="config.isUpdating.value"
              />
              <p class="hint">0 = never expires</p>
            </div>
          </div>
        </div>

        <!-- Unacknowledgement history -->
        <div class="audit-block">
          <div class="form-check form-switch">
            <input
              id="cfg-unack-enabled"
              v-model="unackEnabled"
              class="form-check-input"
              type="checkbox"
              role="switch"
              :disabled="config.isUpdating.value"
            />
            <label for="cfg-unack-enabled" class="form-check-label">
              Unacknowledgement history
            </label>
          </div>
          <div v-if="unackEnabled" class="nested">
            <div class="field">
              <label for="cfg-unack-size" class="form-label"
                >Max history size</label
              >
              <input
                id="cfg-unack-size"
                v-model.number="unackMaxSize"
                type="number"
                min="0"
                class="form-control"
                :disabled="config.isUpdating.value"
              />
              <p class="hint">0 = unlimited</p>
            </div>
          </div>
        </div>
      </section>

      <div v-if="saveError" class="alert alert-danger mb-0 mt-3" role="alert">
        {{ saveError }}
      </div>
    </template>
    <template #footer>
      <button
        type="button"
        class="btn btn-secondary"
        :disabled="config.isUpdating.value"
        @click="emit('close')"
      >
        Cancel
      </button>
      <button
        type="button"
        class="btn btn-primary"
        :disabled="!canSave"
        @click="onSave"
      >
        <span
          v-if="config.isUpdating.value"
          class="spinner-border spinner-border-sm me-1"
          aria-hidden="true"
        />
        {{ config.isUpdating.value ? 'Saving…' : 'Save configuration' }}
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.section {
  padding-bottom: var(--rsmq-space-4);
  margin-bottom: var(--rsmq-space-4);
  border-bottom: 1px solid var(--rsmq-color-border);
}
.section:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}
.section__title {
  display: flex;
  align-items: center;
  gap: var(--rsmq-space-2);
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 var(--rsmq-space-3);
  color: var(--rsmq-color-text);
}
.section__title .bi {
  color: var(--rsmq-color-primary);
}
.field {
  margin-bottom: var(--rsmq-space-3);
}
.field:last-of-type {
  margin-bottom: 0;
}
.hint {
  margin: var(--rsmq-space-1) 0 0;
  font-size: 0.75rem;
  color: var(--rsmq-color-text-muted);
}
.nested {
  margin: var(--rsmq-space-3) 0 0 var(--rsmq-space-5);
  padding-left: var(--rsmq-space-3);
  border-left: 3px solid var(--rsmq-color-primary);
  display: flex;
  flex-direction: column;
  gap: var(--rsmq-space-2);
}
.nested--grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--rsmq-space-3);
}
.audit-block {
  padding: var(--rsmq-space-3) 0;
  border-bottom: 1px dashed var(--rsmq-color-border);
}
.audit-block:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
@media (max-width: 576px) {
  .nested {
    margin-left: var(--rsmq-space-2);
  }
  .nested--grid {
    grid-template-columns: 1fr;
  }
}
</style>
