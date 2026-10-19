<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import ApiHealthIndicator from './ApiHealthIndicator.vue';
</script>

<template>
  <footer class="app-footer">
    <div class="rsmq-container app-footer__inner">
      <span>RedisSMQ Web UI</span>
      <span aria-hidden="true">·</span>
      <span>MIT License</span>
      <span aria-hidden="true">·</span>
      <ApiHealthIndicator />
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  border-top: 1px solid var(--rsmq-color-border);
  background: var(--rsmq-color-surface);
  padding-block: var(--rsmq-space-4);
  padding-bottom: calc(var(--rsmq-space-4) + env(safe-area-inset-bottom));
  font-size: 0.8rem;
  color: var(--rsmq-color-text-muted);
}

.app-footer__inner {
  display: flex;
  gap: var(--rsmq-space-2);
  justify-content: center;
  flex-wrap: wrap;
  align-items: center;
}

@media (max-width: 576px) {
  .app-footer__inner {
    gap: var(--rsmq-space-1);
  }
}
</style>
