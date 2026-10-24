<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    icon?: string;
    headingLevel?: 2 | 3 | 4;
    variant?: 'default' | 'danger' | 'warning' | 'success';
  }>(),
  { headingLevel: 2, variant: 'default' },
);

const headingTag = computed(() => `h${props.headingLevel}`);
</script>

<template>
  <section class="ui-card" :class="`ui-card--${variant}`">
    <header v-if="title || $slots.actions" class="ui-card__header">
      <div class="ui-card__title-group">
        <i v-if="icon" :class="icon" class="ui-card__icon" aria-hidden="true" />
        <div class="ui-card__title-block">
          <component :is="headingTag" v-if="title" class="ui-card__title">
            {{ title }}
          </component>
          <p v-if="subtitle" class="ui-card__subtitle">{{ subtitle }}</p>
        </div>
      </div>
      <div v-if="$slots.actions" class="ui-card__actions">
        <slot name="actions" />
      </div>
    </header>
    <div class="ui-card__body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.ui-card {
  background: var(--rsmq-color-surface);
  border: 1px solid var(--rsmq-color-border);
  border-radius: var(--rsmq-radius-lg);
  box-shadow: var(--rsmq-shadow-sm);
  overflow: hidden;
  transition: box-shadow var(--rsmq-transition);
}
.ui-card:hover {
  box-shadow: var(--rsmq-shadow-md);
}

.ui-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--rsmq-space-4);
  padding: var(--rsmq-space-4) var(--rsmq-space-5);
  border-bottom: 1px solid var(--rsmq-color-border);
  background: linear-gradient(
    135deg,
    var(--rsmq-color-bg),
    var(--rsmq-color-surface)
  );
}
.ui-card__title-group {
  display: flex;
  align-items: center;
  gap: var(--rsmq-space-3);
  min-width: 0;
}
.ui-card__icon {
  font-size: 1.1rem;
  color: var(--rsmq-color-primary);
  flex-shrink: 0;
}
.ui-card__title-block {
  min-width: 0;
}
.ui-card__title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--rsmq-color-text);
  overflow-wrap: anywhere;
}
.ui-card__subtitle {
  margin: var(--rsmq-space-1) 0 0;
  font-size: 0.875rem;
  color: var(--rsmq-color-text-muted);
  overflow-wrap: anywhere;
}
.ui-card__actions {
  display: flex;
  gap: var(--rsmq-space-2);
  flex-shrink: 0;
}
.ui-card__body {
  padding: var(--rsmq-space-5);
}

.ui-card--danger .ui-card__header {
  border-bottom-color: var(--rsmq-color-danger);
}
.ui-card--warning .ui-card__header {
  border-bottom-color: var(--rsmq-color-warning);
}
.ui-card--success .ui-card__header {
  border-bottom-color: var(--rsmq-color-success);
}

@media (max-width: 576px) {
  .ui-card__header {
    flex-wrap: wrap;
  }
  .ui-card__actions {
    width: 100%;
  }
  .ui-card__body {
    padding: var(--rsmq-space-4);
  }
}
</style>
