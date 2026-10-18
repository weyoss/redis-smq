<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';
import { lockScroll, modalStack, unlockScroll } from './modal-stack';

const props = withDefaults(
  defineProps<{
    isVisible: boolean;
    title: string;
    subtitle?: string;
    icon?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    zIndex?: number;
  }>(),
  { size: 'md', zIndex: 1050 },
);

const emit = defineEmits<{ close: [] }>();

const myId = Symbol('modal');
const containerRef = ref<HTMLElement | null>(null);
let previouslyFocused: HTMLElement | null = null;

const titleId = computed(
  () => `rsmq-modal-title-${Math.random().toString(36).slice(2, 10)}`,
);
const sizeClass = computed(() => `rsmq-modal--${props.size}`);

function focusables(): HTMLElement[] {
  const root = containerRef.value;
  if (!root) return [];
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => el.getAttribute('aria-hidden') !== 'true');
}

function trapFocus(e: KeyboardEvent): void {
  const els = focusables();
  const root = containerRef.value;
  if (!root) return;
  if (els.length === 0) {
    e.preventDefault();
    root.focus();
    return;
  }
  const first = els[0];
  const last = els[els.length - 1];
  const active = document.activeElement as HTMLElement | null;
  if (e.shiftKey && (active === first || active === root)) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  }
}

function onKeydown(e: KeyboardEvent): void {
  if (modalStack[modalStack.length - 1] !== myId) return;
  if (e.key === 'Escape') {
    e.stopPropagation();
    emit('close');
    return;
  }
  if (e.key === 'Tab') trapFocus(e);
}

function onScrimClick(e: MouseEvent): void {
  if (e.target === e.currentTarget) emit('close');
}

async function open(): Promise<void> {
  modalStack.push(myId);
  previouslyFocused = document.activeElement as HTMLElement | null;
  lockScroll();
  document.addEventListener('keydown', onKeydown, true);
  await nextTick();
  (focusables()[0] ?? containerRef.value)?.focus();
}

function close(): void {
  const idx = modalStack.indexOf(myId);
  if (idx >= 0) modalStack.splice(idx, 1);
  document.removeEventListener('keydown', onKeydown, true);
  unlockScroll();
  previouslyFocused?.focus?.();
  previouslyFocused = null;
}

watch(
  () => props.isVisible,
  async (visible, wasVisible) => {
    if (visible && wasVisible === false) await open();
    else if (!visible && wasVisible === true) close();
  },
);

onMounted(() => {
  if (props.isVisible) void open();
});

onBeforeUnmount(() => {
  if (props.isVisible) close();
});
</script>

<template>
  <Teleport v-if="isVisible" to="body">
    <div class="rsmq-modal-scrim" :style="{ zIndex }" @click="onScrimClick">
      <div
        ref="containerRef"
        class="rsmq-modal"
        :class="sizeClass"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
        @click.stop
      >
        <header class="rsmq-modal__header">
          <div class="rsmq-modal__title-group">
            <i
              v-if="icon"
              :class="icon"
              class="rsmq-modal__icon"
              aria-hidden="true"
            />
            <div class="rsmq-modal__title-block">
              <h2 :id="titleId" class="rsmq-modal__title">{{ title }}</h2>
              <p v-if="subtitle" class="rsmq-modal__subtitle">{{ subtitle }}</p>
            </div>
          </div>
          <button
            type="button"
            class="btn btn-icon btn-outline-secondary rsmq-modal__close"
            aria-label="Close"
            @click="emit('close')"
          >
            <i class="bi bi-x-lg" aria-hidden="true" />
          </button>
        </header>

        <div class="rsmq-modal__body">
          <slot name="body" />
        </div>

        <footer v-if="$slots.footer" class="rsmq-modal__footer">
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.rsmq-modal-scrim {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 60%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--rsmq-space-5);
  padding-top: calc(var(--rsmq-space-5) + env(safe-area-inset-top));
  padding-bottom: calc(var(--rsmq-space-5) + env(safe-area-inset-bottom));
  animation: rsmq-fade-in var(--rsmq-transition);
}

.rsmq-modal {
  width: 100%;
  max-width: 550px;
  max-height: min(90dvh, calc(100dvh - 2 * var(--rsmq-space-5)));
  display: flex;
  flex-direction: column;
  background: var(--rsmq-color-surface);
  border-radius: var(--rsmq-radius-lg);
  box-shadow: var(--rsmq-shadow-lg);
  overflow: hidden;
  outline: none;
  animation: rsmq-slide-up var(--rsmq-transition);
}

.rsmq-modal--sm {
  max-width: 400px;
}
.rsmq-modal--lg {
  max-width: 700px;
}
.rsmq-modal--xl {
  max-width: 900px;
}

.rsmq-modal__header {
  display: flex;
  align-items: flex-start;
  gap: var(--rsmq-space-4);
  padding: var(--rsmq-space-4) var(--rsmq-space-5);
  border-bottom: 1px solid var(--rsmq-color-border);
  background: linear-gradient(
    135deg,
    var(--rsmq-color-bg),
    var(--rsmq-color-surface)
  );
  flex-shrink: 0;
}

.rsmq-modal__title-group {
  flex: 1;
  display: flex;
  align-items: flex-start;
  gap: var(--rsmq-space-3);
  min-width: 0;
}

.rsmq-modal__icon {
  font-size: 1.25rem;
  color: var(--rsmq-color-primary);
  flex-shrink: 0;
  margin-top: 2px;
}

.rsmq-modal__title-block {
  min-width: 0;
}

.rsmq-modal__title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--rsmq-color-text);
  overflow-wrap: anywhere;
}

.rsmq-modal__subtitle {
  margin: var(--rsmq-space-1) 0 0;
  font-size: 0.875rem;
  color: var(--rsmq-color-text-muted);
  overflow-wrap: anywhere;
}

.rsmq-modal__close {
  flex-shrink: 0;
  min-width: 2rem;
  min-height: 2rem;
}

.rsmq-modal__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--rsmq-space-5);
  overscroll-behavior: contain;
}

.rsmq-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--rsmq-space-2);
  padding: var(--rsmq-space-4) var(--rsmq-space-5);
  border-top: 1px solid var(--rsmq-color-border);
  background: var(--rsmq-color-bg);
  flex-shrink: 0;
  flex-wrap: wrap;
}

@keyframes rsmq-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes rsmq-slide-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 576px) {
  .rsmq-modal-scrim {
    padding: var(--rsmq-space-2);
  }
  .rsmq-modal {
    max-width: 100%;
    max-height: calc(100dvh - 2 * var(--rsmq-space-2));
  }
  .rsmq-modal__header,
  .rsmq-modal__body,
  .rsmq-modal__footer {
    padding-inline: var(--rsmq-space-4);
  }
  .rsmq-modal__footer {
    flex-direction: column-reverse;
    align-items: stretch;
  }
  .rsmq-modal__footer .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>