<!--
  - Copyright (c)
  - Weyoss <weyoss@protonmail.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useQueueRateLimit } from '@/composables/useQueueRateLimit.ts';
import { Form, Field, ErrorMessage, type GenericObject } from 'vee-validate';
import { z } from 'zod';
import { toTypedSchema } from '@vee-validate/zod';
import { useSelectedQueueStore } from '@/stores/selectedQueue.ts';

const selectedQueueStore = useSelectedQueueStore();
const queueRateLimit = useQueueRateLimit();

const selectedQueue = computed(() => {
  return selectedQueueStore.selectedQueue;
});

// Define form schema with millisecond validation
const rateLimitSchema = z.object({
  limit: z
    .number()
    .int('Rate limit must be a whole number')
    .positive('Rate limit must be greater than 0')
    .max(1000000, 'Rate limit must be less than 1,000,000'),
  interval: z
    .number()
    .int('Interval must be a whole number')
    .positive('Interval must be greater than 0'),
  intervalUnit: z
    .string()
    .refine((val) => ['1000', '60000', '3600000'].includes(val), {
      message: 'Please select a valid time unit',
    }),
});

// Convert the zod schema to a vee-validate schema
const validationSchema = toTypedSchema(rateLimitSchema);

// Define form values type based on the schema
type FormValues = z.infer<typeof rateLimitSchema>;

// Initial values for the form
const initialFormValues: FormValues = {
  limit: 100,
  interval: 1,
  intervalUnit: '1000', // seconds
};

// State
const isEditing = ref(false);
const isUpdating = computed(() => {
  return (
    queueRateLimit.isClearingRateLimit.value ||
    queueRateLimit.isUpdatingRateLimit.value
  );
});
const showClearConfirm = ref(false);
const formValues = ref<FormValues>(initialFormValues);

// Computed properties from rate limits store
const isLoading = computed(() => queueRateLimit.isLoadingRateLimit.value);
const error = computed(() => {
  const setError = queueRateLimit.setRateLimitError;
  const clearError = queueRateLimit.clearRateLimitError;
  const error = setError.value?.error || clearError.value?.error;
  if (error) {
    return `Failed to load rate limit settings: ${error.message} (${error.code})`;
  }
  return null;
});
const rateLimit = computed(() => {
  return queueRateLimit.rateLimit.value?.data || null;
});
const hasRateLimit = computed(() => queueRateLimit.hasRateLimit.value);

// Format interval for display (convert from milliseconds)
function formatIntervalForDisplay(intervalMs?: number): string {
  if (!intervalMs) return '1 second';

  if (intervalMs >= 3600000 && intervalMs % 3600000 === 0) {
    const hours = intervalMs / 3600000;
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else if (intervalMs >= 60000 && intervalMs % 60000 === 0) {
    const minutes = intervalMs / 60000;
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    const seconds = intervalMs / 1000;
    return `${seconds} second${seconds > 1 ? 's' : ''}`;
  }
}

// Get label for interval unit
function getIntervalUnitLabel(unit: string): string {
  switch (unit) {
    case '3600000':
      return 'hour';
    case '60000':
      return 'minute';
    default:
      return 'second';
  }
}

// Convert milliseconds to form values
function msToFormValues(intervalMs?: number): {
  interval: number;
  intervalUnit: string;
} {
  if (!intervalMs) return { interval: 1, intervalUnit: '1000' };

  if (intervalMs >= 3600000 && intervalMs % 3600000 === 0) {
    return { interval: intervalMs / 3600000, intervalUnit: '3600000' };
  } else if (intervalMs >= 60000 && intervalMs % 60000 === 0) {
    return { interval: intervalMs / 60000, intervalUnit: '60000' };
  } else {
    return { interval: intervalMs / 1000, intervalUnit: '1000' };
  }
}

// Watch for rate limit changes
watch(
  rateLimit,
  (newValue) => {
    if (newValue) {
      const { interval, intervalUnit } = msToFormValues(newValue.interval);
      formValues.value = {
        limit: newValue.limit,
        interval,
        intervalUnit,
      };
    } else {
      formValues.value = initialFormValues;
    }
  },
  { immediate: true },
);

// Refresh rate limit data
function refreshRateLimit() {
  queueRateLimit.refreshRateLimit();
}

// Start editing (works for both adding and editing)
function startEditing() {
  // Update form values based on current rate limit
  if (hasRateLimit.value && rateLimit.value) {
    const { interval, intervalUnit } = msToFormValues(rateLimit.value.interval);
    formValues.value = {
      limit: rateLimit.value.limit,
      interval,
      intervalUnit,
    };
  } else {
    formValues.value = initialFormValues;
  }

  isEditing.value = true;
}

// Save rate limit
async function saveRateLimit(values: GenericObject) {
  const { interval, limit, intervalUnit } = values as FormValues;
  try {
    // Calculate interval in milliseconds
    const intervalMs = interval * parseInt(intervalUnit);

    // Ensure minimum interval is 1000ms
    if (intervalMs < 1000) {
      alert('Minimum interval is 1 second (1000ms)');
      return;
    }

    // Convert form values to API payload
    const payload = {
      limit: limit,
      interval: intervalMs,
    };

    await queueRateLimit.setRateLimit(payload);
    isEditing.value = false;
  } catch (err) {
    console.error('Error saving rate limit:', err);
  }
}

// Clear rate limit
async function clearRateLimit() {
  try {
    await queueRateLimit.clearRateLimit();
    showClearConfirm.value = false;
  } catch (err) {
    console.error('Error clearing rate limit:', err);
  }
}

// Show clear confirmation modal
function confirmClearRateLimit() {
  showClearConfirm.value = true;
}

// Cancel editing
function cancelEdit() {
  isEditing.value = false;
}

onMounted(() => {
  refreshRateLimit();
});
</script>

<template>
  <div v-if="selectedQueue" class="rate-limit-card">
    <!-- Header -->
    <header class="card-header">
      <div class="header-content">
        <h3 class="card-title">
          <i class="bi bi-speedometer2 title-icon"></i>
          Rate Limiting
        </h3>
        <p class="card-subtitle">Control message processing speed</p>
      </div>
      <div class="header-actions">
        <button
          class="btn btn-refresh"
          :disabled="isLoading"
          title="Refresh rate limit settings"
          @click="refreshRateLimit"
        >
          <i class="bi bi-arrow-clockwise" :class="{ spinning: isLoading }"></i>
        </button>
      </div>
    </header>

    <!-- Content -->
    <main class="card-content">
      <template v-if="selectedQueue">
        <!-- Loading State -->
        <div v-if="isLoading" class="content-state loading-state">
          <div class="state-content">
            <div class="spinner-border text-primary mb-3"></div>
            <h5 class="state-title">Loading rate limit settings...</h5>
            <p class="state-subtitle">
              Please wait while we fetch the configuration
            </p>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="content-state error-state">
          <div class="error-content">
            <div class="error-icon">
              <i class="bi bi-exclamation-triangle-fill text-danger"></i>
            </div>
            <div class="error-text">
              <h5 class="error-title">Failed to load rate limit settings</h5>
              <p class="error-message">{{ error }}</p>
            </div>
          </div>
          <div class="error-actions">
            <button class="btn btn-primary" @click="refreshRateLimit">
              <i class="bi bi-arrow-clockwise me-2"></i>
              Try Again
            </button>
          </div>
        </div>

        <!-- Main Content -->
        <div v-else class="rate-limit-content">
          <!-- Rate Limit Display -->
          <div v-if="!isEditing" class="rate-limit-display">
            <!-- No Rate Limit Set -->
            <div v-if="!hasRateLimit" class="no-limit-section">
              <div class="no-limit-content">
                <div class="no-limit-icon">⚡</div>
                <div class="no-limit-text">
                  <h4 class="no-limit-title">No Rate Limit Configured</h4>
                  <p class="no-limit-description">
                    Messages are processed without speed restrictions. Set a
                    rate limit to control processing speed and prevent system
                    overload.
                  </p>
                </div>
              </div>
              <div class="no-limit-actions">
                <button
                  class="btn btn-primary btn-set-limit"
                  :disabled="isUpdating"
                  @click="startEditing"
                >
                  <i class="bi bi-plus-circle me-2"></i>
                  Set Rate Limit
                </button>
              </div>
            </div>

            <!-- Rate Limit Info -->
            <div v-else class="rate-limit-info">
              <div class="rate-limit-status">
                <div class="status-indicator">
                  <div class="status-badge active">
                    <i class="bi bi-check-circle-fill me-1"></i>
                    Active
                  </div>
                </div>
                <div class="rate-limit-details">
                  <h4 class="rate-limit-value">
                    {{ rateLimit?.limit || 0 }} messages
                    <span class="rate-limit-interval">
                      per {{ formatIntervalForDisplay(rateLimit?.interval) }}
                    </span>
                  </h4>
                  <p class="rate-limit-description">
                    Current rate limiting configuration for this queue
                  </p>
                </div>
              </div>

              <div class="rate-limit-actions">
                <button
                  class="btn btn-outline-primary btn-edit"
                  :disabled="isUpdating"
                  @click="startEditing"
                >
                  <i class="bi bi-pencil me-2"></i>
                  Edit
                </button>
                <button
                  class="btn btn-outline-danger btn-clear"
                  :disabled="isUpdating"
                  @click="confirmClearRateLimit"
                >
                  <i class="bi bi-trash me-2"></i>
                  Clear
                </button>
              </div>
            </div>
          </div>

          <!-- Rate Limit Form -->
          <div v-if="isEditing" class="rate-limit-form">
            <div class="form-header">
              <h4 class="form-title">
                {{ hasRateLimit ? 'Edit Rate Limit' : 'Set Rate Limit' }}
              </h4>
              <p class="form-subtitle">
                Configure the maximum number of messages processed per time
                interval
              </p>
            </div>

            <Form
              :initial-values="formValues"
              :validation-schema="validationSchema"
              @submit="saveRateLimit"
            >
              <div class="form-body">
                <div class="form-grid">
                  <div class="form-group">
                    <label for="limit" class="form-label">
                      <i class="bi bi-hash me-1"></i>
                      Message Limit
                    </label>
                    <Field
                      id="limit"
                      name="limit"
                      type="number"
                      class="form-control"
                      min="1"
                      max="1000000"
                      required
                      :disabled="isUpdating"
                      placeholder="e.g. 100"
                    />
                    <ErrorMessage name="limit" class="field-error" />
                    <div class="field-help">Maximum messages to process</div>
                  </div>

                  <div class="form-group">
                    <label for="interval" class="form-label">
                      <i class="bi bi-clock me-1"></i>
                      Time Interval
                    </label>
                    <div class="input-group">
                      <Field
                        id="interval"
                        name="interval"
                        type="number"
                        class="form-control"
                        min="1"
                        required
                        :disabled="isUpdating"
                        placeholder="e.g. 1"
                      />
                      <Field
                        name="intervalUnit"
                        as="select"
                        class="form-select"
                      >
                        <option value="1000">Seconds</option>
                        <option value="60000">Minutes</option>
                        <option value="3600000">Hours</option>
                      </Field>
                    </div>
                    <ErrorMessage name="interval" class="field-error" />
                    <div class="field-help">Minimum interval is 1 second</div>
                  </div>
                </div>

                <!-- Preview -->
                <div class="rate-limit-preview">
                  <div class="preview-content">
                    <i class="bi bi-info-circle preview-icon"></i>
                    <div class="preview-text">
                      This will limit the queue to processing
                      <Field v-slot="{ field }" name="limit">
                        <strong>{{ field.value || 0 }}</strong>
                      </Field>
                      messages per
                      <Field v-slot="{ field }" name="interval">
                        <strong>{{ field.value || 1 }}</strong>
                      </Field>
                      <Field v-slot="{ field }" name="intervalUnit">
                        <strong
                          >{{ getIntervalUnitLabel(field.value) }}(s)</strong
                        >
                      </Field>
                    </div>
                  </div>
                </div>
              </div>

              <div class="form-footer">
                <button
                  type="button"
                  class="btn btn-outline-secondary btn-cancel"
                  :disabled="isUpdating"
                  @click="cancelEdit"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="btn btn-primary btn-save"
                  :disabled="isUpdating"
                >
                  <template v-if="isUpdating">
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    Saving...
                  </template>
                  <template v-else>
                    <i class="bi bi-check-lg me-2"></i>
                    Save Rate Limit
                  </template>
                </button>
              </div>
            </Form>
          </div>
        </div>
      </template>

      <!-- No Queue Selected -->
      <template v-else>
        <div class="content-state empty-state">
          <div class="state-content">
            <div class="empty-icon">🎯</div>
            <h4 class="state-title">No Queue Selected</h4>
            <p class="state-subtitle">
              Select a queue to configure its rate limiting settings
            </p>
          </div>
        </div>
      </template>
    </main>

    <!-- Clear Rate Limit Confirmation Modal -->
    <div
      v-if="showClearConfirm"
      class="modal-overlay"
      @click="showClearConfirm = false"
    >
      <div class="modal-dialog" @click.stop>
        <div class="modal-content">
          <header class="modal-header">
            <h4 class="modal-title">
              <i class="bi bi-exclamation-triangle-fill text-warning me-2"></i>
              Clear Rate Limit
            </h4>
            <button
              type="button"
              class="btn-close"
              title="Close"
              @click="showClearConfirm = false"
            >
              <i class="bi bi-x"></i>
            </button>
          </header>

          <main class="modal-body">
            <p class="modal-message">
              Are you sure you want to remove the rate limit for queue
              <strong class="queue-identifier"
                >"{{ selectedQueue?.name }}@{{ selectedQueue?.ns }}"</strong
              >?
            </p>
            <div class="modal-warning">
              <i class="bi bi-info-circle me-2"></i>
              This will allow messages to be processed without any rate
              restrictions.
            </div>
          </main>

          <footer class="modal-footer">
            <button
              type="button"
              class="btn btn-outline-secondary"
              @click="showClearConfirm = false"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-danger"
              :disabled="isUpdating"
              @click="clearRateLimit"
            >
              <template v-if="isUpdating">
                <span class="spinner-border spinner-border-sm me-2"></span>
                Clearing...
              </template>
              <template v-else>
                <i class="bi bi-trash me-2"></i>
                Clear Rate Limit
              </template>
            </button>
          </footer>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Card Container */
.rate-limit-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
  overflow: hidden;
  transition: box-shadow 0.2s ease;
}

.rate-limit-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

/* Header */
.card-header {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content {
  flex: 1;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #212529;
  margin: 0 0 0.25rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.title-icon {
  color: #fd7e14;
  font-size: 1.1rem;
}

.card-subtitle {
  color: #6c757d;
  font-size: 0.875rem;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-refresh {
  background: white;
  border: 1px solid #ced4da;
  border-radius: 8px;
  padding: 0.5rem;
  color: #6c757d;
  transition: all 0.2s ease;
  cursor: pointer;
}

.btn-refresh:hover:not(:disabled) {
  background: #fd7e14;
  border-color: #fd7e14;
  color: white;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Content */
.card-content {
  padding: 2rem;
}

/* Content States */
.content-state {
  text-align: center;
  padding: 2rem;
}

.state-content {
  max-width: 400px;
  margin: 0 auto;
}

.state-title {
  color: #495057;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.state-subtitle {
  color: #6c757d;
  margin: 0;
  line-height: 1.5;
}

/* Loading State */
.loading-state .state-title {
  margin-bottom: 0.5rem;
}

/* Error State */
.error-state {
  padding: 2rem;
}

.error-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.error-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.error-text {
  text-align: center;
}

.error-title {
  color: #495057;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.error-message {
  color: #6c757d;
  margin: 0;
  line-height: 1.5;
}

.error-actions {
  text-align: center;
}

/* Empty State */
.empty-state .empty-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  display: block;
}

/* Rate Limit Content */
.rate-limit-content {
  padding: 0;
}

/* No Limit Section */
.no-limit-section {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
}

.no-limit-content {
  margin-bottom: 2rem;
}

.no-limit-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  display: block;
}

.no-limit-title {
  color: #495057;
  margin-bottom: 1rem;
  font-weight: 600;
}

.no-limit-description {
  color: #6c757d;
  line-height: 1.6;
  margin: 0;
}

.btn-set-limit {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
}

/* Rate Limit Info */
.rate-limit-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.rate-limit-status {
  flex: 1;
}

.status-indicator {
  margin-bottom: 1rem;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.active {
  background: #d1e7dd;
  color: #0f5132;
}

.rate-limit-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #212529;
  margin-bottom: 0.5rem;
  line-height: 1.2;
}

.rate-limit-interval {
  color: #6c757d;
  font-weight: 500;
}

.rate-limit-description {
  color: #6c757d;
  font-size: 0.9rem;
  margin: 0;
}

.rate-limit-actions {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
}

.btn-edit,
.btn-clear {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  white-space: nowrap;
}

/* Rate Limit Form */
.rate-limit-form {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 2rem;
}

.form-header {
  margin-bottom: 2rem;
  text-align: center;
}

.form-title {
  color: #212529;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.form-subtitle {
  color: #6c757d;
  font-size: 0.9rem;
  margin: 0;
}

.form-body {
  margin-bottom: 2rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-weight: 600;
  color: #495057;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  font-size: 0.9rem;
}

.form-control,
.form-select {
  border: 1px solid #ced4da;
  border-radius: 6px;
  padding: 0.75rem;
  font-size: 0.9rem;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.form-control:focus,
.form-select:focus {
  border-color: #fd7e14;
  box-shadow: 0 0 0 3px rgba(253, 126, 20, 0.1);
  outline: none;
}

.input-group {
  display: flex;
  gap: 0;
}

.input-group .form-control {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right: none;
}

.input-group .form-select {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  min-width: 120px;
}

.field-error {
  color: #dc3545;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.field-help {
  color: #6c757d;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

/* Rate Limit Preview */
.rate-limit-preview {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1rem;
}

.preview-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.preview-icon {
  color: #0d6efd;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.preview-text {
  color: #495057;
  font-size: 0.9rem;
  line-height: 1.5;
}

/* Form Footer */
.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.btn-cancel,
.btn-save {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 1rem;
}

.modal-dialog {
  max-width: 500px;
  width: 100%;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.modal-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #212529;
  margin: 0;
  display: flex;
  align-items: center;
}

.btn-close {
  background: none;
  border: none;
  padding: 0.5rem;
  color: #6c757d;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.btn-close:hover {
  background: #f8f9fa;
  color: #495057;
}

.modal-body {
  padding: 2rem;
}

.modal-message {
  color: #495057;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.queue-identifier {
  color: #0d6efd;
  font-family: 'Courier New', monospace;
}

.modal-warning {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  color: #856404;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  margin: 0;
}

.modal-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .card-header {
    padding: 1rem 1.5rem;
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .card-content {
    padding: 1.5rem;
  }

  .rate-limit-info {
    flex-direction: column;
    align-items: stretch;
    gap: 1.5rem;
  }

  .rate-limit-actions {
    justify-content: stretch;
  }

  .btn-edit,
  .btn-clear {
    flex: 1;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .form-footer {
    flex-direction: column;
    gap: 0.75rem;
  }

  .btn-cancel,
  .btn-save {
    width: 100%;
  }

  .modal-dialog {
    margin: 1rem;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1rem 1.5rem;
  }
}

@media (max-width: 480px) {
  .card-header {
    padding: 1rem;
  }

  .card-content {
    padding: 1rem;
  }

  .no-limit-section,
  .rate-limit-form {
    padding: 1.5rem;
  }

  .rate-limit-info {
    padding: 1rem;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1rem;
  }
}

/* Focus states for accessibility */
.btn-refresh:focus,
.btn-set-limit:focus,
.btn-edit:focus,
.btn-clear:focus,
.btn-cancel:focus,
.btn-save:focus,
.btn-close:focus {
  outline: 2px solid #fd7e14;
  outline-offset: 2px;
}

.form-control:focus,
.form-select:focus {
  outline: none;
}
</style>
