<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed, ref } from 'vue';
import PageShell from '@/components/ui/PageShell.vue';
import Card from '@/components/ui/Card.vue';
import StateBlock from '@/components/ui/StateBlock.vue';
import UpdateConfigurationModal from '@/components/modals/UpdateConfigurationModal.vue';
import { useConfiguration } from '@/composables/useConfiguration';
import { formatNumber } from '@/lib/format';
import type { PageAction } from '@/components/ui/PageShell.vue';
import type { IMessageAuditMessagesConfig } from '@/api/model';

const config = useConfiguration();

const showEdit = ref(false);

function openEdit() {
  showEdit.value = true;
}

function onSaved() {
  showEdit.value = false;
}

const actions = computed<PageAction[]>(() => [
  {
    id: 'edit',
    label: 'Edit configuration',
    icon: 'bi-pencil',
    variant: 'primary',
    disabled: !config.config.value,
    onClick: openEdit,
  },
  {
    id: 'refresh',
    label: 'Refresh',
    icon: 'bi-arrow-clockwise',
    variant: 'secondary',
    loading: config.isLoading.value,
    onClick: () => config.refetch(),
  },
]);

// Display helpers
function formatQueueSize(n: number | undefined): string {
  if (n === undefined) return '—';
  if (n === 0) return 'Unlimited';
  return formatNumber(n);
}

function formatExpire(seconds: number | undefined): string {
  if (seconds === undefined) return '—';
  if (seconds === 0) return 'Never';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function auditSummary(cfg: IMessageAuditMessagesConfig | undefined): string {
  if (!cfg || !cfg.enabled) return 'Disabled';
  return `Queue size: ${formatQueueSize(cfg.queueSize)} · Expire: ${formatExpire(cfg.expire)}`;
}

const loggerLevelLabel = computed(() => {
  const v = config.config.value?.logger.options.logLevel;
  if (typeof v === 'string') return v;
  const names: Record<number, string> = {
    0: 'DEBUG',
    1: 'INFO',
    2: 'WARN',
    3: 'ERROR',
  };
  return typeof v === 'number' ? (names[v] ?? String(v)) : '—';
});
</script>

<template>
  <PageShell
    title="Configuration"
    subtitle="View and manage RedisSMQ system configuration"
    icon="bi-gear"
    :actions="actions"
    :loading="config.isLoading.value"
    :error="config.error.value"
  >
    <template v-if="config.config.value">
      <!-- Namespace -->
      <Card title="Namespace" icon="bi-tag" :heading-level="2">
        <p class="value font-mono">
          {{ config.config.value.namespace || 'default' }}
        </p>
      </Card>

      <!-- Logger -->
      <Card title="Logger" icon="bi-file-text" :heading-level="2">
        <template #actions>
          <span
            class="badge"
            :class="
              config.config.value.logger.enabled ? 'bg-success' : 'bg-secondary'
            "
          >
            {{ config.config.value.logger.enabled ? 'Enabled' : 'Disabled' }}
          </span>
        </template>
        <dl v-if="config.config.value.logger.enabled" class="kv-grid">
          <div>
            <dt>Log level</dt>
            <dd>{{ loggerLevelLabel }}</dd>
          </div>
          <div>
            <dt>Colorize</dt>
            <dd>
              {{ config.config.value.logger.options.colorize ? 'Yes' : 'No' }}
            </dd>
          </div>
          <div>
            <dt>Include timestamp</dt>
            <dd>
              {{
                config.config.value.logger.options.includeTimestamp
                  ? 'Yes'
                  : 'No'
              }}
            </dd>
          </div>
        </dl>
        <p v-else class="muted">Logger is disabled.</p>
      </Card>

      <!-- Message audit -->
      <Card title="Message audit" icon="bi-bar-chart-steps" :heading-level="2">
        <div class="audit-section">
          <div class="audit-row">
            <span class="audit-row__label">
              <i class="bi bi-check-circle text-success" aria-hidden="true" />
              Acknowledged messages
            </span>
            <span
              class="badge"
              :class="
                config.config.value.messageAudit.acknowledgedMessages.enabled
                  ? 'bg-success'
                  : 'bg-secondary'
              "
            >
              {{
                config.config.value.messageAudit.acknowledgedMessages.enabled
                  ? 'Enabled'
                  : 'Disabled'
              }}
            </span>
          </div>
          <p class="audit-row__summary">
            {{
              auditSummary(
                config.config.value.messageAudit.acknowledgedMessages,
              )
            }}
          </p>
        </div>

        <div class="audit-section">
          <div class="audit-row">
            <span class="audit-row__label">
              <i class="bi bi-x-octagon text-danger" aria-hidden="true" />
              Dead-lettered messages
            </span>
            <span
              class="badge"
              :class="
                config.config.value.messageAudit.deadLetteredMessages.enabled
                  ? 'bg-success'
                  : 'bg-secondary'
              "
            >
              {{
                config.config.value.messageAudit.deadLetteredMessages.enabled
                  ? 'Enabled'
                  : 'Disabled'
              }}
            </span>
          </div>
          <p class="audit-row__summary">
            {{
              auditSummary(
                config.config.value.messageAudit.deadLetteredMessages,
              )
            }}
          </p>
        </div>

        <div class="audit-section">
          <div class="audit-row">
            <span class="audit-row__label">
              <i class="bi bi-clock-history text-info" aria-hidden="true" />
              Unacknowledgement history
            </span>
            <span
              class="badge"
              :class="
                config.config.value.messageAudit.unacknowledgementHistory
                  .enabled
                  ? 'bg-success'
                  : 'bg-secondary'
              "
            >
              {{
                config.config.value.messageAudit.unacknowledgementHistory
                  .enabled
                  ? 'Enabled'
                  : 'Disabled'
              }}
            </span>
          </div>
          <p
            v-if="
              config.config.value.messageAudit.unacknowledgementHistory.enabled
            "
            class="audit-row__summary"
          >
            Max size:
            {{
              formatQueueSize(
                config.config.value.messageAudit.unacknowledgementHistory
                  .maxSize,
              )
            }}
          </p>
        </div>
      </Card>
    </template>
  </PageShell>

  <UpdateConfigurationModal
    :is-visible="showEdit"
    :current="config.config.value"
    @close="showEdit = false"
    @success="onSaved"
  />
</template>

<style scoped>
.value {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--rsmq-color-text);
}
.muted {
  margin: 0;
  color: var(--rsmq-color-text-muted);
}
.kv-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--rsmq-space-3);
  margin: 0;
}
.kv-grid dt {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--rsmq-color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin-bottom: var(--rsmq-space-1);
}
.kv-grid dd {
  margin: 0;
  color: var(--rsmq-color-text);
  font-weight: 600;
}
.audit-section {
  padding: var(--rsmq-space-3) 0;
  border-bottom: 1px solid var(--rsmq-color-border);
}
.audit-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.audit-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--rsmq-space-3);
  flex-wrap: wrap;
}
.audit-row__label {
  display: flex;
  align-items: center;
  gap: var(--rsmq-space-2);
  font-weight: 600;
  color: var(--rsmq-color-text);
}
.audit-row__summary {
  margin: var(--rsmq-space-1) 0 0;
  font-size: 0.85rem;
  color: var(--rsmq-color-text-muted);
}
</style>
