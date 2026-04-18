<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import BreadcrumbsBar from '@/components/BreadcrumbsPanel.vue';
import { computed, onMounted, ref, onBeforeUnmount, watch } from 'vue';
import packageJson from '../package.json';
import redisSMQLogo from '@/assets/images/redis-smq-logo.png';
import { getMainNavRoutes } from '@/router/getMainNavRoutes.ts';
import { useTypedRouter } from '@/router/useTypeRouter.ts';
import type { RouteName } from '@/router/types.ts';

// App state
const isLoading = ref(true);
const appError = ref<string | null>(null);

// Router for navigation state
const router = useTypedRouter();

// App version from package.json
const appVersion = computed(() => packageJson.version || '0.0.0');

// Get main navigation routes from routes config
const mainNavRoutes = computed(() => getMainNavRoutes());

// User menu state
const isUserMenuOpen = ref(false);
const userMenuRef = ref<HTMLElement | null>(null);

// App initialization function
const initializeApp = async () => {
  try {
    isLoading.value = true;
    appError.value = null;
    // Simulate app initialization
    await new Promise((resolve) => setTimeout(resolve, 1500));
  } catch (error) {
    console.error('App initialization failed:', error);
    appError.value = 'Failed to initialize application';
  } finally {
    isLoading.value = false;
  }
};

// Initialize app on mount
onMounted(() => {
  initializeApp();
});

// Check if route is active
const isActiveRoute = (routeName: RouteName) => {
  return router.isActiveRoute(routeName);
};

// Retry app initialization
const retryInitialization = () => {
  initializeApp();
};

// Mobile navigation state
const isMobileNavOpen = ref(false);
const mobileNavDropdown = ref<HTMLElement | null>(null);

// Get current page name for mobile nav
const currentPageName = computed(() => {
  const currentRoute = mainNavRoutes.value.find((route) =>
    isActiveRoute(route.name),
  );
  return currentRoute?.name || 'Navigation';
});

// Close mobile nav on route change
watch(
  () => router.currentRoute.value.fullPath,
  () => {
    isMobileNavOpen.value = false;
    isUserMenuOpen.value = false;
  },
);

// Close on outside click
function handleDocumentClick(e: MouseEvent) {
  const target = e.target as Node;

  // Handle mobile nav close
  if (isMobileNavOpen.value) {
    const container = mobileNavDropdown.value;
    if (container && !container.contains(target)) {
      isMobileNavOpen.value = false;
    }
  }

  // Handle user menu close
  if (isUserMenuOpen.value) {
    const menu = userMenuRef.value;
    if (menu && !menu.contains(target)) {
      isUserMenuOpen.value = false;
    }
  }
}

// Close on Escape key
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    isMobileNavOpen.value = false;
    isUserMenuOpen.value = false;
  }
}

// Navigate to configuration page
const navigateToConfiguration = () => {
  isUserMenuOpen.value = false;
  router.push('configuration');
};

// Toggle user menu
const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value;
};

onMounted(() => {
  document.addEventListener('click', handleDocumentClick, true);
  document.addEventListener('keydown', handleKeydown, true);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick, true);
  document.removeEventListener('keydown', handleKeydown, true);
});
</script>

<template>
  <div class="app">
    <!-- Loading Screen -->
    <div v-if="isLoading" class="loading-screen">
      <div class="loading-container">
        <div class="loading-content">
          <div class="brand-section">
            <div class="brand-logo loading-logo">
              <img :src="redisSMQLogo" alt="RedisSMQ Logo" class="logo-image" />
            </div>
          </div>
          <div class="loading-animation">
            <div class="spinner"></div>
            <p class="loading-text">Initializing application...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Screen -->
    <div v-else-if="appError" class="error-screen">
      <div class="error-container">
        <div class="error-content">
          <div class="error-icon">⚠️</div>
          <h2 class="error-title">Application Error</h2>
          <p class="error-message">{{ appError }}</p>
          <button
            class="btn btn-primary btn-retry"
            @click="retryInitialization"
          >
            <i class="bi bi-arrow-clockwise me-2"></i>
            Try Again
          </button>
        </div>
      </div>
    </div>

    <!-- Main Application -->
    <div v-else class="app-layout">
      <!-- Header with Navigation -->
      <header class="app-header">
        <div class="header-container">
          <!-- Top Header Content -->
          <div class="header-content">
            <div class="brand-section">
              <div class="brand-logo">
                <img :src="redisSMQLogo" alt="RedisSMQ" class="logo-image" />
              </div>
            </div>

            <!-- Top Right Menu -->
            <div class="header-actions">
              <div ref="userMenuRef" class="user-menu">
                <button
                  class="user-menu-toggle"
                  type="button"
                  :aria-expanded="isUserMenuOpen"
                  aria-haspopup="true"
                  aria-label="User menu"
                  @click="toggleUserMenu"
                >
                  <i class="bi bi-person-circle"></i>
                  <span class="user-name">Admin</span>
                  <i
                    class="bi bi-chevron-down"
                    :class="{ rotated: isUserMenuOpen }"
                  ></i>
                </button>

                <transition name="menu-fade">
                  <ul
                    v-show="isUserMenuOpen"
                    class="user-menu-dropdown"
                    role="menu"
                  >
                    <li role="none">
                      <button
                        class="dropdown-item"
                        role="menuitem"
                        @click="navigateToConfiguration"
                      >
                        <i class="bi bi-gear-wide-connected me-2"></i>
                        Configuration
                      </button>
                    </li>
                    <li role="none" class="dropdown-divider"></li>
                    <li role="none">
                      <div class="dropdown-item version-item">
                        <i class="bi bi-info-circle me-2"></i>
                        <span>Version {{ appVersion }}</span>
                      </div>
                    </li>
                  </ul>
                </transition>
              </div>
            </div>
          </div>

          <!-- Navigation -->
          <nav
            class="app-navigation"
            role="navigation"
            aria-label="Main navigation"
          >
            <!-- Desktop Navigation -->
            <ul class="nav-list nav-desktop" role="tablist">
              <li
                v-for="route in mainNavRoutes"
                :key="route.name"
                class="nav-item"
                role="presentation"
              >
                <RouterLink
                  :to="{ name: route.name }"
                  class="nav-link"
                  :class="{
                    'nav-link-active': isActiveRoute(route.name),
                  }"
                  :aria-current="isActiveRoute(route.name) ? 'page' : undefined"
                >
                  <i
                    v-if="route.meta?.icon"
                    :class="[route.meta.icon, 'me-2']"
                  ></i>
                  <span class="nav-label">{{
                    route.meta?.title || route.name
                  }}</span>
                  <span
                    v-if="isActiveRoute(route.name)"
                    class="nav-indicator"
                  ></span>
                </RouterLink>
              </li>
            </ul>

            <!-- Mobile Navigation -->
            <div class="nav-mobile">
              <div ref="mobileNavDropdown" class="mobile-nav-dropdown">
                <button
                  class="mobile-nav-toggle"
                  type="button"
                  :aria-expanded="isMobileNavOpen"
                  aria-haspopup="true"
                  aria-controls="mobile-nav-menu"
                  @click="isMobileNavOpen = !isMobileNavOpen"
                >
                  <span class="current-page">{{ currentPageName }}</span>
                  <i class="bi bi-chevron-down toggle-icon"></i>
                </button>
                <ul
                  v-show="isMobileNavOpen"
                  id="mobile-nav-menu"
                  class="mobile-nav-menu"
                  role="menu"
                >
                  <li
                    v-for="route in mainNavRoutes"
                    :key="route.name"
                    role="none"
                  >
                    <RouterLink
                      :to="{ name: route.name }"
                      class="mobile-nav-link"
                      :class="{
                        'mobile-nav-link-active': isActiveRoute(route.name),
                      }"
                      role="menuitem"
                    >
                      <i
                        v-if="route.meta?.icon"
                        :class="[route.meta.icon, 'me-2']"
                      ></i>
                      {{ route.meta?.title || route.name }}
                    </RouterLink>
                  </li>
                </ul>
              </div>
            </div>
          </nav>
        </div>
      </header>

      <!-- Main Content -->
      <main class="app-main" role="main">
        <!-- BreadcrumbsBar -->
        <BreadcrumbsBar />

        <!-- Content Area -->
        <div class="content-wrapper">
          <div class="content-container">
            <Suspense>
              <template #default>
                <RouterView v-slot="{ Component, route }">
                  <component :is="Component" :key="route.path" />
                </RouterView>
              </template>
              <template #fallback>
                <div class="page-loading">
                  <div class="loading-content">
                    <div class="spinner-small"></div>
                    <p class="loading-text">Loading page...</p>
                  </div>
                </div>
              </template>
            </Suspense>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="app-footer" role="contentinfo">
        <div class="footer-container">
          <div class="footer-content">
            <div class="footer-info">
              <div class="version-info">
                <span class="version">RedisSMQ Web UI {{ appVersion }}</span>
                <span class="separator">•</span>
                <span class="license">
                  Licensed under
                  <a
                    href="https://github.com/weyoss/redis-smq/blob/master/LICENSE"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="license-link"
                  >
                    MIT License
                  </a>
                </span>
              </div>
            </div>
            <div class="footer-links">
              <a
                href="https://github.com/weyoss/redis-smq"
                target="_blank"
                rel="noopener noreferrer"
                class="footer-link"
                aria-label="View on GitHub"
              >
                <i class="bi bi-github me-1"></i>
                GitHub
              </a>
              <a
                href="https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/README.md"
                target="_blank"
                rel="noopener noreferrer"
                class="footer-link"
              >
                <i class="bi bi-book me-1"></i>
                Documentation
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
/* Global-ish safety for mobile inside this component's scope */
.app,
.app * {
  box-sizing: border-box;
}

.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  overflow-x: hidden;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
  touch-action: manipulation;
}

/* Common Brand Components */
.brand-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s ease;
}

.brand-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  padding: 0.75rem;
}

.brand-logo:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.logo-image {
  object-fit: contain;
  filter: brightness(1.1) contrast(1.1);
  transition: all 0.3s ease;
  max-width: 100%;
  height: auto;
}

.brand-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.brand-title {
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.brand-subtitle {
  opacity: 0.85;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-weight: 500;
  margin-top: 0.25rem;
}

/* Header Actions - Top Right Menu */
.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-menu {
  position: relative;
}

.user-menu-toggle {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 40px;
  cursor: pointer;
  color: white;
  font-weight: 500;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.user-menu-toggle:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.user-menu-toggle i:first-child {
  font-size: 1.25rem;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 500;
}

.user-menu-toggle .bi-chevron-down {
  font-size: 0.875rem;
  transition: transform 0.2s ease;
}

.user-menu-toggle .bi-chevron-down.rotated {
  transform: rotate(180deg);
}

.user-menu-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  min-width: 220px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border: 1px solid #e9ecef;
  margin: 0;
  padding: 0.5rem 0;
  list-style: none;
  z-index: 1000;
  overflow: hidden;
}

.dropdown-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.75rem 1rem;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  color: #495057;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.dropdown-item i {
  font-size: 1rem;
  color: #6c757d;
}

.dropdown-item:hover {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  color: #0d6efd;
}

.dropdown-item:hover i {
  color: #0d6efd;
}

.dropdown-divider {
  height: 1px;
  background: #e9ecef;
  margin: 0.25rem 0;
}

.version-item {
  cursor: default;
  font-size: 0.75rem;
  color: #6c757d;
}

.version-item:hover {
  background: none;
  color: #6c757d;
}

.version-item:hover i {
  color: #6c757d;
}

/* Menu fade animation */
.menu-fade-enter-active,
.menu-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.menu-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Loading Screen Specific Styles */
.loading-screen {
  --loading-logo-min: 240px;
  --loading-logo-fluid: 40vw;
  --loading-logo-max: 400px;

  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}

.loading-container {
  text-align: center;
  color: white;
  padding: 2rem;
}

.loading-content {
  max-width: 480px;
}

.loading-screen .brand-section {
  margin-bottom: 3rem;
  flex-direction: row;
  justify-content: center;
}

.loading-screen .brand-logo {
  width: clamp(
    var(--loading-logo-min),
    var(--loading-logo-fluid),
    var(--loading-logo-max)
  );
  height: auto;
  aspect-ratio: 400 / 150;
  border-radius: 20px;
  padding: 1.5rem;
}

.loading-screen .brand-logo.loading-logo {
  animation: float 3s ease-in-out infinite;
}

.loading-screen .logo-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.loading-screen .brand-info {
  text-align: left;
}

.loading-screen .brand-title {
  font-size: clamp(1.8rem, 4.5vw, 2.5rem);
  margin: 0 0 0.25rem 0;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  background: linear-gradient(45deg, #ffffff, #f0f8ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.1;
}

.loading-screen .brand-subtitle {
  font-size: clamp(0.9rem, 2.2vw, 1rem);
  opacity: 0.9;
  letter-spacing: 3px;
}

.loading-animation {
  margin-top: 2rem;
}

.spinner {
  width: clamp(32px, 6vw, 48px);
  height: clamp(32px, 6vw, 48px);
  border: clamp(3px, 0.6vw, 4px) solid rgba(255, 255, 255, 0.2);
  border-top: clamp(3px, 0.6vw, 4px) solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1.5rem;
}

.loading-text {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0;
  font-weight: 500;
}

/* Error Screen */
.error-screen {
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}

.error-container {
  text-align: center;
  padding: 2rem;
  max-width: 500px;
}

.error-content {
  background: white;
  border-radius: 20px;
  padding: 3rem 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  display: block;
  animation: bounce 2s infinite;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #dc3545;
  margin-bottom: 1rem;
}

.error-message {
  color: #6c757d;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.btn-retry {
  padding: 0.875rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
  transition: all 0.2s ease;
}

.btn-retry:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(13, 110, 253, 0.4);
}

/* App Layout */
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Header with Navigation */
.app-header {
  background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
  color: white;
  box-shadow: 0 4px 20px rgba(13, 110, 253, 0.2);
  position: sticky;
  top: 0;
  z-index: 1030;
  padding-top: env(safe-area-inset-top);
}

.header-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 0 1rem 0;
  min-height: 80px;
  gap: 2rem;
}

.app-header .brand-section {
  margin-bottom: 0;
  flex: 1;
}

.app-header .brand-section:hover {
  transform: translateY(-1px);
}

.app-header .brand-logo {
  width: 240px;
  height: auto;
  aspect-ratio: 400 / 150;
  border-radius: 12px;
  padding: 0.5rem;
}

.app-header .logo-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.app-header .brand-title {
  font-size: 1.5rem;
}

.app-header .brand-subtitle {
  font-size: 0.75rem;
}

/* Navigation within Header */
.app-navigation {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0;
}

/* Desktop Navigation */
.nav-list {
  display: flex;
  align-items: center;
  margin: 0;
  padding: 0;
  list-style: none;
  gap: 0.5rem;
}

.nav-desktop {
  padding: 1rem 0;
}

.nav-item {
  position: relative;
}

.nav-link {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.875rem 1.5rem;
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  position: relative;
  min-width: 120px;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.nav-link-active {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

.nav-link-active:hover {
  background: rgba(255, 255, 255, 0.25);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.nav-label {
  font-weight: 600;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.nav-indicator {
  position: absolute;
  bottom: -1rem;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 3px;
  background: white;
  border-radius: 2px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Mobile Navigation */
.nav-mobile {
  display: none;
  padding: 1rem 0;
}

.mobile-nav-dropdown {
  position: relative;
}

.mobile-nav-toggle {
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
  -webkit-tap-highlight-color: transparent;
}

.mobile-nav-toggle:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.1);
}

.current-page {
  font-weight: 600;
  color: white;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toggle-icon {
  color: rgba(255, 255, 255, 0.8);
  transition: transform 0.3s ease;
}

.mobile-nav-toggle[aria-expanded='true'] .toggle-icon {
  transform: rotate(180deg);
}

.mobile-nav-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  margin: 0;
  padding: 0.5rem 0;
  list-style: none;
  z-index: 1000;
  max-height: 60vh;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.mobile-nav-link {
  display: block;
  padding: 0.875rem 1rem;
  color: #6c757d;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-nav-link:hover {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  color: #0d6efd;
}

.mobile-nav-link-active {
  background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
  color: white;
  margin: 0.25rem 0.5rem;
  border-radius: 8px;
}

/* Main Content */
.app-main {
  flex: 1;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  min-height: calc(100vh - 200px);
  padding-bottom: env(safe-area-inset-bottom);
}

.content-wrapper {
  padding: 0;
}

.content-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* Page Loading */
.page-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
}

.page-loading .loading-content {
  text-align: center;
}

.spinner-small {
  width: 40px;
  height: 40px;
  border: 3px solid #e9ecef;
  border-top: 3px solid #0d6efd;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

/* Footer */
.app-footer {
  background: white;
  border-top: 1px solid #e9ecef;
  margin-top: auto;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.04);
}

.footer-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 0;
  gap: 2rem;
}

.footer-info {
  flex: 1;
}

.version-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  color: #6c757d;
  font-size: 0.9rem;
}

.version {
  font-weight: 600;
}

.separator {
  opacity: 0.5;
}

.license-link {
  color: #0d6efd;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.license-link:hover {
  text-decoration: underline;
  color: #0b5ed7;
}

.footer-links {
  display: flex;
  gap: 1.5rem;
}

.footer-link {
  color: #6c757d;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
}

.footer-link:hover {
  color: #0d6efd;
  background: #f8f9fa;
  transform: translateY(-1px);
}

/* Animations */
@keyframes shimmer {
  0% {
    transform: translateX(-100%) translateY(-100%) rotate(45deg);
  }
  100% {
    transform: translateX(100%) translateY(100%) rotate(45deg);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

/* Focus styles for accessibility */
.nav-link:focus,
.mobile-nav-toggle:focus,
.mobile-nav-link:focus,
.footer-link:focus,
.btn:focus,
.user-menu-toggle:focus,
.dropdown-item:focus {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
}

.nav-link:focus-visible,
.mobile-nav-toggle:focus-visible,
.mobile-nav-link:focus-visible,
.footer-link:focus-visible,
.btn:focus-visible,
.user-menu-toggle:focus-visible,
.dropdown-item:focus-visible {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(13, 110, 253, 0.25);
}

/* Responsive Design */
@media (max-width: 1200px) {
  .header-container,
  .content-container,
  .footer-container {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}

@media (max-width: 768px) {
  .nav-desktop {
    display: none;
  }

  .nav-mobile {
    display: block;
  }

  .header-content {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0 0.5rem 0;
  }

  .brand-section {
    flex: 1;
  }

  .user-name {
    display: none;
  }

  .user-menu-toggle {
    padding: 0.5rem;
  }

  .user-menu-toggle i:first-child {
    font-size: 1.5rem;
  }

  .content-container {
    padding: 1.5rem;
  }

  .footer-content {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .footer-links {
    justify-content: center;
  }

  .header-container,
  .content-container,
  .footer-container {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .app-header .brand-section {
    gap: 0.75rem;
  }

  .app-header .brand-logo {
    width: 180px;
    padding: 0.35rem;
  }

  .app-header .brand-title {
    font-size: 1.25rem;
  }

  .app-header .brand-subtitle {
    font-size: 0.65rem;
    letter-spacing: 1.5px;
  }

  :deep(.breadcrumb-navigation) {
    position: static !important;
    top: auto !important;
    box-shadow: none !important;
  }
}

@media (max-width: 480px) {
  .app-header .brand-section {
    gap: 0.5rem;
  }

  .app-header .brand-logo {
    width: 140px;
    padding: 0.25rem;
  }

  .app-header .brand-title {
    font-size: 1.1rem;
  }

  .app-header .brand-subtitle {
    font-size: 0.6rem;
    letter-spacing: 1px;
  }

  .loading-screen .brand-section {
    margin-bottom: 2rem;
    gap: 0.75rem;
    flex-direction: column;
  }

  .loading-screen .brand-logo {
    width: 80%;
    padding: 1rem;
  }

  .loading-screen .brand-title {
    font-size: 1.6rem;
  }

  .loading-screen .brand-subtitle {
    font-size: 0.8rem;
    letter-spacing: 2px;
  }

  .loading-text {
    font-size: 1rem;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .brand-section,
  .brand-logo,
  .nav-link,
  .mobile-nav-toggle,
  .footer-link,
  .user-menu-toggle {
    transition: none;
  }
  .nav-link:hover,
  .mobile-nav-toggle:hover,
  .footer-link:hover,
  .user-menu-toggle:hover {
    transform: none;
  }
}
</style>
