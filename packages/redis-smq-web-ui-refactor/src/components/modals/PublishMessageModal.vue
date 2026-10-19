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
import { usePublishMessage } from '@/composables/usePublishMessage';
import { useTypedRouter } from '@/router/typed';
import { EExchangeType, ExchangeTypeLabel } from '@/types/exchanges';
import type {
  IExchangeParams,
  IQueueParams,
  PublishMessageBody,
} from '@/api/model';

type Mode = 'queue' | 'exchange';

const props = defineProps<{
  isVisible: boolean;
  queue?: IQueueParams | null;
  exchange?: { name: string; ns: string; type: EExchangeType } | null;
}>();

const emit = defineEmits<{ close: []; published: [] }>();

const router = useTypedRouter();
const publisher = usePublishMessage();

// --- Destination ---
const mode = ref<Mode>('queue');
const queueNs = ref('');
const queueName = ref('');
const exchangeNs = ref('');
const exchangeName = ref('');
const exchangeType = ref<EExchangeType>(EExchangeType.FANOUT);
const routingKey = ref('');

// --- Body ---
const bodyText = ref('');
const bodyFormat = ref<'json' | 'text'>('json');
const bodyError = ref('');

// --- Message options ---
const priority = ref<number | null>(null);
const ttl = ref<number | null>(null);
const consumeTimeout = ref<number | null>(null);
const retryThreshold = ref<number | null>(null);
const retryDelay = ref<number | null>(null);

// --- Scheduling ---
const scheduledDelay = ref<number | null>(null);
const scheduledCron = ref('');
const scheduledRepeat = ref<number | null>(null);
const scheduledRepeatPeriod = ref<number | null>(null);

// --- message.queue override ---
const useMessageQueue = ref(false);
const messageQueueNs = ref('');
const messageQueueName = ref('');

// --- Result ---
const submitError = ref<string | null>(null);
const publishedIds = ref<string[] | null>(null);

const isQueueLocked = computed(() => !!props.queue);
const isExchangeLocked = computed(() => !!props.exchange);
const isPending = computed(() => publisher.isPending.value);

watch(
  () => props.isVisible,
  (v) => {
    if (!v) return;

    publisher.reset();
    submitError.value = null;
    publishedIds.value = null;
    bodyError.value = '';
    bodyText.value = '';
    bodyFormat.value = 'json';

    priority.value = null;
    ttl.value = null;
    consumeTimeout.value = null;
    retryThreshold.value = null;
    retryDelay.value = null;

    scheduledDelay.value = null;
    scheduledCron.value = '';
    scheduledRepeat.value = null;
    scheduledRepeatPeriod.value = null;

    useMessageQueue.value = false;
    messageQueueNs.value = '';
    messageQueueName.value = '';

    routingKey.value = '';

    if (props.queue) {
      mode.value = 'queue';
      queueNs.value = props.queue.ns;
      queueName.value = props.queue.name;
    } else if (props.exchange) {
      mode.value = 'exchange';
      exchangeNs.value = props.exchange.ns;
      exchangeName.value = props.exchange.name;
      exchangeType.value = props.exchange.type;
    } else {
      mode.value = 'queue';
      queueNs.value = 'default';
      queueName.value = '';
    }
  },
  { immediate: true },
);

function buildBody():
  { ok: true; value: unknown } | { ok: false; error: string } {
  if (bodyFormat.value === 'text') return { ok: true, value: bodyText.value };
  try {
    return { ok: true, value: JSON.parse(bodyText.value) };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

const needsRoutingKey = computed(
  () =>
    mode.value === 'exchange' &&
    (exchangeType.value === EExchangeType.DIRECT ||
      exchangeType.value === EExchangeType.TOPIC),
);

// Cron and delay are mutually exclusive on the server. Surface that
// before the request so the user doesn't eat a server error.
const schedulingConflict = computed(
  () => scheduledCron.value.trim() !== '' && scheduledDelay.value !== null,
);

const canSubmit = computed(() => {
  if (isPending.value) return false;
  if (!bodyText.value.trim()) return false;
  if (schedulingConflict.value) return false;

  if (mode.value === 'queue') {
    return !!queueNs.value.trim() && !!queueName.value.trim();
  }
  if (!exchangeNs.value.trim() || !exchangeName.value.trim()) return false;
  if (needsRoutingKey.value && !routingKey.value.trim()) return false;
  if (useMessageQueue.value) {
    if (!messageQueueNs.value.trim() || !messageQueueName.value.trim()) {
      return false;
    }
  }
  return true;
});

async function onSubmit() {
  submitError.value = null;
  bodyError.value = '';
  publishedIds.value = null;

  const body = buildBody();
  if (!body.ok) {
    bodyError.value = body.error;
    return;
  }

  // Build the exchange per the schema:
  //   { queue }                             — direct to queue
  //   { fanOut: IExchangeParams | string }  — fanout, no routing key
  //   { direct: IExchangeParams | string, routingKey: string }
  //   { topic:  IExchangeParams | string, routingKey: string }
  let exchange: PublishMessageBody['exchange'];
  if (mode.value === 'queue') {
    exchange = {
      queue: { name: queueName.value.trim(), ns: queueNs.value.trim() },
    };
  } else {
    const params: IExchangeParams = {
      name: exchangeName.value.trim(),
      ns: exchangeNs.value.trim(),
    };
    if (exchangeType.value === EExchangeType.FANOUT) {
      exchange = { fanOut: params };
    } else if (exchangeType.value === EExchangeType.TOPIC) {
      exchange = { topic: params, routingKey: routingKey.value.trim() };
    } else {
      exchange = { direct: params, routingKey: routingKey.value.trim() };
    }
  }

  const message: PublishMessageBody['message'] = { body: body.value };

  if (priority.value !== null) message.priority = priority.value;
  if (ttl.value !== null) message.ttl = ttl.value;
  if (consumeTimeout.value !== null)
    message.consumeTimeout = consumeTimeout.value;
  if (retryThreshold.value !== null)
    message.retryThreshold = retryThreshold.value;
  if (retryDelay.value !== null) message.retryDelay = retryDelay.value;

  if (scheduledDelay.value !== null) {
    message.scheduledDelay = scheduledDelay.value;
  }
  if (scheduledCron.value.trim()) {
    message.scheduledCron = scheduledCron.value.trim();
  }
  if (scheduledRepeat.value !== null) {
    message.scheduledRepeat = scheduledRepeat.value;
  }
  if (scheduledRepeatPeriod.value !== null) {
    message.scheduledRepeatPeriod = scheduledRepeatPeriod.value;
  }

  if (useMessageQueue.value) {
    message.queue = {
      name: messageQueueName.value.trim(),
      ns: messageQueueNs.value.trim(),
    };
  }

  try {
    const ids = await publisher.publish({ exchange, message });
    publishedIds.value = ids;
    emit('published');
  } catch {
    submitError.value = publisher.error.value ?? 'Failed to publish message';
  }
}

function goToQueue() {
  if (mode.value !== 'queue') return;
  const ns = queueNs.value.trim();
  const name = queueName.value.trim();
  emit('close');
  router.go('queue', { ns, queue: name });
}

function dismiss() {
  emit('close');
}
</script>

<template>
  <BaseModal
    :is-visible="isVisible"
    title="Publish message"
    icon="bi-send"
    size="lg"
    @close="dismiss"
  >
    <template #body>
      <!-- Success state -->
      <div v-if="publishedIds && publishedIds.length > 0" class="success-state">
        <i class="bi bi-check-circle-fill success-icon" aria-hidden="true" />
        <h3 class="success-title">Published successfully</h3>
        <p class="success-subtitle">
          Message ID{{ publishedIds.length > 1 ? 's' : '' }}:
        </p>
        <ul class="success-ids">
          <li v-for="id in publishedIds" :key="id" class="font-mono">
            {{ id }}
          </li>
        </ul>
      </div>

      <!-- Form -->
      <form v-else @submit.prevent="onSubmit">
        <!-- Destination -->
        <section class="section">
          <h3 class="section-title">Destination</h3>

          <div v-if="!isQueueLocked && !isExchangeLocked" class="mode-toggle">
            <label>
              <input v-model="mode" type="radio" value="queue" />
              Direct to queue
            </label>
            <label>
              <input v-model="mode" type="radio" value="exchange" />
              Through exchange
            </label>
          </div>

          <template v-if="mode === 'queue'">
            <div class="grid-2">
              <div class="field">
                <label class="form-label">Namespace</label>
                <input
                  v-model="queueNs"
                  type="text"
                  class="form-control"
                  :disabled="isQueueLocked || isPending"
                />
              </div>
              <div class="field">
                <label class="form-label">Queue name</label>
                <input
                  v-model="queueName"
                  type="text"
                  class="form-control"
                  :disabled="isQueueLocked || isPending"
                />
              </div>
            </div>
          </template>

          <template v-else>
            <div class="grid-2">
              <div class="field">
                <label class="form-label">Namespace</label>
                <input
                  v-model="exchangeNs"
                  type="text"
                  class="form-control"
                  :disabled="isExchangeLocked || isPending"
                />
              </div>
              <div class="field">
                <label class="form-label">Exchange name</label>
                <input
                  v-model="exchangeName"
                  type="text"
                  class="form-control"
                  :disabled="isExchangeLocked || isPending"
                />
              </div>
            </div>

            <div v-if="!isExchangeLocked" class="field">
              <label class="form-label">Exchange type</label>
              <select
                v-model.number="exchangeType"
                class="form-select"
                :disabled="isPending"
              >
                <option :value="EExchangeType.FANOUT">
                  {{ ExchangeTypeLabel[EExchangeType.FANOUT] }}
                </option>
                <option :value="EExchangeType.TOPIC">
                  {{ ExchangeTypeLabel[EExchangeType.TOPIC] }}
                </option>
                <option :value="EExchangeType.DIRECT">
                  {{ ExchangeTypeLabel[EExchangeType.DIRECT] }}
                </option>
              </select>
            </div>

            <div v-if="needsRoutingKey" class="field">
              <label class="form-label">Routing key</label>
              <input
                v-model="routingKey"
                type="text"
                class="form-control font-mono"
                placeholder="e.g. user.created"
                :disabled="isPending"
              />
              <p class="hint">
                Required for
                {{ exchangeType === EExchangeType.DIRECT ? 'direct' : 'topic' }}
                exchanges.
                <template v-if="exchangeType === EExchangeType.TOPIC">
                  Use <code>*</code> to match one word, <code>#</code> for zero
                  or more.
                </template>
              </p>
            </div>

            <p v-if="exchangeType === EExchangeType.FANOUT" class="hint">
              Fanout broadcasts to every bound queue — no routing key needed.
            </p>
          </template>
        </section>

        <!-- Message body -->
        <section class="section">
          <div class="section-head">
            <h3 class="section-title">Message body</h3>
            <div class="format-toggle" role="group" aria-label="Body format">
              <button
                type="button"
                :class="{ active: bodyFormat === 'json' }"
                @click="bodyFormat = 'json'"
              >
                JSON
              </button>
              <button
                type="button"
                :class="{ active: bodyFormat === 'text' }"
                @click="bodyFormat = 'text'"
              >
                Text
              </button>
            </div>
          </div>
          <textarea
            v-model="bodyText"
            class="form-control body-textarea"
            rows="8"
            spellcheck="false"
            :placeholder="
              bodyFormat === 'json'
                ? '{ &quot;hello&quot;: &quot;world&quot; }'
                : 'plain text message'
            "
            :disabled="isPending"
          />
          <div v-if="bodyError" class="field-error" role="alert">
            Invalid JSON: {{ bodyError }}
          </div>
        </section>

        <!-- Message options -->
        <section class="section">
          <h3 class="section-title">Message options</h3>
          <div class="options-grid">
            <div class="field">
              <label class="form-label">Priority (0–7)</label>
              <input
                v-model.number="priority"
                type="number"
                min="0"
                max="7"
                class="form-control"
                placeholder="Normal"
                :disabled="isPending"
              />
              <p class="hint">Ignored by non-priority queues.</p>
            </div>
            <div class="field">
              <label class="form-label">TTL (ms)</label>
              <input
                v-model.number="ttl"
                type="number"
                min="1"
                class="form-control"
                placeholder="No TTL"
                :disabled="isPending"
              />
            </div>
            <div class="field">
              <label class="form-label">Consume timeout (ms)</label>
              <input
                v-model.number="consumeTimeout"
                type="number"
                min="1"
                class="form-control"
                placeholder="Server default"
                :disabled="isPending"
              />
            </div>
            <div class="field">
              <label class="form-label">Retry threshold</label>
              <input
                v-model.number="retryThreshold"
                type="number"
                min="0"
                class="form-control"
                placeholder="Server default"
                :disabled="isPending"
              />
            </div>
            <div class="field">
              <label class="form-label">Retry delay (ms)</label>
              <input
                v-model.number="retryDelay"
                type="number"
                min="0"
                class="form-control"
                placeholder="Server default"
                :disabled="isPending"
              />
            </div>
          </div>
        </section>

        <!-- Scheduling -->
        <section class="section">
          <h3 class="section-title">Scheduling</h3>
          <p class="section-hint">
            Use either a delay <em>or</em> a cron pattern — they're mutually
            exclusive. Repeat fields apply when the message is scheduled.
          </p>
          <div class="options-grid">
            <div class="field">
              <label class="form-label">Delay (ms)</label>
              <input
                v-model.number="scheduledDelay"
                type="number"
                min="1"
                class="form-control"
                placeholder="Immediate"
                :disabled="isPending || scheduledCron.trim() !== ''"
              />
            </div>
            <div class="field">
              <label class="form-label">Cron pattern</label>
              <input
                v-model="scheduledCron"
                type="text"
                class="form-control font-mono"
                placeholder="e.g. */5 * * * *"
                :disabled="isPending || scheduledDelay !== null"
              />
            </div>
            <div class="field">
              <label class="form-label">Repeat count</label>
              <input
                v-model.number="scheduledRepeat"
                type="number"
                min="0"
                class="form-control"
                placeholder="Once"
                :disabled="isPending"
              />
            </div>
            <div class="field">
              <label class="form-label">Repeat period (ms)</label>
              <input
                v-model.number="scheduledRepeatPeriod"
                type="number"
                min="1"
                class="form-control"
                placeholder="Same as delay"
                :disabled="isPending"
              />
            </div>
          </div>
          <div v-if="schedulingConflict" class="field-error" role="alert">
            Set either a delay or a cron pattern — not both.
          </div>
        </section>

        <!-- message.queue override -->
        <section class="section">
          <div class="form-check form-switch">
            <input
              id="pm-use-message-queue"
              v-model="useMessageQueue"
              class="form-check-input"
              type="checkbox"
              role="switch"
              :disabled="isPending"
            />
            <label
              for="pm-use-message-queue"
              class="form-check-label fw-medium"
            >
              Set <code>message.queue</code> explicitly
            </label>
          </div>
          <p class="hint">
            Advanced: overrides the routing target stored on the message. Rarely
            needed — leave off unless the exchange-routed message must record a
            specific queue as its destination.
          </p>
          <div v-if="useMessageQueue" class="grid-2 mt-3">
            <div class="field">
              <label class="form-label">Message queue namespace</label>
              <input
                v-model="messageQueueNs"
                type="text"
                class="form-control"
                placeholder="default"
                :disabled="isPending"
              />
            </div>
            <div class="field">
              <label class="form-label">Message queue name</label>
              <input
                v-model="messageQueueName"
                type="text"
                class="form-control"
                :disabled="isPending"
              />
            </div>
          </div>
        </section>

        <div v-if="submitError" class="alert alert-danger mb-0" role="alert">
          {{ submitError }}
        </div>
      </form>
    </template>

    <template #footer>
      <template v-if="publishedIds && publishedIds.length > 0">
        <button type="button" class="btn btn-secondary" @click="dismiss">
          Close
        </button>
        <button
          v-if="mode === 'queue'"
          type="button"
          class="btn btn-primary"
          @click="goToQueue"
        >
          Go to queue
        </button>
      </template>
      <template v-else>
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="isPending"
          @click="dismiss"
        >
          Cancel
        </button>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="!canSubmit"
          @click="onSubmit"
        >
          <span
            v-if="isPending"
            class="spinner-border spinner-border-sm me-1"
            aria-hidden="true"
          />
          {{ isPending ? 'Publishing…' : 'Publish' }}
        </button>
      </template>
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
.section-title {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0 0 var(--rsmq-space-3);
  color: var(--rsmq-color-text);
}
.section-hint {
  margin: calc(-1 * var(--rsmq-space-2)) 0 var(--rsmq-space-3);
  font-size: 0.8rem;
  color: var(--rsmq-color-text-muted);
  line-height: 1.4;
}
.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--rsmq-space-3);
}
.section-head .section-title {
  margin-bottom: 0;
}

.mode-toggle {
  display: flex;
  gap: var(--rsmq-space-4);
  margin-bottom: var(--rsmq-space-3);
  font-size: 0.9rem;
}
.mode-toggle label {
  display: inline-flex;
  align-items: center;
  gap: var(--rsmq-space-2);
  cursor: pointer;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--rsmq-space-3);
}
.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--rsmq-space-3);
}

.field {
  margin-bottom: 0;
}
.hint {
  margin: var(--rsmq-space-1) 0 0;
  font-size: 0.75rem;
  color: var(--rsmq-color-text-muted);
}
.hint code,
.section-hint code {
  background: var(--rsmq-color-bg);
  padding: 0 4px;
  border-radius: 3px;
  font-family: var(--rsmq-font-mono);
}

.field-error {
  margin-top: var(--rsmq-space-2);
  font-size: 0.75rem;
  color: var(--rsmq-color-danger);
  font-weight: 500;
}

.body-textarea {
  font-family: var(--rsmq-font-mono);
  font-size: 0.85rem;
  line-height: 1.5;
}

.format-toggle {
  display: inline-flex;
  border: 1px solid var(--rsmq-color-border);
  border-radius: var(--rsmq-radius-sm);
  overflow: hidden;
}
.format-toggle button {
  padding: 4px 12px;
  background: var(--rsmq-color-surface);
  color: var(--rsmq-color-text-muted);
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
}
.format-toggle button.active {
  background: var(--rsmq-color-primary);
  color: white;
}

.success-state {
  text-align: center;
  padding: var(--rsmq-space-4) 0;
}
.success-icon {
  font-size: 2.5rem;
  color: var(--rsmq-color-success);
  display: block;
  margin: 0 auto var(--rsmq-space-3);
}
.success-title {
  margin: 0 0 var(--rsmq-space-2);
  font-size: 1.1rem;
  font-weight: 700;
}
.success-subtitle {
  margin: 0 0 var(--rsmq-space-2);
  color: var(--rsmq-color-text-muted);
  font-size: 0.9rem;
}
.success-ids {
  list-style: none;
  padding: var(--rsmq-space-3);
  margin: 0 auto;
  max-width: 500px;
  background: var(--rsmq-color-bg);
  border-radius: var(--rsmq-radius-sm);
  text-align: left;
  font-size: 0.8rem;
}
.success-ids li {
  overflow-wrap: anywhere;
  margin-bottom: 4px;
}
.success-ids li:last-child {
  margin-bottom: 0;
}

@media (max-width: 576px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
  .mode-toggle {
    flex-direction: column;
    gap: var(--rsmq-space-2);
  }
}
</style>
