# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [9.0.4-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.3...v9.0.4-next.0) (2025-11-11)

### 🚀 Chore

- update READMEs after merging 'v9.0.3' into 'next' ([5bc9ff0](https://github.com/weyoss/redis-smq/commit/5bc9ff0c9b8d8743a7613fbd499124dab05b1433))

### ♻️ Code Refactoring

- **redis-smq:** expand IRedisClient with additional Redis operations ([a282844](https://github.com/weyoss/redis-smq/commit/a282844a9b0e2c4b1c36b242f49788d16b2683a8))
- **redis-smq:** improve MultiplexedMessageHandlerRunner scheduling ([670abd9](https://github.com/weyoss/redis-smq/commit/670abd952d5e296acd49ca678ae512c8a0c3bd55))
- **redis-smq:** improve queue comparison logic ([2df8878](https://github.com/weyoss/redis-smq/commit/2df8878c41c4ceb1eaf87d161d9a0e119dc4bb6c))
- **redis-smq:** rename tickIntervalMs to multiplexingTickIntervalMs ([57bb36f](https://github.com/weyoss/redis-smq/commit/57bb36f8d8d8dfcefc1dfd5ba8fb343d386afa7e))

### ⚡ Performance Improvements

- **redis-smq:** avoid N+1 query problem by using isConsumerListAlive ([2e6573b](https://github.com/weyoss/redis-smq/commit/2e6573b7267d687ef1eade3401f79f500b6a37c0))

### ✅ Tests

- **redis-smq-common:** make scan operation tests more flexible ([7b54475](https://github.com/weyoss/redis-smq/commit/7b54475504ef262f18f81ffa951171176cef52c0))

## [9.0.3](https://github.com/weyoss/redis-smq/compare/v9.0.3-next.1...v9.0.3) (2025-11-10)

### 🚀 Chore

- update READMEs after merging 'origin/next' into 'master' ([6a3d1ab](https://github.com/weyoss/redis-smq/commit/6a3d1ab48e5fc08b56e0a8ae12e70fc5ba9b55a7))

## [9.0.3-next.1](https://github.com/weyoss/redis-smq/compare/v9.0.3-next.0...v9.0.3-next.1) (2025-11-10)

### 🐛 Bug Fixes

- **redis-smq:** handle gracefully message checkout race condition ([4d00db7](https://github.com/weyoss/redis-smq/commit/4d00db7d935a244c7fbf94ca9aa78e2cd3bffccb))

### ♻️ Code Refactoring

- improve post-merge hook with dynamic commit messages ([c8bf22f](https://github.com/weyoss/redis-smq/commit/c8bf22fe5cec1069a3d574cf5f84a55d098ba447))
- **redis-smq:** implement message handler reconciliation mechanism ([0b3dde2](https://github.com/weyoss/redis-smq/commit/0b3dde206e9c3ae682573fa7f9e57b0dfc201550))
- **redis-smq:** improve MessageHandlerRunner and error handling ([a3f955f](https://github.com/weyoss/redis-smq/commit/a3f955f7236879c96a78ef7200377932084681d2))
- **redis-smq:** improve next scheduling in MultiplexedMessageHandlerRunner ([4082586](https://github.com/weyoss/redis-smq/commit/4082586c5529b4ce16afaefb1159dce7a9dbbc78))
- **redis-smq:** introduce consumer context for dependency injection ([0b3c62c](https://github.com/weyoss/redis-smq/commit/0b3c62cd6b204d4c79885a076dfc91963c6353f1))
- **redis-smq:** simplify and improve control flow for MessageHandler/DequeueMessage ([b5e2b3e](https://github.com/weyoss/redis-smq/commit/b5e2b3e037b4f4d627afb7a37508681397e6352d))
- **redis-smq:** use the config object from consumerContext ([b9e4ddd](https://github.com/weyoss/redis-smq/commit/b9e4dddfa4903a4b742f560e9b38eef04ed0d359))

## [9.0.3-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.2...v9.0.3-next.0) (2025-11-09)

### 🐛 Bug Fixes

- **redis-smq:** ensure ephemeral consumer groups cleanup ([d551caa](https://github.com/weyoss/redis-smq/commit/d551caa8c51509155436a1d90809486bf7b7f7c1))

### 📝 Documentation

- update README files ([aa98d75](https://github.com/weyoss/redis-smq/commit/aa98d752f69ed1593ae43f0e38b9df087b11d6de))

### ♻️ Code Refactoring

- **redis-smq:** decouple consumer components from Consumer class ([185a91f](https://github.com/weyoss/redis-smq/commit/185a91fd11f60d1896bb15727ab8d4055874eb1e))
- **redis-smq:** improve ConsumerHeartbeat reliability and instance isolation ([d544d1c](https://github.com/weyoss/redis-smq/commit/d544d1c50720770a560ca33ea56c807df7d6fd65))

## [9.0.2](https://github.com/weyoss/redis-smq/compare/v9.0.2-next.1...v9.0.2) (2025-11-08)

### 📝 Documentation

- update README files ([20d454a](https://github.com/weyoss/redis-smq/commit/20d454a7179f55132f5bdeb1d53603f945352bba))

## [9.0.2-next.1](https://github.com/weyoss/redis-smq/compare/v9.0.2-next.0...v9.0.2-next.1) (2025-11-08)

### 🐛 Bug Fixes

- update deps to resolve security vulnerabilities ([390d488](https://github.com/weyoss/redis-smq/commit/390d4880241c6bc3cf37e94d1b09f34197a7fa7b))

### 📝 Documentation

- add v9 release notes and upgrade notice to README ([2c742a1](https://github.com/weyoss/redis-smq/commit/2c742a169b04343fd9e00c162b74a2b2601ac9b5))
- update npm badge links to point to GitHub releases ([1eaee9e](https://github.com/weyoss/redis-smq/commit/1eaee9e1734b4e78ac56ca9853baac1d58dd2ec9))

## [9.0.2-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.1...v9.0.2-next.0) (2025-11-08)

### 🚀 Chore

- update copyright header ([d19ea47](https://github.com/weyoss/redis-smq/commit/d19ea47c3c7790f34e801a57e7e7fdc858c5270d))

### ✅ Tests

- rename test_workspace_esm.sh to test-workspace-esm.sh ([4c56821](https://github.com/weyoss/redis-smq/commit/4c5682125c99949118141418c11bd296d2869172))

### 📦‍ Build System

- automate README.md files update ([9d54181](https://github.com/weyoss/redis-smq/commit/9d54181260e6615d176fe47b4786f8edb21c2911))

## [9.0.1](https://github.com/weyoss/redis-smq/compare/v9.0.0...v9.0.1) (2025-11-07)

### 📝 Documentation

- **redis-smq:** do not include preleases for release badge ([c9b3aec](https://github.com/weyoss/redis-smq/commit/c9b3aec8d85f1c72a0e8f739448354e3313c72c3))
- update install commands to use [@latest](https://github.com/latest) instead of [@next](https://github.com/next) ([353abe8](https://github.com/weyoss/redis-smq/commit/353abe893f457f706290c7c182a2b8bc07458dbe))
- update README files for release v9 ([b838b11](https://github.com/weyoss/redis-smq/commit/b838b119323e9c73a420bef1d07a0d432f3607f0))

### 📦‍ Build System

- preserve README versions during merges ([1c48c0d](https://github.com/weyoss/redis-smq/commit/1c48c0d61582e9e35b0f53c6845f544acc3f7c50))

## [9.0.0](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.18...v9.0.0) (2025-11-07)

**Note:** Version bump only for package root

## [9.0.0-next.18](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.17...v9.0.0-next.18) (2025-11-07)

### 📝 Documentation

- convert relative paths to absolute URLs in package READMEs ([ad5da5f](https://github.com/weyoss/redis-smq/commit/ad5da5f14aeb01822e560e7e15473dc27518e80a))
- **redis-smq-web-ui:** fix screenshot URL to use raw GitHub content ([e9024e4](https://github.com/weyoss/redis-smq/commit/e9024e47316dfe8e8ce2b966eef727355098753b))

## [9.0.0-next.17](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.16...v9.0.0-next.17) (2025-11-07)

### ⚠ BREAKING CHANGES

- **redis-smq-web-server:** remove apiServer from IRedisSMQWebServerConfig

### 📝 Documentation

- **redis-smq-common:** restructure README, move details to separate files ([fbdc31d](https://github.com/weyoss/redis-smq/commit/fbdc31d336543a25ffa0f17d2cafeb6ca685134f))
- **redis-smq-rest-api:** restructure README, move details to separate files ([2a5e5d9](https://github.com/weyoss/redis-smq/commit/2a5e5d9a4644e9d1ce490262e7682a83e9dc0e00))
- **redis-smq-web-server:** restructure README, move details to separate files ([99a5bce](https://github.com/weyoss/redis-smq/commit/99a5bce764ed7ba7568f2498ea59ce662a84d7ad))
- **redis-smq-web-ui:** restructure README, move details to separate files ([1f701cd](https://github.com/weyoss/redis-smq/commit/1f701cd6e1e5eee01525677f86bf98b69e7c4dfd))
- **redis-smq:** improve classes/interfaces formatting ([f76936a](https://github.com/weyoss/redis-smq/commit/f76936a13b57887b40b3ac15f6756b6a5f8e87eb))
- standardize documentation links to use relative paths ([fc7c474](https://github.com/weyoss/redis-smq/commit/fc7c474bffbd2160fb9bb8727cec4bbdc5a23dc8))

### ♻️ Code Refactoring

- **redis-smq-web-server:** remove apiServer from IRedisSMQWebServerConfig ([b78dea0](https://github.com/weyoss/redis-smq/commit/b78dea0def68dde6d8550b1355b98ed9aeda833c))
- **redis-smq-web-ui:** improve message audit disabled alert text clarity ([1b5d99f](https://github.com/weyoss/redis-smq/commit/1b5d99fee98f93a61c26564f79623787082665cd))
- **redis-smq-web-ui:** remove unused custom-fetch.ts ([eb672c4](https://github.com/weyoss/redis-smq/commit/eb672c4bbfb83dfb1f2c54809338f4a20d43bd75))

## [9.0.0-next.16](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.15...v9.0.0-next.16) (2025-11-05)

### 🐛 Bug Fixes

- **redis-smq:** don’t fail reap cycle on ephemeral consumer group deletion errors ([ebb28b9](https://github.com/weyoss/redis-smq/commit/ebb28b9d01b47df6a288d0cbeba63c79c6cdfb67))

### 📝 Documentation

- **redis-smq:** add missing IQueueMessages reference ([bd690b5](https://github.com/weyoss/redis-smq/commit/bd690b5502366c0951fafb8a956ac30a8711e89a))
- **redis-smq:** clarify message audit documentation ([e1a06a8](https://github.com/weyoss/redis-smq/commit/e1a06a895e13274b624583d6ab39199ce1cb98c0))
- **redis-smq:** update API reference ([febee6a](https://github.com/weyoss/redis-smq/commit/febee6ada6e757c865897d30ab403d73963e946a))
- **redis-smq:** update API reference ([f98eb39](https://github.com/weyoss/redis-smq/commit/f98eb392b60162831135ad91843f3fee31feb9f1))
- **redis-smq:** update ESM/CJS module usage examples with new API ([ef52575](https://github.com/weyoss/redis-smq/commit/ef5257589ce01b204a75d7a5ab97136efdef9def))

### ♻️ Code Refactoring

- **redis-smq-rest-api:** remove QueueExplorerError from API error list ([687e116](https://github.com/weyoss/redis-smq/commit/687e1165ac9b17c5d331b7ff4b42b59f7ac5db17))
- **redis-smq:** rename QueueExplorer to QueueMessagesAbstract ([459d7e6](https://github.com/weyoss/redis-smq/commit/459d7e6d86192033d6a4a7f878cd4e3d6ef6f6b8))
- **redis-smq:** rename QueueStorage to QueueStorageAbstract ([8bc0f5b](https://github.com/weyoss/redis-smq/commit/8bc0f5b0a1f4abb15ab2181ae3d9700cd4842030))

## [9.0.0-next.15](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.14...v9.0.0-next.15) (2025-10-31)

### ⚠ BREAKING CHANGES

- **redis-smq:** improve message audit configuration and parsing logic

### 📝 Documentation

- **redis-smq-web-server:** add reverse proxy deployment guide ([c19a48c](https://github.com/weyoss/redis-smq/commit/c19a48c58c1e384a0d484cb79ee461503fa0a306))
- **redis-smq:** update message audit related documentation and api ([de075ea](https://github.com/weyoss/redis-smq/commit/de075ea5e1e6a83d0b6cf5aa07cc7a310bcb6cb8))

### ♻️ Code Refactoring

- **redis-smq-rest-api:** update message audit config and error classes ([03bbced](https://github.com/weyoss/redis-smq/commit/03bbced8a687fbf41cbaae57aa455318b5db4da5))
- **redis-smq-web-ui:** update message audit configuration handling ([1f2c55f](https://github.com/weyoss/redis-smq/commit/1f2c55f113e5b8e34feb7c37d9f4f0507d82a6e3))
- **redis-smq:** improve message audit configuration and parsing logic ([62c9750](https://github.com/weyoss/redis-smq/commit/62c97506eecf27f691959a4b85f02d277b8bc150))

### ✅ Tests

- **redis-smq-rest-api:** fix expected configuration object keys ([d72049a](https://github.com/weyoss/redis-smq/commit/d72049a7aa0e82823b491ad053088cb446d37642))

## [9.0.0-next.14](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.13...v9.0.0-next.14) (2025-10-28)

### ⚠ BREAKING CHANGES

- **redis-smq-web-server:** fix base path routing and improve middleware setup
- **redis-smq-rest-api:** reorganize Swagger UI routing

### 🐛 Bug Fixes

- **redis-smq-web-server:** fix base path routing and improve middleware setup ([45d6c6d](https://github.com/weyoss/redis-smq/commit/45d6c6dbb35999676575f7f3373a495c9c2e3731))
- **redis-smq-web-ui:** fix base path handling ([622576e](https://github.com/weyoss/redis-smq/commit/622576e0abd511f7731a3ef98d9777c554007893))

### ♻️ Code Refactoring

- **redis-smq-rest-api:** reorganize Swagger UI routing ([e36f455](https://github.com/weyoss/redis-smq/commit/e36f455134b994ec8278654443d2e8e6d0d5d3c6))

## [9.0.0-next.13](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.12...v9.0.0-next.13) (2025-10-28)

### 🐛 Bug Fixes

- **redis-smq-web-server:** ensure API server inherits correct base path configuration ([eaa1b7d](https://github.com/weyoss/redis-smq/commit/eaa1b7d0a40ccdf98ceecd98f37930f840407946))

### 🚀 Chore

- **redis-smq-rest-api:** fix security vulnerabilities by upgrading koa to v3.1.1 ([35c7534](https://github.com/weyoss/redis-smq/commit/35c75343da3f04a6512916a563633088f6b82b9f))

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

- **redis-smq-rest-api:** add missing RoutingKeyRequiredError to error mappings ([1f46aed](https://github.com/weyoss/redis-smq/commit/1f46aedb5a7cffd2c936316d5cef31a4927f3934))
- **redis-smq-web-server:** add rate limiting middleware to prevent DoS attacks ([5c144fd](https://github.com/weyoss/redis-smq/commit/5c144fdc67007aa686bdceddc36e3d93635bcff9))
- **redis-smq-web-server:** improve base path handling and routing logic ([5e7ff4c](https://github.com/weyoss/redis-smq/commit/5e7ff4c46b07b29bd1328bbf9732efbd07cb60b1))
- **redis-smq-web-ui:** handle correctly base path ([f338be1](https://github.com/weyoss/redis-smq/commit/f338be1c279bd1b6a91225c85c2615490f0050cc))

### 🚀 Chore

- **redis-smq-web-ui:** upgrade playwright to version 1.56.1 ([ac1cd46](https://github.com/weyoss/redis-smq/commit/ac1cd46cc64c927fb00ade40e39e4752fc8fa9fd))
- **redis-smq-web-ui:** upgrade vite to version 7.1.12 ([5c92529](https://github.com/weyoss/redis-smq/commit/5c92529828d9f2512dee5f1b95d92eba996ee2ab))

### 📝 Documentation

- **redis-smq-web-server:** add npm version/code coverage badges ([c4c76c2](https://github.com/weyoss/redis-smq/commit/c4c76c2a781ad414ae1117f9b47cdb0c4eb04fac))

### ✅ Tests

- **redis-smq-web-server:** add comprehensive E2E test suite ([d67e5c6](https://github.com/weyoss/redis-smq/commit/d67e5c6d4cfb62d6736698d5fdb158a2bebf41df))

## [9.0.0-next.9](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.8...v9.0.0-next.9) (2025-10-21)

### 🐛 Bug Fixes

- **redis-smq:** add missing RoutingKeyRequiredError class ([2a76b66](https://github.com/weyoss/redis-smq/commit/2a76b668a698cd79f8cb437a642d5062067cd149))

### 📝 Documentation

- **redis-smq-common:** standardize markdown formatting in API documentation ([445296c](https://github.com/weyoss/redis-smq/commit/445296cd091e1e6a77116238cc4b0327323f9f8a))
- **redis-smq:** update documentation and improve md formatting ([c659b9f](https://github.com/weyoss/redis-smq/commit/c659b9f8f4b026d731ddaf94228ce871ee56f14a))

### ♻️ Code Refactoring

- **redis-smq:** rename QueueConsumerGroupsCache to PubSubTargetResolver, clean up Producer docs ([1ea5669](https://github.com/weyoss/redis-smq/commit/1ea566959e97b0b695cea85b9f2117903273320d))

## [9.0.0-next.8](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.7...v9.0.0-next.8) (2025-10-18)

### ✨ Features

- **redis-smq:** make consumerGroupId optional for PubSub queue consumers ([0529efd](https://github.com/weyoss/redis-smq/commit/0529efd3ab38ba6f423143af344b30d2ef1cc4a4))

### 🐛 Bug Fixes

- **redis-smq-web-ui:** make loading screen responsive with fluid scaling ([fe6d346](https://github.com/weyoss/redis-smq/commit/fe6d3469eaf67a3f52f903c79e2a25942c46ef86))
- **redis-smq-web-ui:** offer to create the first queue only when no queues exist ([8042b45](https://github.com/weyoss/redis-smq/commit/8042b45d5c735352df83e44176647c722509e128))
- **redis-smq:** check consumer group existence when relevant ([1711ac1](https://github.com/weyoss/redis-smq/commit/1711ac1db83ae8ca1e65947c33ca2878f49e15ed))

### 📝 Documentation

- **redis-smq-web-ui:** update README screenshot to home view ([874ad7f](https://github.com/weyoss/redis-smq/commit/874ad7f342119b71004662731482e8b45b921991))
- **redis-smq:** clarify consumer group behavior for PubSub queues ([84f0e48](https://github.com/weyoss/redis-smq/commit/84f0e484bdca19085d067d738bb9d1adaa825ca1))

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

- **redis-smq-rest-api:** add configuration endpoint ([b343c27](https://github.com/weyoss/redis-smq/commit/b343c27a6f668a369ff57de837fb05314cea0b6d))
- **redis-smq-web-ui:** improve mobile experience ([1230bfe](https://github.com/weyoss/redis-smq/commit/1230bfee88f2d6ed2dea4c56bd4b7e4c7dd216df))
- **redis-smq-web-ui:** notify about disabled message storage for ack/dl messages ([b3ecc52](https://github.com/weyoss/redis-smq/commit/b3ecc527548c770c37829cc69f716c27b8df5f14))

### 🐛 Bug Fixes

- **redis-smq-web-ui:** fix sudden CreateExchangeModal closure ([b6b2b0e](https://github.com/weyoss/redis-smq/commit/b6b2b0edb6d4d1c4fc022d2cbaf2f21101a61c4a))

### 🚀 Chore

- add gitattributes for README merge strategy ([ea77c8c](https://github.com/weyoss/redis-smq/commit/ea77c8cce954f5144d08481aee2ad52c6c1ec8cd))
- improve lint-staged configuration for better file type handling ([823d955](https://github.com/weyoss/redis-smq/commit/823d9552dcb262db31797d801c5d9a2781dffed0))
- **redis-smq-rest-api:** update dependencies to latest versions ([a42ac0b](https://github.com/weyoss/redis-smq/commit/a42ac0ba0748e43cd8fa02bfff0c3c9eda7b07e0))
- **redis-smq-web-server:** update dependencies to latest versions ([34676ff](https://github.com/weyoss/redis-smq/commit/34676ff071c0d1f99b8b3d8efa8b1980b3e2eee6))
- **redis-smq-web-ui:** update dependencies to latest versions ([f48c578](https://github.com/weyoss/redis-smq/commit/f48c578eaf84b04bdb700d808b5acc60396fc9e5))
- **redis-smq:** update dependencies to latest versions ([6864c71](https://github.com/weyoss/redis-smq/commit/6864c712ad8596fc461e5825b8a9d6d2d422095e))
- update dependencies to latest versions ([1b96c6f](https://github.com/weyoss/redis-smq/commit/1b96c6f328f560938cb59c4dbbdd6fc1d8c34308))
- update GitHub workflows to include next branch ([146eefe](https://github.com/weyoss/redis-smq/commit/146eefe3f037cba3108b0a84863b8a9c6f19d66a))

### 📝 Documentation

- add GitHub note callouts in README files ([86e855a](https://github.com/weyoss/redis-smq/commit/86e855ae7aea91e3295301671b8da3249164ea40))
- fix master branch README link ([84aaf46](https://github.com/weyoss/redis-smq/commit/84aaf462876b1694a23c27859949df088bc21647))
- fix navigation breadcrumb ([63ec998](https://github.com/weyoss/redis-smq/commit/63ec998fa01613479a984813959a1361336c5f92))
- **redis-smq-common:** update docs and clean up ([21cedc6](https://github.com/weyoss/redis-smq/commit/21cedc648fb8df7cc58ea44fe16790ccacbb92a5))
- **redis-smq-web-ui:** fix license statement ([0e37a16](https://github.com/weyoss/redis-smq/commit/0e37a16143bc458de9b33e78e2be9f1757897f33))
- **redis-smq-web-ui:** improve README clarity and structure ([d85bffe](https://github.com/weyoss/redis-smq/commit/d85bffede56fcc17651af1ac7d0fb0a03cb331ce))
- **redis-smq:** update docs and clean up ([66ed0b8](https://github.com/weyoss/redis-smq/commit/66ed0b8bff775bae6083cee5d958c64d19d71b2c))
- standardize "next" branch reference ([15f3e4f](https://github.com/weyoss/redis-smq/commit/15f3e4f4347fd4f76f9dc167dd72f174f178ab8e))
- streamline and improve documentation structure and readability ([b3aabab](https://github.com/weyoss/redis-smq/commit/b3aabab6bf036d5e8a9908de746bbe7d86422920))
- update README files for next branch with pre-release badges and doc links ([463250b](https://github.com/weyoss/redis-smq/commit/463250bbd754d44ae6741abcf4e2d62995aef620))

### ♻️ Code Refactoring

- **redis-smq-common:** upgrade node-redis client to v5 ([0746f52](https://github.com/weyoss/redis-smq/commit/0746f52a3080bb80398b4a8ce8847910806363ab))
- **redis-smq-web-ui:** migrate scripts utils to use RedisSMQ class ([30797f8](https://github.com/weyoss/redis-smq/commit/30797f855272f5c2f3456224c0a91a2301d2eb39))
- **redis-smq-web-ui:** remove unused CreateFanoutExchangeModal ([79f3fda](https://github.com/weyoss/redis-smq/commit/79f3fdae50c2f1cc21592e7a8759daf98be09fe8))
- **redis-smq-web-ui:** reorder navigation menu items ([235e81c](https://github.com/weyoss/redis-smq/commit/235e81c98a4df75b229b89227e06c2d7aaded068))

## [9.0.0-next.4](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.3...v9.0.0-next.4) (2025-10-09)

### ⚠ BREAKING CHANGES

- **redis-smq-rest-api:** add exchange API endpoints for direct, fanout, and topic exchanges
- **redis-smq:** modernize exchange system with unified API and enhanced routing
- **redis-smq-common:** consolidate Redis client creation logic into factory class
- **redis-smq-common:** simplify logger architecture, improve namespace handling

### ✨ Features

- **redis-smq-common:** add child logger creation ([20c4c80](https://github.com/weyoss/redis-smq/commit/20c4c803ee48f3bf9aeb3c23e9846adfa1138bb8))
- **redis-smq-common:** add WATCH/MULTI/EXEC transaction helper with retry logic ([7d8420b](https://github.com/weyoss/redis-smq/commit/7d8420bf356532c56cc8ebefb0754c79ae4bb16f))
- **redis-smq-rest-api:** add exchange API endpoints for direct, fanout, and topic exchanges ([4ab1f32](https://github.com/weyoss/redis-smq/commit/4ab1f32e0f191e0522474865f1ce23d8b43b41a4))
- **redis-smq-rest-api:** add GET endpoint for namespace exchanges ([22fac1b](https://github.com/weyoss/redis-smq/commit/22fac1b6c837f2d61af9883b63c5f7162b3b422a))
- **redis-smq-web-ui:** add exchange management system ([c33650c](https://github.com/weyoss/redis-smq/commit/c33650c01a3c4fcd4663b08668642f7aea394fce))
- **redis-smq:** add create method to exchange implementations ([1e6fb75](https://github.com/weyoss/redis-smq/commit/1e6fb7559ff95b8e15e294f898da91539c4690e3))
- **redis-smq:** add factory methods for exchange types ([6a670df](https://github.com/weyoss/redis-smq/commit/6a670df688f662b993126791f758df0c2e8c8839))
- **redis-smq:** implement simplified API,connection pooling,and reorganize architecture ([fb81554](https://github.com/weyoss/redis-smq/commit/fb81554a5aac9edebcfc6287415c9dba0f4b3492))
- **redis-smq:** modernize exchange system with unified API and enhanced routing ([20380ee](https://github.com/weyoss/redis-smq/commit/20380eeaf56ee89c88aaadcb606a9dd192411e94))

### 🐛 Bug Fixes

- **redis-smq-web-ui:** fix error message reference ([8e6fb43](https://github.com/weyoss/redis-smq/commit/8e6fb4379976a7a3d26036f22f235f0271da79a0))
- **redis-smq-web-ui:** initialize RedisSMQ before starting API server ([22887fa](https://github.com/weyoss/redis-smq/commit/22887faf0abc8939de9f90e8abfb18d7c8e93d02))
- **redis-smq-web-ui:** update branding ([2bd50ce](https://github.com/weyoss/redis-smq/commit/2bd50ce8ef75bdca9c5602ddc8bc6d36cdb8342f))
- **redis-smq:** validate topic exchange params as regex patterns ([c618c4a](https://github.com/weyoss/redis-smq/commit/c618c4ab173ecdef806693eeea3d4b890cee6a24))

### 🚀 Chore

- update pnpm lockfile ([8861d8e](https://github.com/weyoss/redis-smq/commit/8861d8e7ee599df0ad32c977561de506f24f65e5))

### 📝 Documentation

- fix version compatibility documentation link in README ([f3e7d41](https://github.com/weyoss/redis-smq/commit/f3e7d411ea5870eddfb26f3100aeb99fd52876a3))
- **redis-smq-common:** add API documentation for WATCH transaction helper ([053ada5](https://github.com/weyoss/redis-smq/commit/053ada52cfe52f2c57123647d81826e89e20d8e1))
- **redis-smq-common:** restructure and expand logger documentation ([1b2e341](https://github.com/weyoss/redis-smq/commit/1b2e34106b42a91289fa373c855076ec295dedf3))
- **redis-smq-common:** update API reference ([be62a09](https://github.com/weyoss/redis-smq/commit/be62a09a5748743ae89c143925c22e8db7b15aea))
- **redis-smq-common:** update error classes reference ([f74e2d4](https://github.com/weyoss/redis-smq/commit/f74e2d47eb028917f6a1917f33b6226cd5233d59))
- **redis-smq-common:** update Redis client documentation ([78abf35](https://github.com/weyoss/redis-smq/commit/78abf35841fd8fe78f0217916ba0b8d0dd1a165f))
- **redis-smq-web-ui:** improve README formatting ([e0d3399](https://github.com/weyoss/redis-smq/commit/e0d33990886f934df31e65fa831b87f7a761e3b0))
- **redis-smq:** add create method documentation, fix parameter ordering in exchange API reference ([ece7513](https://github.com/weyoss/redis-smq/commit/ece7513a03fe50adfa48528ae7886b22b99bd4c6))
- **redis-smq:** add JSDoc documentation for ExchangeTopic class ([ffbff17](https://github.com/weyoss/redis-smq/commit/ffbff175de1b658ef29a33fd46b790498bead130))
- **redis-smq:** rewrite message exchanges documentation ([c237de6](https://github.com/weyoss/redis-smq/commit/c237de635078aa9d16b50ce5e056d460f6eb0e8e))
- **redis-smq:** update and clean up documentation ([127377e](https://github.com/weyoss/redis-smq/commit/127377e70e46c7251526532b524a409ed080c8ed))
- **redis-smq:** update API documentation and clean up ([2c41ed6](https://github.com/weyoss/redis-smq/commit/2c41ed65aa40d1522b0a8ddf94ce50759e71dec4))
- **redis-smq:** update API reference ([783e971](https://github.com/weyoss/redis-smq/commit/783e97150fef38a10b08c01c5b5836fdec362cb7))
- **redis-smq:** update API reference for modernized exchange system ([aec4544](https://github.com/weyoss/redis-smq/commit/aec4544ef717de55e876dc4418e9d191dc044189))
- **redis-smq:** update JSDoc for ExchangeFanout class ([c847f3d](https://github.com/weyoss/redis-smq/commit/c847f3deda24905f15dbf1d036e9bfa33577fbf1))
- **redis-smq:** update README code examples and formatting ([de81492](https://github.com/weyoss/redis-smq/commit/de8149222f5721476c3277a917c74abd8942f3da))
- **redis-smq:** update topic exchange documentation ([33cc9a4](https://github.com/weyoss/redis-smq/commit/33cc9a4826ac49023b6d47734b03f69cd10691c7))
- rewrite README and configuration documentation for v9 simplified API ([8ce2923](https://github.com/weyoss/redis-smq/commit/8ce29232c2ebfbb7fdfae690a8305dce48ec541a))
- update documentation reference instructions in README ([7dc9a27](https://github.com/weyoss/redis-smq/commit/7dc9a27fb9a5404cb3e82112f410c8b816ff42df))

### ♻️ Code Refactoring

- **redis-smq-common:** clean up ConsoleLogger ([7900592](https://github.com/weyoss/redis-smq/commit/7900592344cbffad324705edc311ea5b8c98f26f))
- **redis-smq-common:** consolidate Redis client creation logic into factory class ([0742c5d](https://github.com/weyoss/redis-smq/commit/0742c5d0be7c0bc6a3b8b5c07d576ab09d32a97d))
- **redis-smq-common:** redesign event bus architecture with Runnable base class ([1e5fcb4](https://github.com/weyoss/redis-smq/commit/1e5fcb46905b6374109762258562f08c2d0f0e7c))
- **redis-smq-common:** remove isFormatted method ([cd3523c](https://github.com/weyoss/redis-smq/commit/cd3523cfa80e792ef45b817f408903dd970a3546))
- **redis-smq-common:** simplify logger architecture, improve namespace handling ([64d30c2](https://github.com/weyoss/redis-smq/commit/64d30c2ab0ecb59aefc939e89d1d6b3cac390c61))
- **redis-smq-common:** update copyright headers ([d14cde3](https://github.com/weyoss/redis-smq/commit/d14cde3e13d3d28b8a3868d07a0b7b1098cd1cd2))
- **redis-smq-common:** update test utilities to use RedisClientFactory ([fa077d5](https://github.com/weyoss/redis-smq/commit/fa077d506f6d04231e1c5454b93ab196e664c833))
- **redis-smq-common:** use RedisClientFactory in EventBusRedis ([b7a16c6](https://github.com/weyoss/redis-smq/commit/b7a16c640814d817b1f8bfeb881e9543ff93ef17))
- **redis-smq-rest-api:** improve mappings generation script, simplify build process ([c46f7f0](https://github.com/weyoss/redis-smq/commit/c46f7f055997d19642f7a518b7391ba9a0bce9d1))
- **redis-smq-rest-api:** use RedisSMQ factory methods,auto-generate error mappings ([bc3e0c4](https://github.com/weyoss/redis-smq/commit/bc3e0c4253add2414678ecb70f2bbf6ebc747e8e))
- **redis-smq-web-server:** replace console logging with app logger ([d8b3210](https://github.com/weyoss/redis-smq/commit/d8b32109929c54316630029ac8f7d9ed7fa094eb))
- **redis-smq-web-server:** use createLogger function ([436e2ea](https://github.com/weyoss/redis-smq/commit/436e2ea044d9e02e0916b96c1213e92e25787e8a))
- **redis-smq-web-ui:** standardize HTML formatting ([b290044](https://github.com/weyoss/redis-smq/commit/b290044c861014cda393467dd3b7af52f5507679))
- **redis-smq:** improve Configuration class documentation and initialization ([c6cddb9](https://github.com/weyoss/redis-smq/commit/c6cddb9ce284dd53898823d09552c8eed906b5ad))
- **redis-smq:** integrate connection pooling and reorganize error handling ([fa61afb](https://github.com/weyoss/redis-smq/commit/fa61afbd7c2538383b086c200b275749c5b96314))
- **redis-smq:** migrate test utilities to use RedisConnectionPool ([995caff](https://github.com/weyoss/redis-smq/commit/995caff236470dc7fd862a1fc31e35ae65bfd34d))
- **redis-smq:** migrate test utilities to use RedisSMQ factory methods ([1ed1300](https://github.com/weyoss/redis-smq/commit/1ed13005311215cb73ecbc61fa186065c483e07e))
- **redis-smq:** rename config getter functions to use parse prefix ([800cbaf](https://github.com/weyoss/redis-smq/commit/800cbaf8a84a50755b1472bd9069a624c3c2a444))
- **redis-smq:** reorganize imports and codebase structure ([e36d830](https://github.com/weyoss/redis-smq/commit/e36d830eef09a66a3a1b317626d725c3f730e2ce))
- **redis-smq:** update copyright headers ([7c774ab](https://github.com/weyoss/redis-smq/commit/7c774ab3b669b082264166a436f25ebd37fe3a7a))
- **redis-smq:** use IRedisClient interface instead of RedisClient class ([d60152c](https://github.com/weyoss/redis-smq/commit/d60152c752ce9a7f47ff56c31a934c7bde6d3564))

### ✅ Tests

- **redis-smq-rest-api:** fix exchanges sorting in getExchangesController.test.ts ([f6686f8](https://github.com/weyoss/redis-smq/commit/f6686f81d767f749a24cd28c5dc2186c9dc66768))

## [9.0.0-next.3](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.2...v9.0.0-next.3) (2025-09-09)

### 🐛 Bug Fixes

- **redis-smq-rest-api:** update peer dependencies ([4ede51e](https://github.com/weyoss/redis-smq/commit/4ede51e0f1a09ef211beeaa584c6e037ef5469e8))
- **redis-smq-web-server:** set default Redis database to 0 ([3b4e200](https://github.com/weyoss/redis-smq/commit/3b4e200681a5e1eec2446fa6ffa27878cb790b29))
- **redis-smq-web-server:** update peer dependencies ([2be664e](https://github.com/weyoss/redis-smq/commit/2be664ea4bacffd5b0a780e05355e356028b6321))
- **redis-smq-web-ui:** move redis-smq-rest-api from peer to dev deps ([573829e](https://github.com/weyoss/redis-smq/commit/573829e862355c33deb4b830a6c89c708d387c6f))
- **redis-smq:** add optional Redis client peer dependencies ([3e74721](https://github.com/weyoss/redis-smq/commit/3e747210705757780d22eb51c420300aa64a1516))

### 📝 Documentation

- **redis-smq-common:** update console logger documentation ([be75a62](https://github.com/weyoss/redis-smq/commit/be75a622faeb36cb198e4de84cba076d4cc157f1))
- **redis-smq-rest-api:** add Redis client installation instructions ([40d9d54](https://github.com/weyoss/redis-smq/commit/40d9d541274701b6b701505e70d9f5ee8add0912))
- **redis-smq-rest-api:** add Redis client installation instructions ([028fb19](https://github.com/weyoss/redis-smq/commit/028fb19c8eaec0e2c757bf2b1297beb46d0b5683))
- **redis-smq-rest-api:** update CLI options documentation ([ae5cae8](https://github.com/weyoss/redis-smq/commit/ae5cae8d72b9daa6d9ef8892e5bf5cf442238604))
- **redis-smq-rest-api:** update configuration and usage examples ([4d25b5e](https://github.com/weyoss/redis-smq/commit/4d25b5e3b13d725b87e168a6eb7f564349002d19))
- **redis-smq-web-server:** update configuration API and CLI options ([873bedf](https://github.com/weyoss/redis-smq/commit/873bedf848bf7098010cf67b3a886e50864021c4))
- **redis-smq-web-ui:** include Priority Queues support ([ce6d143](https://github.com/weyoss/redis-smq/commit/ce6d1436ea0015e66d736e7a01f1e2982254a0c2))
- **redis-smq:** fix API documentation links ([fc3c5c3](https://github.com/weyoss/redis-smq/commit/fc3c5c3101dc02d2919e2dcf232e98ebe582f8c6))
- **redis-smq:** update API documentation for configuration interfaces ([e825efa](https://github.com/weyoss/redis-smq/commit/e825efabbeecc658b25431155913b3ae00a8b784))

### ♻️ Code Refactoring

- **redis-smq-common:** remove custom date format support from console logger ([92f8dd9](https://github.com/weyoss/redis-smq/commit/92f8dd9eec5baf162fce3974c0d69c41595b5164))
- **redis-smq-rest-api:** improve CLI configuration and config parsing ([29f9b58](https://github.com/weyoss/redis-smq/commit/29f9b58bc6a5ab3b64887a87397f33fd5519c40b))
- **redis-smq-web-server:** improve CLI configuration and config parsing ([8ec1d84](https://github.com/weyoss/redis-smq/commit/8ec1d840678eb360a7854453cd6e20976d872c5c))
- **redis-smq:** improve configuration parsing ([5d84781](https://github.com/weyoss/redis-smq/commit/5d847814c260bf6e85e01e2afd54322f7b312eb7))

### 👷 Continuous Integration

- **codeql:** optimize workflow by running build:ca instead of install ([ff587db](https://github.com/weyoss/redis-smq/commit/ff587dbbcfd9498ac159064c63ce9032cc6458a6))

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
