<!--
  - Copyright (c)
  - Weyoss <weyoss@protonmail.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function goHome(): void {
  router.push({ name: 'Home' });
}

function goBack(): void {
  if (window.history.length > 1) {
    router.go(-1);
  } else {
    goHome();
  }
}

function goToQueues(): void {
  router.push({ name: 'Queues' });
}
</script>

<template>
  <div class="not-found-page">
    <div class="not-found-container">
      <!-- Main Content -->
      <main class="not-found-content">
        <!-- Error Illustration -->
        <div class="error-illustration">
          <div class="error-number">404</div>
          <div class="error-icon">🔍</div>
        </div>

        <!-- Error Message -->
        <div class="error-message">
          <h1 class="error-title">Page Not Found</h1>
          <p class="error-subtitle">
            Sorry, we couldn't find the page you're looking for.
          </p>
          <p class="error-description">
            The page might have been moved, deleted, or you may have entered an
            incorrect URL.
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="error-actions">
          <button class="btn btn-primary btn-home" @click="goHome">
            <i class="bi bi-house-fill me-2"></i>
            Go to Home
          </button>
          <button class="btn btn-outline-secondary btn-back" @click="goBack">
            <i class="bi bi-arrow-left me-2"></i>
            Go Back
          </button>
          <button
            class="btn btn-outline-primary btn-queues"
            @click="goToQueues"
          >
            <i class="bi bi-list-ul me-2"></i>
            View Queues
          </button>
        </div>

        <!-- Help Section -->
        <div class="help-section">
          <h3 class="help-title">What can you do?</h3>
          <ul class="help-list">
            <li class="help-item">
              <i class="bi bi-check-circle-fill help-icon"></i>
              <span>Check the URL for any typos</span>
            </li>
            <li class="help-item">
              <i class="bi bi-check-circle-fill help-icon"></i>
              <span
                >Use the navigation menu to find what you're looking for</span
              >
            </li>
            <li class="help-item">
              <i class="bi bi-check-circle-fill help-icon"></i>
              <span
                >Go back to the previous page or start from the home page</span
              >
            </li>
          </ul>
        </div>
      </main>

      <!-- Footer -->
      <footer class="not-found-footer">
        <p class="footer-text">
          Need help? Check the documentation or contact support.
        </p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
/* Page Layout */
.not-found-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

/* Background Pattern */
.not-found-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: radial-gradient(
      circle at 25% 25%,
      rgba(255, 255, 255, 0.1) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 75% 75%,
      rgba(255, 255, 255, 0.1) 0%,
      transparent 50%
    );
  pointer-events: none;
}

.not-found-container {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 3rem;
  max-width: 600px;
  width: 100%;
  text-align: center;
  position: relative;
  z-index: 1;
}

/* Error Illustration */
.error-illustration {
  margin-bottom: 2rem;
  position: relative;
}

.error-number {
  font-size: 8rem;
  font-weight: 900;
  color: #667eea;
  line-height: 1;
  margin-bottom: 1rem;
  text-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.error-icon {
  font-size: 3rem;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translate(-50%, -50%) translateY(0px);
  }
  50% {
    transform: translate(-50%, -50%) translateY(-10px);
  }
}

/* Error Message */
.error-message {
  margin-bottom: 2.5rem;
}

.error-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.error-subtitle {
  font-size: 1.25rem;
  color: #4a5568;
  margin-bottom: 1rem;
  font-weight: 500;
}

.error-description {
  font-size: 1rem;
  color: #718096;
  line-height: 1.6;
  margin: 0;
}

/* Action Buttons */
.error-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 3rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 140px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
}

.btn-outline-secondary {
  background: transparent;
  color: #6c757d;
  border-color: #6c757d;
}

.btn-outline-secondary:hover {
  background: #6c757d;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);
}

.btn-outline-primary {
  background: transparent;
  color: #667eea;
  border-color: #667eea;
}

.btn-outline-primary:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

/* Help Section */
.help-section {
  text-align: left;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.help-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 1.5rem;
  text-align: center;
}

.help-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.help-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  color: #4a5568;
  font-size: 0.95rem;
  line-height: 1.5;
}

.help-item:not(:last-child) {
  border-bottom: 1px solid #e2e8f0;
}

.help-icon {
  color: #48bb78;
  font-size: 1rem;
  flex-shrink: 0;
}

/* Footer */
.not-found-footer {
  border-top: 1px solid #e2e8f0;
  padding-top: 1.5rem;
}

.footer-text {
  color: #718096;
  font-size: 0.9rem;
  margin: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .not-found-page {
    padding: 1rem;
  }

  .not-found-container {
    padding: 2rem;
  }

  .error-number {
    font-size: 6rem;
  }

  .error-title {
    font-size: 2rem;
  }

  .error-subtitle {
    font-size: 1.1rem;
  }

  .error-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .btn {
    width: 100%;
    min-width: auto;
  }

  .help-section {
    padding: 1.5rem;
  }
}

@media (max-width: 480px) {
  .not-found-container {
    padding: 1.5rem;
  }

  .error-number {
    font-size: 4.5rem;
  }

  .error-title {
    font-size: 1.75rem;
  }

  .error-subtitle {
    font-size: 1rem;
  }

  .error-description {
    font-size: 0.9rem;
  }

  .help-section {
    padding: 1rem;
  }

  .help-item {
    font-size: 0.9rem;
  }
}

/* Focus states for accessibility */
.btn:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.5);
}

/* Animation for page entrance */
.not-found-container {
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
