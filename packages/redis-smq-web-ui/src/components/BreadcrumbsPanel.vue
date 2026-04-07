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
import { getBreadcrumbTrail } from '@/router/getBreadcrumbTrail.ts';
import type { AppRouteRecord } from '@/router/routes.ts';
import { useTypedRouter } from '@/router/useTypeRouter.ts';

interface BreadcrumbItem {
  title: string;
  path: string;
  active: boolean;
}

const route = useRoute();
const router = useTypedRouter();

const breadcrumbs = computed((): BreadcrumbItem[] => {
  try {
    const params = route.params as Record<string, string>;
    const matchedRoute = route.matched[route.matched.length - 1] as unknown as
      | AppRouteRecord
      | undefined;

    if (!matchedRoute) {
      return [];
    }

    const trail = getBreadcrumbTrail(matchedRoute, params);

    return trail.map((item, index) => ({
      title: item.label,
      path: item.path,
      active: index === trail.length - 1,
    }));
  } catch (error) {
    console.warn('Error building breadcrumbs:', error);
    return [];
  }
});

function navigateTo(path: string): void {
  if (!path || path === '') {
    console.warn('Invalid breadcrumb path');
    return;
  }

  try {
    // If it's the current path, reload the page to refresh data
    if (path === route.path) {
      router.go(0);
    } else {
      router.navigateTo(path);
    }
  } catch (error) {
    console.error('Navigation error:', error);
  }
}

// Debug: Log breadcrumbs to see what paths are being generated
const debugBreadcrumbs = computed(() => {
  if (import.meta.env.DEV) {
    console.log('Breadcrumbs:', breadcrumbs.value);
  }
  return breadcrumbs.value;
});
</script>

<template>
  <nav
    v-if="breadcrumbs.length > 0"
    aria-label="breadcrumb"
    class="breadcrumb-navigation"
  >
    <div class="breadcrumb-container">
      <div class="breadcrumb-content">
        <!-- Home Icon (decorative) -->
        <div class="breadcrumb-home" aria-hidden="true">
          <i class="bi bi-house-fill"></i>
          <span class="sr-only">Home</span>
        </div>

        <!-- Breadcrumb Items -->
        <ol class="breadcrumb-list">
          <li
            v-for="(item, index) in debugBreadcrumbs"
            :key="`${item.title}-${index}`"
            class="breadcrumb-item"
            :class="{
              'breadcrumb-item-active': item.active,
            }"
            :aria-current="item.active ? 'page' : undefined"
          >
            <!-- Separator -->
            <div v-if="index > 0" class="breadcrumb-separator">
              <i class="bi bi-chevron-right"></i>
            </div>

            <!-- Breadcrumb Link (all items are clickable) -->
            <button
              type="button"
              class="breadcrumb-link"
              :class="{ 'breadcrumb-link-active': item.active }"
              :title="
                item.active
                  ? 'Refresh current page'
                  : `Navigate to ${item.title}`
              "
              @click="navigateTo(item.path)"
            >
              <span class="breadcrumb-text">{{ item.title }}</span>
            </button>
          </li>
        </ol>
      </div>
    </div>
  </nav>
</template>

<style scoped>
/* Accessibility helper */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  border: 0;
}

/* Breadcrumb Navigation */
.breadcrumb-navigation {
  background: white;
  border-bottom: 1px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  position: sticky;
  top: 0;
  z-index: 1020;
  margin-bottom: 0;
  overflow-x: hidden;
  will-change: transform;
}

.breadcrumb-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

.breadcrumb-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
  min-height: 60px;
  min-width: 0;
}

/* Home Icon */
.breadcrumb-home {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.9rem;
  flex-shrink: 0;
}

/* Breadcrumb List */
.breadcrumb-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
  flex: 1;
  min-width: 0;
}

/* Breadcrumb Items */
.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

/* Separator */
.breadcrumb-separator {
  color: #6c757d;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

/* Breadcrumb Links - Base style */
.breadcrumb-link {
  background: none;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: flex;
  align-items: center;
  min-width: 0;
  color: #6c757d;
}

/* Non-active breadcrumb links */
.breadcrumb-link:not(.breadcrumb-link-active) {
  color: #6c757d;
}

.breadcrumb-link:not(.breadcrumb-link-active):hover {
  background: #f8f9fa;
  color: #0d6efd;
  transform: translateY(-1px);
}

.breadcrumb-link:not(.breadcrumb-link-active):focus {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
  background: #f8f9fa;
  color: #0d6efd;
}

.breadcrumb-link:not(.breadcrumb-link-active):active {
  transform: translateY(0);
}

/* Active breadcrumb link (current page) */
.breadcrumb-link-active {
  background: linear-gradient(135deg, #e7f3ff 0%, #cce7ff 100%);
  border: 1px solid #b3d9ff;
  color: #0d6efd;
  font-weight: 600;
}

.breadcrumb-link-active:hover {
  background: linear-gradient(135deg, #d4e8ff 0%, #b8d9ff 100%);
  transform: translateY(-1px);
}

.breadcrumb-link-active:active {
  transform: translateY(0);
}

/* Breadcrumb Text */
.breadcrumb-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: clamp(120px, 28vw, 220px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .breadcrumb-navigation {
    position: static;
    top: auto;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  }

  .breadcrumb-container {
    padding: 0 1rem;
  }

  .breadcrumb-content {
    padding: 0.75rem 0;
    min-height: 50px;
    gap: 0.75rem;
  }

  .breadcrumb-home {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }

  .breadcrumb-list {
    gap: 0.25rem;
  }

  .breadcrumb-link {
    padding: 0.375rem 0.5rem;
    font-size: 0.85rem;
  }

  .breadcrumb-text {
    max-width: clamp(90px, 35vw, 150px);
  }

  .breadcrumb-separator {
    font-size: 0.7rem;
  }
}

@media (max-width: 576px) {
  .breadcrumb-container {
    padding: 0 0.75rem;
  }

  .breadcrumb-content {
    padding: 0.5rem 0;
    min-height: 45px;
    gap: 0.5rem;
  }

  .breadcrumb-home {
    width: 24px;
    height: 24px;
    font-size: 0.75rem;
  }

  .breadcrumb-link {
    padding: 0.25rem 0.375rem;
    font-size: 0.8rem;
  }

  .breadcrumb-text {
    max-width: clamp(70px, 40vw, 120px);
  }

  /* Hide middle breadcrumbs on very small screens if there are many */
  .breadcrumb-list:has(.breadcrumb-item:nth-child(n + 4))
    .breadcrumb-item:not(:first-child):not(:last-child):not(
      :nth-last-child(2)
    ) {
    display: none;
  }

  /* Insert an ellipsis between first and last visible items when items are hidden */
  .breadcrumb-list:has(.breadcrumb-item:nth-child(n + 4))
    .breadcrumb-item:first-child::after {
    content: '…';
    color: #6c757d;
    padding: 0 0.25rem;
    margin-left: 0.125rem;
    font-weight: 600;
  }
}

/* High contrast mode support */
@media (prefers-contrast: more) {
  .breadcrumb-navigation {
    border-bottom-color: #000;
  }

  .breadcrumb-link:not(.breadcrumb-link-active) {
    border: 1px solid transparent;
  }

  .breadcrumb-link:not(.breadcrumb-link-active):hover,
  .breadcrumb-link:not(.breadcrumb-link-active):focus {
    border-color: #000;
    background: #f0f0f0;
  }

  .breadcrumb-link-active {
    border-color: #000;
    background: #e0e0e0;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .breadcrumb-link {
    transition: none;
  }

  .breadcrumb-link:hover {
    transform: none;
  }
}

/* Print styles */
@media print {
  .breadcrumb-navigation {
    box-shadow: none;
    border-bottom: 1px solid #000;
    position: static;
  }

  .breadcrumb-home {
    background: #000 !important;
  }

  .breadcrumb-link-active {
    background: #f0f0f0 !important;
    border-color: #000 !important;
  }
}
</style>
