<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<template>
  <div class="not-found">
    <h1 class="not-found__code">404</h1>
    <p class="not-found__message">Page not found</p>
    <button class="btn btn-primary" @click="router.push({ name: 'home' })">
      Go home
    </button>
  </div>
</template>

<style scoped>
.not-found {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--rsmq-space-4);
  padding: var(--rsmq-space-6);
  text-align: center;
}
.not-found__code {
  font-size: 6rem;
  font-weight: 800;
  color: var(--rsmq-color-primary);
  margin: 0;
  line-height: 1;
}
.not-found__message {
  font-size: 1.25rem;
  color: var(--rsmq-color-text-muted);
  margin: 0;
}
</style>
