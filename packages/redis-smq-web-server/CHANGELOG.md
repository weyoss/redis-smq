# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [9.0.0-next.15](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.14...v9.0.0-next.15) (2025-10-31)

### 📝 Documentation

- **redis-smq-web-server:** add reverse proxy deployment guide ([c19a48c](https://github.com/weyoss/redis-smq/commit/c19a48c58c1e384a0d484cb79ee461503fa0a306))

## [9.0.0-next.14](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.13...v9.0.0-next.14) (2025-10-28)

### ⚠ BREAKING CHANGES

- **redis-smq-web-server:** fix base path routing and improve middleware setup

### 🐛 Bug Fixes

- **redis-smq-web-server:** fix base path routing and improve middleware setup ([45d6c6d](https://github.com/weyoss/redis-smq/commit/45d6c6dbb35999676575f7f3373a495c9c2e3731))

## [9.0.0-next.13](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.12...v9.0.0-next.13) (2025-10-28)

### 🐛 Bug Fixes

- **redis-smq-web-server:** ensure API server inherits correct base path configuration ([eaa1b7d](https://github.com/weyoss/redis-smq/commit/eaa1b7d0a40ccdf98ceecd98f37930f840407946))

### 📝 Documentation

- **redis-smq-web-server:** update apiProxyTarget notes ([692926d](https://github.com/weyoss/redis-smq/commit/692926d93a242ca58bb798b037a555d4d6e4d69d))

## [9.0.0-next.12](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.11...v9.0.0-next.12) (2025-10-27)

### 🚀 Chore

- add copyright headers to source files ([771e980](https://github.com/weyoss/redis-smq/commit/771e9802ddea11abb5982c4bfdfde1bebf1c7468))

### 📝 Documentation

- fix license section formatting and standardize project names ([abbdbda](https://github.com/weyoss/redis-smq/commit/abbdbdae6fc42f0a9353b7cd786386a98e6e850d))

## [9.0.0-next.11](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.10...v9.0.0-next.11) (2025-10-27)

### 🐛 Bug Fixes

- correct codecov badge URL format ([3ebb5c8](https://github.com/weyoss/redis-smq/commit/3ebb5c8ba8a7f9902de054d7aaf0c1fc572fb9a6))

### ✅ Tests

- **redis-smq-web-server:** add CLI and API proxy e2e tests ([a96ee8e](https://github.com/weyoss/redis-smq/commit/a96ee8e5a91f7a36dcd0a66082fc0b25be62350f))

## [9.0.0-next.10](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.9...v9.0.0-next.10) (2025-10-26)

### 🐛 Bug Fixes

- **redis-smq-web-server:** add rate limiting middleware to prevent DoS attacks ([5c144fd](https://github.com/weyoss/redis-smq/commit/5c144fdc67007aa686bdceddc36e3d93635bcff9))
- **redis-smq-web-server:** improve base path handling and routing logic ([5e7ff4c](https://github.com/weyoss/redis-smq/commit/5e7ff4c46b07b29bd1328bbf9732efbd07cb60b1))

### 📝 Documentation

- **redis-smq-web-server:** add npm version/code coverage badges ([c4c76c2](https://github.com/weyoss/redis-smq/commit/c4c76c2a781ad414ae1117f9b47cdb0c4eb04fac))

### ✅ Tests

- **redis-smq-web-server:** add comprehensive E2E test suite ([d67e5c6](https://github.com/weyoss/redis-smq/commit/d67e5c6d4cfb62d6736698d5fdb158a2bebf41df))

## [9.0.0-next.9](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.8...v9.0.0-next.9) (2025-10-21)

**Note:** Version bump only for package redis-smq-web-server

## [9.0.0-next.8](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.7...v9.0.0-next.8) (2025-10-18)

**Note:** Version bump only for package redis-smq-web-server

## [9.0.0-next.7](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.6...v9.0.0-next.7) (2025-10-13)

**Note:** Version bump only for package redis-smq-web-server

## [9.0.0-next.6](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.5...v9.0.0-next.6) (2025-10-13)

**Note:** Version bump only for package redis-smq-web-server

## [9.0.0-next.5](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.4...v9.0.0-next.5) (2025-10-12)

### 🚀 Chore

- **redis-smq-web-server:** update dependencies to latest versions ([34676ff](https://github.com/weyoss/redis-smq/commit/34676ff071c0d1f99b8b3d8efa8b1980b3e2eee6))

### 📝 Documentation

- add GitHub note callouts in README files ([86e855a](https://github.com/weyoss/redis-smq/commit/86e855ae7aea91e3295301671b8da3249164ea40))
- standardize "next" branch reference ([15f3e4f](https://github.com/weyoss/redis-smq/commit/15f3e4f4347fd4f76f9dc167dd72f174f178ab8e))
- update README files for next branch with pre-release badges and doc links ([463250b](https://github.com/weyoss/redis-smq/commit/463250bbd754d44ae6741abcf4e2d62995aef620))

## [9.0.0-next.4](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.3...v9.0.0-next.4) (2025-10-09)

### ♻️ Code Refactoring

- **redis-smq-web-server:** replace console logging with app logger ([d8b3210](https://github.com/weyoss/redis-smq/commit/d8b32109929c54316630029ac8f7d9ed7fa094eb))
- **redis-smq-web-server:** use createLogger function ([436e2ea](https://github.com/weyoss/redis-smq/commit/436e2ea044d9e02e0916b96c1213e92e25787e8a))

## [9.0.0-next.3](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.2...v9.0.0-next.3) (2025-09-09)

### 🐛 Bug Fixes

- **redis-smq-web-server:** set default Redis database to 0 ([3b4e200](https://github.com/weyoss/redis-smq/commit/3b4e200681a5e1eec2446fa6ffa27878cb790b29))
- **redis-smq-web-server:** update peer dependencies ([2be664e](https://github.com/weyoss/redis-smq/commit/2be664ea4bacffd5b0a780e05355e356028b6321))

### 📝 Documentation

- **redis-smq-rest-api:** add Redis client installation instructions ([40d9d54](https://github.com/weyoss/redis-smq/commit/40d9d541274701b6b701505e70d9f5ee8add0912))
- **redis-smq-web-server:** update configuration API and CLI options ([873bedf](https://github.com/weyoss/redis-smq/commit/873bedf848bf7098010cf67b3a886e50864021c4))

### ♻️ Code Refactoring

- **redis-smq-web-server:** improve CLI configuration and config parsing ([8ec1d84](https://github.com/weyoss/redis-smq/commit/8ec1d840678eb360a7854453cd6e20976d872c5c))

## [9.0.0-next.2](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.1...v9.0.0-next.2) (2025-09-07)

### 🐛 Bug Fixes

- **redis-smq-web-server:** add shebang to CLI script for proper execution ([0c213c5](https://github.com/weyoss/redis-smq/commit/0c213c5a39a86c1d752cfbf6e5e9595b678e7208))

### 📝 Documentation

- **redis-smq-web-server:** fix installation/quick start commands ([9832d33](https://github.com/weyoss/redis-smq/commit/9832d33d8beafc31f989e6477a2d83be86392966))
- **redis-smq-web-server:** fix npm install command ([db7f4e3](https://github.com/weyoss/redis-smq/commit/db7f4e3bd4f0778c2dad2eb9d779afd9515628ea))
- update installation instructions to include required deps ([107c2a5](https://github.com/weyoss/redis-smq/commit/107c2a5b2eda5b540f5f033808be94923e8688fa))

## [9.0.0-next.1](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.0...v9.0.0-next.1) (2025-09-06)

**Note:** Version bump only for package redis-smq-web-server

## [9.0.0-next.0](https://github.com/weyoss/redis-smq/compare/v8.3.1...v9.0.0-next.0) (2025-09-06)

### ✨ Features

- **redis-smq-web-server:** implement web server package for hosting RedisSMQ Web UI ([f85e66f](https://github.com/weyoss/redis-smq/commit/f85e66f9aed869d0f19dab8b0b589632efb63273))

### 🐛 Bug Fixes

- **redis-smq-web-server:** correct package name in README ([9ad1ca1](https://github.com/weyoss/redis-smq/commit/9ad1ca104b33e2762a06ce149bfc361aa6131bad))
- **redis-smq-web-server:** make test script pass without tests ([63ec530](https://github.com/weyoss/redis-smq/commit/63ec530194e995f064ddb06c45774b3a4b0e88bc))

### 🚀 Chore

- add .npmignore files to web packages for proper publishing ([2179c30](https://github.com/weyoss/redis-smq/commit/2179c30785e4c0f7ab7d1b102a91a966b70ccf24))
