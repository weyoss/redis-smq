# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [9.0.0-next.2](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.1...v9.0.0-next.2) (2025-09-07)

### 🐛 Bug Fixes

- **redis-smq-rest-api:** add shebang to CLI script for proper execution ([1ed36cc](https://github.com/weyoss/redis-smq/commit/1ed36cc76c0c8dce97a6f99c0b082bec34d3853d))
- **redis-smq-rest-api:** set default Redis database to 0 ([7e12b43](https://github.com/weyoss/redis-smq/commit/7e12b433c7d4f88bc3a443505818da6a479202a3))
- **redis-smq-web-server:** add shebang to CLI script for proper execution ([0c213c5](https://github.com/weyoss/redis-smq/commit/0c213c5a39a86c1d752cfbf6e5e9595b678e7208))

### 📝 Documentation

- **redis-smq-rest-api:** remove outdated prerequisites section ([f14aaaf](https://github.com/weyoss/redis-smq/commit/f14aaaf0da96e43468ead3e845ebd2be7e61ae59))
- **redis-smq-web-server:** fix installation/quick start commands ([9832d33](https://github.com/weyoss/redis-smq/commit/9832d33d8beafc31f989e6477a2d83be86392966))
- **redis-smq-web-server:** fix npm install command ([db7f4e3](https://github.com/weyoss/redis-smq/commit/db7f4e3bd4f0778c2dad2eb9d779afd9515628ea))
- **redis-smq-web-ui:** add screenshot to README ([c6fb731](https://github.com/weyoss/redis-smq/commit/c6fb731f1bf29021793cb7ee12e69b2a8332a707))
- update installation instructions to include required deps ([107c2a5](https://github.com/weyoss/redis-smq/commit/107c2a5b2eda5b540f5f033808be94923e8688fa))

## [9.0.0-next.1](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.0...v9.0.0-next.1) (2025-09-06)

### 🐛 Bug Fixes

- **redis-smq:** update Redis data structure version ([65f4dd2](https://github.com/weyoss/redis-smq/commit/65f4dd2a7e9f30d8d2367b4cead25024c1097f06))

### 📝 Documentation

- **redis-smq-rest-api:** add CLI usage documentation and examples ([c51cf48](https://github.com/weyoss/redis-smq/commit/c51cf4860ba556ce72b42472289f1bc8b69a3647))

## [9.0.0-next.0](https://github.com/weyoss/redis-smq/compare/v8.3.1...v9.0.0-next.0) (2025-09-06)

### ⚠ BREAKING CHANGES

- **redis-smq-rest-api:** implement missing API endpoints
- **redis-smq:** improve message lifecycle observability

### ✨ Features

- **redis-smq-rest-api:** implement missing API endpoints ([fdb6388](https://github.com/weyoss/redis-smq/commit/fdb63882876e8d39c3a41a1e620f575af752f06b))
- **redis-smq-web-server:** implement web server package for hosting RedisSMQ Web UI ([f85e66f](https://github.com/weyoss/redis-smq/commit/f85e66f9aed869d0f19dab8b0b589632efb63273))
- **redis-smq-web-ui:** implement comprehensive Vue.js web interface for RedisSMQ management ([cee3212](https://github.com/weyoss/redis-smq/commit/cee3212119c10c3fb08109d27f1ad89e7e033110))
- **redis-smq:** improve message lifecycle observability ([159e6f1](https://github.com/weyoss/redis-smq/commit/159e6f1a9b408a9194bf725f062852ac4d650ec9))

### 🐛 Bug Fixes

- **redis-smq-rest-api:** correct import path for routing module ([133938e](https://github.com/weyoss/redis-smq/commit/133938e226833daa00e7daf5569869786ae5ba76))
- **redis-smq-web-server:** correct package name in README ([9ad1ca1](https://github.com/weyoss/redis-smq/commit/9ad1ca104b33e2762a06ce149bfc361aa6131bad))
- **redis-smq-web-server:** make test script pass without tests ([63ec530](https://github.com/weyoss/redis-smq/commit/63ec530194e995f064ddb06c45774b3a4b0e88bc))
- **redis-smq-web-ui:** add OpenAPI client generation to build process ([c726ea6](https://github.com/weyoss/redis-smq/commit/c726ea64895cd51d1e899b0dcf8b9d3c280b9608))
- **redis-smq-web-ui:** clean up old files before OpenAPI client generation ([65372c7](https://github.com/weyoss/redis-smq/commit/65372c725eab412d645dfb6c0589f0519773d70b))
- **redis-smq-web-ui:** correct import path for messages API module ([dc913f6](https://github.com/weyoss/redis-smq/commit/dc913f689618358e45058891273670eba9d4cc61))
- **redis-smq-web-ui:** correct license statement in README ([7dfed65](https://github.com/weyoss/redis-smq/commit/7dfed65b2249a6cebfdb949858297622abdbe294))
- **redis-smq-web-ui:** improve modal warning text and fix z-index ([7dcefe1](https://github.com/weyoss/redis-smq/commit/7dcefe18fecbcb386c0be688b9f2d791faabf0eb))
- **redis-smq-web-ui:** reduce app initialization delay and improve comments ([d250209](https://github.com/weyoss/redis-smq/commit/d25020943ce08d015be0e24d135fe77f9772c32f))
- **redis-smq-web-ui:** standardize import file extensions to .ts ([65974b9](https://github.com/weyoss/redis-smq/commit/65974b9eb7031bba8e83ead4107a1f8b450cafa5))

### 🚀 Chore

- add .npmignore files to web packages for proper publishing ([2179c30](https://github.com/weyoss/redis-smq/commit/2179c30785e4c0f7ab7d1b102a91a966b70ccf24))
- update dependencies to latest versions ([3460e8c](https://github.com/weyoss/redis-smq/commit/3460e8cddc1fd6738fd1ae10beaac53e1256cb8b))

### 📝 Documentation

- **redis-smq-common:** add missing copyright headers ([c44887a](https://github.com/weyoss/redis-smq/commit/c44887a437e131334bb096547d2eb8df7e8f50fd))
- **redis-smq-common:** improve documentation ([6d7a5a9](https://github.com/weyoss/redis-smq/commit/6d7a5a96f6e268e96d2b47b2b6f564f760ed31af))
- **redis-smq-common:** update API documentation format and structure ([46a8c66](https://github.com/weyoss/redis-smq/commit/46a8c6674b69e1933b0797ca6005153099d82b8b))
- **redis-smq:** add message storage documentation ([2f37b0f](https://github.com/weyoss/redis-smq/commit/2f37b0f236ed61024802f3476800b7989d6bf8fc))
- **redis-smq:** add QueuePendingMessages class to configuration docs ([6edb61e](https://github.com/weyoss/redis-smq/commit/6edb61e8d85ac6b8c49061398ed090f605909b95))
- **redis-smq:** improve message storage documentation and class references ([7b14780](https://github.com/weyoss/redis-smq/commit/7b1478081fc05d3d3c81cbb2e4d5e0ccecf6b9fc))
- **redis-smq:** update API documentation format and structure ([a7eab77](https://github.com/weyoss/redis-smq/commit/a7eab7779f2eb7fca5b9379dadbb5c36dbf7a756))
- update README with V9 announcement and ecosystem overview ([9828f9b](https://github.com/weyoss/redis-smq/commit/9828f9b35deec9e899399a043864a22aaa384d1e))

### ♻️ Code Refactoring

- **redis-smq-common:** improve package.json metadata ([7ba7535](https://github.com/weyoss/redis-smq/commit/7ba753578636f3002f8ccaa115fe7ad3f4e91550))
- **redis-smq-common:** improve script loading to support multi-file scripts ([581855a](https://github.com/weyoss/redis-smq/commit/581855a281795368e93dbc36c9dba90b3681dc34))

## [8.3.1](https://github.com/weyoss/redis-smq/compare/v8.3.0...v8.3.1) (2025-05-06)

### ⚡ Performance Improvements

- **redis-smq:** optimize and clean up LUA scripts for better Redis performance ([1f8b128](https://github.com/weyoss/redis-smq/commit/1f8b128716e2686bd7d145efaef9b0c9a28daa65))

## [8.3.0](https://github.com/weyoss/redis-smq/compare/v8.2.1...v8.3.0) (2025-05-04)

### ✨ Features

- **redis-smq-common:** implement additional async utilities and factories ([030d2ec](https://github.com/weyoss/redis-smq/commit/030d2ec849315bb381593fb9781839937761b66e))

### 🐛 Bug Fixes

- **redis-smq:** make message deletion more resilient to race conditions and inconsistent states ([3c07bae](https://github.com/weyoss/redis-smq/commit/3c07baee7df4e350d54d4c354d1f2604f8b773ae))

### 📝 Documentation

- **redis-smq-common:** update ConsoleLogger constructor description ([f777ec6](https://github.com/weyoss/redis-smq/commit/f777ec63e2a963e32f1663c4571a878fa636f114))
- **redis-smq:** update class references ([d30542e](https://github.com/weyoss/redis-smq/commit/d30542e89faa2f511ff4fa0f2640446b0c591d89))

### ♻️ Code Refactoring

- **redis-smq-common:** improve Redis server platform support and constants organization ([d542a0a](https://github.com/weyoss/redis-smq/commit/d542a0ac7ae0c0a7ada81b60f5da347b44129792))
- **redis-smq:** improve callback patterns and use new async utils ([8cff0d2](https://github.com/weyoss/redis-smq/commit/8cff0d2968561899c30156554aa89420c0fa8479))

## [8.2.1](https://github.com/weyoss/redis-smq/compare/v8.2.0...v8.2.1) (2025-04-22)

### 🐛 Bug Fixes

- **redis-smq-common:** set default log level to INFO ([bbd6952](https://github.com/weyoss/redis-smq/commit/bbd6952938ce8f2633a54bc3384e97dee873a820))
- **redis-smq:** use correct cursor for SSCAN operation, clean up ([33828ed](https://github.com/weyoss/redis-smq/commit/33828ed9621d5b126677e11ec1d42ac420dd380c))

### 📝 Documentation

- **redis-smq:** add pageSize to IQueueMessagesPageParams typing ([32bf04f](https://github.com/weyoss/redis-smq/commit/32bf04f522df2b68f26eb8a4cf1d911e83829a06))
- **redis-smq:** improve logging and documentation ([ed477db](https://github.com/weyoss/redis-smq/commit/ed477dbde9f73f27051d8e857b2b5121aef8f626))

### ✅ Tests

- **redis-smq:** add new tests for queue message storage implementations ([5697e58](https://github.com/weyoss/redis-smq/commit/5697e587abe2e99e4d3a35c194d9034561b1c4d8))

## [8.2.0](https://github.com/weyoss/redis-smq/compare/v8.1.0...v8.2.0) (2025-04-20)

### ✨ Features

- **redis-smq-common:** implement ConsoleLogger and improve logging ([37122c2](https://github.com/weyoss/redis-smq/commit/37122c240d2fce3aebd74c8b82166503c2bf4eaf))
- **redis-smq:** enhance logging with detailed debug information ([3935682](https://github.com/weyoss/redis-smq/commit/39356824d769f68165c82fcfd4fcb020aabe5822))

### 🐛 Bug Fixes

- **redis-smq:** await async queue consumers retrieval in test ([0b1f727](https://github.com/weyoss/redis-smq/commit/0b1f727b716c785da271a0410a8c9fd8082e0079))

### 🚀 Chore

- add documentation bug report issue template ([502b942](https://github.com/weyoss/redis-smq/commit/502b942508db3fb4beb490d0e133945ba6752ec1))
- use more descriptive labels for docs bug report ([4848495](https://github.com/weyoss/redis-smq/commit/4848495a5b4b0a13efbdfc3d86d949c15853cef4))

### 📝 Documentation

- **redis-smq-common:** enhance logger documentation and add ConsoleLogger API reference ([e6299d7](https://github.com/weyoss/redis-smq/commit/e6299d7d0c72eebd4273307b855e6538d3fac280))
- **redis-smq-rest-api:** update package name reference in README ([cf8415d](https://github.com/weyoss/redis-smq/commit/cf8415d6b1171c375fa6941430b34acc7b323acd))
- **redis-smq:** fix typos and enhance API documentation ([aabf2fa](https://github.com/weyoss/redis-smq/commit/aabf2faf385fd0f8766f24a868c6dc75a55deaf1))
- **redis-smq:** update configuration examples ([906193e](https://github.com/weyoss/redis-smq/commit/906193ea57158e20a7ae7446aa562e38d820f89d))
- update logs documentation link ([9561f31](https://github.com/weyoss/redis-smq/commit/9561f31282440624dcef02edb694dc311590d921))
- update redis-smq references ([79bdc4c](https://github.com/weyoss/redis-smq/commit/79bdc4c934b61bd07486738fdfa67a289f6f8127))
- update redis-smq-common references ([d8d9fc3](https://github.com/weyoss/redis-smq/commit/d8d9fc380591f9d83e3885513e74d1dc82749e0c))

### ✅ Tests

- **redis-smq-common:** enhance logger tests ([98a275b](https://github.com/weyoss/redis-smq/commit/98a275b8528ae9ebd64e4a139867a4d8c0724d0f))

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
