<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { useRoute } from 'vue-router';

const navItems = [
  { name: 'home', label: 'Home', icon: 'bi-house-door' },
  { name: 'namespaces', label: 'Namespaces', icon: 'bi-folder' },
  { name: 'queues', label: 'Queues', icon: 'bi-list-ul' },
  { name: 'exchanges', label: 'Exchanges', icon: 'bi-diagram-3' },
] as const;

const route = useRoute();
</script>

<template>
  <header class="app-header">
    <div class="rsmq-container app-header__inner">
      <RouterLink :to="{ name: 'home' }" class="app-header__brand">
        <span class="app-header__logo" aria-hidden="true">◆</span>
        <span>RedisSMQ</span>
      </RouterLink>
      <nav class="app-header__nav" aria-label="Main navigation">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="{ name: item.name }"
          class="app-header__link"
          :class="{ 'app-header__link--active': route.name === item.name }"
        >
          <i :class="item.icon" aria-hidden="true" />
          {{ item.label }}
        </RouterLink>
        <RouterLink
          :to="{ name: 'configuration' }"
          class="app-header__link app-header__link--settings"
          :class="{
            'app-header__link--active': route.name === 'configuration',
          }"
          title="Configuration"
        >
          <i class="bi bi-gear" aria-hidden="true" />
          <span class="d-none d-md-inline">Configuration</span>
        </RouterLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  background: linear-gradient(
    135deg,
    var(--rsmq-color-primary),
    var(--rsmq-color-primary-hover)
  );
  color: white;
}
.app-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--rsmq-space-5);
  padding-block: var(--rsmq-space-3);
  flex-wrap: wrap;
}
.app-header__brand {
  display: flex;
  align-items: center;
  gap: var(--rsmq-space-2);
  color: white;
  font-weight: 700;
  font-size: 1.125rem;
  text-decoration: none;
}
.app-header__logo {
  font-size: 1.5rem;
  line-height: 1;
}
.app-header__nav {
  display: flex;
  gap: var(--rsmq-space-1);
  flex-wrap: wrap;
}
.app-header__link {
  display: inline-flex;
  align-items: center;
  gap: var(--rsmq-space-2);
  padding: var(--rsmq-space-2) var(--rsmq-space-3);
  border-radius: var(--rsmq-radius-md);
  color: rgb(255 255 255 / 85%);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all var(--rsmq-transition);
}
.app-header__link:hover {
  background: rgb(255 255 255 / 12%);
  color: white;
}
.app-header__link--active {
  background: rgb(255 255 255 / 20%);
  color: white;
}
@media (max-width: 576px) {
  .app-header__inner {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
