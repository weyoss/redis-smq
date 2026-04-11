# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [10.1.1-next.0](https://github.com/weyoss/redis-smq/compare/v10.1.0...v10.1.1-next.0) (2026-04-11)

### 📝 Documentation

- update READMEs (v10.1.0 → next) ([b5aa53a](https://github.com/weyoss/redis-smq/commit/b5aa53af7eb3a348c7e01c30cc538385bcd7796d))

## [10.1.0](https://github.com/weyoss/redis-smq/compare/v10.1.0-next.1...v10.1.0) (2026-04-11)

> 📖 **Detailed Release Notes**: [RedisSMQ v10.1.0](https://github.com/weyoss/redis-smq/blob/master/release-notes/release-v10.1.0.md)

**Note:** Version bump only for package redis-smq-rest-api

## [10.1.0-next.1](https://github.com/weyoss/redis-smq/compare/v10.1.0-next.0...v10.1.0-next.1) (2026-04-11)

### 📝 Documentation

- update changelog commit hashes after email change ([ce13adf](https://github.com/weyoss/redis-smq/commit/ce13adfc8cf2e9a5b7f2573a413e534ed4cafec3))

## [10.1.0-next.0](https://github.com/weyoss/redis-smq/compare/v10.0.0...v10.1.0-next.0) (2026-04-07)

### ✨ Features

- **redis-smq-rest-api:** add API endpoint for updating config ([e91f2c6](https://github.com/weyoss/redis-smq/commit/e91f2c6bd935d67bc375b13a7ae8c7a0dcdc4d76))

### 📝 Documentation

- update READMEs (v10.0.0 → next) ([8247b2f](https://github.com/weyoss/redis-smq/commit/8247b2f19d7caefcac6efdebd33f5592f743a1e7))

## [10.0.0](https://github.com/weyoss/redis-smq/compare/v10.0.0-next.2...v10.0.0) (2026-04-04)

> 📖 **Detailed Release Notes**: [RedisSMQ v10.0.0](https://github.com/weyoss/redis-smq/blob/master/release-notes/release-v10.0.0.md)

### 📝 Documentation

- add consolidated changelog for v10.0.0-next.2 ([33a6a4a](https://github.com/weyoss/redis-smq/commit/33a6a4af0c0ceb20b93aaff54c409bd2d3f92273))

## [10.0.0-next.2](https://github.com/weyoss/redis-smq/compare/v10.0.0-next.1...v10.0.0-next.2) (2026-04-04)

### ✨ Features

- **redis-smq-rest-api:** add endpoint for fetching message unack history ([ae43bfc](https://github.com/weyoss/redis-smq/commit/ae43bfcbf5acd220528f987df6e78c255594f3d6))

### ♻️ Code Refactoring

- **redis-smq-rest-api:** use new configuration/bootstrap API ([da27b9a](https://github.com/weyoss/redis-smq/commit/da27b9ac20c8103afe34629a5363cee18e81be83))

### 📦 Build System

- add strict bash script options for robustness and debugging ([64f1a0a](https://github.com/weyoss/redis-smq/commit/64f1a0ab5b13982b9e039530f94cdc1016d18adf))
- fix shell compatibility by using bash ([3066eea](https://github.com/weyoss/redis-smq/commit/3066eea5bb4e7ddff744e1e855753881d8fb8ed1))

## [10.0.0-next.1](https://github.com/weyoss/redis-smq/compare/v10.0.0-next.0...v10.0.0-next.1) (2026-03-28)

### ♻️ Code Refactoring

- **redis-smq-rest-api:** update error map ([ede436f](https://github.com/weyoss/redis-smq/commit/ede436f65437d594e268ac3426b4657ca8c057d0))

## [10.0.0-next.0](https://github.com/weyoss/redis-smq/compare/v9.1.0-next.6...v10.0.0-next.0) (2026-03-25)

### ⚠ BREAKING CHANGES

- **redis-smq-rest-api:** update OpenAPI specs to v3.1, refactor project structure
- **redis-smq-rest-api:** redesign API to best follow REST conventions

### 🚀 Chore

- upgrade eslint to v10 ([53c724f](https://github.com/weyoss/redis-smq/commit/53c724f49cd89b95febe2e865a04bbb8af86b298))
- use underscore for script filename convention ([4d942b6](https://github.com/weyoss/redis-smq/commit/4d942b619b2e7680398723277e01bbbfba3d0f30))

### ♻️ Code Refactoring

- **redis-smq-rest-api:** redesign API to best follow REST conventions ([518e38b](https://github.com/weyoss/redis-smq/commit/518e38bdfb33bf6b170b4ce5715efe1a4468d865))
- **redis-smq-rest-api:** update OpenAPI specs to v3.1, refactor project structure ([70b13f5](https://github.com/weyoss/redis-smq/commit/70b13f5943f00a0f55cf854b3a52147be0523ecd))

## [9.1.0-next.6](https://github.com/weyoss/redis-smq/compare/v9.1.0-next.5...v9.1.0-next.6) (2026-03-12)

### ✨ Features

- **redis-smq-rest-api:** add pause/stop/resume queue API endpoints ([0778b07](https://github.com/weyoss/redis-smq/commit/0778b075614c7ac548d7dab226219f43b6a860cb))
- **redis-smq-rest-api:** add queue operational state module ([bb5e132](https://github.com/weyoss/redis-smq/commit/bb5e1328501fa63c15a3dd4d23b32e273853d083))

### ♻️ Code Refactoring

- **redis-smq-rest-api:** disable type coercion in AJV validator ([4f44150](https://github.com/weyoss/redis-smq/commit/4f4415029f5cd0e758d0a1854f6d5478b123a9f3))
- **redis-smq-rest-api:** enable type coercion selectively in AJV request validation ([278538a](https://github.com/weyoss/redis-smq/commit/278538a06376e1cda97eef76e3a5487968083662))

## [9.1.0-next.5](https://github.com/weyoss/redis-smq/compare/v9.1.0-next.4...v9.1.0-next.5) (2026-03-10)

### 🚀 Chore

- **redis-smq-rest-api:** update koa to v3.1.2 to address security vulnerability ([b2652c5](https://github.com/weyoss/redis-smq/commit/b2652c52abcc3fd7f4f356adb8d46d0cb9a204a8))

## [9.1.0-next.4](https://github.com/weyoss/redis-smq/compare/v9.1.0-next.3...v9.1.0-next.4) (2026-03-03)

**Note:** Version bump only for package redis-smq-rest-api

## [9.1.0-next.3](https://github.com/weyoss/redis-smq/compare/v9.1.0-next.2...v9.1.0-next.3) (2026-03-03)

**Note:** Version bump only for package redis-smq-rest-api

## [9.1.0-next.2](https://github.com/weyoss/redis-smq/compare/v9.1.0-next.1...v9.1.0-next.2) (2026-03-03)

### ♻️ Code Refactoring

- **redis-smq-rest-api:** add ProcessingQueueNotEmptyError to error map ([551c35f](https://github.com/weyoss/redis-smq/commit/551c35fc1960afe1c9fb82ff622bd9d8df67c164))

## [9.1.0-next.1](https://github.com/weyoss/redis-smq/compare/v9.1.0-next.0...v9.1.0-next.1) (2026-02-25)

### ♻️ Code Refactoring

- **redis-smq-rest-api:** add QueuePausedError to error map ([ea636df](https://github.com/weyoss/redis-smq/commit/ea636dfb5559545f64ac0a06da6432a98b24a65f))

## [9.1.0-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.14...v9.1.0-next.0) (2026-02-24)

### 🚀 Chore

- optimize npm keywords for maximum search coverage ([7432ecc](https://github.com/weyoss/redis-smq/commit/7432eccb19df6718da0da6e1cc2bd8e8f4b64de3))
- update READMEs after merging 'v9.0.14' into 'next' ([ab23f2b](https://github.com/weyoss/redis-smq/commit/ab23f2b0e6c32ffcf2a235db2322bf1a7cd94b70))
- upgrade packages to latest versions to mitigate security vulnerabilities ([bf55522](https://github.com/weyoss/redis-smq/commit/bf55522ebc97f8a66e929d231a7d05caabac24d9))

### ♻️ Code Refactoring

- **redis-smq-rest-api:** update error map ([fbe800f](https://github.com/weyoss/redis-smq/commit/fbe800fa32f53c8d84804439311e7d07afbb50ef))
- **redis-smq-rest-api:** update errors map, fix create queue test case issues ([131d020](https://github.com/weyoss/redis-smq/commit/131d020a71e9153591cb40b311f5cc8a1f9d255d))

## [9.0.14](https://github.com/weyoss/redis-smq/compare/v9.0.14-next.2...v9.0.14) (2026-02-06)

### 🚀 Chore

- update READMEs after merging 'origin/next' into 'master' ([283b0ee](https://github.com/weyoss/redis-smq/commit/283b0ee73f6157df662c948cebcd3e4a0941c666))

## [9.0.14-next.2](https://github.com/weyoss/redis-smq/compare/v9.0.14-next.1...v9.0.14-next.2) (2026-02-06)

**Note:** Version bump only for package redis-smq-rest-api

## [9.0.14-next.1](https://github.com/weyoss/redis-smq/compare/v9.0.14-next.0...v9.0.14-next.1) (2026-02-06)

**Note:** Version bump only for package redis-smq-rest-api

## [9.0.14-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.13...v9.0.14-next.0) (2026-02-02)

### 🚀 Chore

- update READMEs after merging 'v9.0.13' into 'next' ([0d455ae](https://github.com/weyoss/redis-smq/commit/0d455aeb544473e24a17c8745d79a9861a6df6e5))

## [9.0.13](https://github.com/weyoss/redis-smq/compare/v9.0.13-next.0...v9.0.13) (2026-01-30)

### 🚀 Chore

- update READMEs after merging 'origin/next' into 'master' ([276f166](https://github.com/weyoss/redis-smq/commit/276f166290c5891aeca8dd1680212c265dd6f792))

## [9.0.13-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.12...v9.0.13-next.0) (2026-01-30)

### 🚀 Chore

- update READMEs after merging 'v9.0.12' into 'next' ([be52cae](https://github.com/weyoss/redis-smq/commit/be52cae3ef6c18967b6e56e9fbae6421853fae4a))

## [9.0.12](https://github.com/weyoss/redis-smq/compare/v9.0.12-next.0...v9.0.12) (2026-01-28)

### 🚀 Chore

- update READMEs after merging 'origin/next' into 'master' ([74d4242](https://github.com/weyoss/redis-smq/commit/74d4242232668dd055553aeb36eac57e918eb559))

## [9.0.12-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.11...v9.0.12-next.0) (2026-01-28)

### 🚀 Chore

- update READMEs after merging 'v9.0.11' into 'next' ([055ab50](https://github.com/weyoss/redis-smq/commit/055ab50bd0096472c46f434c60c52ca59c157bc9))

### ♻️ Code Refactoring

- **redis-smq-rest-api:** update error mapping with new error classes ([6d849ef](https://github.com/weyoss/redis-smq/commit/6d849ef6fcda0e45d8b60ceacff8104df76ca365))

## [9.0.11](https://github.com/weyoss/redis-smq/compare/v9.0.11-next.2...v9.0.11) (2026-01-22)

### 🚀 Chore

- update READMEs after merging 'origin/next' into 'master' ([41f9352](https://github.com/weyoss/redis-smq/commit/41f935228d60c8d4e81dc520273f99fb3ca21478))

## [9.0.11-next.2](https://github.com/weyoss/redis-smq/compare/v9.0.11-next.1...v9.0.11-next.2) (2026-01-22)

**Note:** Version bump only for package redis-smq-rest-api

## <small>9.0.11-next.1 (2026-01-22)</small>

- chore: update lodash to v4.17.23 to address security vulnerabilities ([17bda3e](https://github.com/weyoss/redis-smq/commit/17bda3e))

## [9.0.11-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.10-next.4...v9.0.11-next.0) (2026-01-22)

### 📝 Documentation

- improve README files for clarity ([2f30700](https://github.com/weyoss/redis-smq/commit/2f3070058b07425825ae91bdce52bbb2f4aa50aa))

### ♻️ Code Refactoring

- **redis-smq-rest-api:** rename queue to queueParams to correctly pass IQueueParsedParams ([3215f6e](https://github.com/weyoss/redis-smq/commit/3215f6ee856facbf07494ae184d68b79f93c66cf))
- **redis-smq-rest-api:** update error mapping ([c194240](https://github.com/weyoss/redis-smq/commit/c19424032f43331fddecf14b090f6bf427302349))

### ✅ Tests

- **redis-smq-rest-api:** fix purge messages test cases ([4080863](https://github.com/weyoss/redis-smq/commit/40808633a11324e957ccf04d1f5f693135790b5b))

## [9.0.10-next.4](https://github.com/weyoss/redis-smq/compare/v9.0.10-next.3...v9.0.10-next.4) (2026-01-16)

### 📝 Documentation

- adjust badges position to enhance page styling ([89309c6](https://github.com/weyoss/redis-smq/commit/89309c671d7e52265a4c6e0df4d6126e91b6e408))
- refine notifications for master and next branch clarity ([e1e755e](https://github.com/weyoss/redis-smq/commit/e1e755e7086a98d4128ec3173c28056a8008acec))

## [9.0.10-next.3](https://github.com/weyoss/redis-smq/compare/v9.0.10-next.2...v9.0.10-next.3) (2026-01-16)

**Note:** Version bump only for package redis-smq-rest-api

## [9.0.10-next.2](https://github.com/weyoss/redis-smq/compare/v9.0.10-next.1...v9.0.10-next.2) (2026-01-10)

**Note:** Version bump only for package redis-smq-rest-api

## [9.0.10-next.1](https://github.com/weyoss/redis-smq/compare/v9.0.10-next.0...v9.0.10-next.1) (2026-01-10)

**Note:** Version bump only for package redis-smq-rest-api

## [9.0.10-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.9...v9.0.10-next.0) (2026-01-09)

### 🚀 Chore

- update READMEs after merging 'v9.0.9' into 'next' ([f463934](https://github.com/weyoss/redis-smq/commit/f463934b59b6196d231e5552402f449d2b986a25))

## [9.0.9](https://github.com/weyoss/redis-smq/compare/v9.0.9-next.5...v9.0.9) (2026-01-09)

### 🚀 Chore

- update READMEs after merging 'origin/next' into 'master' ([c046d46](https://github.com/weyoss/redis-smq/commit/c046d462c3c9ee32cda218cbbbf24a93f4cee829))

## [9.0.9-next.5](https://github.com/weyoss/redis-smq/compare/v9.0.9-next.4...v9.0.9-next.5) (2026-01-09)

**Note:** Version bump only for package redis-smq-rest-api

## [9.0.9-next.4](https://github.com/weyoss/redis-smq/compare/v9.0.9-next.3...v9.0.9-next.4) (2026-01-09)

**Note:** Version bump only for package redis-smq-rest-api

## [9.0.9-next.3](https://github.com/weyoss/redis-smq/compare/v9.0.9-next.2...v9.0.9-next.3) (2026-01-09)

**Note:** Version bump only for package redis-smq-rest-api

## [9.0.9-next.2](https://github.com/weyoss/redis-smq/compare/v9.0.9-next.1...v9.0.9-next.2) (2026-01-08)

**Note:** Version bump only for package redis-smq-rest-api

## [9.0.9-next.1](https://github.com/weyoss/redis-smq/compare/v9.0.9-next.0...v9.0.9-next.1) (2026-01-08)

**Note:** Version bump only for package redis-smq-rest-api

## [9.0.9-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.8...v9.0.9-next.0) (2026-01-08)

### 🐛 Bug Fixes

- **redis-smq-rest-api:** include 'bin' directory in npm package ([3e52bdb](https://github.com/weyoss/redis-smq/commit/3e52bdbb58cc33302b8fdbda6ab6176ac2bc0bb1))

### 🚀 Chore

- update READMEs after merging 'v9.0.8' into 'next' ([be16380](https://github.com/weyoss/redis-smq/commit/be16380741ba4625d1469aa3cc9d6075ead70e6f))

## [9.0.8](https://github.com/weyoss/redis-smq/compare/v9.0.8-next.0...v9.0.8) (2026-01-04)

### 🚀 Chore

- update READMEs after merging 'origin/next' into 'master' ([9250c21](https://github.com/weyoss/redis-smq/commit/9250c21f14bf0ee8f64db057ccaac091ba202891))

## [9.0.8-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.7-next.0...v9.0.8-next.0) (2026-01-03)

**Note:** Version bump only for package redis-smq-rest-api

## [9.0.7-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.6...v9.0.7-next.0) (2026-01-03)

### 🚀 Chore

- update READMEs after merging 'v9.0.6' into 'next' ([d73c0e3](https://github.com/weyoss/redis-smq/commit/d73c0e336134566b7342fa23029cb78c28952d71))

### ♻️ Code Refactoring

- **redis-smq-rest-api:** use structured errors ([7da628f](https://github.com/weyoss/redis-smq/commit/7da628f897b91b32f312095077f8e27288dc0ee0))

## [9.0.6](https://github.com/weyoss/redis-smq/compare/v9.0.6-next.2...v9.0.6) (2025-12-27)

### 🚀 Chore

- update READMEs after merging 'origin/next' into 'master' ([173e226](https://github.com/weyoss/redis-smq/commit/173e2262de8da26d86b366c6edd94e166a092445))

## [9.0.6-next.2](https://github.com/weyoss/redis-smq/compare/v9.0.6-next.1...v9.0.6-next.2) (2025-12-26)

### ♻️ Code Refactoring

- **redis-smq-rest-api:** sync codebase with recent redis-smq updates ([be1ff92](https://github.com/weyoss/redis-smq/commit/be1ff928610772a0a5302484e7a8c58c3a8d7301))

## [9.0.6-next.1](https://github.com/weyoss/redis-smq/compare/v9.0.6-next.0...v9.0.6-next.1) (2025-12-25)

**Note:** Version bump only for package redis-smq-rest-api

## [9.0.6-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.5...v9.0.6-next.0) (2025-12-19)

### 🚀 Chore

- fix outdated email address in different files ([1690afe](https://github.com/weyoss/redis-smq/commit/1690afe67b467f59c0298d91e84009ec064a66f4))
- update copyright info ([36bd6d8](https://github.com/weyoss/redis-smq/commit/36bd6d87854a07d4e694bddbf80bf8fd9da9a9b0))
- update READMEs after merging 'master' into 'next' ([3c8846b](https://github.com/weyoss/redis-smq/commit/3c8846b35551620e77ad6ef0ac27ac8e6c2ab717))

### ♻️ Code Refactoring

- **redis-smq-rest-api:** include ConsumerSetMismatchError in error list map ([91a8dfb](https://github.com/weyoss/redis-smq/commit/91a8dfb9a62eef2bb32a72e2ac3d94f80fdb02f8))

## [9.0.5](https://github.com/weyoss/redis-smq/compare/v9.0.5-next.1...v9.0.5) (2025-12-15)

### 🚀 Chore

- update READMEs after merging 'next' into 'master' ([75334e3a](https://github.com/weyoss/redis-smq/commit/75334e3a337363ef8d949f4740887f6817d5cd18))

## [9.0.5-next.1](https://github.com/weyoss/redis-smq/compare/v9.0.5-next.0...v9.0.5-next.1) (2025-12-14)

### ♻️ Code Refactoring

- **redis-smq-rest-api:** adopt IBrowserPage type from redis-smq ([3f5cb3a](https://github.com/weyoss/redis-smq/commit/3f5cb3acd715f6e8d2911fe138c720e0947c9768))

## [9.0.5-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.4...v9.0.5-next.0) (2025-12-04)

### 🚀 Chore

- update READMEs after merging 'v9.0.4' into 'next' ([f899525](https://github.com/weyoss/redis-smq/commit/f899525ff2a689e5189fa61e4a39829b4694f513))

### ♻️ Code Refactoring

- **redis-smq-rest-api:** add new error classes ([8d2dd31](https://github.com/weyoss/redis-smq/commit/8d2dd31c137b70b83e66febe7be68d2ff72e43e2))

## [9.0.4](https://github.com/weyoss/redis-smq/compare/v9.0.4-next.0...v9.0.4) (2025-11-13)

### 🚀 Chore

- update READMEs after merging 'origin/next' into 'master' ([f2dfdb8](https://github.com/weyoss/redis-smq/commit/f2dfdb8bfe73e1b04c47f5931fbcd9ca2f6596c3))

## [9.0.4-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.3...v9.0.4-next.0) (2025-11-11)

### 🚀 Chore

- update READMEs after merging 'v9.0.3' into 'next' ([d973314](https://github.com/weyoss/redis-smq/commit/d973314abddc2a5497b53b7a8e1ab3fdf785ebae))

## [9.0.3](https://github.com/weyoss/redis-smq/compare/v9.0.3-next.1...v9.0.3) (2025-11-10)

### 🚀 Chore

- update READMEs after merging 'origin/next' into 'master' ([45472c2](https://github.com/weyoss/redis-smq/commit/45472c2cb1bec7c76fc2dd6db6449ed1a34f43cf))

## [9.0.3-next.1](https://github.com/weyoss/redis-smq/compare/v9.0.3-next.0...v9.0.3-next.1) (2025-11-10)

**Note:** Version bump only for package redis-smq-rest-api

## [9.0.3-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.2...v9.0.3-next.0) (2025-11-09)

### 📝 Documentation

- update README files ([cee0ef3](https://github.com/weyoss/redis-smq/commit/cee0ef3f71df2157c7b4a5845bfeb0ab413de4e9))

## [9.0.2](https://github.com/weyoss/redis-smq/compare/v9.0.2-next.1...v9.0.2) (2025-11-08)

### 📝 Documentation

- update README files ([4473451](https://github.com/weyoss/redis-smq/commit/44734515d013dcab915d3877689b16900d032681))

## [9.0.2-next.1](https://github.com/weyoss/redis-smq/compare/v9.0.2-next.0...v9.0.2-next.1) (2025-11-08)

### 🐛 Bug Fixes

- update deps to resolve security vulnerabilities ([eeec75f](https://github.com/weyoss/redis-smq/commit/eeec75fdb7813a05dabc332185416a1377c6e7dd))

### 📝 Documentation

- update npm badge links to point to GitHub releases ([c6421ac](https://github.com/weyoss/redis-smq/commit/c6421acacfce4aec3950357e5e7543cda7c495c5))

## [9.0.2-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.1...v9.0.2-next.0) (2025-11-08)

### ✅ Tests

- rename test_workspace_esm.sh to test-workspace-esm.sh ([8e22339](https://github.com/weyoss/redis-smq/commit/8e22339cf87b3abc3fe71ac61fd9d93a9e8be869))

### 📦‍ Build System

- automate README.md files update ([7d4811f](https://github.com/weyoss/redis-smq/commit/7d4811f3d152feb7cb98298513425a2e0b1baf01))

## [9.0.1](https://github.com/weyoss/redis-smq/compare/v9.0.0...v9.0.1) (2025-11-07)

### 📝 Documentation

- update install commands to use [@latest](https://github.com/latest) instead of [@next](https://github.com/next) ([07f2109](https://github.com/weyoss/redis-smq/commit/07f2109455120d8d314e594e6b3f35d0460e7c1d))
- update README files for release v9 ([805886d](https://github.com/weyoss/redis-smq/commit/805886d41212b28eb537796c12f736fe9202e014))

## [9.0.0](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.18...v9.0.0) (2025-11-07)

**Note:** Version bump only for package redis-smq-rest-api

## [9.0.0-next.18](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.17...v9.0.0-next.18) (2025-11-07)

### 📝 Documentation

- convert relative paths to absolute URLs in package READMEs ([1da8173](https://github.com/weyoss/redis-smq/commit/1da817349fed106e0551fdb069321609cc373c8c))

## [9.0.0-next.17](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.16...v9.0.0-next.17) (2025-11-07)

### 📝 Documentation

- **redis-smq-rest-api:** restructure README, move details to separate files ([faa4157](https://github.com/weyoss/redis-smq/commit/faa4157cbfc2c8699d1fb7e830f4bb881126d075))
- standardize documentation links to use relative paths ([56f25b2](https://github.com/weyoss/redis-smq/commit/56f25b2dfff77708bb99c94f9d3f72caa6b1105b))

## [9.0.0-next.16](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.15...v9.0.0-next.16) (2025-11-05)

### ♻️ Code Refactoring

- **redis-smq-rest-api:** remove QueueExplorerError from API error list ([9a0fa15](https://github.com/weyoss/redis-smq/commit/9a0fa15ce151d9c2c67396232a634c8eab32b3e4))

## [9.0.0-next.15](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.14...v9.0.0-next.15) (2025-10-31)

### ♻️ Code Refactoring

- **redis-smq-rest-api:** update message audit config and error classes ([f490cac](https://github.com/weyoss/redis-smq/commit/f490cac51b73637301c6e3ee9a73ec0730cfc6b9))

### ✅ Tests

- **redis-smq-rest-api:** fix expected configuration object keys ([5dfd409](https://github.com/weyoss/redis-smq/commit/5dfd409a3ddfd1f7ca3677d88112b5399f95ce6d))

## [9.0.0-next.14](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.13...v9.0.0-next.14) (2025-10-28)

### ⚠ BREAKING CHANGES

- **redis-smq-rest-api:** reorganize Swagger UI routing

### ♻️ Code Refactoring

- **redis-smq-rest-api:** reorganize Swagger UI routing ([5278bda](https://github.com/weyoss/redis-smq/commit/5278bda865d15aa5b6c20ef2457a83b2bcdd8c0a))

## [9.0.0-next.13](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.12...v9.0.0-next.13) (2025-10-28)

### 🚀 Chore

- **redis-smq-rest-api:** fix security vulnerabilities by upgrading koa to v3.1.1 ([0ee4285](https://github.com/weyoss/redis-smq/commit/0ee4285fed1ab398609d964fbed9af373553b735))

## [9.0.0-next.12](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.11...v9.0.0-next.12) (2025-10-27)

### 📝 Documentation

- fix license section formatting and standardize project names ([9752491](https://github.com/weyoss/redis-smq/commit/9752491d72f19a5b470f95f6afb79bdb132b78f2))

## [9.0.0-next.11](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.10...v9.0.0-next.11) (2025-10-27)

### 🐛 Bug Fixes

- correct codecov badge URL format ([2b9e3f0](https://github.com/weyoss/redis-smq/commit/2b9e3f09d923d6e2310ef447bc1be60180af200d))

## [9.0.0-next.10](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.9...v9.0.0-next.10) (2025-10-26)

### 🐛 Bug Fixes

- **redis-smq-rest-api:** add missing RoutingKeyRequiredError to error mappings ([0ed55de](https://github.com/weyoss/redis-smq/commit/0ed55de5871248f0671e85d5b9c56bf1db5d84ab))

## [9.0.0-next.9](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.8...v9.0.0-next.9) (2025-10-21)

**Note:** Version bump only for package redis-smq-rest-api

## [9.0.0-next.8](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.7...v9.0.0-next.8) (2025-10-18)

**Note:** Version bump only for package redis-smq-rest-api

## [9.0.0-next.7](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.6...v9.0.0-next.7) (2025-10-13)

**Note:** Version bump only for package redis-smq-rest-api

## [9.0.0-next.6](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.5...v9.0.0-next.6) (2025-10-13)

**Note:** Version bump only for package redis-smq-rest-api

## [9.0.0-next.5](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.4...v9.0.0-next.5) (2025-10-12)

### ✨ Features

- **redis-smq-rest-api:** add configuration endpoint ([35bdb00](https://github.com/weyoss/redis-smq/commit/35bdb00b12d7066613b0866f8bc22d56246484be))

### 🚀 Chore

- **redis-smq-rest-api:** update dependencies to latest versions ([47c738d](https://github.com/weyoss/redis-smq/commit/47c738de6fe43dc0d8cfa751c4cb28d8a715e7e2))

### 📝 Documentation

- add GitHub note callouts in README files ([4c42582](https://github.com/weyoss/redis-smq/commit/4c42582dbfa3349a3d414a39a1f41a1e372913c0))
- standardize "next" branch reference ([ba24b3b](https://github.com/weyoss/redis-smq/commit/ba24b3bac54af4c2658699e0866c27bec4febdfc))
- update README files for next branch with pre-release badges and doc links ([005ccf4](https://github.com/weyoss/redis-smq/commit/005ccf411df460984615a4101b385a2d8023dab5))

## [9.0.0-next.4](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.3...v9.0.0-next.4) (2025-10-09)

### ⚠ BREAKING CHANGES

- **redis-smq-rest-api:** add exchange API endpoints for direct, fanout, and topic exchanges

### ✨ Features

- **redis-smq-rest-api:** add exchange API endpoints for direct, fanout, and topic exchanges ([47ed7b6](https://github.com/weyoss/redis-smq/commit/47ed7b64115d3ef85e41ad5b4dce84303854ca06))
- **redis-smq-rest-api:** add GET endpoint for namespace exchanges ([c351f9c](https://github.com/weyoss/redis-smq/commit/c351f9c3698fb36e561fcf61762352d6c2addf3b))
- **redis-smq:** add create method to exchange implementations ([f5285a2](https://github.com/weyoss/redis-smq/commit/f5285a2f3af1800c6d98a87681378e9bae3b3279))

### ♻️ Code Refactoring

- **redis-smq-rest-api:** improve mappings generation script, simplify build process ([105ec1e](https://github.com/weyoss/redis-smq/commit/105ec1eb9de22b88b4853e4ea74459c1e6514f4b))
- **redis-smq-rest-api:** use RedisSMQ factory methods,auto-generate error mappings ([2f5ba94](https://github.com/weyoss/redis-smq/commit/2f5ba94042423ba732b5d441a45bd072333bb538))

### ✅ Tests

- **redis-smq-rest-api:** fix exchanges sorting in getExchangesController.test.ts ([9ac0a41](https://github.com/weyoss/redis-smq/commit/9ac0a41a3a1dfca75f39d9facf6b8d99f60ba83e))

## [9.0.0-next.3](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.2...v9.0.0-next.3) (2025-09-09)

### 🐛 Bug Fixes

- **redis-smq-rest-api:** update peer dependencies ([7e53873](https://github.com/weyoss/redis-smq/commit/7e5387325512a545665ccec5641391cbdf1d41e0))

### 📝 Documentation

- **redis-smq-rest-api:** add Redis client installation instructions ([42f852c](https://github.com/weyoss/redis-smq/commit/42f852c01b39a323ab9db292168950e1ce62efd2))
- **redis-smq-rest-api:** update CLI options documentation ([7b25eea](https://github.com/weyoss/redis-smq/commit/7b25eea9d64ee5c663d5e31528092084afea31bf))
- **redis-smq-rest-api:** update configuration and usage examples ([2766f69](https://github.com/weyoss/redis-smq/commit/2766f69f2e8a8c699d401730055d3a667f2c79a0))

### ♻️ Code Refactoring

- **redis-smq-rest-api:** improve CLI configuration and config parsing ([22d59b8](https://github.com/weyoss/redis-smq/commit/22d59b8a30962f84ea4590400cf48a1fed84ed03))

## [9.0.0-next.2](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.1...v9.0.0-next.2) (2025-09-07)

### 🐛 Bug Fixes

- **redis-smq-rest-api:** add shebang to CLI script for proper execution ([5230cb0](https://github.com/weyoss/redis-smq/commit/5230cb025a648f85bbb65cc4e93ddf50ca7c401e))
- **redis-smq-rest-api:** set default Redis database to 0 ([bb9ef29](https://github.com/weyoss/redis-smq/commit/bb9ef292e301230aa69dd66d902b3b102a61f965))

### 📝 Documentation

- **redis-smq-rest-api:** remove outdated prerequisites section ([7e1f961](https://github.com/weyoss/redis-smq/commit/7e1f96130415fb1a46c4d6b1c2a3ca7b9508256a))
- update installation instructions to include required deps ([e6d414d](https://github.com/weyoss/redis-smq/commit/e6d414d0f0ff7ab0b6bed4beab8dcfbd968b9751))

## [9.0.0-next.1](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.0...v9.0.0-next.1) (2025-09-06)

### 📝 Documentation

- **redis-smq-rest-api:** add CLI usage documentation and examples ([9ff748b](https://github.com/weyoss/redis-smq/commit/9ff748b0901daeecd3b16b1a4c5c05190840dbbd))

## [9.0.0-next.0](https://github.com/weyoss/redis-smq/compare/v8.3.1...v9.0.0-next.0) (2025-09-06)

### ⚠ BREAKING CHANGES

- **redis-smq-rest-api:** implement missing API endpoints

### ✨ Features

- **redis-smq-rest-api:** implement missing API endpoints ([838fe4f](https://github.com/weyoss/redis-smq/commit/838fe4f66f2b2217d17309a591a92d726aca6697))

### 🐛 Bug Fixes

- **redis-smq-rest-api:** correct import path for routing module ([8a0edf6](https://github.com/weyoss/redis-smq/commit/8a0edf6188241f5944f66d9ac06435eed3df3ec3))

## [8.3.1](https://github.com/weyoss/redis-smq/compare/v8.3.0...v8.3.1) (2025-05-06)

**Note:** Version bump only for package redis-smq-rest-api

## [8.3.0](https://github.com/weyoss/redis-smq/compare/v8.2.1...v8.3.0) (2025-05-04)

**Note:** Version bump only for package redis-smq-rest-api

## [8.2.1](https://github.com/weyoss/redis-smq/compare/v8.2.0...v8.2.1) (2025-04-22)

**Note:** Version bump only for package redis-smq-rest-api

## [8.2.0](https://github.com/weyoss/redis-smq/compare/v8.1.0...v8.2.0) (2025-04-20)

### 📝 Documentation

- **redis-smq-rest-api:** update package name reference in README ([daac8fb](https://github.com/weyoss/redis-smq/commit/daac8fb3e456bd3446c5962a72194eb9888517f6))

## [8.1.0](https://github.com/weyoss/redis-smq/compare/v8.0.3...v8.1.0) (2025-04-16)

**Note:** Version bump only for package redis-smq-rest-api

## [8.0.3](https://github.com/weyoss/redis-smq/compare/v8.0.2...v8.0.3) (2025-04-14)

**Note:** Version bump only for package redis-smq-rest-api

## [8.0.2](https://github.com/weyoss/redis-smq/compare/v8.0.1...v8.0.2) (2025-04-14)

### 📝 Documentation

- reorganize and enhance documentation across packages ([128d333](https://github.com/weyoss/redis-smq/commit/128d33329adc9e4659a07f42fc552ede618e1a57))

## [8.0.1](https://github.com/weyoss/redis-smq/compare/v8.0.0...v8.0.1) (2025-04-13)

### 📝 Documentation

- **redis-smq-rest-api:** update README ([a9602b2](https://github.com/weyoss/redis-smq/commit/a9602b2bdc2a1dca978417c89e72057dd55f9ce4))

## [8.0.0](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.36...v8.0.0) (2025-04-13)

**Note:** Version bump only for package redis-smq-rest-api

## [8.0.0-rc.36](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.35...v8.0.0-rc.36) (2025-04-11)

### ♻️ Code Refactoring

- **redis-smq-common:** download and use pre-built Redis binaries ([e71be54](https://github.com/weyoss/redis-smq/commit/e71be54919f185613fffb08a7c977700fea9fbf6))

## [8.0.0-rc.35](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.34...v8.0.0-rc.35) (2025-03-22)

### 📦‍ Build System

- **redis-smq-rest-api:** include schema.json in npm package ([3fe2f64](https://github.com/weyoss/redis-smq/commit/3fe2f6419451779eff22ed5be85c716ef0fe41e9))

## [8.0.0-rc.34](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.33...v8.0.0-rc.34) (2025-03-22)

### 📦‍ Build System

- update repository links and issue tracking ([dba6935](https://github.com/weyoss/redis-smq/commit/dba69352c507b9e2ed963b1af074fa362cd2554d))

## [8.0.0-rc.33](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.32...v8.0.0-rc.33) (2025-03-22)

### 📦‍ Build System

- update .npmignore files to properly include source files ([0be9bc3](https://github.com/weyoss/redis-smq/commit/0be9bc3832f4953d7ddb67ba9bd18971e408092c))

## [8.0.0-rc.32](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.31...v8.0.0-rc.32) (2025-03-22)

### 📦‍ Build System

- update .npmignore files to include only essential files ([6f7e7d8](https://github.com/weyoss/redis-smq/commit/6f7e7d83f655d4b47fc971dbf6fb2dfc7b531b6d))

## [8.0.0-rc.31](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.30...v8.0.0-rc.31) (2025-03-22)

### ⚠ BREAKING CHANGES

- merge redis-server and net utils into redis-smq-common

### ♻️ Code Refactoring

- merge redis-server and net utils into redis-smq-common ([9340e57](https://github.com/weyoss/redis-smq/commit/9340e578677796daf7dc2ffe5f7d5127072c61b7))

## [8.0.0-rc.30](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.29...v8.0.0-rc.30) (2025-03-21)

### 🚀 Chore

- migrate to monorepo structure ([37e0142](https://github.com/weyoss/redis-smq/commit/37e0142cfc140990d9367ee260ba2b08a82d626a))

### 📝 Documentation

- update README files with latest release and coverage badges ([8eabf08](https://github.com/weyoss/redis-smq/commit/8eabf08d53fdf313d0e2708672f89c5386700ef6))

### ✅ Tests

- remove unused data directory parameter from startRedisServer ([c1572b4](https://github.com/weyoss/redis-smq/commit/c1572b4ddae7e37a9ad70fed7eac3d6291df9ddd))

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
