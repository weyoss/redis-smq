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
      <div class="app-footer__left">
        <span>RedisSMQ Web UI</span>
        <span aria-hidden="true">·</span>
        <span>MIT License</span>
      </div>
      <div class="app-footer__right">
        <a
          href="https://github.com/weyoss/redis-smq"
          target="_blank"
          rel="noopener noreferrer"
          class="app-footer__link"
        >
          <i class="bi bi-github me-1" aria-hidden="true" />
          GitHub
        </a>
        <a
          href="https://github.com/weyoss/redis-smq/tree/master/packages/redis-smq/docs"
          target="_blank"
          rel="noopener noreferrer"
          class="app-footer__link"
        >
          <i class="bi bi-book me-1" aria-hidden="true" />
          Docs
        </a>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  border-top: 1px solid var(--rsmq-color-border);
  background: var(--rsmq-color-surface);
  padding-block: var(--rsmq-space-5);
  padding-bottom: calc(var(--rsmq-space-5) + env(safe-area-inset-bottom));
  font-size: 0.8rem;
  color: var(--rsmq-color-text-muted);
}
.app-footer__inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--rsmq-space-3);
  flex-wrap: wrap;
}
.app-footer__left {
  display: flex;
  gap: var(--rsmq-space-2);
  flex-wrap: wrap;
}
.app-footer__right {
  display: flex;
  gap: var(--rsmq-space-4);
  flex-wrap: wrap;
}
.app-footer__link {
  color: var(--rsmq-color-text-muted);
  text-decoration: none;
  transition: color var(--rsmq-transition);
}
.app-footer__link:hover {
  color: var(--rsmq-color-primary);
}
@media (max-width: 576px) {
  .app-footer {
    padding-block: var(--rsmq-space-4);
    padding-bottom: calc(var(--rsmq-space-4) + env(safe-area-inset-bottom));
  }
  .app-footer__inner {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
