/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { createRouter, createWebHistory } from 'vue-router';
import { routes } from '@/router/routes.ts';
import { usePageContentStore } from '@/stores/pageContent.ts';
import { getConfig } from '@/config';

const router = createRouter({
  history: createWebHistory(getConfig('BASE_PATH')),
  routes: [...routes],
});

// Auto-reset page content on route changes
router.beforeEach((to, from, next) => {
  // Only reset if actually changing routes (not just query params)
  if (to.path !== from.path) {
    const pageContentStore = usePageContentStore();
    pageContentStore.resetPageContent();
  }
  next();
});

export default router;
