<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
defineProps<{
  kind: 'loading' | 'error' | 'empty';
  icon?: string;
  title?: string;
  message?: string;
}>();
</script>

<template>
  <div class="state-block" :class="`state-block--${kind}`">
    <div
      v-if="kind === 'loading'"
      class="spinner-border text-primary"
      role="status"
      aria-label="Loading"
    />
    <i
      v-else-if="icon"
      :class="[icon, 'state-block__icon']"
      aria-hidden="true"
    />
    <h4 v-if="title" class="state-block__title">{{ title }}</h4>
    <p v-if="message" class="state-block__message">{{ message }}</p>
    <slot />
  </div>
</template>

<style scoped>
.state-block {
  padding: var(--rsmq-space-7) var(--rsmq-space-5);
  text-align: center;
  max-width: 520px;
  margin-inline: auto;
}

.state-block__icon {
  display: block;
  font-size: 2.5rem;
  color: var(--rsmq-color-text-muted);
  margin: 0 auto var(--rsmq-space-3);
}

.state-block--error .state-block__icon {
  color: var(--rsmq-color-danger);
}

.state-block__title {
  margin: 0 0 var(--rsmq-space-2);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--rsmq-color-text);
}

.state-block__message {
  margin: 0 0 var(--rsmq-space-4);
  color: var(--rsmq-color-text-muted);
  line-height: 1.5;
  overflow-wrap: anywhere;
}
</style>