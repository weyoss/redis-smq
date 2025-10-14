<!--
  - Copyright (c)
  - Weyoss <weyoss@protonmail.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import BreadcrumbsBar from '@/components/BreadcrumbsPanel.vue';
import { main } from '@/router/main.ts';
import { computed, onMounted, ref, onBeforeUnmount, watch } from 'vue';
import { type RouteRecordNameGeneric, useRouter } from 'vue-router';
import packageJson from '../package.json';
import logoImageSmall from '@/assets/images/redis-smq-logo-small.png';
import logoImageBig from '@/assets/images/redis-smq-logo-big.png';

// App state
const isLoading = ref(true);
const appError = ref<string | null>(null);

// Router for navigation state
const router = useRouter();

// App version from package.json
const appVersion = computed(() => {
  return packageJson.version || '0.0.0';
});

// App initialization function
const initializeApp = async () => {
  try {
    isLoading.value = true;
    appError.value = null;

    // Add any app initialization logic here
    // e.g., check authentication, load user preferences, etc.
    // At this time no initialization is required

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
const isActiveRoute = (routeName: RouteRecordNameGeneric) => {
  return router.currentRoute.value.name === routeName;
};

// Retry app initialization
const retryInitialization = () => {
  initializeApp();
};

// Mobile navigation state and a11y handling
const isMobileNavOpen = ref(false);
const mobileNavDropdown = ref<HTMLElement | null>(null);

// Close mobile nav on route change
watch(
  () => router.currentRoute.value.fullPath,
  () => {
    isMobileNavOpen.value = false;
  },
);

// Close on outside click
function handleDocumentClick(e: MouseEvent) {
  if (!isMobileNavOpen.value) return;
  const target = e.target as Node;
  const container = mobileNavDropdown.value;
  if (container && !container.contains(target)) {
    isMobileNavOpen.value = false;
  }
}

// Close on Escape key
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isMobileNavOpen.value) {
    isMobileNavOpen.value = false;
  }
}

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
              <img :src="logoImageBig" alt="RedisSMQ Logo" class="logo-image" />
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
                <img
                  :src="logoImageSmall"
                  alt="RedisSMQ Logo"
                  class="logo-image"
                />
              </div>
              <div class="brand-info">
                <h1 class="brand-title">RedisSMQ</h1>
                <span class="brand-subtitle">Web UI</span>
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
                v-for="route in main"
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
                  <span class="nav-label">{{ route.name }}</span>
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
                  <span class="current-page">
                    {{
                      main.find((r) => isActiveRoute(r.name))?.name ||
                      'Navigation'
                    }}
                  </span>
                  <i class="bi bi-chevron-down toggle-icon"></i>
                </button>
                <ul
                  v-show="isMobileNavOpen"
                  id="mobile-nav-menu"
                  class="mobile-nav-menu"
                  role="menu"
                >
                  <li v-for="route in main" :key="route.name" role="none">
                    <RouterLink
                      :to="{ name: route.name }"
                      class="mobile-nav-link"
                      :class="{
                        'mobile-nav-link-active': isActiveRoute(route.name),
                      }"
                      role="menuitem"
                    >
                      {{ route.name }}
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
  overflow-x: hidden; /* Prevent horizontal overflow on mobile */
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
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

.brand-logo::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  animation: shimmer 2s infinite;
}

.brand-logo:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.logo-image {
  object-fit: contain;
  filter: brightness(1.1) contrast(1.1);
  transition: all 0.3s ease;
  max-width: 100%; /* Fluid images to avoid overflow */
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

/* Loading Screen Specific Styles */
.loading-screen {
  /* The minimum width for the loading logo “frame.” */
  --loading-logo-min: 120px;
  /* The fluid (viewport-based) preferred width. Setting this to 0vw effectively disables fluid scaling */
  --loading-logo-fluid: 60vw;
  /* The maximum width for the loading logo “frame.” */
  --loading-logo-max: 240px;

  /* Hard cap for the image inside the frame. */
  --loading-img-max: 220px;
  /* Scales the inner image to 82% of the frame width. */
  --loading-img-percent: 82%;

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
  /* Make the glass frame responsive with original-ish aspect ratio */
  width: clamp(
    var(--loading-logo-min),
    var(--loading-logo-fluid),
    var(--loading-logo-max)
  );
  aspect-ratio: 465 / 315; /* keep the frame proportions consistent */
  height: auto; /* let aspect-ratio control height */
  border-radius: 20px;
}

.loading-screen .brand-logo.loading-logo {
  animation: float 3s ease-in-out infinite;
}

.loading-screen .logo-image {
  /* Scale the logo inside the frame responsively, with a sensible max */
  width: min(var(--loading-img-percent), var(--loading-img-max));
  height: auto;
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
}

.app-header .brand-section {
  margin-bottom: 0;
}

.app-header .brand-section:hover {
  transform: translateY(-1px);
}

.app-header .brand-logo {
  width: 121px;
  height: 84px;
  border-radius: 16px;
}

.app-header .logo-image {
  width: 91px;
  height: 54px;
  filter: brightness(1.2) contrast(1.1);
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
  text-overflow: ellipsis; /* Prevent overly long labels from overflowing */
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
  max-height: 60vh; /* Scrollable on small screens */
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
  overflow-wrap: anywhere; /* Avoid long content causing horizontal scroll */
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

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
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
.btn:focus {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
}

.nav-link:focus-visible,
.mobile-nav-toggle:focus-visible,
.mobile-nav-link:focus-visible,
.footer-link:focus-visible,
.btn:focus-visible {
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
    flex-direction: column;
    gap: 1rem;
    text-align: center;
    padding: 1rem 0 0.5rem 0;
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

  /* Header brand adjustments for mobile (unchanged) */
  .app-header .brand-section {
    gap: 0.75rem;
  }

  .app-header .brand-logo {
    width: 48px;
    height: 48px;
  }

  .app-header .logo-image {
    width: 28px;
    height: 28px;
  }

  .app-header .brand-title {
    font-size: 1.25rem;
  }

  .app-header .brand-subtitle {
    font-size: 0.65rem;
    letter-spacing: 1.5px;
  }

  /* Avoid sticky conflict with header on mobile: make breadcrumbs non-sticky */
  :deep(.breadcrumb-navigation) {
    position: static !important;
    top: auto !important;
    box-shadow: none !important;
  }
}

@media (max-width: 480px) {
  /* Header brand adjustments for small screens (unchanged) */
  .app-header .brand-section {
    gap: 0.5rem;
  }

  .app-header .brand-logo {
    width: 40px;
    height: 40px;
  }

  .app-header .logo-image {
    width: 24px;
    height: 24px;
  }

  .app-header .brand-title {
    font-size: 1.1rem;
  }

  .app-header .brand-subtitle {
    font-size: 0.6rem;
    letter-spacing: 1px;
  }

  /* Loading screen text tweaks for small screens */
  .loading-screen .brand-section {
    margin-bottom: 2rem;
    gap: 0.75rem;
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
  .footer-link {
    transition: none;
  }
  .nav-link:hover,
  .mobile-nav-toggle:hover,
  .footer-link:hover {
    transform: none;
  }
}
</style>
