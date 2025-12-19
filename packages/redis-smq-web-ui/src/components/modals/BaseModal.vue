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

const props = defineProps<{
  isVisible: boolean;
  title: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const modalContainer = ref<HTMLElement | null>(null);
const previouslyFocused = ref<HTMLElement | null>(null);

const modalSizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'modal-sm';
    case 'lg':
      return 'modal-lg';
    case 'xl':
      return 'modal-xl';
    default:
      return '';
  }
});

const modalTitleId = computed(
  () => `modal-title-${props.title.replace(/\s+/g, '-').toLowerCase()}`,
);
const modalDescId = computed(() =>
  props.subtitle
    ? `modal-desc-${props.title.replace(/\s+/g, '-').toLowerCase()}`
    : undefined,
);

function handleClose() {
  emit('close');
}

function handleOverlayClick() {
  emit('close');
}

// Background scroll lock (simple and reliable across devices)
function lockBodyScroll() {
  document.body.style.overflow = 'hidden';
}

function unlockBodyScroll() {
  document.body.style.overflow = '';
}

// Focus management: focus modal on open and restore focus on close
async function focusModal() {
  await nextTick();
  previouslyFocused.value = (document.activeElement as HTMLElement) || null;

  const container = modalContainer.value;
  if (!container) return;

  // Try focusing the first focusable element; fallback to container
  const focusable = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  );
  (focusable[0] || container).focus();
}

function restoreFocus() {
  previouslyFocused.value?.focus?.();
}

// Simple focus trap inside modal
function trapFocus(e: KeyboardEvent) {
  if (e.key !== 'Tab') return;
  const container = modalContainer.value;
  if (!container) return;

  const focusable = Array.from(
    container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter(
    (el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'),
  );

  if (focusable.length === 0) {
    e.preventDefault();
    container.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement as HTMLElement | null;

  if (e.shiftKey) {
    if (active === first || active === container) {
      e.preventDefault();
      last.focus();
    }
  } else {
    if (active === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.stopPropagation();
    handleClose();
    return;
  }
  trapFocus(e);
}

// Watch visibility to manage side effects when Teleport mounts/unmounts
watch(
  () => props.isVisible,
  async (visible) => {
    if (visible) {
      lockBodyScroll();
      await focusModal();
      document.addEventListener('keydown', onKeydown, true);
    } else {
      document.removeEventListener('keydown', onKeydown, true);
      unlockBodyScroll();
      restoreFocus();
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (props.isVisible) {
    lockBodyScroll();
    focusModal();
    document.addEventListener('keydown', onKeydown, true);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown, true);
  unlockBodyScroll();
});
</script>

<template>
  <Teleport v-if="isVisible" to="body">
    <div
      class="modal-overlay"
      role="dialog"
      :aria-labelledby="modalTitleId"
      :aria-describedby="modalDescId"
      aria-modal="true"
      @click="handleOverlayClick"
    >
      <div
        ref="modalContainer"
        class="modal-container"
        :class="modalSizeClass"
        tabindex="-1"
        @click.stop
      >
        <div class="modal-content">
          <!-- Header -->
          <header class="modal-header">
            <div v-if="icon" class="header-icon">
              <i :class="icon"></i>
            </div>
            <div class="header-content">
              <h2 :id="modalTitleId" class="modal-title">
                {{ title }}
              </h2>
              <p v-if="subtitle" :id="modalDescId" class="modal-subtitle">
                {{ subtitle }}
              </p>
            </div>
            <button
              type="button"
              class="btn-close"
              aria-label="Close modal"
              @click="handleClose"
            >
              <i class="bi bi-x"></i>
            </button>
          </header>

          <!-- Body -->
          <main class="modal-body">
            <div class="modal-body-inner">
              <slot name="body"></slot>
            </div>
          </main>

          <!-- Footer -->
          <footer v-if="$slots.footer" class="modal-footer">
            <slot name="footer"></slot>
          </footer>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Ensure predictable sizing */
:host,
*,
*::before,
*::after {
  box-sizing: border-box;
}

/* Overlay with safe-area and responsive gutters */
.modal-overlay {
  position: fixed;
  inset: 0;
  --modal-gutter: clamp(8px, 3vw, 24px);
  padding-inline: var(--modal-gutter);
  padding-block: var(--modal-gutter);
  padding-top: calc(var(--modal-gutter) + env(safe-area-inset-top));
  padding-bottom: calc(var(--modal-gutter) + env(safe-area-inset-bottom));
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  animation: fadeIn 0.2s ease-out;
  overflow: hidden; /* never allow horizontal bleed */
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Container: responsive max-height using dvh and safe areas */
.modal-container {
  width: 100%;
  max-width: 550px;
  max-height: min(
    98vh,
    calc(
      100dvh - (var(--modal-gutter) * 2) - env(safe-area-inset-top) -
        env(safe-area-inset-bottom)
    )
  );
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
  overflow: hidden; /* contain children */
  outline: none;
}

.modal-container.modal-sm {
  max-width: 400px;
}
.modal-container.modal-lg {
  max-width: 700px;
}
.modal-container.modal-xl {
  max-width: 900px;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Content */
.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  border: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  max-height: 100%;
  height: 100%;
}

/* Header: centered icon + content, with reserved space for close button */
.modal-header {
  /* Responsive spacing tokens */
  --header-inline: clamp(16px, 3.2vw, 28px);
  --header-block: clamp(12px, 2.2vw, 20px);
  --header-gap: clamp(6px, 1.2vw, 12px);
  --close-size: 34px; /* matches .btn-close width/height */
  --close-gap: 10px; /* space between centered content and the close button */

  background: linear-gradient(135deg, #e7f3ff 0%, #cce7ff 100%);
  /* Reserve room on the right so centered content isn't overlapped by the close button */
  padding: var(--header-block)
    calc(var(--header-inline) + var(--close-size) + var(--close-gap))
    var(--header-block) var(--header-inline);

  display: flex;
  flex-direction: column; /* icon above title/subtitle */
  align-items: center; /* center horizontally */
  justify-content: center;
  text-align: center;
  gap: var(--header-gap);
  border-bottom: 1px solid #cce7ff;
  position: relative; /* anchor for absolute close button */
  flex-shrink: 0;
}

.header-icon {
  width: clamp(36px, 5vw, 44px);
  height: clamp(36px, 5vw, 44px);
  background: #0d6efd;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: clamp(1.1rem, 1.8vw, 1.3rem);
  flex-shrink: 0;
}

.header-content {
  flex: 0 0 auto;
  min-width: 0;
  text-align: center;
  display: grid; /* consistent vertical rhythm */
  row-gap: clamp(4px, 0.9vw, 8px);
}

.modal-title {
  margin: 0; /* reset defaults */
  margin-bottom: clamp(2px, 0.5vw, 6px);
  font-size: clamp(1.125rem, 1.8vw, 1.375rem);
  font-weight: 700;
  color: #1f2937;
  line-height: 1.2;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.modal-subtitle {
  margin: 0; /* reset defaults */
  color: #6b7280;
  font-size: clamp(0.9rem, 1.5vw, 0.95rem);
  font-weight: 500;
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* Close button pinned to the top-right, aligned with header paddings */
.btn-close {
  position: absolute;
  top: var(--header-block);
  right: var(--header-inline);
  width: var(--close-size);
  height: var(--close-size);
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1.1rem;
  -webkit-tap-highlight-color: transparent;
}

.btn-close:hover {
  background: white;
  color: #374151;
  border-color: #d1d5db;
  transform: scale(1.05);
}

/* Body */
.modal-body {
  padding: 0;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.modal-body-inner {
  padding: 1rem 1.25rem;
}

.modal-body-inner > :last-child {
  margin-bottom: 0;
}

.modal-body-inner,
.modal-body-inner * {
  max-width: 100%;
}

.modal-body-inner img,
.modal-body-inner video,
.modal-body-inner canvas,
.modal-body-inner svg {
  height: auto;
  display: block;
}

.modal-body-inner pre,
.modal-body-inner code {
  white-space: pre-wrap;
  word-break: break-word;
}

/* Footer */
.modal-footer {
  background: #f9fafb;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-shrink: 0;
}

/* Focus styles */
.btn-close:focus,
.modal-container:focus {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
}

/* Responsive */
@media (max-width: 768px) {
  .modal-header {
    /* Slightly tighter spacing for smaller screens */
    --header-inline: clamp(12px, 4vw, 20px);
    --header-block: clamp(10px, 3vw, 16px);
    --header-gap: clamp(6px, 1.8vw, 10px);
  }

  .modal-body-inner {
    padding: 0.875rem 1rem;
  }

  .modal-footer {
    padding: 0.75rem 1rem;
    flex-direction: column;
    gap: 0.5rem;
  }
}

@media (max-width: 576px) {
  .modal-body-inner {
    padding: 0.75rem 0.875rem;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .modal-overlay,
  .modal-container,
  .btn-close {
    animation: none;
    transition: none;
  }
  .btn-close:hover {
    transform: none;
  }
}
</style>
