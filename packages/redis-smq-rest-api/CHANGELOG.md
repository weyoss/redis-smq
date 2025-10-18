# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [9.0.0-next.8](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.7...v9.0.0-next.8) (2025-10-18)

**Note:** Version bump only for package redis-smq-rest-api

## [9.0.0-next.7](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.6...v9.0.0-next.7) (2025-10-13)

**Note:** Version bump only for package redis-smq-rest-api

## [9.0.0-next.6](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.5...v9.0.0-next.6) (2025-10-13)

**Note:** Version bump only for package redis-smq-rest-api

## [9.0.0-next.5](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.4...v9.0.0-next.5) (2025-10-12)

### ✨ Features

- **redis-smq-rest-api:** add configuration endpoint ([b343c27](https://github.com/weyoss/redis-smq/commit/b343c27a6f668a369ff57de837fb05314cea0b6d))

### 🚀 Chore

- **redis-smq-rest-api:** update dependencies to latest versions ([a42ac0b](https://github.com/weyoss/redis-smq/commit/a42ac0ba0748e43cd8fa02bfff0c3c9eda7b07e0))

### 📝 Documentation

- add GitHub note callouts in README files ([86e855a](https://github.com/weyoss/redis-smq/commit/86e855ae7aea91e3295301671b8da3249164ea40))
- standardize "next" branch reference ([15f3e4f](https://github.com/weyoss/redis-smq/commit/15f3e4f4347fd4f76f9dc167dd72f174f178ab8e))
- update README files for next branch with pre-release badges and doc links ([463250b](https://github.com/weyoss/redis-smq/commit/463250bbd754d44ae6741abcf4e2d62995aef620))

## [9.0.0-next.4](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.3...v9.0.0-next.4) (2025-10-09)

### ⚠ BREAKING CHANGES

- **redis-smq-rest-api:** add exchange API endpoints for direct, fanout, and topic exchanges

### ✨ Features

- **redis-smq-rest-api:** add exchange API endpoints for direct, fanout, and topic exchanges ([4ab1f32](https://github.com/weyoss/redis-smq/commit/4ab1f32e0f191e0522474865f1ce23d8b43b41a4))
- **redis-smq-rest-api:** add GET endpoint for namespace exchanges ([22fac1b](https://github.com/weyoss/redis-smq/commit/22fac1b6c837f2d61af9883b63c5f7162b3b422a))
- **redis-smq:** add create method to exchange implementations ([1e6fb75](https://github.com/weyoss/redis-smq/commit/1e6fb7559ff95b8e15e294f898da91539c4690e3))

### ♻️ Code Refactoring

- **redis-smq-rest-api:** improve mappings generation script, simplify build process ([c46f7f0](https://github.com/weyoss/redis-smq/commit/c46f7f055997d19642f7a518b7391ba9a0bce9d1))
- **redis-smq-rest-api:** use RedisSMQ factory methods,auto-generate error mappings ([bc3e0c4](https://github.com/weyoss/redis-smq/commit/bc3e0c4253add2414678ecb70f2bbf6ebc747e8e))

### ✅ Tests

- **redis-smq-rest-api:** fix exchanges sorting in getExchangesController.test.ts ([f6686f8](https://github.com/weyoss/redis-smq/commit/f6686f81d767f749a24cd28c5dc2186c9dc66768))

## [9.0.0-next.3](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.2...v9.0.0-next.3) (2025-09-09)

### 🐛 Bug Fixes

- **redis-smq-rest-api:** update peer dependencies ([4ede51e](https://github.com/weyoss/redis-smq/commit/4ede51e0f1a09ef211beeaa584c6e037ef5469e8))

### 📝 Documentation

- **redis-smq-rest-api:** add Redis client installation instructions ([028fb19](https://github.com/weyoss/redis-smq/commit/028fb19c8eaec0e2c757bf2b1297beb46d0b5683))
- **redis-smq-rest-api:** update CLI options documentation ([ae5cae8](https://github.com/weyoss/redis-smq/commit/ae5cae8d72b9daa6d9ef8892e5bf5cf442238604))
- **redis-smq-rest-api:** update configuration and usage examples ([4d25b5e](https://github.com/weyoss/redis-smq/commit/4d25b5e3b13d725b87e168a6eb7f564349002d19))

### ♻️ Code Refactoring

- **redis-smq-rest-api:** improve CLI configuration and config parsing ([29f9b58](https://github.com/weyoss/redis-smq/commit/29f9b58bc6a5ab3b64887a87397f33fd5519c40b))

## [9.0.0-next.2](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.1...v9.0.0-next.2) (2025-09-07)

### 🐛 Bug Fixes

- **redis-smq-rest-api:** add shebang to CLI script for proper execution ([1ed36cc](https://github.com/weyoss/redis-smq/commit/1ed36cc76c0c8dce97a6f99c0b082bec34d3853d))
- **redis-smq-rest-api:** set default Redis database to 0 ([7e12b43](https://github.com/weyoss/redis-smq/commit/7e12b433c7d4f88bc3a443505818da6a479202a3))

### 📝 Documentation

- **redis-smq-rest-api:** remove outdated prerequisites section ([f14aaaf](https://github.com/weyoss/redis-smq/commit/f14aaaf0da96e43468ead3e845ebd2be7e61ae59))
- update installation instructions to include required deps ([107c2a5](https://github.com/weyoss/redis-smq/commit/107c2a5b2eda5b540f5f033808be94923e8688fa))

## [9.0.0-next.1](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.0...v9.0.0-next.1) (2025-09-06)

### 📝 Documentation

- **redis-smq-rest-api:** add CLI usage documentation and examples ([c51cf48](https://github.com/weyoss/redis-smq/commit/c51cf4860ba556ce72b42472289f1bc8b69a3647))

## [9.0.0-next.0](https://github.com/weyoss/redis-smq/compare/v8.3.1...v9.0.0-next.0) (2025-09-06)

### ⚠ BREAKING CHANGES

- **redis-smq-rest-api:** implement missing API endpoints

### ✨ Features

- **redis-smq-rest-api:** implement missing API endpoints ([fdb6388](https://github.com/weyoss/redis-smq/commit/fdb63882876e8d39c3a41a1e620f575af752f06b))

### 🐛 Bug Fixes

- **redis-smq-rest-api:** correct import path for routing module ([133938e](https://github.com/weyoss/redis-smq/commit/133938e226833daa00e7daf5569869786ae5ba76))

## [8.3.1](https://github.com/weyoss/redis-smq/compare/v8.3.0...v8.3.1) (2025-05-06)

**Note:** Version bump only for package redis-smq-rest-api

## [8.3.0](https://github.com/weyoss/redis-smq/compare/v8.2.1...v8.3.0) (2025-05-04)

**Note:** Version bump only for package redis-smq-rest-api

## [8.2.1](https://github.com/weyoss/redis-smq/compare/v8.2.0...v8.2.1) (2025-04-22)

**Note:** Version bump only for package redis-smq-rest-api

## [8.2.0](https://github.com/weyoss/redis-smq/compare/v8.1.0...v8.2.0) (2025-04-20)

### 📝 Documentation

- **redis-smq-rest-api:** update package name reference in README ([cf8415d](https://github.com/weyoss/redis-smq/commit/cf8415d6b1171c375fa6941430b34acc7b323acd))

## [8.1.0](https://github.com/weyoss/redis-smq/compare/v8.0.3...v8.1.0) (2025-04-16)

**Note:** Version bump only for package redis-smq-rest-api

## [8.0.3](https://github.com/weyoss/redis-smq/compare/v8.0.2...v8.0.3) (2025-04-14)

**Note:** Version bump only for package redis-smq-rest-api

## [8.0.2](https://github.com/weyoss/redis-smq/compare/v8.0.1...v8.0.2) (2025-04-14)

### 📝 Documentation

- reorganize and enhance documentation across packages ([212fe75](https://github.com/weyoss/redis-smq/commit/212fe75143f1c446045c346e460065215e98f1d7))

## [8.0.1](https://github.com/weyoss/redis-smq/compare/v8.0.0...v8.0.1) (2025-04-13)

### 📝 Documentation

- **redis-smq-rest-api:** update README ([62fad72](https://github.com/weyoss/redis-smq/commit/62fad721cd79997bfafa5eecc4564488f69563ab))

## [8.0.0](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.36...v8.0.0) (2025-04-13)

**Note:** Version bump only for package redis-smq-rest-api

## [8.0.0-rc.36](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.35...v8.0.0-rc.36) (2025-04-11)

### ♻️ Code Refactoring

- **redis-smq-common:** download and use pre-built Redis binaries ([9a3d244](https://github.com/weyoss/redis-smq/commit/9a3d244599b97732bfaa544e44fa7b39fddaef56))

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

## [8.0.0-rc.30](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.29...v8.0.0-rc.30) (2025-03-21)

### 🚀 Chore

- migrate to monorepo structure ([8ef9888](https://github.com/weyoss/redis-smq/commit/8ef988862cedd84eddbd3e4eb5e2f50d575fe30f))

### 📝 Documentation

- update README files with latest release and coverage badges ([0efb786](https://github.com/weyoss/redis-smq/commit/0efb7863a58bf8b2ec43cfe5b46b016c9a40b0fe))

### ✅ Tests

- remove unused data directory parameter from startRedisServer ([46af2f4](https://github.com/weyoss/redis-smq/commit/46af2f40585cc4387a070f3d6c76d95d12a84ba7))

## [1.0.0-rc.4](https://github.com/weyoss/redis-smq-rest-api/compare/1.0.0-rc.3...1.0.0-rc.4) (2024-05-18)

### Bug Fixes

- exclude package-lock.json to support different platform arch ([48ee33b](https://github.com/weyoss/redis-smq-rest-api/commit/48ee33b99684161ddd78612ae9ad27fed997a4d4))
- **github-ci:** fix dependencies installation error due to missing lock file ([da5e462](https://github.com/weyoss/redis-smq-rest-api/commit/da5e462323b670063fa37a1267c6df0196a79436))
- **json-schema:** create required array for non-optional properties ([84bc2fb](https://github.com/weyoss/redis-smq-rest-api/commit/84bc2fb8de863368605a17faa9eea01283adb1f6))

## [1.0.0-rc.3](https://github.com/weyoss/redis-smq-rest-api/compare/1.0.0-rc.2...1.0.0-rc.3) (2024-05-17)

### Bug Fixes

- fix Swagger UI specs url ([bbe9de4](https://github.com/weyoss/redis-smq-rest-api/commit/bbe9de420df3234bbc44f241bc9a28b4f0ded2de))

### Misc

- include CHANGELOG.md into npm package, clean up ([cff6c34](https://github.com/weyoss/redis-smq-rest-api/commit/cff6c344a709f9d5e76da63b6e01a0b368b7e7a6))

## [1.0.0-rc.2](https://github.com/weyoss/redis-smq-rest-api/compare/1.0.0-rc.1...1.0.0-rc.2) (2024-05-17)

### Bug Fixes

- calculate paths based on rootDir instead of process.cwd() ([6f89c98](https://github.com/weyoss/redis-smq-rest-api/commit/6f89c98b080e86dda50a6dc0d4a1052dfcf22cdd))
- fix CJS import error due to package default export ([b1f4087](https://github.com/weyoss/redis-smq-rest-api/commit/b1f4087516cc26b93204b4f0f2a0969b815c20cd))
- fix ERR_REQUIRE_ESM error for cjs modules ([f2e021f](https://github.com/weyoss/redis-smq-rest-api/commit/f2e021fdd1b3dc6d1e52c8fe7703e9ec1ce47847))
- **schema-generator:** fix empty schema when parsing .d.ts files ([4f988b9](https://github.com/weyoss/redis-smq-rest-api/commit/4f988b9284708441c8d051a5bbd2c5efd1d50649))

### Codebase Refactoring

- optimize package.json ([d0c95ad](https://github.com/weyoss/redis-smq-rest-api/commit/d0c95ad38372353b29dd118ac79ddaf772a21fa4))

### Misc

- update .npmignore ([68f9272](https://github.com/weyoss/redis-smq-rest-api/commit/68f9272f8a1c1b97a131f03ba086e29e01fcdbd0))

## 1.0.0-rc.1 (2024-05-15)
