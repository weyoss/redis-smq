/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { routes } from '@/router/routes.ts';
import { usePageContentStore } from '@/stores/pageContent.ts';
import NotFoundViewView from '@/views/NotFoundView.vue';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...routes,
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: NotFoundViewView,
    },
  ],
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
