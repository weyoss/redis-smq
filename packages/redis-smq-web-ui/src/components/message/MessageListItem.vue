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
import type { IMessageTransferable } from '@/api/model';
import { EMessagePropertyStatus } from '@/types/messages.ts';
import { formatDate, formatSince } from '@/lib/format';

const props = defineProps<{
  message: IMessageTransferable;
  selected?: boolean;
}>();

const emit = defineEmits<{
  view: [id: string];
  delete: [id: string];
  requeue: [id: string];
  toggle: [id: string];
}>();

// redis-smq allows requeue from ACKNOWLEDGED or DEAD_LETTERED. Computed
// per-message (not per-tab) so a DEAD_LETTERED message visible on the
// Published tab — which shows every message regardless of state —
// correctly exposes Requeue, and a PENDING message on the same tab
// correctly does not.
const canRequeue = computed(() => {
  const s = props.message.status;
  return (
    s === EMessagePropertyStatus.ACKNOWLEDGED ||
    s === EMessagePropertyStatus.DEAD_LETTERED
  );
});

const STATUS_LABELS: Record<EMessagePropertyStatus, string> = {
  [EMessagePropertyStatus.NEW]: 'New',
  [EMessagePropertyStatus.PENDING]: 'Pending',
  [EMessagePropertyStatus.PROCESSING]: 'Processing',
  [EMessagePropertyStatus.SCHEDULED]: 'Scheduled',
  [EMessagePropertyStatus.ACKNOWLEDGED]: 'Acknowledged',
  [EMessagePropertyStatus.UNACK_REQUEUING]: 'Requeuing',
  [EMessagePropertyStatus.UNACK_DELAYING]: 'Delaying',
  [EMessagePropertyStatus.DEAD_LETTERED]: 'Dead-lettered',
};

const STATUS_TINT: Record<EMessagePropertyStatus, string> = {
  [EMessagePropertyStatus.NEW]: 'secondary',
  [EMessagePropertyStatus.PENDING]: 'warning',
  [EMessagePropertyStatus.PROCESSING]: 'info',
  [EMessagePropertyStatus.SCHEDULED]: 'secondary',
  [EMessagePropertyStatus.ACKNOWLEDGED]: 'success',
  [EMessagePropertyStatus.UNACK_REQUEUING]: 'warning',
  [EMessagePropertyStatus.UNACK_DELAYING]: 'warning',
  [EMessagePropertyStatus.DEAD_LETTERED]: 'danger',
};

function preview(body: unknown): string {
  if (body == null) return '(empty)';
  const s = typeof body === 'string' ? body : JSON.stringify(body);
  return s.length > 200 ? `${s.slice(0, 200)}…` : s;
}

function open() {
  emit('view', props.message.id);
}
</script>

<template>
  <div class="msg-row-wrap" :class="{ 'msg-row-wrap--selected': selected }">
    <label class="msg-row__check" @click.stop>
      <input
        type="checkbox"
        :checked="selected"
        :aria-label="`Select message ${message.id}`"
        @change="emit('toggle', message.id)"
      />
    </label>

    <article
      class="msg-row"
      role="button"
      tabindex="0"
      :aria-label="`View message ${message.id}`"
      @click="open"
      @keydown.enter="open"
      @keydown.space.prevent="open"
    >
      <header class="msg-row__head">
        <span class="msg-row__id font-mono" :title="message.id">
          {{ message.id }}
        </span>
        <span
          v-if="message.priority !== null"
          class="msg-row__priority"
          :title="`Priority ${message.priority}`"
        >
          P{{ message.priority }}
        </span>
        <span
          class="msg-row__status"
          :class="`msg-row__status--${STATUS_TINT[message.status] ?? 'secondary'}`"
        >
          {{ STATUS_LABELS[message.status] ?? `Unknown (${message.status})` }}
        </span>
        <div class="msg-row__actions">
          <button
            v-if="canRequeue"
            type="button"
            class="btn btn-icon btn-outline-secondary"
            title="Requeue message"
            aria-label="Requeue message"
            @click.stop="emit('requeue', message.id)"
          >
            <i class="bi bi-arrow-clockwise" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="btn btn-icon btn-outline-danger"
            title="Delete message"
            aria-label="Delete message"
            @click.stop="emit('delete', message.id)"
          >
            <i class="bi bi-trash" aria-hidden="true" />
          </button>
        </div>
      </header>
      <div class="msg-row__meta">
        <span :title="formatDate(message.createdAt)">
          {{ formatSince(message.createdAt) }}
        </span>
      </div>
      <pre class="msg-row__body">{{ preview(message.body) }}</pre>
    </article>
  </div>
</template>

<style scoped>
.msg-row-wrap {
  display: flex;
  align-items: flex-start;
  gap: var(--rsmq-space-2);
  padding: var(--rsmq-space-3) var(--rsmq-space-2);
  border-bottom: 1px solid var(--rsmq-color-border);
  border-radius: var(--rsmq-radius-sm);
  transition: background var(--rsmq-transition);
}
.msg-row-wrap:last-child {
  border-bottom: none;
}
.msg-row-wrap:hover {
  background: var(--rsmq-color-bg);
}
.msg-row-wrap--selected {
  background: var(--rsmq-color-primary-tint);
}
.msg-row-wrap--selected:hover {
  background: var(--rsmq-color-primary-tint);
}

.msg-row__check {
  display: inline-flex;
  align-items: center;
  padding: 4px 6px;
  cursor: pointer;
  flex-shrink: 0;
  margin-top: 2px;
}
.msg-row__check input {
  accent-color: var(--rsmq-color-primary);
  width: 1rem;
  height: 1rem;
  cursor: pointer;
  margin: 0;
}

.msg-row {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--rsmq-space-2);
  cursor: pointer;
  outline: none;
}
.msg-row:focus-visible {
  outline: 2px solid var(--rsmq-color-primary);
  outline-offset: -2px;
  border-radius: var(--rsmq-radius-sm);
}

.msg-row__head {
  display: flex;
  align-items: center;
  gap: var(--rsmq-space-2);
  flex-wrap: wrap;
}
.msg-row__id {
  font-size: 0.8rem;
  color: var(--rsmq-color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  flex: 1;
  min-width: 0;
}
.msg-row__priority,
.msg-row__status {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  padding: 0.15rem 0.5rem;
  border-radius: var(--rsmq-radius-sm);
  flex-shrink: 0;
}
.msg-row__priority {
  background: var(--rsmq-color-primary-tint);
  color: var(--rsmq-color-primary);
}
.msg-row__status--warning {
  background: #fff3cd;
  color: #856404;
}
.msg-row__status--info {
  background: #cff4fc;
  color: #055160;
}
.msg-row__status--success {
  background: #d4edda;
  color: #155724;
}
.msg-row__status--danger {
  background: #f8d7da;
  color: #721c24;
}
.msg-row__status--secondary {
  background: var(--rsmq-color-bg);
  color: var(--rsmq-color-text-muted);
}

.msg-row__actions {
  display: flex;
  gap: var(--rsmq-space-1);
  margin-left: auto;
}
.msg-row__actions .btn {
  min-width: 2rem;
  min-height: 2rem;
  padding: var(--rsmq-space-1);
}

.msg-row__meta {
  font-size: 0.75rem;
  color: var(--rsmq-color-text-muted);
}

.msg-row__body {
  margin: 0;
  padding: var(--rsmq-space-3);
  background: var(--rsmq-color-bg);
  border-radius: var(--rsmq-radius-sm);
  font-size: 0.8rem;
  color: var(--rsmq-color-text-muted);
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 8rem;
  overflow-y: auto;
  font-family: var(--rsmq-font-mono);
}
.msg-row-wrap:hover .msg-row__body {
  background: var(--rsmq-color-surface);
}

@media (max-width: 576px) {
  .msg-row__actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
