<!--
  - Copyright (c)
  - Weyoss <weyoss@protonmail.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { routes } from '@/router/routes.ts';
import { computed } from 'vue';
import { useRoute, useRouter, type RouteRecordRaw } from 'vue-router';

interface BreadcrumbItem {
  title: string;
  to?: string;
  active: boolean;
}

const route = useRoute();
const router = useRouter();

const breadcrumbs = computed(() => {
  try {
    const items: BreadcrumbItem[] = [];
    const currentPath = route.path;
    const params = route.params as Record<string, string>;

    // Build breadcrumb trail by matching path segments
    const pathSegments = buildPathSegments(currentPath, params);

    pathSegments.forEach((segment, index) => {
      const routeConfig = findRouteByPath(segment.pattern);
      if (!routeConfig) return;

      const isLast = index === pathSegments.length - 1;
      const title = resolveTitle(routeConfig);

      if (title) {
        items.push({
          title,
          to: isLast ? undefined : segment.actualPath,
          active: isLast,
        });
      }
    });

    return items;
  } catch (error) {
    console.warn('Error building breadcrumbs:', error);
    return [];
  }
});

function buildPathSegments(
  currentPath: string,
  params: Record<string, string>,
): Array<{ pattern: string; actualPath: string }> {
  const segments: Array<{ pattern: string; actualPath: string }> = [];

  // Parse the current path and build segments progressively
  const pathParts = currentPath.split('/').filter((part) => part);
  let builtPath = '';

  // Add root if we're not already there
  if (currentPath !== '/' && findRouteByPath('/')) {
    segments.push({ pattern: '/', actualPath: '/' });
  }

  for (let i = 0; i < pathParts.length; i++) {
    builtPath += '/' + pathParts[i];

    // Try to find matching pattern for this path segment
    const pattern = findMatchingPattern(builtPath, params);
    if (pattern) {
      segments.push({
        pattern,
        actualPath: builtPath,
      });
    }
  }

  return segments;
}

function findMatchingPattern(
  path: string,
  params: Record<string, string>,
): string | null {
  // Sort routes by specificity (more specific patterns first)
  const sortedRoutes = [...routes].sort((a, b) => {
    const aSpecificity = getPatternSpecificity(a.path);
    const bSpecificity = getPatternSpecificity(b.path);
    return bSpecificity - aSpecificity;
  });

  for (const routeConfig of sortedRoutes) {
    if (matchesPattern(path, routeConfig.path, params)) {
      return routeConfig.path;
    }
  }

  return null;
}

function getPatternSpecificity(pattern: string): number {
  // More specific patterns have fewer parameters and more static segments
  const parts = pattern.split('/').filter((part) => part);
  let specificity = parts.length * 10;

  // Reduce specificity for each parameter
  for (const part of parts) {
    if (part.startsWith(':')) {
      specificity -= 5;
    }
  }

  return specificity;
}

function matchesPattern(
  path: string,
  pattern: string,
  params: Record<string, string>,
): boolean {
  const pathParts = path.split('/').filter((part) => part);
  const patternParts = pattern.split('/').filter((part) => part);

  if (pathParts.length !== patternParts.length) {
    return false;
  }

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    if (patternPart.startsWith(':')) {
      // This is a parameter, check if it matches
      const paramName = patternPart.substring(1);
      if (params[paramName] !== pathPart) {
        return false;
      }
    } else if (patternPart !== pathPart) {
      return false;
    }
  }

  return true;
}

function findRouteByPath(path: string): RouteRecordRaw | undefined {
  return routes.find((routeConfig) => routeConfig.path === path);
}

function resolveTitle(routeConfig: RouteRecordRaw): string {
  // Fallback to route name
  return String(routeConfig.meta?.title || routeConfig.name);
}

function navigateTo(to: string): void {
  try {
    router.push(to);
  } catch (error) {
    console.error('Navigation error:', error);
  }
}
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
            v-for="(item, index) in breadcrumbs"
            :key="`${item.title}-${index}`"
            class="breadcrumb-item"
            :class="{
              'breadcrumb-item-active': item.active,
              'breadcrumb-item-clickable': !item.active && item.to,
            }"
            :aria-current="item.active ? 'page' : undefined"
          >
            <!-- Separator -->
            <div v-if="index > 0" class="breadcrumb-separator">
              <i class="bi bi-chevron-right"></i>
            </div>

            <!-- Non-active breadcrumb items (clickable) -->
            <button
              v-if="!item.active && item.to"
              type="button"
              class="breadcrumb-link"
              :title="`Navigate to ${item.title}`"
              @click="navigateTo(item.to)"
            >
              <span class="breadcrumb-text">{{ item.title }}</span>
            </button>

            <!-- Active breadcrumb item (current page) -->
            <div v-else class="breadcrumb-current" :title="item.title">
              <span class="breadcrumb-text">{{ item.title }}</span>
            </div>
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
  /* Allow host to set an offset to avoid overlapping the sticky header */
  top: 0;
  z-index: 1020;
  margin-bottom: 0;
  /* Prevent horizontal scroll bleeding */
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
  /* Ensure children can shrink without overflow */
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

/* Breadcrumb Links */
.breadcrumb-link {
  background: none;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  color: #6c757d;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: flex;
  align-items: center;
  min-width: 0;
}

.breadcrumb-link:hover {
  background: #f8f9fa;
  color: #0d6efd;
  transform: translateY(-1px);
}

.breadcrumb-link:focus {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
  background: #f8f9fa;
  color: #0d6efd;
}

.breadcrumb-link:active {
  transform: translateY(0);
}

/* Current Page */
.breadcrumb-current {
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  background: linear-gradient(135deg, #e7f3ff 0%, #cce7ff 100%);
  border: 1px solid #b3d9ff;
  color: #0d6efd;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  min-width: 0;
}

/* Breadcrumb Text */
.breadcrumb-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  /* Responsive clamp prevents overflow while keeping reasonable width */
  max-width: clamp(120px, 28vw, 220px);
}

/* Responsive Design */
@media (max-width: 768px) {
  /* Disable sticky on small screens to avoid overlapping sticky header */
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

  .breadcrumb-link,
  .breadcrumb-current {
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

  .breadcrumb-link,
  .breadcrumb-current {
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

  .breadcrumb-link {
    border: 1px solid transparent;
  }

  .breadcrumb-link:hover,
  .breadcrumb-link:focus {
    border-color: #000;
    background: #f0f0f0;
  }

  .breadcrumb-current {
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

  .breadcrumb-current {
    background: #f0f0f0 !important;
    border-color: #000 !important;
  }
}
</style>
