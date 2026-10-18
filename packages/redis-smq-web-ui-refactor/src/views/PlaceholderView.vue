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
  <PageShell
    title="Coming soon"
    subtitle="This view is ported in phase 2"
    icon="bi-hourglass-split"
  >
    <Card title="Not implemented yet" icon="bi-hammer">
      <p>The placeholder route exists so the navigation is functional.</p>
    </Card>
  </PageShell>
</template>
