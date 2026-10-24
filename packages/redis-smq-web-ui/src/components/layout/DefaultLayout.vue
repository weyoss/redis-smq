<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import AppHeader from './AppHeader.vue';
import AppFooter from './AppFooter.vue';
</script>

<template>
  <!--
    Skip link must be the first focusable element in the DOM. Screen-reader
    and keyboard users land on it before any header nav, letting them jump
    straight to <main>. The `#main-content` fragment moves focus to <main>
    because it has tabindex="-1" (fragments alone don't reliably move focus
    cross-browser).
  -->
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <div class="app">
    <AppHeader />
    <main id="main-content" tabindex="-1" class="app__main">
      <RouterView />
    </main>
    <AppFooter />
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--rsmq-color-bg);
}

.app__main {
  flex: 1;
}

/* Skip target: focusable programmatically but not via Tab. Outline is
   suppressed because the user never tab-focuses it deliberately. */
.app__main:focus {
  outline: none;
}

/* Hidden by default; appears at the top-left of the viewport when focused
   or focused-visible. Positioned absolutely against the initial containing
   block (no positioned ancestor), so `left: 0` reliably lands at viewport
   top-left. */
.skip-link {
  position: absolute;
  top: 0;
  left: -9999px;
  z-index: 9999;
  padding: var(--rsmq-space-2) var(--rsmq-space-4);
  background: var(--rsmq-color-primary);
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  text-decoration: none;
  border-radius: 0 0 var(--rsmq-radius-sm) 0;
  box-shadow: var(--rsmq-shadow-md);
  transition: none;
}

.skip-link:focus,
.skip-link:focus-visible {
  left: 0;
  outline: 2px solid white;
  outline-offset: -3px;
}

/* Respect reduced-motion: no transition to remove, but this documents the
   intent — the link should appear instantly on focus. */
@media (prefers-reduced-motion: reduce) {
  .skip-link {
    transition: none;
  }
}
</style>
