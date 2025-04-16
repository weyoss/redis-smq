# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [8.1.0](https://github.com/weyoss/redis-smq/compare/v8.0.3...v8.1.0) (2025-04-16)

### ✨ Features

- **redis-smq-common:** add scard method to Redis client ([fc0243c](https://github.com/weyoss/redis-smq/commit/fc0243ca8fda486685589f0efd97d43c932e6750))

### 🐛 Bug Fixes

- **redis-smq:** prevent duplicate message publishing for scheduled tasks ([18b1bd9](https://github.com/weyoss/redis-smq/commit/18b1bd9a6c88f714972c35cc0445c67ad8aa64e3))

### 🚀 Chore

- add GitHub issue templates for bug reports and feature requests ([696fe34](https://github.com/weyoss/redis-smq/commit/696fe347e166c501c3a3a35980a7ab9e52a06bde))
- add Q&A discussion link ([d84a369](https://github.com/weyoss/redis-smq/commit/d84a3698f9bc17c3793c092b5ced800a9202a910))
- improve issue templates with clearer labels and descriptions ([60771ce](https://github.com/weyoss/redis-smq/commit/60771ce94b44fc1f44f8dd522bd70bee473d3388))
- update GitHub Actions dependencies to latest versions ([bf6eaff](https://github.com/weyoss/redis-smq/commit/bf6eaff951afd30b139972ecc071c1dc7aa3be3b))

### 📝 Documentation

- **redis-smq:** update documentation and interfaces ([f917cd9](https://github.com/weyoss/redis-smq/commit/f917cd92b1edfb33190f25feec5577538a64517a))

### ♻️ Code Refactoring

- **redis-smq:** improve queue message management system with storage abstractions ([20d9985](https://github.com/weyoss/redis-smq/commit/20d998592ad255731b6bca71ea5ef116c42c7bf1))
- **redis-smq:** rename IQueueMessages interface to IQueueMessageManager ([505b555](https://github.com/weyoss/redis-smq/commit/505b5551c52acfe955b09a569f2d43e3c5cb045c))

## [8.0.3](https://github.com/weyoss/redis-smq/compare/v8.0.2...v8.0.3) (2025-04-14)

### 🚀 Chore

- **redis-smq-common:** enhance Redis server management with CLI and scripts ([1fec53e](https://github.com/weyoss/redis-smq/commit/1fec53eb25dd16ea28efaf2a5b31eeab09539ec4))

### 📝 Documentation

- fix ERedisConfigClient import, update installation instruction ([6d4cb62](https://github.com/weyoss/redis-smq/commit/6d4cb62750325492b38d26ee4487985428656302))

## [8.0.2](https://github.com/weyoss/redis-smq/compare/v8.0.1...v8.0.2) (2025-04-14)

### 🚀 Chore

- **redis-smq-common:** update Valkey server binary URLs to v7.2.8-2 ([e6b9b8d](https://github.com/weyoss/redis-smq/commit/e6b9b8d31af9d321b3ad208bebabd09171932822))

### 📝 Documentation

- **redis-smq-common:** update package description and documentation link ([3a5d91c](https://github.com/weyoss/redis-smq/commit/3a5d91c05faed92c395eaa541c346d8ecb5273b7))
- reorganize and enhance documentation across packages ([212fe75](https://github.com/weyoss/redis-smq/commit/212fe75143f1c446045c346e460065215e98f1d7))
- simplify and streamline v8 release notes ([60ab227](https://github.com/weyoss/redis-smq/commit/60ab22750d213236a9bb157ab3a4ef7e60dacdd4))

## [8.0.1](https://github.com/weyoss/redis-smq/compare/v8.0.0...v8.0.1) (2025-04-13)

### 📝 Documentation

- **redis-smq-rest-api:** update README ([62fad72](https://github.com/weyoss/redis-smq/commit/62fad721cd79997bfafa5eecc4564488f69563ab))
- **redis-smq-web-ui:** add initial README with feature overview ([9901a45](https://github.com/weyoss/redis-smq/commit/9901a45805a904beecfa6a2fbabe471fbb4d60c9))
- **redis-smq:** update links to REST API and Web UI documentation ([77a923d](https://github.com/weyoss/redis-smq/commit/77a923d5670405c8e06b4e5807969aed5543ec95))

### ♻️ Code Refactoring

- **redis-smq:** improve redis-keys module with better organization and documentation ([850116d](https://github.com/weyoss/redis-smq/commit/850116ddcc1f25a9dcd589842fde0fa1fe098cda))
- **redis-smq:** update key prefix with version-based naming scheme ([6af3840](https://github.com/weyoss/redis-smq/commit/6af384080cbc2c6772e1cc134a515cbf21eeffcb))

## [8.0.0](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.36...v8.0.0) (2025-04-13)

### 🚀 Chore

- expand release script options with semantic versioning commands ([0b3794a](https://github.com/weyoss/redis-smq/commit/0b3794a2fcc700892ff3f68cdb37e53f358fd90e))

### 📝 Documentation

- add release notes for RedisSMQ v8 ([81835e2](https://github.com/weyoss/redis-smq/commit/81835e22a3216a3c27199389681b610400128461))
- update README with v8 release announcement ([99b977f](https://github.com/weyoss/redis-smq/commit/99b977f01bc327c5323196ddeafd620202b80f6a))

## [8.0.0-rc.36](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.35...v8.0.0-rc.36) (2025-04-11)

### ⚠ BREAKING CHANGES

- **redis-smq-common:** implement FileLock class with improved locking mechanism

### ✨ Features

- **redis-smq-common:** add options to build/download Redis binary ([f00df37](https://github.com/weyoss/redis-smq/commit/f00df374184f8baa70e44f7d28398802cc1492d6))

### 📝 Documentation

- **redis-smq-common:** clarify FileLock method descriptions ([3578221](https://github.com/weyoss/redis-smq/commit/35782211cc263192e2ed91ef54ba3e78dcb3194e))
- **redis-smq-common:** clean up redis-client.md ([e0b31b4](https://github.com/weyoss/redis-smq/commit/e0b31b414485acf74c250e812ddc40c0edd63aa1))
- **redis-smq-common:** fix capitalization of FileLock in README ([2d448e0](https://github.com/weyoss/redis-smq/commit/2d448e0ee73e9eea7809a4586774ede2f0a1e9e9))
- **redis-smq-common:** fix typo in redis-server.md ([2657b3b](https://github.com/weyoss/redis-smq/commit/2657b3b56e8b259650180912e26f0f063edae34c))
- **redis-smq-common:** improve documentation structure ([975b696](https://github.com/weyoss/redis-smq/commit/975b696db60cf152244ffef1c09642aa93d3732f))

### ♻️ Code Refactoring

- **redis-smq-common:** download and use pre-built Redis binaries ([9a3d244](https://github.com/weyoss/redis-smq/commit/9a3d244599b97732bfaa544e44fa7b39fddaef56))
- **redis-smq-common:** implement FileLock class with improved locking mechanism ([77c1cff](https://github.com/weyoss/redis-smq/commit/77c1cffae9071ea275afaa28964d1b684490b653))
- **redis-smq-common:** rename createClient ([7d748d8](https://github.com/weyoss/redis-smq/commit/7d748d8f9cc364df8e81aaf7506ee63a66702fcb))
- **redis-smq-common:** shorten imports ([21ec49a](https://github.com/weyoss/redis-smq/commit/21ec49ae23418b917d68bac2a711545db43f1bad))

### ✅ Tests

- **redis-smq-common:** use os.tmpdir() for test lock files ([f33b738](https://github.com/weyoss/redis-smq/commit/f33b738cc9f2b2adb7ece1f5154fc7255709120e))

### 👷 Continuous Integration

- update workflow for improved code analysis ([97c5f70](https://github.com/weyoss/redis-smq/commit/97c5f70aa5538978b1c97502b0178ca3a4678840))

## [8.0.0-rc.35](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.34...v8.0.0-rc.35) (2025-03-22)

### 📦‍ Build System

- **redis-smq-rest-api:** include schema.json in npm package ([0743e10](https://github.com/weyoss/redis-smq/commit/0743e10181b710b084d611ea4f33d303421240f8))

## [8.0.0-rc.34](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.33...v8.0.0-rc.34) (2025-03-22)

### 📦‍ Build System

- update repository links and issue tracking ([de60250](https://github.com/weyoss/redis-smq/commit/de60250675b57213408e8580f90ed43f71856b0f))

## [8.0.0-rc.33](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.32...v8.0.0-rc.33) (2025-03-22)

### 📦‍ Build System

- update .npmignore files to properly include source files ([8c7ec7d](https://github.com/weyoss/redis-smq/commit/8c7ec7d9d98f51d346167c7d723fd4d78705430b))

## [8.0.0-rc.32](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.31...v8.0.0-rc.32) (2025-03-22)

### 📦‍ Build System

- update .npmignore files to include only essential files ([9f537a0](https://github.com/weyoss/redis-smq/commit/9f537a06e1bebfacc1204698c6f3f15afcf768e3))

## [8.0.0-rc.31](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.30...v8.0.0-rc.31) (2025-03-22)

### ⚠ BREAKING CHANGES

- merge redis-server and net utils into redis-smq-common

### ♻️ Code Refactoring

- merge redis-server and net utils into redis-smq-common ([3591e20](https://github.com/weyoss/redis-smq/commit/3591e2060dec07ed05d13dba7b3a6154b5bc8057))

### 📦‍ Build System

- rename document script to document:all ([74fac60](https://github.com/weyoss/redis-smq/commit/74fac6016f175b108b7a3288a8c0bc28732d4c95))

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
