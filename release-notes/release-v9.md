# RedisSMQ V9 Release Notes

## The Observability & DX Release

This is a monumental release for RedisSMQ, focused on observability, developer experience, and ease of use. Version 9
introduces a complete ecosystem for monitoring and managing your message queue, alongside a simplified, more powerful
core API.

This release is the culmination of extensive work to modernize the entire platform.

## Table of Contents

- [✨ Highlights](#-highlights)
  - [🌐 The RedisSMQ Ecosystem: A New Era of Observability](#-the-redissmq-ecosystem-a-new-era-of-observability)
  - [🚀 Simplified & Powerful Core API](#-simplified--powerful-core-api)
  - [🔄 Modernized Exchange System](#-modernized-exchange-system)
- [⚠ BREAKING CHANGES](#-breaking-changes)
- [🚀 New Features](#-new-features)
- [🐛 Bug Fixes & Performance](#-bug-fixes--performance)
- [📝 Documentation & Internal Improvements](#-documentation--internal-improvements)
- [📦 Installation](#-installation)

---

## ✨ Highlights

### 🌐 The RedisSMQ Ecosystem: A New Era of Observability

The flagship feature of v9 is a complete management and monitoring ecosystem, delivered through a suite of new packages:

- **`redis-smq-rest-api`**: A comprehensive REST API for managing queues, exchanges, and messages. It includes an auto-generated OpenAPI v3 (Swagger) specification for easy integration and exploration.
- **`redis-smq-web-ui`**: A modern, responsive Single Page Application built with Vue.js. It provides a powerful interface for visualizing queues, inspecting messages, managing consumers, and interacting with the entire system in real-time.
- **`redis-smq-web-server`**: A lightweight, production-ready web server to host the Web UI. It can run the REST API in-process for a simple all-in-one setup or act as a proxy for distributed deployments.

![RedisSMQ Web UI](https://raw.githubusercontent.com/weyoss/redis-smq/master/packages/redis-smq-web-ui/docs/screenshots/img01.png)

### 🚀 Simplified & Powerful Core API

The core RedisSMQ API has been redesigned from the ground up to be more intuitive, powerful, and resilient.

- **Unified `RedisSMQ` Class**: A single entry point (`new RedisSMQ()`) is now used for creating producers, consumers, and managing queues, simplifying application bootstrap.
- **Simplified Configuration**: Configuration is now more straightforward, with sensible defaults and clear, documented options.
- **Built-in Connection Management**: Redis client connections are now managed automatically by a robust factory, improving performance and resilience.

### 🔄 Modernized Exchange System

The message exchange system has been completely overhauled with a unified API for creating, binding, and managing all exchange types (Direct, Topic, and Fanout), making complex routing logic easier to implement and maintain.

---

## ⚠ BREAKING CHANGES

Version 9 is a major release with significant breaking changes designed to improve the long-term health and usability of the project.

- **Core API Redesign**:
  - The methods for creating producers and consumers have changed. You must now use the new `RedisSMQ` factory class.
  - The configuration object structure has been simplified. Please review the updated documentation.

- **Exchange System**:
  - The API for creating and managing exchanges is entirely new. Old methods have been removed in favor of the new unified API.

- **Message Auditing & Storage**:
  - The configuration and API for message auditing and storage have been improved. The `messageStorage` property and related classes have been refactored.

- **`redis-smq-common`**:
  - The logger architecture has been simplified. The `logger` configuration now expects an object with a `class` property.
  - Redis client creation logic has been consolidated into a `RedisClientFactory` class.

- **`redis-smq-web-server`**:
  - The `apiServer` property has been removed from `IRedisSMQWebServerConfig` in favor of a more streamlined proxy or in-process setup.
  - Base path routing logic has been improved, which may affect reverse proxy configurations.

- **`redis-smq-rest-api`**:
  - Swagger UI routing has been reorganized.
  - The introduction of new exchange API endpoints may conflict with custom extensions.

---

## 🚀 New Features

- **`redis-smq-rest-api`**:
  - Added a `/config` endpoint to expose the current RedisSMQ configuration.
  - Implemented a full suite of endpoints for creating, deleting, and managing Direct, Topic, and Fanout exchanges.
- **`redis-smq-web-ui`**:
  - Full UI for managing message exchanges.
  - Improved mobile experience for on-the-go monitoring.
  - Notifications for disabled message storage, providing better operational feedback.
- **`redis-smq`**:
  - `consumerGroupId` is now optional for PubSub queue consumers, allowing for ephemeral, broadcast-style consumption.
  - Enhanced message lifecycle observability with more detailed logging and events.
- **`redis-smq-common`**:
  - Added a `WatchMultiExec` transaction helper with automatic retry logic for handling Redis transactions robustly.
  - Implemented a `FileLock` class to handle concurrency in multi-process environments, used for managing Redis server instances in tests.

---

## 🐛 Bug Fixes & Performance

- **Performance**: LUA scripts have been optimized and cleaned up for better Redis performance.
- **Resilience**:
  - Message deletion is now more resilient to race conditions and inconsistent states.
  - The consumer reaping cycle no longer fails on errors related to ephemeral consumer group deletion.
- **`redis-smq-web-server`**:
  - Added rate-limiting middleware to prevent DoS attacks.
  - Fixed base path routing and improved middleware setup for more reliable deployments.
- **`redis-smq-web-ui`**:
  - Fixed base path handling to work correctly when hosted under a sub-path.
  - The loading screen is now fully responsive.
- **`redis-smq`**:
  - Prevented duplicate message publishing for scheduled tasks.
  - Corrected the cursor usage in `SSCAN` operations for reliable set iteration.

---

## 📝 Documentation & Internal Improvements

- **Documentation Overhaul**: All documentation has been rewritten, restructured, and expanded for v9. This includes in-depth guides, a complete API reference, and examples for both ESM and CJS.
- **`redis-smq-common` Refactoring**:
  - Upgraded the `node-redis` client dependency to v5.
  - Redesigned the internal event bus architecture with a `Runnable` base class for more predictable lifecycle management.
- **Build System**:
  - Implemented an automated system to manage `README.md` files, ensuring badges and links are always correct for `master` vs. `next` branches.
  - Added a Git merge driver strategy to preserve README versions during merges.
- **Testing**: Added comprehensive E2E tests for `redis-smq-web-server`, including CLI and API proxy functionality.

---

## 📦 Installation

To get started with the full RedisSMQ v9 ecosystem, install the following packages:

```bash
# Core, common utilities, and the full web stack
npm install redis-smq@latest redis-smq-common@latest redis-smq-rest-api@latest redis-smq-web-ui@latest redis-smq-web-server@latest

# Choose ONE Redis client
npm install ioredis
# or
npm install @redis/client
```
