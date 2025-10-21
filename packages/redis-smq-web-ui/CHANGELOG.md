# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [9.0.0-next.9](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.8...v9.0.0-next.9) (2025-10-21)

**Note:** Version bump only for package redis-smq-web-ui

## [9.0.0-next.8](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.7...v9.0.0-next.8) (2025-10-18)

### 🐛 Bug Fixes

- **redis-smq-web-ui:** make loading screen responsive with fluid scaling ([fe6d346](https://github.com/weyoss/redis-smq/commit/fe6d3469eaf67a3f52f903c79e2a25942c46ef86))
- **redis-smq-web-ui:** offer to create the first queue only when no queues exist ([8042b45](https://github.com/weyoss/redis-smq/commit/8042b45d5c735352df83e44176647c722509e128))

### 📝 Documentation

- **redis-smq-web-ui:** update README screenshot to home view ([874ad7f](https://github.com/weyoss/redis-smq/commit/874ad7f342119b71004662731482e8b45b921991))

### ♻️ Code Refactoring

- **redis-smq-web-ui:** integrate CreateQueueModal into HomeView, simplify dashboard ([de2a116](https://github.com/weyoss/redis-smq/commit/de2a116a8fb069a8ff51c0d3b616fadb7d6d306c))
- **redis-smq-web-ui:** make CreateQueueModal self-contained ([ff31b5c](https://github.com/weyoss/redis-smq/commit/ff31b5c5f3b10d0831184350616c096c0118613f))

## [9.0.0-next.7](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.6...v9.0.0-next.7) (2025-10-13)

### 📝 Documentation

- **redis-smq-web-ui:** update web ui screenshot ([8c1addb](https://github.com/weyoss/redis-smq/commit/8c1addb026e6ee734070adc2d57e522d07411cdb))

### ♻️ Code Refactoring

- **redis-smq-web-ui:** extract ClearRateLimitConfirmationModal component ([f46508a](https://github.com/weyoss/redis-smq/commit/f46508a70b1d1695f11dd7b0aff6d17f7d5ea36a))
- **redis-smq-web-ui:** unify queue display format to name@namespace ([0362b5b](https://github.com/weyoss/redis-smq/commit/0362b5b02245ef98cf33f2775ad280d9ae6fda05))

## [9.0.0-next.6](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.5...v9.0.0-next.6) (2025-10-13)

### ✨ Features

- **redis-smq-web-ui:** add notification for exchange deletion with bound queues ([c9159fa](https://github.com/weyoss/redis-smq/commit/c9159fa9404583bacd88392c11ae245d5df3b4ba))
- **redis-smq-web-ui:** add unified DeleteExchangeModal for all exchange types ([db69156](https://github.com/weyoss/redis-smq/commit/db6915686fbb5f85414ee6a71f83b00a5afaf1ac))

### ♻️ Code Refactoring

- **redis-smq-web-ui:** remove unused DeleteFanoutExchangeModal ([d91136c](https://github.com/weyoss/redis-smq/commit/d91136c952843fe16d8fcbc1b4f96ad92c452f93))

## [9.0.0-next.5](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.4...v9.0.0-next.5) (2025-10-12)

### ✨ Features

- **redis-smq-web-ui:** improve mobile experience ([1230bfe](https://github.com/weyoss/redis-smq/commit/1230bfee88f2d6ed2dea4c56bd4b7e4c7dd216df))
- **redis-smq-web-ui:** notify about disabled message storage for ack/dl messages ([b3ecc52](https://github.com/weyoss/redis-smq/commit/b3ecc527548c770c37829cc69f716c27b8df5f14))

### 🐛 Bug Fixes

- **redis-smq-web-ui:** fix sudden CreateExchangeModal closure ([b6b2b0e](https://github.com/weyoss/redis-smq/commit/b6b2b0edb6d4d1c4fc022d2cbaf2f21101a61c4a))

### 🚀 Chore

- **redis-smq-web-ui:** update dependencies to latest versions ([f48c578](https://github.com/weyoss/redis-smq/commit/f48c578eaf84b04bdb700d808b5acc60396fc9e5))

### 📝 Documentation

- add GitHub note callouts in README files ([86e855a](https://github.com/weyoss/redis-smq/commit/86e855ae7aea91e3295301671b8da3249164ea40))
- **redis-smq-web-ui:** fix license statement ([0e37a16](https://github.com/weyoss/redis-smq/commit/0e37a16143bc458de9b33e78e2be9f1757897f33))
- **redis-smq-web-ui:** improve README clarity and structure ([d85bffe](https://github.com/weyoss/redis-smq/commit/d85bffede56fcc17651af1ac7d0fb0a03cb331ce))
- standardize "next" branch reference ([15f3e4f](https://github.com/weyoss/redis-smq/commit/15f3e4f4347fd4f76f9dc167dd72f174f178ab8e))
- update README files for next branch with pre-release badges and doc links ([463250b](https://github.com/weyoss/redis-smq/commit/463250bbd754d44ae6741abcf4e2d62995aef620))

### ♻️ Code Refactoring

- **redis-smq-web-ui:** migrate scripts utils to use RedisSMQ class ([30797f8](https://github.com/weyoss/redis-smq/commit/30797f855272f5c2f3456224c0a91a2301d2eb39))
- **redis-smq-web-ui:** remove unused CreateFanoutExchangeModal ([79f3fda](https://github.com/weyoss/redis-smq/commit/79f3fdae50c2f1cc21592e7a8759daf98be09fe8))
- **redis-smq-web-ui:** reorder navigation menu items ([235e81c](https://github.com/weyoss/redis-smq/commit/235e81c98a4df75b229b89227e06c2d7aaded068))

## [9.0.0-next.4](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.3...v9.0.0-next.4) (2025-10-09)

### ✨ Features

- **redis-smq-web-ui:** add exchange management system ([c33650c](https://github.com/weyoss/redis-smq/commit/c33650c01a3c4fcd4663b08668642f7aea394fce))

### 🐛 Bug Fixes

- **redis-smq-web-ui:** fix error message reference ([8e6fb43](https://github.com/weyoss/redis-smq/commit/8e6fb4379976a7a3d26036f22f235f0271da79a0))
- **redis-smq-web-ui:** initialize RedisSMQ before starting API server ([22887fa](https://github.com/weyoss/redis-smq/commit/22887faf0abc8939de9f90e8abfb18d7c8e93d02))
- **redis-smq-web-ui:** update branding ([2bd50ce](https://github.com/weyoss/redis-smq/commit/2bd50ce8ef75bdca9c5602ddc8bc6d36cdb8342f))

### 📝 Documentation

- **redis-smq-web-ui:** improve README formatting ([e0d3399](https://github.com/weyoss/redis-smq/commit/e0d33990886f934df31e65fa831b87f7a761e3b0))

### ♻️ Code Refactoring

- **redis-smq-web-ui:** standardize HTML formatting ([b290044](https://github.com/weyoss/redis-smq/commit/b290044c861014cda393467dd3b7af52f5507679))

## [9.0.0-next.3](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.2...v9.0.0-next.3) (2025-09-09)

### 🐛 Bug Fixes

- **redis-smq-web-ui:** move redis-smq-rest-api from peer to dev deps ([573829e](https://github.com/weyoss/redis-smq/commit/573829e862355c33deb4b830a6c89c708d387c6f))

### 📝 Documentation

- **redis-smq-web-ui:** include Priority Queues support ([ce6d143](https://github.com/weyoss/redis-smq/commit/ce6d1436ea0015e66d736e7a01f1e2982254a0c2))

## [9.0.0-next.2](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.1...v9.0.0-next.2) (2025-09-07)

### 📝 Documentation

- **redis-smq-web-ui:** add screenshot to README ([c6fb731](https://github.com/weyoss/redis-smq/commit/c6fb731f1bf29021793cb7ee12e69b2a8332a707))

## [9.0.0-next.1](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.0...v9.0.0-next.1) (2025-09-06)

**Note:** Version bump only for package redis-smq-web-ui

## [9.0.0-next.0](https://github.com/weyoss/redis-smq/compare/v8.3.1...v9.0.0-next.0) (2025-09-06)

### ✨ Features

- **redis-smq-web-ui:** implement comprehensive Vue.js web interface for RedisSMQ management ([cee3212](https://github.com/weyoss/redis-smq/commit/cee3212119c10c3fb08109d27f1ad89e7e033110))

### 🐛 Bug Fixes

- **redis-smq-web-ui:** add OpenAPI client generation to build process ([c726ea6](https://github.com/weyoss/redis-smq/commit/c726ea64895cd51d1e899b0dcf8b9d3c280b9608))
- **redis-smq-web-ui:** clean up old files before OpenAPI client generation ([65372c7](https://github.com/weyoss/redis-smq/commit/65372c725eab412d645dfb6c0589f0519773d70b))
- **redis-smq-web-ui:** correct import path for messages API module ([dc913f6](https://github.com/weyoss/redis-smq/commit/dc913f689618358e45058891273670eba9d4cc61))
- **redis-smq-web-ui:** correct license statement in README ([7dfed65](https://github.com/weyoss/redis-smq/commit/7dfed65b2249a6cebfdb949858297622abdbe294))
- **redis-smq-web-ui:** improve modal warning text and fix z-index ([7dcefe1](https://github.com/weyoss/redis-smq/commit/7dcefe18fecbcb386c0be688b9f2d791faabf0eb))
- **redis-smq-web-ui:** reduce app initialization delay and improve comments ([d250209](https://github.com/weyoss/redis-smq/commit/d25020943ce08d015be0e24d135fe77f9772c32f))
- **redis-smq-web-ui:** standardize import file extensions to .ts ([65974b9](https://github.com/weyoss/redis-smq/commit/65974b9eb7031bba8e83ead4107a1f8b450cafa5))

### 🚀 Chore

- add .npmignore files to web packages for proper publishing ([2179c30](https://github.com/weyoss/redis-smq/commit/2179c30785e4c0f7ab7d1b102a91a966b70ccf24))
