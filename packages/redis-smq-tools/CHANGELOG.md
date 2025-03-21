# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [8.0.0-rc.30](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.29...v8.0.0-rc.30) (2025-03-21)

### ✨ Features

- **redis-smq-tools:** handle concurrent startRedisServer() calls ([46cc938](https://github.com/weyoss/redis-smq/commit/46cc9387bc85770352910217a9a1e6743248baed))
- **redis-smq-tools:** use system redis-server instead of building from src ([56f5bd8](https://github.com/weyoss/redis-smq/commit/56f5bd8bb2053ef7f607a63d5b3fd23d6053a4ca))

### 🐛 Bug Fixes

- **redis-smq-tools:** create dir if it doesn't exist ([ff2b098](https://github.com/weyoss/redis-smq/commit/ff2b09807ccf30f96dfd3d513b4b0677235e5674))
- **redis-smq-tools:** ensure port 0 is not used ([2c60dd2](https://github.com/weyoss/redis-smq/commit/2c60dd2450ba71566b83184ded3c81100a26fdc1))
- **redis-smq-tools:** ensure Redis binary is executable and found ([d167ec0](https://github.com/weyoss/redis-smq/commit/d167ec0d053e64f3332bdeff9d618d2420abf127))
- **redis-smq-tools:** implement file locking for Redis setup ([3b064f1](https://github.com/weyoss/redis-smq/commit/3b064f1629ea173d3bafabf32fa1ab6aed0f4707))

### 🚀 Chore

- migrate to monorepo structure ([8ef9888](https://github.com/weyoss/redis-smq/commit/8ef988862cedd84eddbd3e4eb5e2f50d575fe30f))

### 📝 Documentation

- update README files with latest release and coverage badges ([0efb786](https://github.com/weyoss/redis-smq/commit/0efb7863a58bf8b2ec43cfe5b46b016c9a40b0fe))

### ♻️ Code Refactoring

- **redis-smq-tools:** simplify Redis server setup ([a801829](https://github.com/weyoss/redis-smq/commit/a801829d55a64aa101fcd5a85d8a7b535fab1180))

### ✅ Tests

- remove unused data directory parameter from startRedisServer ([46af2f4](https://github.com/weyoss/redis-smq/commit/46af2f40585cc4387a070f3d6c76d95d12a84ba7))

### 📦‍ Build System

- **redis-smq-server:** update package description ([b5ab39e](https://github.com/weyoss/redis-smq/commit/b5ab39e0a59cddde8476320c53d3b12412c6ec29))
