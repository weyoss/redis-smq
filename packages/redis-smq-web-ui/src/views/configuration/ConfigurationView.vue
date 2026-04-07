<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { usePageContentStore, type PageAction } from '@/stores/pageContent.ts';
import { useEscapeKey } from '@/composables/useEscapeKey.ts';
import { getErrorMessage } from '@/lib/error.ts';
import { EConsoleLoggerLevel } from '@/types/config.ts';

import PageContent from '@/components/PageContent.vue';
import { useGetApiConfig } from '@/api/generated/configuration/configuration.ts';
import UpdateConfigurationModal from '@/components/modals/UpdateConfigurationModal.vue';

const pageContentStore = usePageContentStore();

// Data fetching
const {
  data: configData,
  isLoading,
  error,
  refetch: refetchConfig,
} = useGetApiConfig();

const config = computed(() => configData.value?.data);
const configError = computed(() => getErrorMessage(error.value));

// UI State
const showEditModal = ref(false);
const isRefreshing = ref(false);

// Page content definitions
const pageTitle = 'Configuration';
const pageSubtitle = 'View and manage RedisSMQ system configuration';

const pageActions = computed((): PageAction[] => [
  {
    id: 'refresh-config',
    label: 'Refresh',
    icon: 'bi bi-arrow-clockwise',
    variant: 'secondary',
    disabled: isLoading.value || isRefreshing.value,
    loading: isLoading.value || isRefreshing.value,
    handler: async () => {
      isRefreshing.value = true;
      await refetchConfig();
      isRefreshing.value = false;
    },
  },
  {
    id: 'edit-config',
    label: 'Edit Configuration',
    icon: 'bi bi-pencil-square',
    variant: 'primary',
    disabled: isLoading.value,
    loading: false,
    handler: () => (showEditModal.value = true),
  },
]);

// Helper functions for display
const getLogLevelLabel = (
  level: 0 | 1 | 2 | 3 | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR',
): string => {
  const labels: Record<number, string> = {
    [EConsoleLoggerLevel.DEBUG]: 'Debug',
    [EConsoleLoggerLevel.INFO]: 'Info',
    [EConsoleLoggerLevel.WARN]: 'Warning',
    [EConsoleLoggerLevel.ERROR]: 'Error',
  };
  if (typeof level === 'string') {
    const i = EConsoleLoggerLevel[level];
    return labels[i];
  }
  return labels[level];
};

const formatExpireTime = (seconds?: number): string => {
  if (!seconds) return 'Unlimited';
  if (seconds === 0) return 'Unlimited';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 && days === 0 && hours === 0) parts.push(`${secs}s`);

  return parts.length > 0 ? parts.join(' ') : '0s';
};

const formatNumber = (value?: number): string => {
  if (value === undefined) return 'N/A';
  if (value === 0) return 'Unlimited';
  return value.toLocaleString();
};

const getStatusBadgeClass = (enabled: boolean): string => {
  return enabled
    ? 'badge bg-success bg-opacity-10 text-success border border-success border-opacity-25'
    : 'badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25';
};

const getStatusText = (enabled: boolean): string => {
  return enabled ? 'Enabled' : 'Disabled';
};

const getStatusIcon = (enabled: boolean): string => {
  return enabled ? 'bi bi-check-circle-fill' : 'bi bi-x-circle-fill';
};

// Handle successful configuration update
function handleConfigUpdated() {
  showEditModal.value = false;
  refetchConfig();
}

// Keyboard shortcuts
useEscapeKey([
  {
    isVisible: showEditModal,
    onEscape: () => (showEditModal.value = false),
  },
]);

// Sync with page content store
watchEffect(() => {
  pageContentStore.setPageHeader({
    title: pageTitle,
    subtitle: pageSubtitle,
    icon: 'bi bi-gear-wide-connected',
  });
  pageContentStore.setPageActions(pageActions.value);
  pageContentStore.setLoadingState(isLoading.value);

  if (configError.value) {
    pageContentStore.setErrorState(configError.value);
    pageContentStore.setEmptyState(false);
  } else if (!isLoading.value && !config.value) {
    pageContentStore.setErrorState(null);
    pageContentStore.setEmptyState(true, {
      icon: 'bi bi-gear',
      title: 'No Configuration Data',
      message: 'Unable to load configuration data.',
      actionLabel: 'Retry',
      actionHandler: () => refetchConfig(),
    });
  } else {
    pageContentStore.setErrorState(null);
    pageContentStore.setEmptyState(false);
  }
});
</script>

<template>
  <div class="configuration-view">
    <PageContent>
      <div v-if="config" class="config-container">
        <!-- Namespace Section -->
        <div class="config-card">
          <div class="card-header-custom">
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-tag fs-5 text-primary"></i>
              <h3 class="mb-0 fs-6 fw-semibold text-secondary">Namespace</h3>
            </div>
          </div>
          <div class="card-body-custom">
            <div class="info-row">
              <div class="info-label">
                <i class="bi bi-hash me-1"></i>
                Namespace
              </div>
              <div class="info-value">
                <code class="namespace-code">{{
                  config.namespace || 'default'
                }}</code>
              </div>
            </div>
          </div>
        </div>

        <!-- Logger Configuration Section -->
        <div class="config-card">
          <div class="card-header-custom">
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-file-text fs-5 text-primary"></i>
              <h3 class="mb-0 fs-6 fw-semibold text-secondary">
                Logger Configuration
              </h3>
            </div>
          </div>
          <div class="card-body-custom">
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">
                  <i class="bi bi-toggle2-on me-1"></i>
                  Status
                </div>
                <div class="info-value">
                  <span :class="getStatusBadgeClass(config.logger.enabled)">
                    <i
                      :class="getStatusIcon(config.logger.enabled)"
                      class="me-1"
                    ></i>
                    {{ getStatusText(config.logger.enabled) }}
                  </span>
                </div>
              </div>

              <template v-if="config.logger.enabled">
                <div class="info-item">
                  <div class="info-label">
                    <i class="bi bi-bar-chart-steps me-1"></i>
                    Log Level
                  </div>
                  <div class="info-value">
                    <code class="value-code">
                      {{ getLogLevelLabel(config.logger.options.logLevel!) }}
                    </code>
                  </div>
                </div>

                <div class="info-item">
                  <div class="info-label">
                    <i class="bi bi-palette me-1"></i>
                    Colorize
                  </div>
                  <div class="info-value">
                    <span
                      :class="
                        getStatusBadgeClass(config.logger.options.colorize!)
                      "
                    >
                      <i
                        :class="getStatusIcon(config.logger.options.colorize!)"
                        class="me-1"
                      ></i>
                      {{ getStatusText(config.logger.options.colorize!) }}
                    </span>
                  </div>
                </div>

                <div class="info-item">
                  <div class="info-label">
                    <i class="bi bi-clock me-1"></i>
                    Include Timestamp
                  </div>
                  <div class="info-value">
                    <span
                      :class="
                        getStatusBadgeClass(
                          config.logger.options.includeTimestamp!,
                        )
                      "
                    >
                      <i
                        :class="
                          getStatusIcon(config.logger.options.includeTimestamp!)
                        "
                        class="me-1"
                      ></i>
                      {{
                        getStatusText(config.logger.options.includeTimestamp!)
                      }}
                    </span>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Message Audit Configuration Section -->
        <div class="config-card">
          <div class="card-header-custom">
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-bar-chart-steps fs-5 text-primary"></i>
              <h3 class="mb-0 fs-6 fw-semibold text-secondary">
                Message Audit Configuration
              </h3>
            </div>
          </div>
          <div class="card-body-custom">
            <!-- Acknowledged Messages -->
            <div class="audit-card mb-4">
              <div class="audit-header">
                <div class="d-flex align-items-center gap-2">
                  <i class="bi bi-check-circle text-success"></i>
                  <h4 class="mb-0 fs-6 fw-semibold">Acknowledged Messages</h4>
                </div>
              </div>
              <div class="audit-body">
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">
                      <i class="bi bi-toggle2-on me-1"></i>
                      Status
                    </div>
                    <div class="info-value">
                      <span
                        :class="
                          getStatusBadgeClass(
                            config.messageAudit.acknowledgedMessages.enabled,
                          )
                        "
                      >
                        <i
                          :class="
                            getStatusIcon(
                              config.messageAudit.acknowledgedMessages.enabled,
                            )
                          "
                          class="me-1"
                        ></i>
                        {{
                          getStatusText(
                            config.messageAudit.acknowledgedMessages.enabled,
                          )
                        }}
                      </span>
                    </div>
                  </div>

                  <template
                    v-if="config.messageAudit.acknowledgedMessages.enabled"
                  >
                    <div class="info-item">
                      <div class="info-label">
                        <i class="bi bi-database me-1"></i>
                        Queue Size
                      </div>
                      <div class="info-value">
                        <code class="value-code">
                          {{
                            formatNumber(
                              config.messageAudit.acknowledgedMessages
                                .queueSize,
                            )
                          }}
                        </code>
                        <span
                          v-if="
                            config.messageAudit.acknowledgedMessages
                              .queueSize === 0
                          "
                          class="text-muted ms-2 small"
                        >
                          (unlimited)
                        </span>
                      </div>
                    </div>

                    <div class="info-item">
                      <div class="info-label">
                        <i class="bi bi-hourglass-split me-1"></i>
                        Expire After
                      </div>
                      <div class="info-value">
                        <code class="value-code">
                          {{
                            formatExpireTime(
                              config.messageAudit.acknowledgedMessages.expire,
                            )
                          }}
                        </code>
                        <span
                          v-if="
                            config.messageAudit.acknowledgedMessages.expire ===
                            0
                          "
                          class="text-muted ms-2 small"
                        >
                          (never expires)
                        </span>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </div>

            <!-- Dead Lettered Messages -->
            <div class="audit-card mb-4">
              <div class="audit-header">
                <div class="d-flex align-items-center gap-2">
                  <i class="bi bi-exclamation-triangle text-warning"></i>
                  <h4 class="mb-0 fs-6 fw-semibold">Dead Lettered Messages</h4>
                </div>
              </div>
              <div class="audit-body">
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">
                      <i class="bi bi-toggle2-on me-1"></i>
                      Status
                    </div>
                    <div class="info-value">
                      <span
                        :class="
                          getStatusBadgeClass(
                            config.messageAudit.deadLetteredMessages.enabled,
                          )
                        "
                      >
                        <i
                          :class="
                            getStatusIcon(
                              config.messageAudit.deadLetteredMessages.enabled,
                            )
                          "
                          class="me-1"
                        ></i>
                        {{
                          getStatusText(
                            config.messageAudit.deadLetteredMessages.enabled,
                          )
                        }}
                      </span>
                    </div>
                  </div>

                  <template
                    v-if="config.messageAudit.deadLetteredMessages.enabled"
                  >
                    <div class="info-item">
                      <div class="info-label">
                        <i class="bi bi-database me-1"></i>
                        Queue Size
                      </div>
                      <div class="info-value">
                        <code class="value-code">
                          {{
                            formatNumber(
                              config.messageAudit.deadLetteredMessages
                                .queueSize,
                            )
                          }}
                        </code>
                        <span
                          v-if="
                            config.messageAudit.deadLetteredMessages
                              .queueSize === 0
                          "
                          class="text-muted ms-2 small"
                        >
                          (unlimited)
                        </span>
                      </div>
                    </div>

                    <div class="info-item">
                      <div class="info-label">
                        <i class="bi bi-hourglass-split me-1"></i>
                        Expire After
                      </div>
                      <div class="info-value">
                        <code class="value-code">
                          {{
                            formatExpireTime(
                              config.messageAudit.deadLetteredMessages.expire,
                            )
                          }}
                        </code>
                        <span
                          v-if="
                            config.messageAudit.deadLetteredMessages.expire ===
                            0
                          "
                          class="text-muted ms-2 small"
                        >
                          (never expires)
                        </span>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </div>

            <!-- Unacknowledgement History -->
            <div class="audit-card">
              <div class="audit-header">
                <div class="d-flex align-items-center gap-2">
                  <i class="bi bi-clock-history text-info"></i>
                  <h4 class="mb-0 fs-6 fw-semibold">
                    Unacknowledgement History
                  </h4>
                </div>
              </div>
              <div class="audit-body">
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">
                      <i class="bi bi-toggle2-on me-1"></i>
                      Status
                    </div>
                    <div class="info-value">
                      <span
                        :class="
                          getStatusBadgeClass(
                            config.messageAudit.unacknowledgementHistory
                              .enabled,
                          )
                        "
                      >
                        <i
                          :class="
                            getStatusIcon(
                              config.messageAudit.unacknowledgementHistory
                                .enabled,
                            )
                          "
                          class="me-1"
                        ></i>
                        {{
                          getStatusText(
                            config.messageAudit.unacknowledgementHistory
                              .enabled,
                          )
                        }}
                      </span>
                    </div>
                  </div>

                  <template
                    v-if="config.messageAudit.unacknowledgementHistory.enabled"
                  >
                    <div class="info-item">
                      <div class="info-label">
                        <i class="bi bi-database me-1"></i>
                        Max Size
                      </div>
                      <div class="info-value">
                        <code class="value-code">
                          {{
                            formatNumber(
                              config.messageAudit.unacknowledgementHistory
                                .maxSize,
                            )
                          }}
                        </code>
                        <span
                          v-if="
                            config.messageAudit.unacknowledgementHistory
                              .maxSize === 0
                          "
                          class="text-muted ms-2 small"
                        >
                          (unlimited)
                        </span>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContent>

    <!-- Edit Configuration Modal -->
    <UpdateConfigurationModal
      v-if="showEditModal"
      :is-visible="showEditModal"
      :current-config="config"
      @close="showEditModal = false"
      @success="handleConfigUpdated"
    />
  </div>
</template>

<style scoped>
.configuration-view {
  max-width: 100%;
  overflow-x: hidden;
}

.config-container {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Card Styles */
.config-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
  overflow: hidden;
  transition: box-shadow 0.2s ease;
}

.config-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.card-header-custom {
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-bottom: 1px solid #e9ecef;
}

.card-body-custom {
  padding: 1.25rem;
}

/* Audit Card Styles */
.audit-card {
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #e9ecef;
  overflow: hidden;
}

.audit-header {
  padding: 0.875rem 1.25rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.audit-body {
  padding: 1.25rem;
}

/* Info Grid Styles */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f1f3f5;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 500;
  font-size: 0.8125rem;
  color: #6c757d;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.info-label i {
  font-size: 0.875rem;
}

.info-value {
  font-size: 0.875rem;
  font-weight: 500;
  color: #212529;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* Row layout for single items */
.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
}

/* Code Styles */
.namespace-code,
.value-code {
  background: #f8f9fa;
  padding: 0.25rem 0.625rem;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
  color: #0d6efd;
  border: 1px solid #e9ecef;
}

.value-code {
  color: #495057;
}

/* Badge Styles */
.badge {
  padding: 0.3125rem 0.875rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}

.bg-success.bg-opacity-10 {
  background-color: rgba(25, 135, 84, 0.1) !important;
}

.bg-danger.bg-opacity-10 {
  background-color: rgba(220, 53, 69, 0.1) !important;
}

/* Responsive Design */
@media (max-width: 768px) {
  .card-header-custom {
    padding: 0.875rem 1rem;
  }

  .card-body-custom {
    padding: 1rem;
  }

  .audit-header {
    padding: 0.75rem 1rem;
  }

  .audit-body {
    padding: 1rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.375rem;
    padding: 0.625rem 0;
  }

  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.375rem;
  }

  .info-label {
    font-size: 0.75rem;
  }

  .info-value {
    font-size: 0.8125rem;
  }

  .badge {
    padding: 0.25rem 0.75rem;
    font-size: 0.6875rem;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .config-card {
    background: #2d2d2d;
    border-color: #404040;
  }

  .card-header-custom {
    background: linear-gradient(135deg, #242424 0%, #2d2d2d 100%);
    border-bottom-color: #404040;
  }

  .card-header-custom h3 {
    color: #e5e7eb;
  }

  .card-header-custom i {
    color: #9ca3af;
  }

  .audit-card {
    background: #2d2d2d;
    border-color: #404040;
  }

  .audit-header {
    background: #242424;
    border-bottom-color: #404040;
  }

  .audit-header h4 {
    color: #e5e7eb;
  }

  .info-label {
    color: #9ca3af;
  }

  .info-value {
    color: #e5e7eb;
  }

  .info-item {
    border-bottom-color: #404040;
  }

  .namespace-code,
  .value-code {
    background: #1f1f1f;
    border-color: #404040;
    color: #9ec1ff;
  }

  .value-code {
    color: #d1d5db;
  }

  .bg-success.bg-opacity-10 {
    background-color: rgba(25, 135, 84, 0.15) !important;
  }

  .bg-danger.bg-opacity-10 {
    background-color: rgba(220, 53, 69, 0.15) !important;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .config-card {
    transition: none;
  }
}
</style>
