<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import PageShell from '@/components/ui/PageShell.vue';
import Card from '@/components/ui/Card.vue';
</script>

<template>
  <PageShell title="Home" subtitle="RedisSMQ dashboard" icon="bi-house-door">
    <Card
      title="Refactor in progress"
      subtitle="Phase 1.2 — shell + data layer"
      icon="bi-tools"
    >
      <p>
        The shell is working. Views will be ported in phase 2, cards in phase 3.
        This page is a placeholder that proves
        <code>PageShell</code> + <code>Card</code> compose correctly.
      </p>
    </Card>
  </PageShell>
</template>
