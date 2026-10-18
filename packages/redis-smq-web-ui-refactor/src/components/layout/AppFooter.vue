<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<template>
  <footer class="app-footer">
    <div class="rsmq-container app-footer__inner">
      <span>RedisSMQ Web UI</span>
      <span aria-hidden="true">·</span>
      <span>MIT License</span>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  border-top: 1px solid var(--rsmq-color-border);
  background: var(--rsmq-color-surface);
  padding-block: var(--rsmq-space-4);
  font-size: 0.8rem;
  color: var(--rsmq-color-text-muted);
}
.app-footer__inner {
  display: flex;
  gap: var(--rsmq-space-2);
  justify-content: center;
}
</style>
