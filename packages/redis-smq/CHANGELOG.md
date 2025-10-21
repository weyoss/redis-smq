# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [9.0.0-next.9](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.8...v9.0.0-next.9) (2025-10-21)

### 🐛 Bug Fixes

- **redis-smq:** add missing RoutingKeyRequiredError class ([2a76b66](https://github.com/weyoss/redis-smq/commit/2a76b668a698cd79f8cb437a642d5062067cd149))

### 📝 Documentation

- **redis-smq:** update documentation and improve md formatting ([c659b9f](https://github.com/weyoss/redis-smq/commit/c659b9f8f4b026d731ddaf94228ce871ee56f14a))

### ♻️ Code Refactoring

- **redis-smq:** rename QueueConsumerGroupsCache to PubSubTargetResolver, clean up Producer docs ([1ea5669](https://github.com/weyoss/redis-smq/commit/1ea566959e97b0b695cea85b9f2117903273320d))

## [9.0.0-next.8](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.7...v9.0.0-next.8) (2025-10-18)

### ✨ Features

- **redis-smq:** make consumerGroupId optional for PubSub queue consumers ([0529efd](https://github.com/weyoss/redis-smq/commit/0529efd3ab38ba6f423143af344b30d2ef1cc4a4))

### 🐛 Bug Fixes

- **redis-smq:** check consumer group existence when relevant ([1711ac1](https://github.com/weyoss/redis-smq/commit/1711ac1db83ae8ca1e65947c33ca2878f49e15ed))

### 📝 Documentation

- **redis-smq:** clarify consumer group behavior for PubSub queues ([84f0e48](https://github.com/weyoss/redis-smq/commit/84f0e484bdca19085d067d738bb9d1adaa825ca1))

## [9.0.0-next.7](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.6...v9.0.0-next.7) (2025-10-13)

**Note:** Version bump only for package redis-smq

## [9.0.0-next.6](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.5...v9.0.0-next.6) (2025-10-13)

**Note:** Version bump only for package redis-smq

## [9.0.0-next.5](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.4...v9.0.0-next.5) (2025-10-12)

### 🚀 Chore

- **redis-smq:** update dependencies to latest versions ([6864c71](https://github.com/weyoss/redis-smq/commit/6864c712ad8596fc461e5825b8a9d6d2d422095e))

### 📝 Documentation

- add GitHub note callouts in README files ([86e855a](https://github.com/weyoss/redis-smq/commit/86e855ae7aea91e3295301671b8da3249164ea40))
- fix navigation breadcrumb ([63ec998](https://github.com/weyoss/redis-smq/commit/63ec998fa01613479a984813959a1361336c5f92))
- **redis-smq:** update docs and clean up ([66ed0b8](https://github.com/weyoss/redis-smq/commit/66ed0b8bff775bae6083cee5d958c64d19d71b2c))
- standardize "next" branch reference ([15f3e4f](https://github.com/weyoss/redis-smq/commit/15f3e4f4347fd4f76f9dc167dd72f174f178ab8e))
- streamline and improve documentation structure and readability ([b3aabab](https://github.com/weyoss/redis-smq/commit/b3aabab6bf036d5e8a9908de746bbe7d86422920))
- update README files for next branch with pre-release badges and doc links ([463250b](https://github.com/weyoss/redis-smq/commit/463250bbd754d44ae6741abcf4e2d62995aef620))

## [9.0.0-next.4](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.3...v9.0.0-next.4) (2025-10-09)

### ⚠ BREAKING CHANGES

- **redis-smq:** modernize exchange system with unified API and enhanced routing

### ✨ Features

- **redis-smq:** add create method to exchange implementations ([1e6fb75](https://github.com/weyoss/redis-smq/commit/1e6fb7559ff95b8e15e294f898da91539c4690e3))
- **redis-smq:** add factory methods for exchange types ([6a670df](https://github.com/weyoss/redis-smq/commit/6a670df688f662b993126791f758df0c2e8c8839))
- **redis-smq:** implement simplified API,connection pooling,and reorganize architecture ([fb81554](https://github.com/weyoss/redis-smq/commit/fb81554a5aac9edebcfc6287415c9dba0f4b3492))
- **redis-smq:** modernize exchange system with unified API and enhanced routing ([20380ee](https://github.com/weyoss/redis-smq/commit/20380eeaf56ee89c88aaadcb606a9dd192411e94))

### 🐛 Bug Fixes

- **redis-smq:** validate topic exchange params as regex patterns ([c618c4a](https://github.com/weyoss/redis-smq/commit/c618c4ab173ecdef806693eeea3d4b890cee6a24))

### 📝 Documentation

- **redis-smq:** add create method documentation, fix parameter ordering in exchange API reference ([ece7513](https://github.com/weyoss/redis-smq/commit/ece7513a03fe50adfa48528ae7886b22b99bd4c6))
- **redis-smq:** add JSDoc documentation for ExchangeTopic class ([ffbff17](https://github.com/weyoss/redis-smq/commit/ffbff175de1b658ef29a33fd46b790498bead130))
- **redis-smq:** rewrite message exchanges documentation ([c237de6](https://github.com/weyoss/redis-smq/commit/c237de635078aa9d16b50ce5e056d460f6eb0e8e))
- **redis-smq:** update and clean up documentation ([127377e](https://github.com/weyoss/redis-smq/commit/127377e70e46c7251526532b524a409ed080c8ed))
- **redis-smq:** update API documentation and clean up ([2c41ed6](https://github.com/weyoss/redis-smq/commit/2c41ed65aa40d1522b0a8ddf94ce50759e71dec4))
- **redis-smq:** update API reference ([783e971](https://github.com/weyoss/redis-smq/commit/783e97150fef38a10b08c01c5b5836fdec362cb7))
- **redis-smq:** update API reference for modernized exchange system ([aec4544](https://github.com/weyoss/redis-smq/commit/aec4544ef717de55e876dc4418e9d191dc044189))
- **redis-smq:** update JSDoc for ExchangeFanout class ([c847f3d](https://github.com/weyoss/redis-smq/commit/c847f3deda24905f15dbf1d036e9bfa33577fbf1))
- **redis-smq:** update topic exchange documentation ([33cc9a4](https://github.com/weyoss/redis-smq/commit/33cc9a4826ac49023b6d47734b03f69cd10691c7))
- rewrite README and configuration documentation for v9 simplified API ([8ce2923](https://github.com/weyoss/redis-smq/commit/8ce29232c2ebfbb7fdfae690a8305dce48ec541a))

### ♻️ Code Refactoring

- **redis-smq:** improve Configuration class documentation and initialization ([c6cddb9](https://github.com/weyoss/redis-smq/commit/c6cddb9ce284dd53898823d09552c8eed906b5ad))
- **redis-smq:** integrate connection pooling and reorganize error handling ([fa61afb](https://github.com/weyoss/redis-smq/commit/fa61afbd7c2538383b086c200b275749c5b96314))
- **redis-smq:** migrate test utilities to use RedisConnectionPool ([995caff](https://github.com/weyoss/redis-smq/commit/995caff236470dc7fd862a1fc31e35ae65bfd34d))
- **redis-smq:** migrate test utilities to use RedisSMQ factory methods ([1ed1300](https://github.com/weyoss/redis-smq/commit/1ed13005311215cb73ecbc61fa186065c483e07e))
- **redis-smq:** rename config getter functions to use parse prefix ([800cbaf](https://github.com/weyoss/redis-smq/commit/800cbaf8a84a50755b1472bd9069a624c3c2a444))
- **redis-smq:** reorganize imports and codebase structure ([e36d830](https://github.com/weyoss/redis-smq/commit/e36d830eef09a66a3a1b317626d725c3f730e2ce))
- **redis-smq:** update copyright headers ([7c774ab](https://github.com/weyoss/redis-smq/commit/7c774ab3b669b082264166a436f25ebd37fe3a7a))
- **redis-smq:** use IRedisClient interface instead of RedisClient class ([d60152c](https://github.com/weyoss/redis-smq/commit/d60152c752ce9a7f47ff56c31a934c7bde6d3564))

## [9.0.0-next.3](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.2...v9.0.0-next.3) (2025-09-09)

### 🐛 Bug Fixes

- **redis-smq:** add optional Redis client peer dependencies ([3e74721](https://github.com/weyoss/redis-smq/commit/3e747210705757780d22eb51c420300aa64a1516))

### 📝 Documentation

- **redis-smq:** fix API documentation links ([fc3c5c3](https://github.com/weyoss/redis-smq/commit/fc3c5c3101dc02d2919e2dcf232e98ebe582f8c6))
- **redis-smq:** update API documentation for configuration interfaces ([e825efa](https://github.com/weyoss/redis-smq/commit/e825efabbeecc658b25431155913b3ae00a8b784))

### ♻️ Code Refactoring

- **redis-smq:** improve configuration parsing ([5d84781](https://github.com/weyoss/redis-smq/commit/5d847814c260bf6e85e01e2afd54322f7b312eb7))

## [9.0.0-next.2](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.1...v9.0.0-next.2) (2025-09-07)

**Note:** Version bump only for package redis-smq

## [9.0.0-next.1](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.0...v9.0.0-next.1) (2025-09-06)

### 🐛 Bug Fixes

- **redis-smq:** update Redis data structure version ([65f4dd2](https://github.com/weyoss/redis-smq/commit/65f4dd2a7e9f30d8d2367b4cead25024c1097f06))

## [9.0.0-next.0](https://github.com/weyoss/redis-smq/compare/v8.3.1...v9.0.0-next.0) (2025-09-06)

### ⚠ BREAKING CHANGES

- **redis-smq-rest-api:** implement missing API endpoints
- **redis-smq:** improve message lifecycle observability

### ✨ Features

- **redis-smq-rest-api:** implement missing API endpoints ([fdb6388](https://github.com/weyoss/redis-smq/commit/fdb63882876e8d39c3a41a1e620f575af752f06b))
- **redis-smq:** improve message lifecycle observability ([159e6f1](https://github.com/weyoss/redis-smq/commit/159e6f1a9b408a9194bf725f062852ac4d650ec9))

### 📝 Documentation

- **redis-smq:** add message storage documentation ([2f37b0f](https://github.com/weyoss/redis-smq/commit/2f37b0f236ed61024802f3476800b7989d6bf8fc))
- **redis-smq:** add QueuePendingMessages class to configuration docs ([6edb61e](https://github.com/weyoss/redis-smq/commit/6edb61e8d85ac6b8c49061398ed090f605909b95))
- **redis-smq:** improve message storage documentation and class references ([7b14780](https://github.com/weyoss/redis-smq/commit/7b1478081fc05d3d3c81cbb2e4d5e0ccecf6b9fc))
- **redis-smq:** update API documentation format and structure ([a7eab77](https://github.com/weyoss/redis-smq/commit/a7eab7779f2eb7fca5b9379dadbb5c36dbf7a756))

## [8.3.1](https://github.com/weyoss/redis-smq/compare/v8.3.0...v8.3.1) (2025-05-06)

### ⚡ Performance Improvements

- **redis-smq:** optimize and clean up LUA scripts for better Redis performance ([1f8b128](https://github.com/weyoss/redis-smq/commit/1f8b128716e2686bd7d145efaef9b0c9a28daa65))

## [8.3.0](https://github.com/weyoss/redis-smq/compare/v8.2.1...v8.3.0) (2025-05-04)

### 🐛 Bug Fixes

- **redis-smq:** make message deletion more resilient to race conditions and inconsistent states ([3c07bae](https://github.com/weyoss/redis-smq/commit/3c07baee7df4e350d54d4c354d1f2604f8b773ae))

### 📝 Documentation

- **redis-smq:** update class references ([d30542e](https://github.com/weyoss/redis-smq/commit/d30542e89faa2f511ff4fa0f2640446b0c591d89))

### ♻️ Code Refactoring

- **redis-smq:** improve callback patterns and use new async utils ([8cff0d2](https://github.com/weyoss/redis-smq/commit/8cff0d2968561899c30156554aa89420c0fa8479))

## [8.2.1](https://github.com/weyoss/redis-smq/compare/v8.2.0...v8.2.1) (2025-04-22)

### 🐛 Bug Fixes

- **redis-smq:** use correct cursor for SSCAN operation, clean up ([33828ed](https://github.com/weyoss/redis-smq/commit/33828ed9621d5b126677e11ec1d42ac420dd380c))

### 📝 Documentation

- **redis-smq:** add pageSize to IQueueMessagesPageParams typing ([32bf04f](https://github.com/weyoss/redis-smq/commit/32bf04f522df2b68f26eb8a4cf1d911e83829a06))
- **redis-smq:** improve logging and documentation ([ed477db](https://github.com/weyoss/redis-smq/commit/ed477dbde9f73f27051d8e857b2b5121aef8f626))

### ✅ Tests

- **redis-smq:** add new tests for queue message storage implementations ([5697e58](https://github.com/weyoss/redis-smq/commit/5697e587abe2e99e4d3a35c194d9034561b1c4d8))

## [8.2.0](https://github.com/weyoss/redis-smq/compare/v8.1.0...v8.2.0) (2025-04-20)

### ✨ Features

- **redis-smq:** enhance logging with detailed debug information ([3935682](https://github.com/weyoss/redis-smq/commit/39356824d769f68165c82fcfd4fcb020aabe5822))

### 🐛 Bug Fixes

- **redis-smq:** await async queue consumers retrieval in test ([0b1f727](https://github.com/weyoss/redis-smq/commit/0b1f727b716c785da271a0410a8c9fd8082e0079))

### 📝 Documentation

- **redis-smq:** fix typos and enhance API documentation ([aabf2fa](https://github.com/weyoss/redis-smq/commit/aabf2faf385fd0f8766f24a868c6dc75a55deaf1))
- **redis-smq:** update configuration examples ([906193e](https://github.com/weyoss/redis-smq/commit/906193ea57158e20a7ae7446aa562e38d820f89d))
- update logs documentation link ([9561f31](https://github.com/weyoss/redis-smq/commit/9561f31282440624dcef02edb694dc311590d921))
- update redis-smq references ([79bdc4c](https://github.com/weyoss/redis-smq/commit/79bdc4c934b61bd07486738fdfa67a289f6f8127))
- update redis-smq-common references ([d8d9fc3](https://github.com/weyoss/redis-smq/commit/d8d9fc380591f9d83e3885513e74d1dc82749e0c))

## [8.1.0](https://github.com/weyoss/redis-smq/compare/v8.0.3...v8.1.0) (2025-04-16)

### 🐛 Bug Fixes

- **redis-smq:** prevent duplicate message publishing for scheduled tasks ([18b1bd9](https://github.com/weyoss/redis-smq/commit/18b1bd9a6c88f714972c35cc0445c67ad8aa64e3))

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

### 📝 Documentation

- reorganize and enhance documentation across packages ([212fe75](https://github.com/weyoss/redis-smq/commit/212fe75143f1c446045c346e460065215e98f1d7))

## [8.0.1](https://github.com/weyoss/redis-smq/compare/v8.0.0...v8.0.1) (2025-04-13)

### 📝 Documentation

- **redis-smq:** update links to REST API and Web UI documentation ([77a923d](https://github.com/weyoss/redis-smq/commit/77a923d5670405c8e06b4e5807969aed5543ec95))

### ♻️ Code Refactoring

- **redis-smq:** improve redis-keys module with better organization and documentation ([850116d](https://github.com/weyoss/redis-smq/commit/850116ddcc1f25a9dcd589842fde0fa1fe098cda))
- **redis-smq:** update key prefix with version-based naming scheme ([6af3840](https://github.com/weyoss/redis-smq/commit/6af384080cbc2c6772e1cc134a515cbf21eeffcb))

## [8.0.0](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.36...v8.0.0) (2025-04-13)

**Note:** Version bump only for package redis-smq

## [8.0.0-rc.36](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.35...v8.0.0-rc.36) (2025-04-11)

### ♻️ Code Refactoring

- **redis-smq-common:** download and use pre-built Redis binaries ([9a3d244](https://github.com/weyoss/redis-smq/commit/9a3d244599b97732bfaa544e44fa7b39fddaef56))

## [8.0.0-rc.35](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.34...v8.0.0-rc.35) (2025-03-22)

**Note:** Version bump only for package redis-smq

## [8.0.0-rc.34](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.33...v8.0.0-rc.34) (2025-03-22)

**Note:** Version bump only for package redis-smq

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

## [8.0.0-rc.29](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.28...v8.0.0-rc.29) (2025-02-14)

### Bug Fixes

- **deps:** regenerate package-lock.json ([dc55c81](https://github.com/weyoss/redis-smq/commit/dc55c8101e9b57d2607ee47a78db7861d17623ab))

### Documentation

- **api:** update API documentation and references ([08f85ae](https://github.com/weyoss/redis-smq/commit/08f85ae0c963497d4200fcdfdeccc4aa83d3e60b))
- **contributing:** update guidelines and improve language ([c2feb57](https://github.com/weyoss/redis-smq/commit/c2feb57429513abb4b8973fc0bb6000377712f2c))
- **README:** update installation and usage instructions ([cfe19e4](https://github.com/weyoss/redis-smq/commit/cfe19e4f88cf5a5059ecb8567f1cbc16524008de))

### Codebase Refactoring

- remove unnecessary factory patterns ([3ed3a7d](https://github.com/weyoss/redis-smq/commit/3ed3a7d8056fae3c253f8af5b6b5f3f0d591945f))
- **tests:** update imports and usage of EventBus and RedisClient ([f9dca11](https://github.com/weyoss/redis-smq/commit/f9dca11015e3d02fddccc8f442facb2bf008236a))

### Misc

- **deps:** update redis-smq-common to 3.0.0-rc.17 ([324d6f1](https://github.com/weyoss/redis-smq/commit/324d6f12fc82da8762f442c110a9351cce3c3505))

## [8.0.0-rc.28](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.27...v8.0.0-rc.28) (2025-02-05)

### Bug Fixes

- **message:** revert back shutdown method to arrow function ([c4e5ceb](https://github.com/weyoss/redis-smq/commit/c4e5cebb4d9fbd91889618669765698cb80cd044))

### Documentation

- **api:** enhance class documentation with detailed descriptions and examples ([67f8a21](https://github.com/weyoss/redis-smq/commit/67f8a21c039e41301e8bfcf2c4ffc4319b02424d))
- **api:** separate error classes from main classes ([4aa850e](https://github.com/weyoss/redis-smq/commit/4aa850ed5411906d4a38c32a673cf2021498c294))
- **README:** update HTTP REST API reference link ([9e20a6c](https://github.com/weyoss/redis-smq/commit/9e20a6c08bf47b1a581129f922c9922c64cb7e3d))
- update logo, improve content readability ([7c921d4](https://github.com/weyoss/redis-smq/commit/7c921d406e05961d92769f2a43c40f7fa955d5fa))

### Codebase Refactoring

- improve code structure and readability ([5b4a47c](https://github.com/weyoss/redis-smq/commit/5b4a47cdc1139507a724d1d48202f6d8c6074174))

# Changelog

## [8.0.0-rc.27](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.26...v8.0.0-rc.27) (2025-01-09)

### Continuous Integration

- fix broken CHANGELOG.md for v8.0.0-rc.26 ([a20b40e](https://github.com/weyoss/redis-smq/commit/a20b40ec343ab07a1a0ef80f4bf7625ed27ba9ec))

## [8.0.0-rc.26](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.25...v8.0.0-rc.26) (2025-01-09)

### Documentation

- update API reference ([b7d0f6f](https://github.com/weyoss/redis-smq/commit/b7d0f6f4e078557021854d33fd301980dab7782b))

### Codebase Refactoring

- use queue-scoped workers instead of global ones ([ada94e0](https://github.com/weyoss/redis-smq/commit/ada94e09d17f58488b1596c70b4f657110cc8b79))

### Continuous Integration

- add support for node.js v22 ([a15d62e](https://github.com/weyoss/redis-smq/commit/a15d62e49b609fb63b90082af53a0a23613677e8))
- upgrade eslint and other deprecated dependencies ([c948298](https://github.com/weyoss/redis-smq/commit/c94829850c5cf04ca3240163669c242ba50ba9e2))

## [8.0.0-rc.25](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.24...v8.0.0-rc.25) (2024-07-07)

### Documentation

- add a link to redis-smq-rest-api ([a1ab6fc](https://github.com/weyoss/redis-smq/commit/a1ab6fc594b4d32de5f4e4257fbf46c2447f0018))

### Misc

- make redis-smq-common a peer dependency ([3b7dbab](https://github.com/weyoss/redis-smq/commit/3b7dbab7a14fc3b11aa75badc36a396727fb4f3b))

## [8.0.0-rc.24](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.23...v8.0.0-rc.24) (2024-05-15)

### Bug Fixes

- **namespace:** replace generic error in getNamespaceQueues() ([aa9c8e5](https://github.com/weyoss/redis-smq/commit/aa9c8e5a125bdf1fc8e200263618693671219882))
- **queue-rate-limit:** always validate queue existence ([538cf78](https://github.com/weyoss/redis-smq/commit/538cf786b3b3131f137d1488d6d130323acb571d))

### Documentation

- add new error classes reference ([6c39625](https://github.com/weyoss/redis-smq/commit/6c3962589537a83fe345e349743a798e73e751a6))

### Codebase Refactoring

- **queue-rate-limit:** move QueueRateLimit.set() logic to LUA ([d104a9c](https://github.com/weyoss/redis-smq/commit/d104a9c038ea321e5e18049bffefc54850d4294f))
- **queue:** return the original error instance ([14228ec](https://github.com/weyoss/redis-smq/commit/14228ec255776cabf2a9202078cd016f80b5f5da))

## [8.0.0-rc.23](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.22...v8.0.0-rc.23) (2024-05-10)

### Bug Fixes

- use namespaced errors ([637096b](https://github.com/weyoss/redis-smq/commit/637096baf1f1e201b3dc5cf381944dab608b296d))
- validate queue delivery model before adding consumer groups ([eebcae7](https://github.com/weyoss/redis-smq/commit/eebcae7da0364ffd8cf731e451dbfce3ed32fd11))

### Documentation

- add new error classes reference ([5f7427d](https://github.com/weyoss/redis-smq/commit/5f7427d0ed100624f10e3b9cc1b615bf9ae51730))
- update Message API reference ([9c1fa7a](https://github.com/weyoss/redis-smq/commit/9c1fa7a129dd159ad118276fd904232d71bde508))

### Tests

- use QueueMessagesConsumerGroupIdRequiredError class ([efb9821](https://github.com/weyoss/redis-smq/commit/efb98215b3bb93460ef07345fc447a286474b914))

## [8.0.0-rc.22](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.21...v8.0.0-rc.22) (2024-05-04)

### Features

- use more granular error classes for reporting errors ([2cc06c1](https://github.com/weyoss/redis-smq/commit/2cc06c1cfbf2fe19c5c0756638ff73806ce06529))

### Bug Fixes

- **exchange:** use more granular error classes for reporting errors ([3b3e640](https://github.com/weyoss/redis-smq/commit/3b3e6407cd6a2c1db8a3e68d58163447746cd5d0))

### Documentation

- add missing error classes ([e16ffea](https://github.com/weyoss/redis-smq/commit/e16ffead799a4a40020ba27b9daae306301efd1a))

## [8.0.0-rc.21](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.20...v8.0.0-rc.21) (2024-04-29)

### Bug Fixes

- **message:** correct logic for deleting multiple messages by IDs ([fdb39d6](https://github.com/weyoss/redis-smq/commit/fdb39d66f3cea59decf8ad29b5efdf827780ba73))

### Documentation

- improve RC release status description, clean up ([98910dc](https://github.com/weyoss/redis-smq/commit/98910dcef215494ccee4de01879d0e2f8037213d))
- update examples ([d80beb2](https://github.com/weyoss/redis-smq/commit/d80beb2af2472ac596a88531786a0ba2681e09dd))

### Codebase Refactoring

- optimize imports ([29a0efb](https://github.com/weyoss/redis-smq/commit/29a0efb9e46ce23a6fb14c44222cf987a05ee22a))
- remove unused error classes and clean up ([15bd959](https://github.com/weyoss/redis-smq/commit/15bd9591d58b5717ee5a8e8191df7388e65a768b))
- shorten imports ([3bfb8f1](https://github.com/weyoss/redis-smq/commit/3bfb8f1e39011e2f48039b2c534f0fe936b67759))

### Tests

- increase code coverage ([e9d84e8](https://github.com/weyoss/redis-smq/commit/e9d84e8b4a9a239246473ca770ce035ce8e66831))

### Misc

- clean up package.json ([ff9ff3d](https://github.com/weyoss/redis-smq/commit/ff9ff3d06f61c20f70bd55c34a545278713847d5))
- update LICENSE ([cb18d44](https://github.com/weyoss/redis-smq/commit/cb18d4449f851df803a0e2cd84410257cbfcfdfd))

## [8.0.0-rc.20](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.19...v8.0.0-rc.20) (2024-03-24)

### Bug Fixes

- include missing enums when exporting esm/cjs modules ([2ee6802](https://github.com/weyoss/redis-smq/commit/2ee680205dbde78af46f4e4347cdf4fa80adfe3b))

## [8.0.0-rc.19](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.18...v8.0.0-rc.19) (2024-03-24)

### Documentation

- fix incorrect generated anchor texts ([c4f523f](https://github.com/weyoss/redis-smq/commit/c4f523f9a17dbbb8510b35032cfecfc69905dd04))

## [8.0.0-rc.18](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.17...v8.0.0-rc.18) (2024-03-24)

### ⚠ BREAKING CHANGES

- rebase on redis-smq-common@3.0.0-rc.14

### Documentation

- update documentation and API reference ([3baaee6](https://github.com/weyoss/redis-smq/commit/3baaee6649c7bde47ce4c22c12ca4dc367ab301d))

### Codebase Refactoring

- do not throw errors for async functions ([582f355](https://github.com/weyoss/redis-smq/commit/582f35539c01e9b98a05fbd65b2247cba623524c))
- rebase on redis-smq-common@3.0.0-rc.14 ([2c5edbd](https://github.com/weyoss/redis-smq/commit/2c5edbd8debdf4599ddbb7ad42a37bc94fea14d1))

## [8.0.0-rc.17](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.16...v8.0.0-rc.17) (2024-01-30)

### Documentation

- add missing error classes ([753331e](https://github.com/weyoss/redis-smq/commit/753331e5ce4fb239cb29b3ae4c3246ba185b4d94))
- simplify and unify class/method naming and referencing ([0299b31](https://github.com/weyoss/redis-smq/commit/0299b314e843c28d52e2f767ace150e39652287c))

### Codebase Refactoring

- improve MessageHandler error handling ([957d257](https://github.com/weyoss/redis-smq/commit/957d257e66cce6faaf9dad5bf949cdd1198cfae8))

## [8.0.0-rc.16](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.15...v8.0.0-rc.16) (2024-01-28)

### Features

- allow running/sandboxing message handlers using worker threads ([53095bd](https://github.com/weyoss/redis-smq/commit/53095bd2689ccb2f701365bafb4ef8e550da82b3))

### Bug Fixes

- export message handler errors ([26d2689](https://github.com/weyoss/redis-smq/commit/26d26890da139d88c46ce220e3dda3d9c8e03aee))

### Documentation

- **ConsumeMessageWorker:** update docs and clean up ([140322e](https://github.com/weyoss/redis-smq/commit/140322e3520ee3db905ea977a159064f339aa7d2))
- fix broken links ([aad9010](https://github.com/weyoss/redis-smq/commit/aad9010e70ed332b154f4fbdcb8ac657a14fe6b9))
- update messages and queues documentation ([7c3d06e](https://github.com/weyoss/redis-smq/commit/7c3d06ed3765ffc14dfece4f725241aa4535e1e7))

### Codebase Refactoring

- **ConsumeMessageWorker:** improve typings ([66c6ca9](https://github.com/weyoss/redis-smq/commit/66c6ca948677f76d496fe0b988bd195e1a7108a2))

### Tests

- allow running/sandboxing message handlers using worker threads ([79e6886](https://github.com/weyoss/redis-smq/commit/79e688674ed11ec34ce2f74d5f15c8eefa129767))

## [8.0.0-rc.15](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.14...v8.0.0-rc.15) (2024-01-25)

### Features

- add Pub/Sub delivery model, refactor and clean up ([47affa1](https://github.com/weyoss/redis-smq/commit/47affa172eb2fc6943f660bea3feab3af1bc28ec))

### Documentation

- add a notification about the latest release, clean up ([904f196](https://github.com/weyoss/redis-smq/commit/904f196f1854059625b08af05fe5ceb1466d4a9f))
- add Pub/Sub delivery model, refactor and clean up ([32db9dd](https://github.com/weyoss/redis-smq/commit/32db9dd2772bc16568e03e6e216a7d0fd0a599a7))
- clean up ([c7d13a6](https://github.com/weyoss/redis-smq/commit/c7d13a639a1ed9f134ba3deb99d1e2a23223935a))

### Misc

- bump up redis-smq-common to v3.0.0-rc.8 ([d411849](https://github.com/weyoss/redis-smq/commit/d4118496263479036085ee09ceb5785ee497bb59))
- bump up redis-smq-common to v3.0.0-rc9 ([d372e9d](https://github.com/weyoss/redis-smq/commit/d372e9d98593934e9e9fb63efcd56cbad99202af))

## [8.0.0-rc.14](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.13...v8.0.0-rc.14) (2024-01-03)

### Documentation

- add new diagrams and update existing ones ([f5182b1](https://github.com/weyoss/redis-smq/commit/f5182b10b5179365edf68e7b6bf564ccc25281ab))
- **event-listeners:** add a link to IRedisSMQConfig interface ([a7635c5](https://github.com/weyoss/redis-smq/commit/a7635c5d811ad775123547a5696c78b030981269))
- scale down diagrams ([c3b37e4](https://github.com/weyoss/redis-smq/commit/c3b37e445a6d15fdcc8c7a73b713a1f7d5e7c94e))
- update exchange diagrams ([9dc05d6](https://github.com/weyoss/redis-smq/commit/9dc05d6cd835d779b9d183e83f562c7991105c92))

### Codebase Refactoring

- **event-listeners:** clean up ([d9195e4](https://github.com/weyoss/redis-smq/commit/d9195e4e85e2e4519d238f5f3ecace37ae9bbb32))
- **exchanges:** improve typings ([97665fe](https://github.com/weyoss/redis-smq/commit/97665fed4a579af444c46e01a6b05f9adb12e888))
- **message:** handle various errors when deleting a message ([a4505ae](https://github.com/weyoss/redis-smq/commit/a4505ae7d95bda0185da28433c6737e395400e7b))

### Tests

- **message:** handle various errors when deleting a message ([ecf301b](https://github.com/weyoss/redis-smq/commit/ecf301b06aac1bf6d0fcb1ced962a32ac6a6ca68))

## [8.0.0-rc.13](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.12...v8.0.0-rc.13) (2023-12-23)

### ⚠ BREAKING CHANGES

- **event-listeners:** unify consumer/producer event listeners

### Documentation

- **event-listeners:** update documentation ([71100d3](https://github.com/weyoss/redis-smq/commit/71100d3aa94a61fb8ece86e439f0b120b66a6cab))

### Codebase Refactoring

- **event-listeners:** unify consumer/producer event listeners ([9e1a181](https://github.com/weyoss/redis-smq/commit/9e1a1811dd841d4329f0ee14e979d2770a7a6358))

### Tests

- **event-listeners:** unify consumer/producer event listeners ([2d14a07](https://github.com/weyoss/redis-smq/commit/2d14a077feda98933fb6c038bea5a33ad8d5f610))

## [8.0.0-rc.12](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.11...v8.0.0-rc.12) (2023-12-18)

### Misc

- update logo ([9bd373e](https://github.com/weyoss/redis-smq/commit/9bd373e693c57c8e18dddb5b0899c710e6de9492))

## [8.0.0-rc.11](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.10...v8.0.0-rc.11) (2023-12-18)

### Documentation

- **IConsumableMessage:** clean up ([5b5ce3a](https://github.com/weyoss/redis-smq/commit/5b5ce3aedd3e378cc74a2715da2ae1e98f41124f))

### Codebase Refactoring

- **MessageEnvelope:** clean up ([72140f6](https://github.com/weyoss/redis-smq/commit/72140f61742dd4e3cbe36a6c421bf5f0b5a2f7ac))
- rename \_createRMessage to \_createConsumableMessage ([7a138fd](https://github.com/weyoss/redis-smq/commit/7a138fdce633946d4f69a7c8aa4d78a019bc82df))

### Tests

- **ConsumableMessage:** increase code coverage ([3960c6e](https://github.com/weyoss/redis-smq/commit/3960c6ef72875fcdd0684eb1025afd0c0630c67c))

## [8.0.0-rc.10](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.9...v8.0.0-rc.10) (2023-12-17)

### ⚠ BREAKING CHANGES

- add ProducibleMessage/ConsumableMessage/MessageEnvelope

### Features

- add ProducibleMessage/ConsumableMessage/MessageEnvelope ([4a3eec7](https://github.com/weyoss/redis-smq/commit/4a3eec79575b2845d2c35ec478b89e4a5acb863d))

### Documentation

- add ProducibleMessage/ConsumableMessage/MessageEnvelope ([55aa68e](https://github.com/weyoss/redis-smq/commit/55aa68e17021afadad32ee2c1b9dfef6924449f5))
- **QueueMessages:** fix outdated class reference ([e6ae499](https://github.com/weyoss/redis-smq/commit/e6ae4991d4389e1d1602bd780f4e0d95e02e5606))
- update examples ([bbccf7c](https://github.com/weyoss/redis-smq/commit/bbccf7cb5a2a5dfe2eacaeabb097129cbdcf6720))

### Tests

- add ProducibleMessage/ConsumableMessage/MessageEnvelope ([2961a22](https://github.com/weyoss/redis-smq/commit/2961a221190307c4a4a8857fed9ec12622bdd10d))

### Misc

- update health-check ([81edb25](https://github.com/weyoss/redis-smq/commit/81edb255d081824143f147ed8d0faefe0948224f))

## [8.0.0-rc.9](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.8...v8.0.0-rc.9) (2023-12-11)

### Documentation

- update documentation ([85d6adb](https://github.com/weyoss/redis-smq/commit/85d6adb7e8db6cb4f427a34e8e510c11d2fc5bf0))

### Codebase Refactoring

- **MessageEnvelope:** improve setPriority/getPriority typings ([91c44f0](https://github.com/weyoss/redis-smq/commit/91c44f013d6ff757876a0e57dcec45869ab6a02a))

### Tests

- **MessageEnvelope:** improve setPriority/getPriority typings ([20fd6e5](https://github.com/weyoss/redis-smq/commit/20fd6e58e466ae425bba54d4d85adf4df888654b))

## [8.0.0-rc.8](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.7...v8.0.0-rc.8) (2023-12-11)

### ⚠ BREAKING CHANGES

- **Message:** remove Message.MessagePriority, add EMessagePriority
- **QueueMessages:** move message methods to Message,add MessageEnvelope

### Features

- **Message:** add getMessageStatus() method ([fda81fa](https://github.com/weyoss/redis-smq/commit/fda81fa7a3c4428799dfabef8581f0f3b39949e8))

### Bug Fixes

- **Message:** export missing error classes ([29e8817](https://github.com/weyoss/redis-smq/commit/29e8817fa805faed42ebd9a3fea469004552eec1))

### Documentation

- update documentation and examples ([8efb082](https://github.com/weyoss/redis-smq/commit/8efb08200ac1f2751c7e10e3492445badb2e4039))

### Codebase Refactoring

- **Message:** remove Message.MessagePriority, add EMessagePriority ([702a01d](https://github.com/weyoss/redis-smq/commit/702a01da987479a4f3b2127b9da0851d74046c10))
- **QueueMessages:** move message methods to Message,add MessageEnvelope ([f71f0d0](https://github.com/weyoss/redis-smq/commit/f71f0d06240e16b1519ae175793ae28470684d4f))

### Tests

- **Message:** add getMessageStatus() method ([76e97c4](https://github.com/weyoss/redis-smq/commit/76e97c48fdc86c2709db39b17a0ba55432157270))
- **Message:** remove Message.MessagePriority, add EMessagePriority ([88a1368](https://github.com/weyoss/redis-smq/commit/88a1368ff8e000f3f26141ec29fddc7f96a7103e))
- **QueueMessages:** move message methods to Message,add MessageEnvelope ([932a88e](https://github.com/weyoss/redis-smq/commit/932a88eee5bfd0dc020c8516f76e2d351d486fe3))

## [8.0.0-rc.7](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.6...v8.0.0-rc.7) (2023-12-09)

### ⚠ BREAKING CHANGES

- **QueueMessages:** remove redundant method deleteMessage()

### Documentation

- **QueueMessages:** remove redundant method deleteMessage() ([cdeb454](https://github.com/weyoss/redis-smq/commit/cdeb4543f859e108efdcaa61aeac15d3a325b0a5))

### Codebase Refactoring

- **QueueMessages:** remove redundant method deleteMessage() ([af21dff](https://github.com/weyoss/redis-smq/commit/af21dff9f6b959ed21aa4cbe812606c1efbf4046))

### Tests

- **QueueMessages:** remove redundant method deleteMessage() ([dfa3792](https://github.com/weyoss/redis-smq/commit/dfa37924a0a8e2fc726ce4a76baa535c79f0c917))

## [8.0.0-rc.6](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.5...v8.0.0-rc.6) (2023-12-09)

### ⚠ BREAKING CHANGES

- **QueueMessages:** rename deleteMessagesById to deleteMessageById

### Documentation

- **QueueMessages:** rename deleteMessagesById to deleteMessageById ([81cfb72](https://github.com/weyoss/redis-smq/commit/81cfb72a012e99398435418f52c8a24018759234))

### Codebase Refactoring

- **QueueMessages:** rename deleteMessagesById to deleteMessageById ([b3baf71](https://github.com/weyoss/redis-smq/commit/b3baf711e6210034aac256362418dd8d87859557))

## [8.0.0-rc.5](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.4...v8.0.0-rc.5) (2023-12-03)

### Documentation

- clean up ([2d7c004](https://github.com/weyoss/redis-smq/commit/2d7c004e690ca2f30a6de8d22feb5f4a3711eab9))

### Codebase Refactoring

- improve typings ([c86bb53](https://github.com/weyoss/redis-smq/commit/c86bb53969bbb919f115268cbf510c818af44066))

## [8.0.0-rc.4](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.3...v8.0.0-rc.4) (2023-12-02)

### Documentation

- clean up outdated examples ([dd1c68b](https://github.com/weyoss/redis-smq/commit/dd1c68bdd7cf7de2dfa309dbe7efff76fed5c983))

### Misc

- move redis-smq-common from dev-deps to deps ([675880d](https://github.com/weyoss/redis-smq/commit/675880d3803cca9c89aa860486bae43dbe7e2f70))

## [8.0.0-rc.3](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.2...v8.0.0-rc.3) (2023-12-02)

### Bug Fixes

- **scheduler:** handle unacked messages with retry delay correctly ([a97b145](https://github.com/weyoss/redis-smq/commit/a97b145f605d6b5c7d9f6f83c844c9d2447c5786))

### Documentation

- update Message reference ([1cff3e3](https://github.com/weyoss/redis-smq/commit/1cff3e3fe3634ffa2d502a4bbb589948ed8e56ea))
- update TRedisSMQEvent reference ([5afa22e](https://github.com/weyoss/redis-smq/commit/5afa22ea1d2de00cb9c4708c55ec8fe1ef5a39b5))

### Tests

- **message:** add new test cases covering message status ([9eec7e9](https://github.com/weyoss/redis-smq/commit/9eec7e9e2a39244ab62b9f8db4d049d3363a534d))

## [8.0.0-rc.2](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.1...v8.0.0-rc.2) (2023-11-27)

### ⚠ BREAKING CHANGES

- **events:** use typed events, remove legacy events
- add message status, return message IDs for produced messages

### Features

- add message status, return message IDs for produced messages ([56566bf](https://github.com/weyoss/redis-smq/commit/56566bf77d180a3b8a2baf0659f9bfc4861c71b3))
- **events:** use typed events, remove legacy events ([5f5a34f](https://github.com/weyoss/redis-smq/commit/5f5a34f11b51949c761a83301a087a682a105a89))

### Documentation

- **README.md:** update features description ([4ac300e](https://github.com/weyoss/redis-smq/commit/4ac300e71ef758d30f24810205732fd8b1d61b55))
- update configuration.md ([83ce680](https://github.com/weyoss/redis-smq/commit/83ce680d4ba06901d4b524c542036d8f661a8af4))
- use typed events, remove legacy events ([7c899f8](https://github.com/weyoss/redis-smq/commit/7c899f81f3eb66084d1b94b818d549800d453334))

### Tests

- add message status, return message IDs for produced messages ([8e3c228](https://github.com/weyoss/redis-smq/commit/8e3c22854940e7de3ab911e99cba64793b6ef7a5))
- use typed events, remove legacy events ([5d85cb0](https://github.com/weyoss/redis-smq/commit/5d85cb006b49cae97a214012e0f249399357c76a))

## [8.0.0-rc.1](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.0...v8.0.0-rc.1) (2023-11-21)

### Codebase Refactoring

- pass keyQueueMessages as a key for SCHEDULE_MESSAGE script ([f9f69b3](https://github.com/weyoss/redis-smq/commit/f9f69b3359c63702974946d9ae486b1a59a38485))

### Tests

- fix unpredictable error throwing when deleting a namespace ([4126670](https://github.com/weyoss/redis-smq/commit/4126670ca283073c42e69e80e5fc95f1eaf95a92))

### Misc

- update lint-staged configuration ([9543401](https://github.com/weyoss/redis-smq/commit/9543401acae6abed6eaa53aa9149e0306b2cad64))

## [8.0.0-rc.0](https://github.com/weyoss/redis-smq/compare/v7.2.3...v8.0.0-rc.0) (2023-11-20)

### ⚠ BREAKING CHANGES

- use latest redis-smq-common release, fix breaking changes

### Features

- allow to track a published message by its ID ([5f702d2](https://github.com/weyoss/redis-smq/commit/5f702d251a5b1f43c0364d6ce96a667d4f79d700))

### Bug Fixes

- **exchange:** fix json argument typings for \_fromJSON() ([55bf8cc](https://github.com/weyoss/redis-smq/commit/55bf8cca65fce23774a68e6aaac1b590bbc07ff4))

### Documentation

- add missing error classes reference, clean up ([106b6d0](https://github.com/weyoss/redis-smq/commit/106b6d0627b747e49d5d09499dda21912803298a))
- **api:** improve IQueueProperties description ([4ffeee3](https://github.com/weyoss/redis-smq/commit/4ffeee30e4a119a4bf378a4e753b19ad60f62070))
- fix empty links ([dfc4ae9](https://github.com/weyoss/redis-smq/commit/dfc4ae992be9b4145e100d8f063947c316b04f37))
- fix javascript/typescript examples ([4cb2eb1](https://github.com/weyoss/redis-smq/commit/4cb2eb13055609ea05ed98b34a143feedb63ebc0))
- **queue:** update IQueueProperties interface reference ([631f239](https://github.com/weyoss/redis-smq/commit/631f2393fedb7f33a20611e1a006b19c64a9fa93))
- **README.md:** add pre-release notice ([458fc57](https://github.com/weyoss/redis-smq/commit/458fc57e8089b8aa2835783a8bfe642364989ff6))
- **README.md:** fix typo ([3abf1e2](https://github.com/weyoss/redis-smq/commit/3abf1e2665c4ae5d3eb91b8166abc630cd9f039a))
- **README.md:** update minimal supported Redis version ([2c3ea00](https://github.com/weyoss/redis-smq/commit/2c3ea00dd93266b59ee649ffc8ff9351708f925b))
- **README:** fix heading hierarchy ([6dc0bd5](https://github.com/weyoss/redis-smq/commit/6dc0bd5ea10b42cc5a4ab1012c480f206e576edb))
- update docs ([188679e](https://github.com/weyoss/redis-smq/commit/188679e9476c9c0ba979be500168567775e085f3))
- update examples ([ac4b0b5](https://github.com/weyoss/redis-smq/commit/ac4b0b5d7d1d50ad10e9f5bcd825b28a51c37c40))

### Codebase Refactoring

- **queue:** use friendly keys for queue properties object ([9e88f54](https://github.com/weyoss/redis-smq/commit/9e88f54052a9b0bc89144e8d067f1818f0d32a13))
- use latest redis-smq-common release, fix breaking changes ([e347d4d](https://github.com/weyoss/redis-smq/commit/e347d4d148c3b104e7d73c9ef8d5bf796657c1d6))

### Tests

- fix breaking changes from latest redis-smq-common ([30a6099](https://github.com/weyoss/redis-smq/commit/30a609981786cabd4d08e9277be5b0bab8ad86fb))
- fix QueueMessageNotFoundError checking ([6053cee](https://github.com/weyoss/redis-smq/commit/6053ceef7b7922bbb58eaf91d4d3a15baea34bb4))
- fix tests ([561f0d0](https://github.com/weyoss/redis-smq/commit/561f0d06f0c4f28e6338def878210f2704b718b0))

### Misc

- add npm scripts ([34b4883](https://github.com/weyoss/redis-smq/commit/34b4883fa65a3c0b75d019cd1aedda3d42ccfc63))
- bump up redis-smq-common to v3.0.0-rc.6 ([f177b95](https://github.com/weyoss/redis-smq/commit/f177b95a84b1ab41304a8ceb568922e359c626b2))
- bump up type-coverage to v2.27.0 ([5140727](https://github.com/weyoss/redis-smq/commit/5140727f59ebf820702b2822149d85a266ca4b5e))
- fix incorrect imports ([ba82774](https://github.com/weyoss/redis-smq/commit/ba827746f1824191bd677919f3165e405ff8bcfc))
- update both .gitignore and .npmignore files ([3e84387](https://github.com/weyoss/redis-smq/commit/3e8438758d65fec2afa4f8de11f25239f581c368))
- update package-lock.json ([77c761a](https://github.com/weyoss/redis-smq/commit/77c761aec04e103bc6a60b01ae0393a9e9bf7e43))
- update project copyright annotation ([4080ac0](https://github.com/weyoss/redis-smq/commit/4080ac0b76f418193391e20f5e8c294cac7671e9))

### Continuous Integration

- drop support for redis server 2.8 and 3 ([9ef8ade](https://github.com/weyoss/redis-smq/commit/9ef8adec08bf90d1cc27b9bbabe591bca25a7d8e))
- update minimal supported versions for nodejs and redis ([13b3197](https://github.com/weyoss/redis-smq/commit/13b31977937c65aa989de8d715022d1afb5f0839))

## 7.2.3 (2023-03-26)

- test(consumer-heartbeat): update tests (4332153)
- refactor(consumer-heartbeat): clean up and improve API (20fc1b1)

## 7.2.2 (2023-03-25)

- test(workers): update tests (c22f1bb)
- perf(workers): use offset/count for schedule and watchdog workers (e78ecdb)
- build: bump up redis-smq-common to v2.0.0 (c90050d)
- build: clean up (61851a9)

## 7.2.1 (2023-02-15)

- build: update deps (e362d7c)
- fix: use path.resolve() to fix 'no such file or directory' error (b713fbe)
- build: bump up redis-smq-common to v1.0.6 (fc25b15)

## 7.2.0 (2023-01-06)

- build: fix NPM vulnerability warnings (e2ca247)
- build: bump up redis-smq-common to v1.0.5 (cc08fe7)
- docs(readme): update documentation (3713643)
- refactor(message-state): improve getSetExpired() logic (bb6f262)
- test(queue): test settings parsing compatibility with v7.1 (0656217)
- refactor(queue): move out settings parsing logic from getSettings() (cf4ba86)
- fix(queue): Keep compatibility with v7.1 queue settings schema (d49735e)
- docs(queue-manager): update queue.getSettings() reference (09214a4)
- chore: update license (6016483)
- docs(queues): improve documentation (494a0ce)
- docs(queue-manager): update docs (77d2e64)
- fix(examples): use save() method to create queues (9026923)
- test(queue-manager): test FIFO queues (b97dc4d)
- refactor(queue-manager): clean up (7f2d693)
- refactor(message-manager): refactor and clean up (4f55431)
- feat(queue-manager): allow to create and use FIFO queues (853a29b)
- docs(message-manager): update scheduled messages API reference (7fa3d23)

## 7.1.3 (2022-10-26)

- test(FanOutExchangeManager): test binding queues of different types (d2e287c)
- fix(FanOutExchangeManager): forbid binding queues of different types (0df6bdc)

## 7.1.2 (2022-10-22)

- fix(FanOutExchangeManager): fix unbindQueue() transaction handling (dec63de)
- fix(FanOutExchangeManager): fix bindQueue() transaction handling (afbdde6)
- docs(queues): fix typos (08f29c0)
- docs(queues): add queues.md reference, clean up (3219eb8)
- docs: improve documentation, add missing links (c740e11)

## 7.1.1 (2022-10-11)

- docs(message-exchanges): update docs (19d7dd3)
- docs: update README (63b2fe6)

## 7.1.0 (2022-10-06)

- docs: update README.md (8734e49)
- build: update npm dependencies (4225c50)
- test(FanOutExchangeManager): increase code coverage (df4c693)
- refactor(FanOutExchangeManager): improve unbindQueue() logic (c1440a5)
- docs: update docs (508430f)
- fix: fix typing error (05c1575)
- test: increase code coverage (c4ba4f3)
- refactor: rename saveExchange() to createExchange() (995ca03)
- refactor: improve TQueueSettings typing (413f4d3)
- refactor: bump up redis keys version (3389216)
- refactor: add EQueueSettingType, remove KEY*QUEUE_SETTINGS*\* keys (600199c)
- refactor(queue-manager): update queue.create() reply payload (f3a12d1)
- feat(FanOutExchangeManager): add saveExchange(), deleteExchange() (1ce22cc)
- refactor(redis-keys): clean up validateRedisKey() (e921540)
- fix(FanOutExchange): fix bindingParams validation (327d045)
- test(exchange): increase code coverage (f5f5d95)
- feat(exchange): allow retrieving fanout exchange list (8a96b17)
- refactor(exchange): improve exchange tag naming (a089738)
- refactor(message): improve message.exchange typing (9ce281a)
- refactor(queue-manager): clean up (ce5ab8e)
- docs(message): update MessageMetadata references (5041a85)
- test(message): update MessageMetadata references (9888918)
- refactor(message): rename MessageMetadata to MessageState, clean up (2de18b4)
- docs(exchange): improve documentation (718a80a)
- docs(producer): update docs (1965a75)
- docs(exchange): fix typos (93b4c8e)
- test(exchange): test exchanges with unmatched queues (d836eab)
- fix(exchange): return an error for exchanges with unmatched queues (e89ce06)
- docs(message): add missing method references (c723ec2)
- docs(exchange): update docs (1dc02a4)
- refactor(exchange): rename FanOutExchangeManager methods (f981241)
- docs(exchange): add FanOutExchangeManager reference (9cecc89)
- test(exchange): update fanout-exchange tests (be75519)
- feat(exchange): add FanOutExchangeManager (f8168a4)
- refactor(exchange): rename files (fd9d906)
- build: update workflow names (7b1b545)
- docs(readme): display the status of codeql.yml workflow (94eb97a)
- perf(redis-keys): fix inefficient regex complexity (dcb4f1f)
- build: set up code scanning (be0dd02)
- docs(exchange): update message-exchanges.md (49436af)
- test(exchange): fix test errors (f3aa786)
- docs(exchange): fix typos (a62a732)
- fix(redis-keys): enforce a redis key to start with a letter (a-z) (ecb7493)
- docs(exchange): update docs (wip) (6d3eaee)
- fix(exchange): export DirectExchange/TopicExchange/FanOutExchange classes (c070f3c)
- test(exchange): increase code coverage (063582c)
- refactor(exchange): add and use InvalidExchangeDataError (482e093)
- docs(readme): add reference to current release documentation (747e4e3)
- docs(producer): update producer.produce() parameters (938976e)
- fix: fix various typings issues (9c51445)
- chore: update examples (3628813)
- refactor: update tests (1456c5a)
- test(exchange): test fanout and topic exchanges (54c081b)
- feat(queue-manager): allow to bind/unbind a queue to an exchange (cd91109)
- refactor(exchange): remove code redundancies and clean up (2dc2cba)
- chore: bump up redis-smq-common to v1.0.4 (5181ad7)
- feat(exchange): implement missing methods of TopicExchange class (e2119b5)
- feat(redis-keys): allow redis keys to include a dot (92b8b05)
- perf(queue-manager): use sscan instead of smembers (8f491f4)
- feat(exchange): implement direct, fanout, and topic exchanges (1617e9b)
- chore: bump up redis-smq-common to 1.0.3 (d7f4aba)
- chore: clean up (ee88201)

## 7.0.7 (2022-08-10)

- Bump up redis-smq-common to v1.0.2 (ff385ad)
- Update docs (3871e8f)

## 7.0.6 (2022-08-08)

- Improve consumer/producer shutdown handling (36278ce)
- Update docs (51dfd16)
- Update examples (208934b)
- Fix tests (573e340)
- Add and use ProducerNotRunningError error class (e89facd)
- Fix a potential MaxListenersExceededWarning exception throwing (011a21b)
- Make producers to be run manually before producing messages (c989449)

## 7.0.5 (2022-07-20)

- Remove code redundancies (55eec79)
- Update event listeners docs (e308848)
- Refactor IEventListener interface, clean up (14dbf30)

## 7.0.4 (2022-07-14)

- Fix dev dependencies (e42d072)
- Update installation info (12c6170)
- Make redis-smq-common as a peer dependency (ade08af)

## 7.0.3 (2022-07-13)

- Fix consuming-messages/test00012 (4c9dfb8)

## 7.0.2 (2022-07-13)

- Bump up redis-smq-common to v1.0.1 (e3fbb10)
- Bump up typescript to v4.7.4 (0f69254)
- Fix npm vulnerability warnings (9925be0)
- Clean up examples (72ea0fb)

## 7.0.1 (2022-06-18)

- Update migrating.md (9065d5f)
- Update README.md (4cfb653)

## 7.0.0 (2022-06-18)

- Fix typing issue (cd8bf6a)
- Bump up redis-smq-common to v1.0.0 (02c353d)
- Update callback vs promise vs async/await benchmarks (6fca49c)
- Update README.md (7fbdcbf)

## 7.0.0-rc.8 (2022-06-09)

- Update docs (96a45e7)
- Test consumers/producers event listeners (856e12d)
- Implement consumers/producers event listeners (6f5d603)

## 7.0.0-rc.7 (2022-06-07)

- Update redis keys prefix (a6ca852)
- Use codecov instead of coveralls (d8b5f83)
- Improve consuming-messages/test00013 (5cd823c)
- Improve consuming-messages/test00010 (a9a4f47)
- Test WatchdogWorker (73fbe9a)
- Clean up (aa9a51a)
- Improve unacknowleged messages handling, refactor (005c6a0)
- Fix outdated javascript examples (e31f89c)
- Keep a clean directory structure (642739f)
- Update README.md (5c011e3)
- Clean up tests (10ebb77)

## 7.0.0-rc.6 (2022-05-31)

- Bump up redis-smq-common to v1.0.0-rc.11 (43717f0)

## 7.0.0-rc.5 (2022-05-31)

- Bump up redis-smq-common to v1.0.0-rc.10 (e025525)
- Update docs (738d9d0)

## 7.0.0-rc.4 (2022-05-30)

- Update README.md (fef27c1)
- Support node-redis v4 (c7a91b1)
- Drop support for node.js v12 (0b5a4e9)
- Fix outdated documentation (d3bf31b)
- Fix broken link (fd48c86)

## 7.0.0-rc.3 (2022-05-26)

- Update migration/configuration/message/message-manager references (6d53877)
- Update docs (df2eddb)
- Bump up redis-smq-common to v1.0.0-rc.3, refactor (0508c75)
- Bump up redis-smq-common to v1.0.0-rc.2 (f38d757)
- Remove singletons, use instance based configuration (65f28ec)
- Fix 'fsevents not accessible from jest-haste-map' error (1cbc786)
- Use shared components from redis-smq-common (2abfb98)
- Reorganize codebase folders (cdf25fa)
- Clean up redis-keys.ts (c6b8af8)
- Add PluginRegistrationNotAllowedError error, clean up (aa003a1)
- Update tests (0950706)
- Implement a plugging system for using the web-ui as an extension (e2b0cca)
- Fix tests (ca01d66)
- Reorganize codebase files (2cef191)
- Remove the web ui from codebase, clean up (ffe03c9)
- Update http-api.md (4023dc5)

## 7.0.0-rc.2 (2022-05-18)

- Fix typo (8002616)
- Update docs (d40b1c2)
- Update misc scripts (bde5171)
- Clean up WebsocketRateStreamWorker, use incremental timestamp (918fac0)

## 7.0.0-rc.1 (2022-05-15)

- Update docs (41ee4bf)
- Fix consuming-messages/test00015 test (8b3072a)
- Clean up and simplify the consumer.consume() callback argument (bd98b65)
- Update docs (9ede0f6)
- Update tests (b1772aa)
- Refactor configuration object (2ebe1ba)
- Make QueueManager constructor private (c55cdad)
- Update redisKeys version (add3e8d)
- Update scheduling-messages.md (4b2bb2d)
- Update multiplexing.md (f36f712)

## 7.0.0-rc.0 (2022-05-13)

- Update LICENSE (2ef31db)
- Update multiplexing.md (62c575e)
- Add v7 migration guide (48e325e)
- Add error codes for message publishing/scheduling failures (e89308d)
- Update examples (564ffe6)
- Update docs (e8d80c2)
- Bump up redis-smq-monitor to v7.0.0-rc.0 (059e0fd)
- Update docs (5810361)
- Fix http-api/test00001 test (a2f257c)
- Update docs (117955a)
- Update tests (ba83f0b)
- Improve QueueManager methods naming (b1c5237)
- Clean up (f57f237)
- Fix pending messages related data in websocket streams (bbd99cb)
- Clean up (5ae08f8)
- Update examples (e3990a9)
- Update tests (86d58e4)
- Unify pending messages API for both LIFO and Priority messages (ffdbfd1)
- Fix tests (f00ea26)
- Fix queue creation, handle properly queue settings (ec00907)
- Clean up Queue class (afce21f)
- Update tests (3bc9fd4)
- Clean up QueueManager (852633d)
- Validate the message queue before scheduling a message (9c70c0c)
- Refactor MessageManager API, clean up (0df67f3)
- Fix various tests errors due to incompatible APIs (bea78a6)
- Refactor Producer/Consumer/QueueManager APIs (3f0574a)
- Refactor consumer class, update consumer.consume() signature (618172c)
- Expect the number messages to be at greater than 6 (02ea402)
- Improve consuming-messages/test00031 (3605512)
- Clean up (3660ba3)
- Bump up redis-smq-monitor to v6.5.7 (05d004a)
- Fix consuming-messages/test00014 (8a1b7b9)
- Merge branch 'lock-manager' (c1edcb2)
- Throw an error when a lock could not be acquired or extended (5ff1fca)
- Refactor LockManager to allow auto extending locks (efbbe35)

## 6.4.2 (2022-04-23)

- Test expired locks (367660e)
- Do not throw an exception and try to acquire again an expired lock (b7f7d36)
- Bump up redis-smq-monitor to v6.5.6 (c31cd2e)
- Fix NPM security vulnerabilities (3900ddf)
- Clean up monitor-server services (954d856)

## 6.4.1 (2022-03-22)

- Fix fsevents not accessible from jest-haste-map (482cb11)
- Fix broken url in the Web UI docs (02e08d7)

## 6.4.0 (2022-03-22)

- Update Web UI docs (ed63186)
- Bump up redis-smq-monitor to v6.5.5 (3179f85)
- Test monitor.basePath configuration (00c680d)
- Support basePath when running web ui from behind a reverse proxy (ea17ffe)

## 6.3.1 (2022-03-15)

- Fix typos (a5db76a)

## 6.3.0 (2022-03-15)

- Update docs (3ad938a)
- Use colons instead of dots for joining Redis key segments (75dbcb6)
- Continue testing consumer message multiplexing (17c9659)
- Improve multiplexing delay when dequeuing messages (a635c8a)
- Remove deprecated consumer.cancel(queue,priority,cb), add new tests (4a2d458)
- Fix test errors, clean up (09feb9c)
- Prefer method definition over arrow function property (5d7e664)
- Implement MultiplexedMessageHandlerRunner (6980cbf)
- Refactor MessageHandler to allow more modular structures (b079244)

## 6.2.6 (2022-03-04)

- Clean up (2837cc6)
- Implement MessageHandlerRunner (cfba094)

## 6.2.5 (2022-03-03)

- Update Consumer API docs (8580f4a)
- Do not consume messages with and without priority from the same queue (84130bf)
- Use default parameters when creating a Ticker instance (db9feb0)
- Update consumer queue list upon shutting down a message handler (14519e2)

## 6.2.4 (2022-02-23)

- Fix consuming-messages/test00015 error (c5c365a)

## 6.2.3 (2022-02-23)

- Bump up redis-smq-monitor to v6.5.3 (4e845d0)
- Remove gracefully a message handler (a4402b7)
- Add MessageHandlerAlreadyExistsError custom error (65882ed)

## 6.2.2 (2022-02-21)

- Fix a queue rate limiting bug allowing to save invalid Redis keys (1dc91aa)
- Bump up redis-smq-monitor to v6.5.2 (e192db0)
- Update docs (5a6469e)

## 6.2.1 (2022-02-19)

- Remove unused code (475fa3d)

## 6.2.0 (2022-02-19)

- Bump up redis-smq-monitor to v6.5.1 (c543c55)
- Improve consumer message rate time series handling (7d51bb3)
- Update docs (ef21b39)
- Allow configuring queue rate limiting from the HTTP API (ec2bc52)
- Test message consumption rate limiting (62e5b1f)
- Implement message consumption rate limiting (1c87ec0)

## 6.1.0 (2022-02-14)

- Allow configuring which messages to store with extended parameters (7bd37a1)

## 6.0.4 (2022-02-13)

- Fix missing type definition for koa-bodyparser (4b8a11e)

## 6.0.3 (2022-02-13)

- Increase code coverage (ec839a1)

## 6.0.2 (2022-02-12)

- Update architecture overview diagram (e8f77a8)
- Improve offline consumers handling & message recovery strategy (4072939)
- Fix typos and update README.md (b73bd37)

## 6.0.1 (2022-02-11)

- Update docs (78fef2e)
- Clean up WorkerPool class (b4dae38)

## 6.0.0 (2022-02-08)

- Bump up redis-smq-monitor version to 6.4.0 (71ceb45)
- Implement TimeSeriesWorker (a5c404e)
- When deleting a namespace throw an error if it does not exist (28d0be0)
- Fix schedule-message.lua parameters (15708c4)
- Allow managing namespaces, update HTTP API, test (b0c265c)
- Rename setScheduledPeriod() to setScheduledRepeatPeriod() (d6e3376)
- Improve Redis keys handling (d9c50f3)
- Improve LUA scripts parameters handling (5aaa893)
- Remove redundant call to this.getMainKeys() (f3b1f1f)
- Update docs (31c81ca)

## 6.0.0-rc.11 (2022-02-02)

- Fix tests/purging-queues/test00007 (88e1d3a)
- Update pre-push hook (8594e6a)
- Clean up (63ca899)
- Fix broken pre-release v6.0.0-rc.10 due to missing dependency (9739115)

## 6.0.0-rc.10 (2022-02-01)

- Improve locking mechanisms, remove redlock package, refactor (8f5d9b2)
- Continue Message class refactoring, update docs and examples (d25f370)
- Fix consuming-messages/test00006 test errors, refactor Message class (efa1163)
- Fix at-most-once message delivery (eb4e6fa)
- Update tests (6f9d07e)
- Bump up redis-smq-monitor to v6.3.0 (ec518fc)
- Update time series data only when message rate > 0 (748bc7f)
- Remove dependency on async package and clean up (76698b2)
- Use worker pool for system workers and monitor-server workers (8bee7ec)
- Test producing duplicate messages (a260fd7)
- Remove redundant code related to message.isSchedulable() (34f25cc)
- Update Redis keys prefix (0914c99)
- Forbid producing a message more than once, introduce MessageMetadata (eebab36)

## 6.0.0-rc.9 (2022-01-27)

- Check object reference equality before clearing singleton instance (88e35ad)
- Improve namespaced logger (9acf9e9)
- Support external loggers, use system-wide config, refactor codebase (eaf9c14)
- Make storing acknowledged & dead-lettered messages optional (96b8be3)
- Fix typos and update readme (21b2e9a)

## 6.0.0-rc.8 (2022-01-24)

- Update migration guide (545932a)
- Test multi-queue consumer, update docs (70209a0)
- Fix ticker waitlock issue (fca5bd1)
- Handle gracefully run/shutdown call errors, fix test errors, clean up (779c562)
- Clean up (4dc6ce5)
- Update examples (38064d0)
- Implement multi-queue consumers, refactor and clean up (9c2fefb)
- Fix typo in README.md (e0ca944)

## 6.0.0-rc.7 (2022-01-21)

- Update package.json keywords (e84d4cf)
- Remove extra spacing in message-manager.md (b87ac3d)
- Update QueueManager API reference (832b090)
- Move purge operations to handlers (5345dc3)
- Rename and move purgePendingMessagesWithPriority to MessageManager (e959d7b)
- Rename and move purgePendingMessages to MessageManager (3804122)
- Rename and move purgeScheduledMessages to MessageManager (78ba9ac)
- Rename and move purgeAcknowledgedMessages to MessageManager (febcd9c)
- Rename and move purgeDeadLetteredMessages to MessageManager (cf07797)
- Update message-manager.md (8b5fec1)
- Rename requeueMessageFromDLQueue to requeueDeadLetteredMessage (2d4df08)
- Rename requeueMessageFromAcknowledgedQueue to requeueAcknowledgedMessage (59f446e)
- Rename deleteDeadLetterMessage to deleteDeadLetteredMessage (f99dd09)
- Rename getDeadLetterMessages to getDeadLetteredMessages (3172c20)
- Update migration guide (837da04)

## 6.0.0-rc.6 (2022-01-20)

- Bump up redis-smq-monitor to v6.1.0 (83107be)
- Update README.md (0ce39bd)
- Make Producer stateless, drop MultiQueueProducer, refactor, clean up (7597762)

## 6.0.0-rc.5 (2022-01-18)

- Fix a possible EventEmitter memory leak in WorkerRunner (4d3a066)
- Fix MultiQueueProducer bug with queueName not being validated, test (c4cbc7d)

## 6.0.0-rc.4 (2022-01-18)

- Bump redis-smq-monitor to v6.1.0 (930aa95)
- Improve error message (443794b)
- Make MultiQueueProducer publish a message as a single atomic operation (19cfb2f)
- Always invoke setUpMessageQueue() when publishing a message (502a4cb)
- Test scheduled messages publication when dst queue is deleted (41055f9)
- Make sure scheduled messages aren't published if dst queue is deleted (cda411a)
- Fix a typo (af5c310)
- Fix delete queue validation bug causing request to hang forever (c14488a)
- Update typescript/javascript examples (f595bb1)
- Update queue-manager.md (461ae0b)
- Update HTTP API endpoints documentation (5da7777)
- Improve HTTP API error handling (c90473a)
- Allow to delete a message queue from HTTP API, test, update docs (a3087a2)
- Fix husky v7 setup (3fa4f2f)
- Update HTTP API reference (688a028)
- Fix npm vulnerability warnings (7ad221b)
- Refactor monitor server HTTP API routing (2fec7c3)

## 6.0.0-rc.3 (2022-01-14)

- Allow to delete a message queue alongside with its related data.
- Make sure to release queue lock before returning.
- Improve QueueManager API method names, update docs.
- Update QueueManager API reference (add deleteQueue() method).
- Fix QueueManager broken method references in the Web UI.
- Rename purgeScheduledMessages() to purgeScheduledQueue().
- Test deleting queues, wait for a heartbeat before returning during startup.
- Update QueueManager API reference.
- Fix random errors from tests/consuming-messages/test00003.
- Fix random test errors due to javascript time drift.
- Do not return an error if a heartbeat is not found. Just skip it.

## 6.0.0-rc.2 (2022-01-11)

- Optimize npm package size, update docs.
- Rename event MESSAGE_DEQUEUED to MESSAGE_RECEIVED.
- Update ConsumerMessageRateWriter constructor signature
- Increase code coverage.
- Small cleanup and improvements.

## 6.0.0-rc.1 (2022-01-04)

- Expire consumers and producers time series after 30s of inactivity.
- Improve redisKeys versioning strategy, update docs.
- Improve migration guide.

## 6.0.0-rc.0 (2022-01-03)

- Implement MultiQueueProducer for publishing messages to multiple queues using a single producer instance.
- Implement rates time series for queues, producers and consumers, allowing to move the chart to the left or the right
  in order to scan the timeline.
- Refactor MessageManager and QueueManager API
- Add new WebSocket streams for heartbeats, rates, queues, consumers, and producers.
- Refactored Web UI.
- Overall improvements and minor bug fixes.

## 5.0.11 (2021-12-07)

- Bumped redis-smq-monitor to v5.0.7.
- Updated package.json to use strict package versioning.

## 5.0.10 (2021-12-04)

- Bumped redis-smq-monitor to v5.0.6.
- Updated scheduler.md.

## 5.0.9 (2021-12-03)

- Calculate and emit "idle" event only when testing.

## 5.0.8 (2021-12-01)

- Updated architecture diagram.
- Bumped redis-smq-monitor to v5.0.4

## 5.0.7 (2021-11-27)

- Do not throw an error immediately and allow a compatible Redis client (ioredis, node_redis) to reconnect in case of
  Redis server not responding or restarting.

## 5.0.6 (2021-11-26)

- Reviewed and updated documentation files.

## 5.0.5 (2021-11-25)

- Minor improvements: refactored and cleaned up MessageRate and QueueManager classes.

## 5.0.4 (2021-11-24)

- Updated RedisSMQ logo.
- Bumped redis-smq-monitor to v5.0.3.

## 5.0.3 (2021-11-23)

- Updated RedisSMQ logo.

## 5.0.2 (2021-11-23)

- Added RedisSMQ logo.
- Bumped redis-smq-monitor to v5.0.2.
- Bumped type-coverage to v2.19.0.

## 5.0.1 (2021-11-22)

- Fixed broken redis-smq-monitor package.

## 5.0.0 (2021-11-22)

- Implemented message and queue management features in the Web UI.
- Refactored the MQ to use LIFO queues.
- Updated HTTP API endpoints.
- Minor overall improvements and changes.

## 4.0.9 (2021-11-10)

- Fixed outdated Message API docs.

## 4.0.8 (2021-11-09)

- Improved debugging info.
- Allowed listing message queues from QueueManagerFrontend.

## 4.0.7 (2021-11-08)

- Made queue namespace optional for queue/message management. When not provided, the configuration namespace is used. If
  the configuration namespace is not set, the default namespace is used.

## 4.0.6 (2021-11-07)

- Fixed queues and messages management issues when using many namespaces.

## 4.0.5 (2021-11-05)

- Fixed outdated examples in the HTTP API reference

## 4.0.3 (2021-11-04)

- Minor refactoring and improvements.

## 4.0.2 (2021-11-03)

- Updated docs.
- Added current MQ architecture overview.

## 4.0.1 (2021-11-02)

- Removed Scheduler class in favor of MessageManager.
- Added QueueManager and MessageManager, allowing to fetch/delete/requeue messages from different queues.
- Improved MQ performance by using background message processing with the help of workers.
- MQ architecture tweaks and improvements.
- Redis keys namespace bug fix.

## 3.3.0 (2021-10-07)

- With the release of v3.3.0, reliable, persistent priority queues are now supported.
- Added new tests and increased code coverage.

## 3.2.0 (2021-10-01)

- Run tests in Node.js v12, v14, and v16
- Run tests in Redis v2.6.17, v3, v4, v5, and v6
- Made redis-smq-monitor server an integral part of redis-smq
- Implemented Scheduler HTTP API endpoints
- Various fixes and improvements

## 3.1.1 (2021-09-16)

- Added Github CI

## 3.1.0 (2021-09-15)

- Added Scheduler API docs.
- Added new methods to fetch and delete scheduled messages.

## 3.0.4 (2021-09-08)

- Updated examples.

## 3.0.3 (2021-09-08)

- Fixed .npmignore.

## 3.0.2 (2021-09-08)

- Moved all dependant declaration packages from "devDependencies" to "dependencies".

## 3.0.1 (2021-09-08)

- Moved husky to devDependencies.

## 3.0.0 (2021-09-08)

- A major release v3 is out.
- Starting from this release, only active LTS and maintenance LTS Node.js releases are supported.
- Upgrading your installation to the newest version should be straightforward as most APIs are compatible with some exceptions.
- Project codebase has been migrated to TypeScript to make use of strong typings.
- JavaScript's users are always first class citizens.
- Fixed a compatibility issue between ioredis and redis when calling multi.exec().
- Fixed typing inconsistencies (ConfigRedisDriver and RedisDriver types) between redis-smq and redis-smq-monitor.
- Improved scheduler mechanics, refactored GC, and updated tests.
- Introduced RedisClient.
- Updated docs.

## 2.0.12 (2021-02-07)

- Fixed a bug in redis-client.js.

## 2.0.11 (2020-10-20)

- Improved overall performance by using asynchronous loops and avoiding recursion.
- Continued clean up and refactoring.
- Added tests coverage.

## 2.0.10 (2020-10-16)

- Implemented stats providers.
- Fixed a potential memory leak issue relative to event listeners.
- Created a new module for encapsulating message collecting logic.
- Improved code structure

## 2.0.9 (2020-10-11)

- Updated tests.

## 2.0.8 (2020-10-11)

- Refactored legacy code, upgraded eslint and added prettier.

## 2.0.7 (2020-10-04)

- Fixed bug in stats aggregation causing lost of queue name and queue namespace.

## 2.0.6 (2020-10-02)

- Refactored gc.collectProcessingQueuesMessages()
- Capitalized factory names

## 2.0.5 (2020-09-23)

- Bumped redis-smq-monitor to 1.1.5

## 2.0.4 (2020-09-23)

- Bumped redis-smq-monitor to 1.1.4

## 2.0.3 (2020-09-21)

- Bumped redis-smq-monitor to 1.1.3

## 2.0.2 (2020-09-20)

- Bumped redis-smq-monitor to 1.1.2

## 2.0.1 (2020-09-20)

- Included CPU usage percentage, hostname, and IP address in the consumer stats
- Bumped redis-smq-monitor to 1.1.1
- Updated the monitor parameters types based on the redis-smq-monitor package typing

## 2.0.0 (2020-04-12)

- Removed all deprecated methods
- Removed undocumented Message constructor parameters
- Message.createFromMessage() now accepts 2 parameters for cloning a message (see Message API docs)
- Introduced TypeScript support
- Added examples for TypeScript
- Small refactoring and cleaning

## 1.1.6 (2019-11-29)

- Bug fix: Fixed broken message retry delay (see issue #24)

## 1.1.5 (2019-11-26)

- Migrated from Mocha/sinon/chai to Jest
- Minor scheduler bug fix in some cases when using both `PROPERTY_SCHEDULED_REPEAT` and `PROPERTY_SCHEDULED_CRON`
- Code cleanup

## 1.1.4 (2019-11-23)

- Hotfix release addresses a bug with invalid state checking at the dispatcher level

## 1.1.3 (2019-11-23)

- Clean up
- Improved error handling
- Improved dispatcher state management
- Fixed broken redis parameters parsing for old configuration syntax used before v1.1.0

## 1.1.1 (2019-11-12)

- Handle gracefully unexpected errors for both consumers/producers. Instead of terminating the whole node process, in case of an unexpected error, just log the error and shutdown the instance.
- Fixed wrong emitted event during producer instance bootstrap causing TypeError.

## 1.1.0 (2019-11-11)

- Major code refactoring and improvements
- Fixed namespace related bugs
- Fixed minor consumer related bugs
- Added support for ioredis
- Rewritten RedisSMQ Monitor based on React and D3
- RedisSMQ Monitor has split up from main repository and now maintained separately.
- Introduced changelog
