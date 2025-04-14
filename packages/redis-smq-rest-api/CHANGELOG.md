# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
