# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [8.0.1](https://github.com/weyoss/redis-smq/compare/v8.0.0...v8.0.1) (2025-04-13)

**Note:** Version bump only for package redis-smq-common

## [8.0.0](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.36...v8.0.0) (2025-04-13)

**Note:** Version bump only for package redis-smq-common

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

## [8.0.0-rc.35](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.34...v8.0.0-rc.35) (2025-03-22)

**Note:** Version bump only for package redis-smq-common

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

## [3.0.0-rc.17](https://github.com/weyoss/redis-smq-common/compare/v3.0.0-rc.16...v3.0.0-rc.17) (2025-02-13)

### Codebase Refactoring

- **src:** improve Redis client creation logic ([12ede86](https://github.com/weyoss/redis-smq-common/commit/12ede86eb20fe8a9934597e1ef7c9570fc7cace3))

## [3.0.0-rc.16](https://github.com/weyoss/redis-smq-common/compare/v3.0.0-rc.15...v3.0.0-rc.16) (2025-02-07)

### Documentation

- **api:** update class documentation to include Error properties and methods ([4a204d9](https://github.com/weyoss/redis-smq-common/commit/4a204d9980ce6dec569d2925782e2db6b010a775))
- **api:** update type references and clean up ([d697550](https://github.com/weyoss/redis-smq-common/commit/d6975503a883d653e495b35cee53f3b2584db099))
- **README:** update layout and add badges ([0e9d58a](https://github.com/weyoss/redis-smq-common/commit/0e9d58a09450494faeccb3e888d9cff484547db2))
- update README and add CONTRIBUTING guide ([4708653](https://github.com/weyoss/redis-smq-common/commit/47086530a87cb10d40090caeb7db01eddb7ec1ad))

### Codebase Refactoring

- **config:** consolidate Redis client configuration interface ([b1039ac](https://github.com/weyoss/redis-smq-common/commit/b1039ac98b6e230a30f2ccda8ab94174b6d25d64))
- **imports:** update import paths to use index.js ([004b4a4](https://github.com/weyoss/redis-smq-common/commit/004b4a4e7f4c6aa09fb5afa2415c2e4da1ccb06c))
- **ioredis-client:** improve type safety and error handling ([cc02dde](https://github.com/weyoss/redis-smq-common/commit/cc02ddedf6cbb7652066bfd99c0a9c1628f07b43))
- **redis-client:** simplify script loading, use dynamic imports ([7ef3593](https://github.com/weyoss/redis-smq-common/commit/7ef35930a327ee00448a1c2fb83aca0cec003b56))
- **tests:** update import paths and remove type-coverage comments ([26e7775](https://github.com/weyoss/redis-smq-common/commit/26e77755e20a4f6756a2e07b6a1cd2090d6550e0))

### Tests

- improve test coverage and refactor test scripts ([acc563e](https://github.com/weyoss/redis-smq-common/commit/acc563e1d71a6042b3cbe57d5a1e9213f4cd70c8))

### Misc

- **deps:** make redis & ioredis as peer dependencies, remove bunyan ([9095343](https://github.com/weyoss/redis-smq-common/commit/9095343ce9bdce5346e0b0b4375c70d7c52cee83))
- **deps:** update dependencies and add peer dependencies ([36f3170](https://github.com/weyoss/redis-smq-common/commit/36f3170df08253cf288fe8d6a39b18ae0101018a))
- **deps:** update dependencies and remove @types/ioredis ([08922e4](https://github.com/weyoss/redis-smq-common/commit/08922e4a6e0888043f3fdde95285dacb59bbfb74))
- update deprecated packages ([b0074cf](https://github.com/weyoss/redis-smq-common/commit/b0074cf5c789716dbf6c0b25960717f267bea34b))

## [3.0.0-rc.15](https://github.com/weyoss/redis-smq-common/compare/v3.0.0-rc.14...v3.0.0-rc.15) (2024-03-24)

### Bug Fixes

- include missing enums when exporting esm/cjs modules ([6dbfa0a](https://github.com/weyoss/redis-smq-common/commit/6dbfa0abfe4129611c9cef0d5f9d850ed7d7937e))

## [3.0.0-rc.14](https://github.com/weyoss/redis-smq-common/compare/v3.0.0-rc.13...v3.0.0-rc.14) (2024-03-23)

### ⚠ BREAKING CHANGES

- rewrite and optimize worker logic, clean up

### Bug Fixes

- strip 'file://' from filename ([39367b0](https://github.com/weyoss/redis-smq-common/commit/39367b01b19e2f5d5cdadb20d68d95dc9ab3f72e))

### Documentation

- update API reference ([e79899a](https://github.com/weyoss/redis-smq-common/commit/e79899a6316d14042bee5eaa94be86f6816833e6))

### Codebase Refactoring

- rewrite and optimize worker logic, clean up ([f9120de](https://github.com/weyoss/redis-smq-common/commit/f9120de0bc45929ab19aa4eb724ebc3b6159a0b3))

## [3.0.0-rc.13](https://github.com/weyoss/redis-smq-common/compare/v3.0.0-rc.12...v3.0.0-rc.13) (2024-03-08)

### ⚠ BREAKING CHANGES

- improve and clean up codebase, refactor typings
- enable esm and cjs module exports
- reorganize and rewrite shared components

### Features

- enable esm and cjs module exports ([2d28c41](https://github.com/weyoss/redis-smq-common/commit/2d28c41b67ab7798bc74a75b27fa3c43ec60a604))

### Documentation

- update API reference ([cca5214](https://github.com/weyoss/redis-smq-common/commit/cca521481c74ba9eca3af9c6cf74dbc7dd01f1d9))

### Codebase Refactoring

- improve and clean up codebase, refactor typings ([71cfe06](https://github.com/weyoss/redis-smq-common/commit/71cfe06c61f01106f5b85aa652d6cb6e520d4743))
- reorganize and rewrite shared components ([66d59e9](https://github.com/weyoss/redis-smq-common/commit/66d59e98c46b0c9f6727358351bb808d45524cec))

### Tests

- reorganize and rewrite shared components ([e98dc77](https://github.com/weyoss/redis-smq-common/commit/e98dc7779490252e1ab5201dd965fec685f2d234))

### Misc

- update .npmignore file ([9b26c78](https://github.com/weyoss/redis-smq-common/commit/9b26c783a7e93edbda4bf9d5d82228901f10c61c))

## [3.0.0-rc.12](https://github.com/weyoss/redis-smq-common/compare/v3.0.0-rc.11...v3.0.0-rc.12) (2024-02-03)

### Codebase Refactoring

- improve error handling ([dd0f49c](https://github.com/weyoss/redis-smq-common/commit/dd0f49cc3f62d89c1f621d3d26a269970efe02f3))

## [3.0.0-rc.11](https://github.com/weyoss/redis-smq-common/compare/v3.0.0-rc.10...v3.0.0-rc.11) (2024-02-01)

### Codebase Refactoring

- improve typing ([a3d69ee](https://github.com/weyoss/redis-smq-common/commit/a3d69ee6ba0c5a4745b2ee778f50adeaabf3087a))

## [3.0.0-rc.10](https://github.com/weyoss/redis-smq-common/compare/v3.0.0-rc.9...v3.0.0-rc.10) (2024-02-01)

### ⚠ BREAKING CHANGES

- do not throw errors within async functions

### Documentation

- update documentation ([a513ea8](https://github.com/weyoss/redis-smq-common/commit/a513ea83cf1284e3dcba09351674006bb3193aef))

### Codebase Refactoring

- do not throw errors within async functions ([74dfbb6](https://github.com/weyoss/redis-smq-common/commit/74dfbb654a9a62d1802b3ed80485b76a40c85976))

### Tests

- do not throw errors within async function ([a77eaf2](https://github.com/weyoss/redis-smq-common/commit/a77eaf28c384114f02aef22ffe8abe93da692d91))

## [3.0.0-rc.9](https://github.com/weyoss/redis-smq-common/compare/v3.0.0-rc.8...v3.0.0-rc.9) (2024-01-25)

### Misc

- update package-lock.json ([d001ba1](https://github.com/weyoss/redis-smq-common/commit/d001ba1938ed34e4a76f5da1814de56dde72ca99))

## [3.0.0-rc.8](https://github.com/weyoss/redis-smq-common/compare/v3.0.0-rc.7...v3.0.0-rc.8) (2024-01-25)

### ⚠ BREAKING CHANGES

- drop support for node-redis v3

### Documentation

- drop support for node-redis v3 ([3481d53](https://github.com/weyoss/redis-smq-common/commit/3481d53de1df805e9a4fc9ec244c6f6b7e131947))

### Codebase Refactoring

- drop support for node-redis v3 ([0b89843](https://github.com/weyoss/redis-smq-common/commit/0b8984396ec0ccb57eb1e183e9b7b0a6f1935e9b))

## [3.0.0-rc.7](https://github.com/weyoss/redis-smq-common/compare/v3.0.0-rc.6...v3.0.0-rc.7) (2023-11-26)

### ⚠ BREAKING CHANGES

- **event-emitter:** add typed EventEmitter, remove legacy events

### Features

- **event-emitter:** add typed EventEmitter, remove legacy events ([65d57c3](https://github.com/weyoss/redis-smq-common/commit/65d57c31639add4808edfb5d2db4ed6a4cb6bf58))

### Documentation

- add typed EventEmitter, remove legacy events ([a9f979a](https://github.com/weyoss/redis-smq-common/commit/a9f979a24f334ed345b6e0caf15357d4a5a1fd92))

### Tests

- add typed EventEmitter, remove legacy events ([4ba6ec8](https://github.com/weyoss/redis-smq-common/commit/4ba6ec8bf8c1d37e849e6f25de70ea0b660506d0))

## [3.0.0-rc.6](https://github.com/weyoss/redis-smq-common/compare/v3.0.0-rc.5...v3.0.0-rc.6) (2023-11-20)

### ⚠ BREAKING CHANGES

- **redis-client:** support redis server starting from 4.0.0

### Features

- **redis-client:** support redis server starting from 4.0.0 ([84d6b66](https://github.com/weyoss/redis-smq-common/commit/84d6b6686e366568002b58a454d7684fa4e7a646))

### Continuous Integration

- drop support for redis server 2.8 and 3 ([444d1fd](https://github.com/weyoss/redis-smq-common/commit/444d1fde37385f21576dc4f8b9cada07bff1c373))

## [3.0.0-rc.5](https://github.com/weyoss/redis-smq-common/compare/v3.0.0-rc.4...v3.0.0-rc.5) (2023-11-19)

### Documentation

- remove logs.md and redis.md, update README.md ([be2ebd8](https://github.com/weyoss/redis-smq-common/commit/be2ebd8ef0b8acbbcb37572363528dfcf968679a))

## [3.0.0-rc.4](https://github.com/weyoss/redis-smq-common/compare/v3.0.0-rc.3...v3.0.0-rc.4) (2023-11-19)

### Misc

- add typescript declaration file entry ([453f103](https://github.com/weyoss/redis-smq-common/commit/453f1036cb0c89cf10372c14d44b336b19add370))
- update .npmignore ([6b41b6d](https://github.com/weyoss/redis-smq-common/commit/6b41b6dad1c9d587001b331f29d401d653c066b3))

## [3.0.0-rc.3](https://github.com/weyoss/redis-smq-common/compare/v2.0.0...v3.0.0-rc.3) (2023-11-19)

### ⚠ BREAKING CHANGES

- support cjs/esm modules, refactor codebase, improve typings

### Features

- **redis-client:** add hscan support ([7672617](https://github.com/weyoss/redis-smq-common/commit/7672617c5438b677420f24591cc849082084602f))
- support cjs/esm modules, refactor codebase, improve typings ([3da25b9](https://github.com/weyoss/redis-smq-common/commit/3da25b91dfce72051df0e409de00b1ef40e91d1c))

### Bug Fixes

- **NodeRedisV4Client:** fix zrevrange() error for Redis v2.8 ([f0d9e25](https://github.com/weyoss/redis-smq-common/commit/f0d9e2563821c161aba92b1518249b89da448b76))

### Misc

- fix broken links ([6b2e9cf](https://github.com/weyoss/redis-smq-common/commit/6b2e9cf222eff79bf9355d46d9677d378347b740))
- improve documentation, add API reference, clean up ([53169a1](https://github.com/weyoss/redis-smq-common/commit/53169a1b459a7f0db9907bba18f900dc179cc366))
- **logger:** fix getLogger() tests when called with the 2nd param ([df43847](https://github.com/weyoss/redis-smq-common/commit/df438470cdc306311cc70aca72e19f3b1dcd2c46))
- **redis-client:** fix 'ERR unknown command HSCAN' error ([70a5c98](https://github.com/weyoss/redis-smq-common/commit/70a5c98ae5281b0f0a04ab6f2414da620cad2ae7))
- **redis-client:** increase code coverage ([34fccba](https://github.com/weyoss/redis-smq-common/commit/34fccba189078cb56b1c86b83662f9d927a28182))
- **redis-client:** test hscan support ([939a0ad](https://github.com/weyoss/redis-smq-common/commit/939a0ad1eb417e3d5e5607306ad9d172285c4c5d))
- **redis-client:** Use count param for sscan ([8705086](https://github.com/weyoss/redis-smq-common/commit/87050869cf580e778bc9a5e8ede19e02884f8a87))
- update .gitignore ([6fbc308](https://github.com/weyoss/redis-smq-common/commit/6fbc3087b74395ac3558e310bf58c378184608e3))
- update CHANGELOG.md template ([aae81f3](https://github.com/weyoss/redis-smq-common/commit/aae81f376c3404a13a8647774d26175eff58b39d))
- update minimal supported versions for nodejs and redis ([4a31852](https://github.com/weyoss/redis-smq-common/commit/4a31852a889cffb82eac2b3454dac323a39da79a))
- update package description ([776a240](https://github.com/weyoss/redis-smq-common/commit/776a24029a6d79c132d5b861139926c6ffc7288b))
- update tests and fix various errors ([c915fb2](https://github.com/weyoss/redis-smq-common/commit/c915fb240cf8f8781f98bd6aa77023b26e1a0fde))

## 2.0.0 (2023-03-25)

- feat(redis-client): support offset and count for zrangebyscore() (2ec00e0)

## 1.0.6 (2023-02-15)

- fix: use path.resolve() to fix 'no such file or directory' error (2d33599)

## 1.0.5 (2023-01-06)

- chore: update license (9b817d2)
- build: update NPM dependencies to latest releases (b03795b)
- docs(readme): replace lgtm badge with code quality badge (ea6545a)
- build: migrate from lgtm to github code scanning (de3dcd4)

## 1.0.4 (2022-08-24)

- test(redis-client): cover srem command (caf3837)
- feat(redis-client): add support for srem command (7ddaf24)

## 1.0.3 (2022-08-16)

- [RedisClient] Update tests (6f1fd51)
- [RedisClient] Make validateRedisVersion() public (c2fccb3)
- [RedisClient] Support MATCH and COUNT options for sscan (12b24ac)
- [RedisClient] Fallback to smembers when sscan is not supported (8a4409f)
- [RedisClient] Test sscan command (17b8279)
- [RedisClient] Add sscan command (b771873)

## 1.0.2 (2022-08-10)

- Update LockManager tests (321c8c4)
- Fix "LockManagerExtendError: Acquired lock could not be extended" (fa3a8e5)

## 1.0.1 (2022-07-07)

- Remove unused WorkerRunnerError (48e7206)
- Use namespaced WorkerError (517224c)
- Make array looping asynchronous (cd66e51)
- Run workers one by one without a delay (099b488)

## 1.0.0 (20220-06-18)

- Rename logger/test00018 (f20fdf9)
- Test PowerManager (8d6f5e6)
- Complete async tests to reach 9x% code coverage (ea57f8f)
- Test async.waterfall() (ae4a283)
- Increase code coverage (c5e3f2b)

## 1.0.0-rc.11 (2022-05-31)

- Update RedisClient and IRedisClientMulti interfaces (8732c97)

## 1.0.0-rc.10 (2022-05-31)

- Fix broken promisify(All) because of ICallback typing (4250e32)

## 1.0.0-rc.9 (2022-05-31)

- Improve RedisClient typings (27219a6)
- Set up codecov (98293bd)
- Fix type coverage (2f4a722)

## 1.0.0-rc.8 (2022-05-30)

- Add WatchedKeysChangedError class (1e42e80)

## 1.0.0-rc.7 (2022-05-30)

- Fix various redis errors (9349261)

## 1.0.0-rc.6 (2022-05-30)

- Fix missing RedisClient from package exports (88f90f0)

## 1.0.0-rc.5 (2022-05-30)

- Update IRedisClientMulti interface (be1c534)

## 1.0.0-rc.4 (2022-05-30)

- Update docs (5b88f1d)
- Clean up (dfccabf)
- Fix type coverage (a5def8d)
- Implement RedisClientMulti (fc5a832)
- Fix redis-client/test00001 (ba817ef)
- Drop support for node.js v12 (14773ab)
- Add node-redis v4 support (WIP) (a316490)
- Add NPM version badge (8fa0d52)
- Update package keywords (98b6e5e)
- Update logs.md (fe0e708)
- Add shared docs (19b9f0b)

## 1.0.0-rc.3 (2022-05-26)

- Update README.md
- Refactor and clean up Worker and WorkerRunner classes

## 1.0.0-rc.2 (2022-05-25)

- Allow children of Worker class to access worker params

## 1.0.0-rc.1 (2022-05-24)

- Update package keywords and description
- Use codecov instead of coveralls
- Initial commit, migrate common components from redis-smq
