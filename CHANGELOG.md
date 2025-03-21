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

- add release:rc script to package.json ([69f3172](https://github.com/weyoss/redis-smq/commit/69f317213cbe0ce1ca5c72c1693713614c46532d))
- migrate to monorepo structure ([8ef9888](https://github.com/weyoss/redis-smq/commit/8ef988862cedd84eddbd3e4eb5e2f50d575fe30f))
- remove Redis server scripts and related commands ([1851d5a](https://github.com/weyoss/redis-smq/commit/1851d5a008fbc21a17b44af03fc68318edf609c1))

### 📝 Documentation

- update README files with latest release and coverage badges ([0efb786](https://github.com/weyoss/redis-smq/commit/0efb7863a58bf8b2ec43cfe5b46b016c9a40b0fe))

### ♻️ Code Refactoring

- **redis-smq-tools:** simplify Redis server setup ([a801829](https://github.com/weyoss/redis-smq/commit/a801829d55a64aa101fcd5a85d8a7b535fab1180))

### ✅ Tests

- double the test timeout to 240000 milliseconds ([a5dd05c](https://github.com/weyoss/redis-smq/commit/a5dd05c997c522263a9fc036f1c3ec3c644081e4))
- increase hook timeout to 120 seconds ([dee1ce2](https://github.com/weyoss/redis-smq/commit/dee1ce224c5e7de58e62f0f8074deab06540657b))
- remove unused data directory parameter from startRedisServer ([46af2f4](https://github.com/weyoss/redis-smq/commit/46af2f40585cc4387a070f3d6c76d95d12a84ba7))

### 📦‍ Build System

- **deps:** remove pnpm from dev dependencies ([d19292b](https://github.com/weyoss/redis-smq/commit/d19292b7a1e8f54c63449fe9e7d3fe32eb19adab))
- **redis-smq-server:** update package description ([b5ab39e](https://github.com/weyoss/redis-smq/commit/b5ab39e0a59cddde8476320c53d3b12412c6ec29))
- update dev dependency @types/node to v20 ([047304d](https://github.com/weyoss/redis-smq/commit/047304de8615c277574bb517f6038929e544e28b))

### 👷 Continuous Integration

- add secret token for codecov ([d81f4d6](https://github.com/weyoss/redis-smq/commit/d81f4d62c12dbc765b64a420244ee0b552d66f84))
- reduce test timeout to 120 seconds ([384b8a7](https://github.com/weyoss/redis-smq/commit/384b8a707941c57ae0f554927489da1134594ad5))
- remove unnecessary directory navigation step ([d4e2cdb](https://github.com/weyoss/redis-smq/commit/d4e2cdb0100351593f2c66f6ea1daf020c9e038f))
- update codecov action and install redis server ([2bd256e](https://github.com/weyoss/redis-smq/commit/2bd256e907a14acda19ec9adf2cc78cb9e9b7b99))
- update CodeQL action and add PNPM installation ([526f7e5](https://github.com/weyoss/redis-smq/commit/526f7e505b04b7cd9b83c70202bda39c14152282))
- update Redis server installation command ([1e8e062](https://github.com/weyoss/redis-smq/commit/1e8e06239b4b9b203734ab3ce8b1501d0a872b83))
