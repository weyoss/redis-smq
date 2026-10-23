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
import { useRoute } from 'vue-router';
import redisSMQLogo from '@/assets/images/redis-smq-logo.png';
import type { RouteName } from '@/router/types';

const navItems = [
  { name: 'home', label: 'Home', icon: 'bi-house-door' },
  { name: 'namespaces', label: 'Namespaces', icon: 'bi-folder' },
  { name: 'queues', label: 'Queues', icon: 'bi-list-ul' },
  { name: 'exchanges', label: 'Exchanges', icon: 'bi-diagram-3' },
] as const satisfies ReadonlyArray<{
  name: RouteName;
  label: string;
  icon: string;
}>;

type NavSection = (typeof navItems)[number]['name'];

// Which route names highlight each nav item. Detail routes and
// namespace-scoped lists belong to the section the user navigated
// *through* — /ns/:ns/queues/:q/messages highlights Queues even
// though the URL is longer than the Queues link itself.
const SECTION_ROUTES: Record<NavSection, readonly RouteName[]> = {
  home: ['home'],
  namespaces: ['namespaces'],
  queues: ['queues', 'queue', 'messages', 'namespaceQueues'],
  exchanges: ['exchanges', 'exchangeDetails', 'namespaceExchanges'],
};

const route = useRoute();

const activeSection = computed<NavSection | null>(() => {
  const name = route.name as RouteName | undefined;
  if (!name) return null;
  for (const item of navItems) {
    if (SECTION_ROUTES[item.name].includes(name)) return item.name;
  }
  return null;
});

const isConfiguration = computed(() => route.name === 'configuration');
</script>

<template>
  <header class="app-header">
    <div class="rsmq-container app-header__inner">
      <RouterLink
        :to="{ name: 'home' }"
        class="app-header__brand"
        aria-label="RedisSMQ home"
      >
        <img :src="redisSMQLogo" alt="RedisSMQ" class="app-header__logo" />
      </RouterLink>
      <nav class="app-header__nav" aria-label="Main navigation">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="{ name: item.name }"
          class="app-header__link"
          :class="{ 'app-header__link--active': activeSection === item.name }"
          :aria-current="activeSection === item.name ? 'page' : undefined"
        >
          <i :class="item.icon" aria-hidden="true" />
          {{ item.label }}
        </RouterLink>
        <RouterLink
          :to="{ name: 'configuration' }"
          class="app-header__link app-header__link--settings"
          :class="{ 'app-header__link--active': isConfiguration }"
          :aria-current="isConfiguration ? 'page' : undefined"
          title="Configuration"
          aria-label="Configuration"
        >
          <i class="bi bi-gear" aria-hidden="true" />
          <span>Configuration</span>
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
  padding-block: var(--rsmq-space-5);
  flex-wrap: wrap;
}
.app-header__brand {
  display: flex;
  align-items: center;
  text-decoration: none;
  flex-shrink: 0;
}
.app-header__logo {
  width: 160px;
  height: auto;
  display: block;
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
.app-header__link--settings {
  margin-left: auto;
}
@media (max-width: 576px) {
  .app-header__inner {
    flex-direction: column;
    align-items: flex-start;
  }
  .app-header__link--settings {
    margin-left: 0;
  }
  .app-header__logo {
    width: 120px;
  }
}
</style>
