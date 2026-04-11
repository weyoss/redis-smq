# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [10.1.0-next.1](https://github.com/weyoss/redis-smq/compare/v10.1.0-next.0...v10.1.0-next.1) (2026-04-11)

### 📝 Documentation

- **redis-smq:** update examples in IRedisSMQConfig JSDocs ([d9dc170](https://github.com/weyoss/redis-smq/commit/d9dc170c4dac5d6778d05805db05b7a753ded25f))
- update changelog commit hashes after email change ([ce13adf](https://github.com/weyoss/redis-smq/commit/ce13adfc8cf2e9a5b7f2573a413e534ed4cafec3))

## [10.1.0-next.0](https://github.com/weyoss/redis-smq/compare/v10.0.0...v10.1.0-next.0) (2026-04-07)

### 📝 Documentation

- update READMEs (v10.0.0 → next) ([8247b2f](https://github.com/weyoss/redis-smq/commit/8247b2f19d7caefcac6efdebd33f5592f743a1e7))

## [10.0.0](https://github.com/weyoss/redis-smq/compare/v10.0.0-next.2...v10.0.0) (2026-04-04)

> 📖 **Detailed Release Notes**: [RedisSMQ v10.0.0](https://github.com/weyoss/redis-smq/blob/master/release-notes/release-v10.0.0.md)

### 📝 Documentation

- add consolidated changelog for v10.0.0-next.2 ([33a6a4a](https://github.com/weyoss/redis-smq/commit/33a6a4af0c0ceb20b93aaff54c409bd2d3f92273))
- **redis-smq:** simplify EventBus documentation ([704259e](https://github.com/weyoss/redis-smq/commit/704259ec476b8b77e36a601e515cbca1473ef0f5))
- **redis-smq:** simplify RedisSMQ setup documentation ([3bf2e7a](https://github.com/weyoss/redis-smq/commit/3bf2e7aa6641e5a8ca7bb441f201a8ae4d71a628))
- **redis-smq:** update API reference ([99488b6](https://github.com/weyoss/redis-smq/commit/99488b6d76a360fc94129e309c457fa1b8e0be8e))

## [10.0.0-next.2](https://github.com/weyoss/redis-smq/compare/v10.0.0-next.1...v10.0.0-next.2) (2026-04-04)

### ⚠ BREAKING CHANGES

- **redis-smq:** update IRedisSMQConfig.logger to support boolean values
- **redis-smq:** simplify RedisSMQ class API

### ✨ Features

- **redis-smq:** add cross-instance configuration synchronization ([0b10045](https://github.com/weyoss/redis-smq/commit/0b100455ab9763c66fe02067142454fef48c5d17))

### 🐛 Bug Fixes

- **redis-smq:** audit messages only when enabled explicitly ([43e52d5](https://github.com/weyoss/redis-smq/commit/43e52d553835e153f0eb98c5ea822d4a29cdc5f6))

### ♻️ Code Refactoring

- **redis-smq:** add lastProcessedAt prop to MessageState ([c664159](https://github.com/weyoss/redis-smq/commit/c6641598844861444c279a6f760930830738d279))
- **redis-smq:** simplify RedisSMQ class API ([913b6e8](https://github.com/weyoss/redis-smq/commit/913b6e862198caff18c1177948f556d9e9d7e418))
- **redis-smq:** update IRedisSMQConfig.logger to support boolean values ([b2cb422](https://github.com/weyoss/redis-smq/commit/b2cb422b7404b4aa8e37ef91b4e04ef7dadf302a))

### 📦 Build System

- add strict bash script options for robustness and debugging ([64f1a0a](https://github.com/weyoss/redis-smq/commit/64f1a0ab5b13982b9e039530f94cdc1016d18adf))
- fix shell compatibility by using bash ([3066eea](https://github.com/weyoss/redis-smq/commit/3066eea5bb4e7ddff744e1e855753881d8fb8ed1))

## [10.0.0-next.1](https://github.com/weyoss/redis-smq/compare/v10.0.0-next.0...v10.0.0-next.1) (2026-03-28)

### ⚠ BREAKING CHANGES

- **redis-smq:** improve redis keys hierarchy

### ✨ Features

- **redis-smq:** add message failure history tracking ([29bef17](https://github.com/weyoss/redis-smq/commit/29bef17a897dfa4efd4aac47fcc817020981b451))
- **redis-smq:** support async/await message handlers ([8046412](https://github.com/weyoss/redis-smq/commit/8046412557ddec9ccb6df8c1c9eb30e0c86c4cc5))

### 🐛 Bug Fixes

- **redis-smq:** validate message handler function signature ([e673596](https://github.com/weyoss/redis-smq/commit/e673596402abd27edf4b2ee907887d7d788ddbd3))

### 📝 Documentation

- **redis-smq:** update dual callback & promise support docs ([76bb961](https://github.com/weyoss/redis-smq/commit/76bb9615ec9aa4d41836fac3965bc734dd623522))

### ♻️ Code Refactoring

- **redis-smq:** improve redis keys hierarchy ([5155e6d](https://github.com/weyoss/redis-smq/commit/5155e6df8d6acae02e3f270c2ab14c438b1c9905))

## [10.0.0-next.0](https://github.com/weyoss/redis-smq/compare/v9.1.0-next.6...v10.0.0-next.0) (2026-03-25)

### ⚠ BREAKING CHANGES

- **redis-smq:** make redis key structure more intuitive and consistent
- **redis-smq:** move purge job logic to PurgeQueueJobManager
- **redis-smq:** remove deprecated boolean constructor option for Consumer
- **redis-smq:** use short error class names for clarity
- **redis-smq:** rename methods for clarity and add new bindings methods
- **redis-smq:** store published messages using LISTs for efficient pagination

### ✨ Features

- **redis-smq:** add dual callback and promise support to public API ([558e309](https://github.com/weyoss/redis-smq/commit/558e309de9385a25d2226132e7f53f444a68a57c))
- **redis-smq:** enable retrieval of queue consumption status by consumer ([4df8b23](https://github.com/weyoss/redis-smq/commit/4df8b238e69cd3c7fb7dde77a7c3e539df5902a8))

### 🐛 Bug Fixes

- **redis-smq:** expect InvalidExchangeRoutingKeyError for invalid routing keys ([a4b97d5](https://github.com/weyoss/redis-smq/commit/a4b97d55a938461651ab624dbeea19ab3dcd1f4f))

### 🚀 Chore

- use underscore for script filename convention ([4d942b6](https://github.com/weyoss/redis-smq/commit/4d942b619b2e7680398723277e01bbbfba3d0f30))

### 📝 Documentation

- **redis-smq:** clean up dual-callback-and-promise-support.md ([acfa7f7](https://github.com/weyoss/redis-smq/commit/acfa7f718164fbacbbb663b7486a68bbada7dc76))
- **redis-smq:** fix incorrect error class names in JSDocs ([f49f675](https://github.com/weyoss/redis-smq/commit/f49f6755fa2355ea2efa6e8bfa2277a71ff984c0))

### ♻️ Code Refactoring

- **redis-smq:** make redis key structure more intuitive and consistent ([950df98](https://github.com/weyoss/redis-smq/commit/950df98e7ed8377f921cf28efeeded9fdf97c74d))
- **redis-smq:** move purge job logic to PurgeQueueJobManager ([07b8add](https://github.com/weyoss/redis-smq/commit/07b8add560f751e09b9ca5375d3a765a27f482cf))
- **redis-smq:** remove deprecated boolean constructor option for Consumer ([9fca59c](https://github.com/weyoss/redis-smq/commit/9fca59c58d0540d337db236545ea6a2c640f0889))
- **redis-smq:** rename methods for clarity and add new bindings methods ([12905b7](https://github.com/weyoss/redis-smq/commit/12905b7b84ae7caed6e2826d30c9b345257d5e1e))
- **redis-smq:** store published messages using LISTs for efficient pagination ([de7f621](https://github.com/weyoss/redis-smq/commit/de7f62175a9798f39d727eba4b4347951cf609af))
- **redis-smq:** use short error class names for clarity ([3990c5f](https://github.com/weyoss/redis-smq/commit/3990c5ff1f317d1c395de40c3cc041f7b92d69ff))
- **redis-smq:** use ZPOPLPUSH instead of ZPOPRPUSH when dequeuing priority queue messages ([aa26bd0](https://github.com/weyoss/redis-smq/commit/aa26bd0fcf80afdace2d30d7da1c08ba4e969145))

## [9.1.0-next.6](https://github.com/weyoss/redis-smq/compare/v9.1.0-next.5...v9.1.0-next.6) (2026-03-12)

### 📝 Documentation

- **redis-smq:** add message lifecycle and reliability documents ([0879ba3](https://github.com/weyoss/redis-smq/commit/0879ba3dae0ee7659a790e052357798882108a40))

### ♻️ Code Refactoring

- **redis-smq:** separate system and user state transition reasons ([2704e0c](https://github.com/weyoss/redis-smq/commit/2704e0cf5a8749850b921ed9bcf42c12d7e4f223))

## [9.1.0-next.5](https://github.com/weyoss/redis-smq/compare/v9.1.0-next.4...v9.1.0-next.5) (2026-03-10)

### ♻️ Code Refactoring

- **redis-smq:** integrate updates from redis-smq-common into codebase ([c4215eb](https://github.com/weyoss/redis-smq/commit/c4215eba78eabda7c831bee149e81f901146777c))
- **redis-smq:** update Consumer API reference, fix a minor typo in configuration.md ([b19d41d](https://github.com/weyoss/redis-smq/commit/b19d41d85db3a09f81a1482961c7f57015fea74a))

## [9.1.0-next.4](https://github.com/weyoss/redis-smq/compare/v9.1.0-next.3...v9.1.0-next.4) (2026-03-03)

### 🐛 Bug Fixes

- **redis-smq:** restore consumer options for running tests ([c091543](https://github.com/weyoss/redis-smq/commit/c091543229b69be882eb747ad01f9538624606ad))

### 📝 Documentation

- **redis-smq:** fix typo in README.md file ([e2908f1](https://github.com/weyoss/redis-smq/commit/e2908f1e1280ccd6e5163970a0e26b0e367d66ce))

## [9.1.0-next.3](https://github.com/weyoss/redis-smq/compare/v9.1.0-next.2...v9.1.0-next.3) (2026-03-03)

### 📝 Documentation

- **redis-smq:** add batch message acks/unacks documentation ([ce3f47f](https://github.com/weyoss/redis-smq/commit/ce3f47f4ab65e0e0f464e9beb36630fc4e5b7335))
- **redis-smq:** add navigation path to main README file ([8665359](https://github.com/weyoss/redis-smq/commit/866535975e984d3956b6b8b34edd88c62355cfa6))
- **redis-smq:** clean up and improve documentation for clarity ([11298f2](https://github.com/weyoss/redis-smq/commit/11298f272571c90e36619cc3cc5226d875a17ffa))

### ♻️ Code Refactoring

- **redis-smq:** improve batch configuration API with nested objects ([12750b4](https://github.com/weyoss/redis-smq/commit/12750b4761aef7721e7d2869add68eaecada87ba))
- **redis-smq:** shorten import ([ee1b838](https://github.com/weyoss/redis-smq/commit/ee1b838608ecc9c782dc61bafffd8029c449e76d))

## [9.1.0-next.2](https://github.com/weyoss/redis-smq/compare/v9.1.0-next.1...v9.1.0-next.2) (2026-03-03)

### ✨ Features

- **redis-smq:** implement batch message acks for improved performance ([26fd613](https://github.com/weyoss/redis-smq/commit/26fd613ce95ba8d57cf2e3afa063d1d74f426d70))
- **redis-smq:** implement batch unacks for improved performance ([fe72882](https://github.com/weyoss/redis-smq/commit/fe728822c039cadea6640afdd97e7e3a1d901205))

### 📝 Documentation

- **redis-smq:** enhance ConsumerFactory and Consumer documentation ([d3cd730](https://github.com/weyoss/redis-smq/commit/d3cd7303e62b2717bc1b21353d92d55c8db2077c))

### ♻️ Code Refactoring

- suppress error reporting for non-operational Runnable instances ([3c897b0](https://github.com/weyoss/redis-smq/commit/3c897b0ae44682e6baf0959088b2f39e6dfc8b62))

## [9.1.0-next.1](https://github.com/weyoss/redis-smq/compare/v9.1.0-next.0...v9.1.0-next.1) (2026-02-25)

### 📝 Documentation

- **redis-smq:** update API reference ([5eb591e](https://github.com/weyoss/redis-smq/commit/5eb591e25969759645d4ed1c6143c5abfd8c6a34))

### ♻️ Code Refactoring

- **redis-smq:** add lua script to retrieve queue state ([a467c9c](https://github.com/weyoss/redis-smq/commit/a467c9c4cf2f18365f167dafddcb32af89b5a97f))

### ✅ Tests

- **redis-smq:** add e2e tests for QueueOperationValidator ([2c92e62](https://github.com/weyoss/redis-smq/commit/2c92e62c9f5fe6fb21f3b862d39bf9260e89215a))
- **redis-smq:** add e2e tests for QueueStateManager ([3095b8d](https://github.com/weyoss/redis-smq/commit/3095b8ddd552920b860f5c5b58837c9d27472e8d))

## [9.1.0-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.14...v9.1.0-next.0) (2026-02-24)

### ✨ Features

- **redis-smq:** add queue state management with pause/stop/resume functionality ([8e557e5](https://github.com/weyoss/redis-smq/commit/8e557e504675a25a877169633f9af7ad220f439d))
- **redis-smq:** introduce QueueOperationValidator, enhance Queue State Management ([80d97c6](https://github.com/weyoss/redis-smq/commit/80d97c66d0e743b47689601ddcb28d7043a06bc6))

### 🐛 Bug Fixes

- **redis-smq:** correct queue lockId to null instead of empty value ([b8a6d1a](https://github.com/weyoss/redis-smq/commit/b8a6d1a7ca7a5482f82151095fe419963ebd8101))

### 🚀 Chore

- optimize npm keywords for maximum search coverage ([7432ecc](https://github.com/weyoss/redis-smq/commit/7432eccb19df6718da0da6e1cc2bd8e8f4b64de3))
- update READMEs after merging 'v9.0.14' into 'next' ([ab23f2b](https://github.com/weyoss/redis-smq/commit/ab23f2b0e6c32ffcf2a235db2322bf1a7cd94b70))

### 📝 Documentation

- **redis-smq:** add queue state management guide and update API reference ([158e337](https://github.com/weyoss/redis-smq/commit/158e33730eaff3fa5b68ed1c59577d1da247fc56))
- **redis-smq:** add QueueOperationValidator documentation ([55dbde8](https://github.com/weyoss/redis-smq/commit/55dbde8869572bc2edeaf0ca10fda410ac7a0ac1))
- **redis-smq:** clarify difference between initialize/initializeWithConfig ([29eb6fc](https://github.com/weyoss/redis-smq/commit/29eb6fce69827c736355d51a101b69787cb366a3))
- **redis-smq:** update API reference ([ddf0801](https://github.com/weyoss/redis-smq/commit/ddf080182e9daf1374ba4fdd3e07953b36eed062))

### ♻️ Code Refactoring

- **redis-smq:** enhance queue-messages implementation by removing redundancies ([df966ac](https://github.com/weyoss/redis-smq/commit/df966acb9db87e5e2c2d35368ab4c48dbea52e07))
- **redis-smq:** integrate Heartbeat from redis-smq-common in Consumer ([d88ebe2](https://github.com/weyoss/redis-smq/commit/d88ebe2ba3e608a8827791698cf00a999fc72a6c))
- **redis-smq:** optimize and shorten import statements ([a6fc7ea](https://github.com/weyoss/redis-smq/commit/a6fc7ea34b50eca291c600e08edff06333afcd80))

## [9.0.14](https://github.com/weyoss/redis-smq/compare/v9.0.14-next.2...v9.0.14) (2026-02-06)

### 🚀 Chore

- update READMEs after merging 'origin/next' into 'master' ([283b0ee](https://github.com/weyoss/redis-smq/commit/283b0ee73f6157df662c948cebcd3e4a0941c666))

## [9.0.14-next.2](https://github.com/weyoss/redis-smq/compare/v9.0.14-next.1...v9.0.14-next.2) (2026-02-06)

### 📝 Documentation

- **redis-smq:** update API reference ([59aafce](https://github.com/weyoss/redis-smq/commit/59aafcef11d8746c53dc40adc972c584e90279a7))

## [9.0.14-next.1](https://github.com/weyoss/redis-smq/compare/v9.0.14-next.0...v9.0.14-next.1) (2026-02-06)

### ♻️ Code Refactoring

- **redis-smq:** include consumer ID when emitting heartbeat errors ([6694e5a](https://github.com/weyoss/redis-smq/commit/6694e5a66686e933f7545bf3f8da05798e089889))

## [9.0.14-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.13...v9.0.14-next.0) (2026-02-02)

### 🚀 Chore

- update READMEs after merging 'v9.0.13' into 'next' ([0d455ae](https://github.com/weyoss/redis-smq/commit/0d455aeb544473e24a17c8745d79a9861a6df6e5))

### 📝 Documentation

- **redis-smq:** enhance 'Getting Started' page by linking to main README ([e1630c6](https://github.com/weyoss/redis-smq/commit/e1630c6b5e1507609f0ccbb02fe235f90071ec80))
- **redis-smq:** rewrite user guides to improve clarity and structure ([4c2565e](https://github.com/weyoss/redis-smq/commit/4c2565ee7084bb69357054f4d3cbe48faec4a851))

### ♻️ Code Refactoring

- **redis-smq:** improve duplicate message audit validation ([edc91b5](https://github.com/weyoss/redis-smq/commit/edc91b51f113d114fc6801bf66436ba246b7a867))
- **redis-smq:** remove redundant debug message ([9475370](https://github.com/weyoss/redis-smq/commit/9475370280461a0ae566a4681e2771452e4be3f8))
- **redis-smq:** restructure queue pending messages implementation ([3b09da9](https://github.com/weyoss/redis-smq/commit/3b09da96728c18943a475ddf5850b32d79b994a3))

## [9.0.13](https://github.com/weyoss/redis-smq/compare/v9.0.13-next.0...v9.0.13) (2026-01-30)

### 🚀 Chore

- update READMEs after merging 'origin/next' into 'master' ([276f166](https://github.com/weyoss/redis-smq/commit/276f166290c5891aeca8dd1680212c265dd6f792))

## [9.0.13-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.12...v9.0.13-next.0) (2026-01-30)

### 🚀 Chore

- update READMEs after merging 'v9.0.12' into 'next' ([be52cae](https://github.com/weyoss/redis-smq/commit/be52cae3ef6c18967b6e56e9fbae6421853fae4a))

### 📝 Documentation

- **redis-smq:** update API reference ([1db81ff](https://github.com/weyoss/redis-smq/commit/1db81ff8ab0de2c2c6a1529adddf59d5549bc570))

### ♻️ Code Refactoring

- **redis-smq:** update description for QueueAcknowledgedMessages.purge() method ([24046e2](https://github.com/weyoss/redis-smq/commit/24046e22a19c23a77321772f6bd9bc7f72bac4b1))
- **redis-smq:** update description for QueueDeadLetteredMessages.purge() method ([2f2902a](https://github.com/weyoss/redis-smq/commit/2f2902add929731e7e0fa56f95b9f1888e272c53))

## [9.0.12](https://github.com/weyoss/redis-smq/compare/v9.0.12-next.0...v9.0.12) (2026-01-28)

### 🚀 Chore

- update READMEs after merging 'origin/next' into 'master' ([74d4242](https://github.com/weyoss/redis-smq/commit/74d4242232668dd055553aeb36eac57e918eb559))

## [9.0.12-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.11...v9.0.12-next.0) (2026-01-28)

### 🚀 Chore

- **redis-smq:** fix build script to correctly copy lua files ([6fea887](https://github.com/weyoss/redis-smq/commit/6fea887f285a46adcf532f5cacb66380c86c329e))
- update READMEs after merging 'v9.0.11' into 'next' ([055ab50](https://github.com/weyoss/redis-smq/commit/055ab50bd0096472c46f434c60c52ca59c157bc9))

### 📝 Documentation

- **redis-smq:** update API reference ([511bc72](https://github.com/weyoss/redis-smq/commit/511bc72aee9f59e277fa90f9b869c14fdb32445c))
- **redis-smq:** update API reference ([d44b4ba](https://github.com/weyoss/redis-smq/commit/d44b4ba76052552f9c4bd28dd47a97660ba7e432))
- **redis-smq:** update RedisSMQ class API reference ([76fb06d](https://github.com/weyoss/redis-smq/commit/76fb06d8d9ad161cd9a3ca0fe247381ce3685b02))

### ♻️ Code Refactoring

- **redis-smq:** implement data retrieval methods for purge job management ([c967402](https://github.com/weyoss/redis-smq/commit/c967402ec812dada7c15ddc240736c0daec32df8))
- **redis-smq:** modularize RedisSMQ class for enhanced clarity and reliability ([344044c](https://github.com/weyoss/redis-smq/commit/344044c96eb977d26c67bfed8ad6b43f0dbe16f1))
- **redis-smq:** restructure background‑jobs implementation ([cc5209e](https://github.com/weyoss/redis-smq/commit/cc5209e04959f9d54d3014da9aa0bfb5bb8c7238))
- **redis-smq:** shorten imports ([508bce4](https://github.com/weyoss/redis-smq/commit/508bce413ba33bb963cfaf7a020894d8a528c92c))
- **redis-smq:** update job manager to use atomic operations, clean up codebase ([f9d1352](https://github.com/weyoss/redis-smq/commit/f9d135248c87bf40ae50dae048edb957fcd6c2e5))

### ✅ Tests

- **redis-smq:** add edge case coverage for PurgeQueueWorker ([47eef89](https://github.com/weyoss/redis-smq/commit/47eef8949d21ff74c176cde79993af67506e3ab1))

## [9.0.11](https://github.com/weyoss/redis-smq/compare/v9.0.11-next.2...v9.0.11) (2026-01-22)

### 🚀 Chore

- update READMEs after merging 'origin/next' into 'master' ([41f9352](https://github.com/weyoss/redis-smq/commit/41f935228d60c8d4e81dc520273f99fb3ca21478))

## [9.0.11-next.2](https://github.com/weyoss/redis-smq/compare/v9.0.11-next.1...v9.0.11-next.2) (2026-01-22)

**Note:** Version bump only for package redis-smq

## <small>9.0.11-next.1 (2026-01-22)</small>

- chore: update lodash to v4.17.23 to address security vulnerabilities ([17bda3e](https://github.com/weyoss/redis-smq/commit/17bda3e))
- docs(redis-smq): update API reference ([9e8595f](https://github.com/weyoss/redis-smq/commit/9e8595f))
- refactor(redis-smq): clean up and improve queue messages implementations ([513c4fa](https://github.com/weyoss/redis-smq/commit/513c4fa))

## [9.0.11-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.10-next.4...v9.0.11-next.0) (2026-01-22)

### 📝 Documentation

- improve README files for clarity ([2f30700](https://github.com/weyoss/redis-smq/commit/2f3070058b07425825ae91bdce52bbb2f4aa50aa))
- **redis-smq:** update API reference ([fbb2813](https://github.com/weyoss/redis-smq/commit/fbb2813540964d7860e49f60b8c1a477382b1d1e))

### ♻️ Code Refactoring

- **redis-smq:** clean up MessageBrowserAbstract and BrowserStorageAbstract implementations ([3fbea2c](https://github.com/weyoss/redis-smq/commit/3fbea2c97fabda7813fd728b6d0028610f81304d))
- **redis-smq:** implement background jobs for purge queue management ([23763ce](https://github.com/weyoss/redis-smq/commit/23763ce4ed0bbbf13548701e40e253eedc011799))

## [9.0.10-next.4](https://github.com/weyoss/redis-smq/compare/v9.0.10-next.3...v9.0.10-next.4) (2026-01-16)

### 📝 Documentation

- adjust badges position to enhance page styling ([89309c6](https://github.com/weyoss/redis-smq/commit/89309c671d7e52265a4c6e0df4d6126e91b6e408))
- **redis-smq:** update Consumer and Producer references ([670ac78](https://github.com/weyoss/redis-smq/commit/670ac78de38b7a5803cf58f641efa7608a4c452d))
- refine notifications for master and next branch clarity ([e1e755e](https://github.com/weyoss/redis-smq/commit/e1e755e7086a98d4128ec3173c28056a8008acec))

### ♻️ Code Refactoring

- **redis-smq:** update to new class and type names from redis-smq-common ([dcd5d8c](https://github.com/weyoss/redis-smq/commit/dcd5d8cc257e4b0abfe7ebcec9ff48409b00daad))

## [9.0.10-next.3](https://github.com/weyoss/redis-smq/compare/v9.0.10-next.2...v9.0.10-next.3) (2026-01-16)

### 🐛 Bug Fixes

- **redis-smq:** wait for workers to be loaded before invoking callback ([a10b999](https://github.com/weyoss/redis-smq/commit/a10b999e6099e847f4f5c49edcb4130a37e1ec9d))

### ♻️ Code Refactoring

- **redis-smq:** make use of redis-smq-common latest updates ([af8c2cf](https://github.com/weyoss/redis-smq/commit/af8c2cf80ff954412082b7ca542b84aaa4c4c514))
- **redis-smq:** rename \_purgeMessages() to purgeMessages() ([3bd60f6](https://github.com/weyoss/redis-smq/commit/3bd60f6847c77faa05c00aad58856bbc4fbc372f))

## [9.0.10-next.2](https://github.com/weyoss/redis-smq/compare/v9.0.10-next.1...v9.0.10-next.2) (2026-01-10)

**Note:** Version bump only for package redis-smq

## [9.0.10-next.1](https://github.com/weyoss/redis-smq/compare/v9.0.10-next.0...v9.0.10-next.1) (2026-01-10)

**Note:** Version bump only for package redis-smq

## [9.0.10-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.9...v9.0.10-next.0) (2026-01-09)

### 🚀 Chore

- update READMEs after merging 'v9.0.9' into 'next' ([f463934](https://github.com/weyoss/redis-smq/commit/f463934b59b6196d231e5552402f449d2b986a25))

## [9.0.9](https://github.com/weyoss/redis-smq/compare/v9.0.9-next.5...v9.0.9) (2026-01-09)

### 🚀 Chore

- update READMEs after merging 'origin/next' into 'master' ([c046d46](https://github.com/weyoss/redis-smq/commit/c046d462c3c9ee32cda218cbbbf24a93f4cee829))

## [9.0.9-next.5](https://github.com/weyoss/redis-smq/compare/v9.0.9-next.4...v9.0.9-next.5) (2026-01-09)

**Note:** Version bump only for package redis-smq

## [9.0.9-next.4](https://github.com/weyoss/redis-smq/compare/v9.0.9-next.3...v9.0.9-next.4) (2026-01-09)

**Note:** Version bump only for package redis-smq

## [9.0.9-next.3](https://github.com/weyoss/redis-smq/compare/v9.0.9-next.2...v9.0.9-next.3) (2026-01-09)

**Note:** Version bump only for package redis-smq

## [9.0.9-next.2](https://github.com/weyoss/redis-smq/compare/v9.0.9-next.1...v9.0.9-next.2) (2026-01-08)

**Note:** Version bump only for package redis-smq

## [9.0.9-next.1](https://github.com/weyoss/redis-smq/compare/v9.0.9-next.0...v9.0.9-next.1) (2026-01-08)

**Note:** Version bump only for package redis-smq

## [9.0.9-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.8...v9.0.9-next.0) (2026-01-08)

### 🚀 Chore

- update READMEs after merging 'v9.0.8' into 'next' ([be16380](https://github.com/weyoss/redis-smq/commit/be16380741ba4625d1469aa3cc9d6075ead70e6f))

### 📝 Documentation

- **redis-smq:** update performance.md with a link to benchmarking tool ([00845c9](https://github.com/weyoss/redis-smq/commit/00845c905ba69ef9539a156571c43a366d98495d))

### ♻️ Code Refactoring

- **redis-smq:** improve logger context with hierarchical namespaces ([cb25c29](https://github.com/weyoss/redis-smq/commit/cb25c2982219e7d0f6e7f851225c7f3dbf321e83))

## [9.0.8](https://github.com/weyoss/redis-smq/compare/v9.0.8-next.0...v9.0.8) (2026-01-04)

### 🚀 Chore

- update READMEs after merging 'origin/next' into 'master' ([9250c21](https://github.com/weyoss/redis-smq/commit/9250c21f14bf0ee8f64db057ccaac091ba202891))

## [9.0.8-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.7-next.0...v9.0.8-next.0) (2026-01-03)

### 📝 Documentation

- fix markdown formatting and improve consistency ([0639c66](https://github.com/weyoss/redis-smq/commit/0639c668dfdca90e9542c599ef6bc57b6179dda2))

## [9.0.7-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.6...v9.0.7-next.0) (2026-01-03)

### 🐛 Bug Fixes

- **redis-smq:** delete specific namespace queues when deleting a ns ([0da3de2](https://github.com/weyoss/redis-smq/commit/0da3de2ad35439f98fcde8be6070019f88b1800c))
- **redis-smq:** validate queue delivery model before deleting a consumerGroupId ([725f10f](https://github.com/weyoss/redis-smq/commit/725f10f50cb8dfab5449dab2fffb21510dd9db03))

### 🚀 Chore

- update READMEs after merging 'v9.0.6' into 'next' ([d73c0e3](https://github.com/weyoss/redis-smq/commit/d73c0e336134566b7342fa23029cb78c28952d71))

### 📝 Documentation

- **redis-smq:** update class refs ([e9b5433](https://github.com/weyoss/redis-smq/commit/e9b5433fe8cc3ad587b33e913772ed911085f28f))

### ♻️ Code Refactoring

- **redis-smq:** optimize imports ([cf6944f](https://github.com/weyoss/redis-smq/commit/cf6944f20094f9a57a8b7be0d28adff735cfb986))
- **redis-smq:** shorten imports ([03bff14](https://github.com/weyoss/redis-smq/commit/03bff146a3b6f76900eb99b0c46cd26a058dec06))
- **redis-smq:** use EventMultiplexer instead of EventBus ([0addf13](https://github.com/weyoss/redis-smq/commit/0addf1372d08b68382ca38282c5551c998bf0371))
- **redis-smq:** use structured errors ([fd45033](https://github.com/weyoss/redis-smq/commit/fd45033169fc5c693e8b7ca8ed61e043ec7002b1))

## [9.0.6](https://github.com/weyoss/redis-smq/compare/v9.0.6-next.2...v9.0.6) (2025-12-27)

### 🚀 Chore

- update READMEs after merging 'origin/next' into 'master' ([173e226](https://github.com/weyoss/redis-smq/commit/173e2262de8da26d86b366c6edd94e166a092445))

## [9.0.6-next.2](https://github.com/weyoss/redis-smq/compare/v9.0.6-next.1...v9.0.6-next.2) (2025-12-26)

### 📝 Documentation

- **redis-smq:** update class refs ([698d620](https://github.com/weyoss/redis-smq/commit/698d6209ac9bbe214c2aa36d147e78f34c392c71))

### ♻️ Code Refactoring

- **redis-smq:** introduce InternalEventBus for system communication ([a4fa5a9](https://github.com/weyoss/redis-smq/commit/a4fa5a9d6c6d63d19c55cd8f170cd326562c6a3c))

## [9.0.6-next.1](https://github.com/weyoss/redis-smq/compare/v9.0.6-next.0...v9.0.6-next.1) (2025-12-25)

### 🐛 Bug Fixes

- **redis-smq:** resolve config persistence issue in test environment ([5f8c672](https://github.com/weyoss/redis-smq/commit/5f8c672c780e26bb46e9d93aa342a209cefa1f45))

### ♻️ Code Refactoring

- **redis-smq:** convert Configuration class to an enum-driven state machine ([34fe8b5](https://github.com/weyoss/redis-smq/commit/34fe8b57cceff7320c7ad2b73bfc87387d786633))
- **redis-smq:** convert RedisSMQ class to an enum-driven state machine ([d8ac002](https://github.com/weyoss/redis-smq/commit/d8ac0029a07f32c5ef076fc464dfc97be608d756))
- **redis-smq:** migrate queue rate limit setup to Lua ([f8efcba](https://github.com/weyoss/redis-smq/commit/f8efcba1498bb60ec356f04eb086f02399800f1b))

## [9.0.6-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.5...v9.0.6-next.0) (2025-12-19)

### 🐛 Bug Fixes

- **redis-smq:** fix consumer hangout during startup ([0b5951a](https://github.com/weyoss/redis-smq/commit/0b5951a8edce909ebabd86442d460988414dae93))

### 🚀 Chore

- fix outdated email address in different files ([1690afe](https://github.com/weyoss/redis-smq/commit/1690afe67b467f59c0298d91e84009ec064a66f4))
- update copyright info ([36bd6d8](https://github.com/weyoss/redis-smq/commit/36bd6d87854a07d4e694bddbf80bf8fd9da9a9b0))
- update READMEs after merging 'master' into 'next' ([3c8846b](https://github.com/weyoss/redis-smq/commit/3c8846b35551620e77ad6ef0ac27ac8e6c2ab717))

### 📝 Documentation

- **redis-smq:** add ConsumerSetMismatchError error class ([4a1e4ab](https://github.com/weyoss/redis-smq/commit/4a1e4abf16879bd47e86c1eb3c669a0640804857))

### ♻️ Code Refactoring

- **redis-smq:** do not pollute log with redundant debug info ([e7c063b](https://github.com/weyoss/redis-smq/commit/e7c063be170071c6bc1d37c88477788edc72ac23))
- **redis-smq:** make use of consumer context ([62da2f0](https://github.com/weyoss/redis-smq/commit/62da2f077b60be6753fc627a9999dc0b072a639a))
- **redis-smq:** migrate the queue deletion logic to LUA ([4b7c9d5](https://github.com/weyoss/redis-smq/commit/4b7c9d5c0b7ae667dfcd937aa74bc49e6b278040))
- **redis-smq:** update getQueueKeys() to accept ns and name as args ([a147858](https://github.com/weyoss/redis-smq/commit/a14785859c93465a43bed1d08c085cce3349b5d3))

### ✅ Tests

- **redis-smq:** cover edge cases in queue deletion errors ([6253a06](https://github.com/weyoss/redis-smq/commit/6253a06be798d9a176dd99883edba885684b4fe6))
- **redis-smq:** simplify namespace deleting test case ([9792ecb](https://github.com/weyoss/redis-smq/commit/9792ecba98c4f91274232438d69f64f014afb0e4))

## [9.0.5](https://github.com/weyoss/redis-smq/compare/v9.0.5-next.1...v9.0.5) (2025-12-15)

### 🚀 Chore

- update READMEs after merging 'next' into 'master' ([75334e3a](https://github.com/weyoss/redis-smq/commit/75334e3a337363ef8d949f4740887f6817d5cd18))

## [9.0.5-next.1](https://github.com/weyoss/redis-smq/compare/v9.0.5-next.0...v9.0.5-next.1) (2025-12-14)

### 📝 Documentation

- **redis-smq:** update API reference for MessageBrowser ([ef73e83](https://github.com/weyoss/redis-smq/commit/ef73e83868b4f8a42b5b8dbcbb19729e4eef20a8))

### ♻️ Code Refactoring

- **redis-smq:** introduce MessageBrowser for message listing logic ([0d5e2a6](https://github.com/weyoss/redis-smq/commit/0d5e2a6377684bb80a67edca99222811f19ac0a7))
- **redis-smq:** remove invalid 'instanceof' check ([ee66142](https://github.com/weyoss/redis-smq/commit/ee6614249e253281e4e4335c42d71c589ab96765))

## [9.0.5-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.4...v9.0.5-next.0) (2025-12-04)

### 🐛 Bug Fixes

- **redis-smq:** fail when acked message audit is not enabled ([cf75fa2](https://github.com/weyoss/redis-smq/commit/cf75fa2d4c08f07333863813a56404db0b524d54))
- **redis-smq:** fail when unacked message audit is not enabled ([f91b759](https://github.com/weyoss/redis-smq/commit/f91b7598109aacb903f6fef7b5cec2d63d26f89c))

### 🚀 Chore

- update READMEs after merging 'v9.0.4' into 'next' ([f899525](https://github.com/weyoss/redis-smq/commit/f899525ff2a689e5189fa61e4a39829b4694f513))

### 📝 Documentation

- **redis-smq:** improve code examples ([f104c67](https://github.com/weyoss/redis-smq/commit/f104c678f0d82d239e484937cf8dce0600731179))
- **redis-smq:** update API reference ([3346bba](https://github.com/weyoss/redis-smq/commit/3346bbaa9909e8f6e6c08755a24c0fca800a425c))

### ✅ Tests

- **redis-smq:** update tests to expect audit errors when audit is disabled ([eeffebb](https://github.com/weyoss/redis-smq/commit/eeffebbe12f3f0f87d675b5c1f0b8c49b7ba461c))

## [9.0.4](https://github.com/weyoss/redis-smq/compare/v9.0.4-next.0...v9.0.4) (2025-11-13)

### 🚀 Chore

- update READMEs after merging 'origin/next' into 'master' ([f2dfdb8](https://github.com/weyoss/redis-smq/commit/f2dfdb8bfe73e1b04c47f5931fbcd9ca2f6596c3))

## [9.0.4-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.3...v9.0.4-next.0) (2025-11-11)

### 🚀 Chore

- update READMEs after merging 'v9.0.3' into 'next' ([d973314](https://github.com/weyoss/redis-smq/commit/d973314abddc2a5497b53b7a8e1ab3fdf785ebae))

### ♻️ Code Refactoring

- **redis-smq:** improve MultiplexedMessageHandlerRunner scheduling ([d5bccbc](https://github.com/weyoss/redis-smq/commit/d5bccbc573a6d41919dbe7afc4e7044df86c6f29))
- **redis-smq:** improve queue comparison logic ([ef406a9](https://github.com/weyoss/redis-smq/commit/ef406a9d599da1abbb02bb4095d5904f57cd97ef))
- **redis-smq:** rename tickIntervalMs to multiplexingTickIntervalMs ([1e3b8d8](https://github.com/weyoss/redis-smq/commit/1e3b8d80652c843787c40ceea72e73336167bacf))

### ⚡ Performance Improvements

- **redis-smq:** avoid N+1 query problem by using isConsumerListAlive ([b168396](https://github.com/weyoss/redis-smq/commit/b16839686e3da4dcef7c65a6c6bdaa6ea6f2278f))

## [9.0.3](https://github.com/weyoss/redis-smq/compare/v9.0.3-next.1...v9.0.3) (2025-11-10)

### 🚀 Chore

- update READMEs after merging 'origin/next' into 'master' ([45472c2](https://github.com/weyoss/redis-smq/commit/45472c2cb1bec7c76fc2dd6db6449ed1a34f43cf))

## [9.0.3-next.1](https://github.com/weyoss/redis-smq/compare/v9.0.3-next.0...v9.0.3-next.1) (2025-11-10)

### 🐛 Bug Fixes

- **redis-smq:** handle gracefully message checkout race condition ([fcdfb1b](https://github.com/weyoss/redis-smq/commit/fcdfb1b4bdf380ce5bbc3a3bb1f8f936715c81aa))

### ♻️ Code Refactoring

- **redis-smq:** implement message handler reconciliation mechanism ([174f6d3](https://github.com/weyoss/redis-smq/commit/174f6d39aaa13780ec96acb0e4beb1d062d12271))
- **redis-smq:** improve MessageHandlerRunner and error handling ([900bd42](https://github.com/weyoss/redis-smq/commit/900bd42c4192887d361d5489985890db5acde347))
- **redis-smq:** improve next scheduling in MultiplexedMessageHandlerRunner ([b13e219](https://github.com/weyoss/redis-smq/commit/b13e2198ba3143a9295570d397f8e7869d2cf37a))
- **redis-smq:** introduce consumer context for dependency injection ([f91b84d](https://github.com/weyoss/redis-smq/commit/f91b84d826b27f10e99857e1d04143306b374620))
- **redis-smq:** simplify and improve control flow for MessageHandler/DequeueMessage ([cc66129](https://github.com/weyoss/redis-smq/commit/cc661299527220ae9fadaea3db6baf8a11bd72db))
- **redis-smq:** use the config object from consumerContext ([046f964](https://github.com/weyoss/redis-smq/commit/046f9644dd351c7ef583d8217be7966399bf2ba9))

## [9.0.3-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.2...v9.0.3-next.0) (2025-11-09)

### 🐛 Bug Fixes

- **redis-smq:** ensure ephemeral consumer groups cleanup ([7659900](https://github.com/weyoss/redis-smq/commit/76599003f1bd5213178b13db89d730eb1a00b740))

### 📝 Documentation

- update README files ([cee0ef3](https://github.com/weyoss/redis-smq/commit/cee0ef3f71df2157c7b4a5845bfeb0ab413de4e9))

### ♻️ Code Refactoring

- **redis-smq:** decouple consumer components from Consumer class ([581f70d](https://github.com/weyoss/redis-smq/commit/581f70d645777d5031b12e33cebfe2b9fd41aa41))
- **redis-smq:** improve ConsumerHeartbeat reliability and instance isolation ([aedac5d](https://github.com/weyoss/redis-smq/commit/aedac5d4f4eeb73cb25710fc201640feaf592c8d))

## [9.0.2](https://github.com/weyoss/redis-smq/compare/v9.0.2-next.1...v9.0.2) (2025-11-08)

### 📝 Documentation

- update README files ([4473451](https://github.com/weyoss/redis-smq/commit/44734515d013dcab915d3877689b16900d032681))

## [9.0.2-next.1](https://github.com/weyoss/redis-smq/compare/v9.0.2-next.0...v9.0.2-next.1) (2025-11-08)

### 📝 Documentation

- update npm badge links to point to GitHub releases ([c6421ac](https://github.com/weyoss/redis-smq/commit/c6421acacfce4aec3950357e5e7543cda7c495c5))

## [9.0.2-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.1...v9.0.2-next.0) (2025-11-08)

### ✅ Tests

- rename test_workspace_esm.sh to test-workspace-esm.sh ([8e22339](https://github.com/weyoss/redis-smq/commit/8e22339cf87b3abc3fe71ac61fd9d93a9e8be869))

### 📦‍ Build System

- automate README.md files update ([7d4811f](https://github.com/weyoss/redis-smq/commit/7d4811f3d152feb7cb98298513425a2e0b1baf01))

## [9.0.1](https://github.com/weyoss/redis-smq/compare/v9.0.0...v9.0.1) (2025-11-07)

### 📝 Documentation

- update README files for release v9 ([805886d](https://github.com/weyoss/redis-smq/commit/805886d41212b28eb537796c12f736fe9202e014))

## [9.0.0](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.18...v9.0.0) (2025-11-07)

**Note:** Version bump only for package redis-smq

## [9.0.0-next.18](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.17...v9.0.0-next.18) (2025-11-07)

### 📝 Documentation

- convert relative paths to absolute URLs in package READMEs ([1da8173](https://github.com/weyoss/redis-smq/commit/1da817349fed106e0551fdb069321609cc373c8c))

## [9.0.0-next.17](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.16...v9.0.0-next.17) (2025-11-07)

### 📝 Documentation

- **redis-smq:** improve classes/interfaces formatting ([7d9fd74](https://github.com/weyoss/redis-smq/commit/7d9fd740718a9208ec4df8c6a6350beca1fba8ee))

## [9.0.0-next.16](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.15...v9.0.0-next.16) (2025-11-05)

### 🐛 Bug Fixes

- **redis-smq:** don’t fail reap cycle on ephemeral consumer group deletion errors ([4136c99](https://github.com/weyoss/redis-smq/commit/4136c9972ed0f80444b1cea35ea9b53bb8a3606f))

### 📝 Documentation

- **redis-smq:** add missing IQueueMessages reference ([fc0a26f](https://github.com/weyoss/redis-smq/commit/fc0a26f1c319fffb4113ae51d156b0a8da76c7ec))
- **redis-smq:** clarify message audit documentation ([4cd477e](https://github.com/weyoss/redis-smq/commit/4cd477e61e333647edcfcdeeb883c5b9dc7c4d26))
- **redis-smq:** update API reference ([261a856](https://github.com/weyoss/redis-smq/commit/261a8569b027bb38ee2707db180661b5f23ece2a))
- **redis-smq:** update API reference ([f86fe68](https://github.com/weyoss/redis-smq/commit/f86fe687fdca3c12971a2f02699209d6e88483de))
- **redis-smq:** update ESM/CJS module usage examples with new API ([4d6f661](https://github.com/weyoss/redis-smq/commit/4d6f661e8fdd1cd9fae011663ac5396e99be4aa5))

### ♻️ Code Refactoring

- **redis-smq:** rename QueueExplorer to QueueMessagesAbstract ([7c97a1e](https://github.com/weyoss/redis-smq/commit/7c97a1e089da3ae89b63e87dc0e0534151f09faa))
- **redis-smq:** rename QueueStorage to QueueStorageAbstract ([e30cb5e](https://github.com/weyoss/redis-smq/commit/e30cb5e17536e79b2ac070be2123fd0f1a7f6b28))

## [9.0.0-next.15](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.14...v9.0.0-next.15) (2025-10-31)

### ⚠ BREAKING CHANGES

- **redis-smq:** improve message audit configuration and parsing logic

### 📝 Documentation

- **redis-smq:** update message audit related documentation and api ([d17ac49](https://github.com/weyoss/redis-smq/commit/d17ac49036468aa97cd4934683b3718e415f63e3))

### ♻️ Code Refactoring

- **redis-smq:** improve message audit configuration and parsing logic ([5c0cf9a](https://github.com/weyoss/redis-smq/commit/5c0cf9a67b6494e633cd18cf7f99546ddb2a97ba))

## [9.0.0-next.14](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.13...v9.0.0-next.14) (2025-10-28)

**Note:** Version bump only for package redis-smq

## [9.0.0-next.13](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.12...v9.0.0-next.13) (2025-10-28)

**Note:** Version bump only for package redis-smq

## [9.0.0-next.12](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.11...v9.0.0-next.12) (2025-10-27)

### 🚀 Chore

- add copyright headers to source files ([8cf3331](https://github.com/weyoss/redis-smq/commit/8cf333150129aabd91b68204cf0eca428888efc7))

### 📝 Documentation

- fix license section formatting and standardize project names ([9752491](https://github.com/weyoss/redis-smq/commit/9752491d72f19a5b470f95f6afb79bdb132b78f2))

## [9.0.0-next.11](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.10...v9.0.0-next.11) (2025-10-27)

### 🐛 Bug Fixes

- correct codecov badge URL format ([2b9e3f0](https://github.com/weyoss/redis-smq/commit/2b9e3f09d923d6e2310ef447bc1be60180af200d))

## [9.0.0-next.10](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.9...v9.0.0-next.10) (2025-10-26)

**Note:** Version bump only for package redis-smq

## [9.0.0-next.9](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.8...v9.0.0-next.9) (2025-10-21)

### 🐛 Bug Fixes

- **redis-smq:** add missing RoutingKeyRequiredError class ([8d1aeb1](https://github.com/weyoss/redis-smq/commit/8d1aeb1fb8cfab2e689a550a08f368620eba4a3a))

### 📝 Documentation

- **redis-smq:** update documentation and improve md formatting ([8aaaead](https://github.com/weyoss/redis-smq/commit/8aaaead0280784ee37fac4a4f746a9e947608eb6))

### ♻️ Code Refactoring

- **redis-smq:** rename QueueConsumerGroupsCache to PubSubTargetResolver, clean up Producer docs ([67a6be3](https://github.com/weyoss/redis-smq/commit/67a6be329bcaec7304eca8b866f48d90cbb72f81))

## [9.0.0-next.8](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.7...v9.0.0-next.8) (2025-10-18)

### ✨ Features

- **redis-smq:** make consumerGroupId optional for PubSub queue consumers ([84daeec](https://github.com/weyoss/redis-smq/commit/84daeec701e3cbdd4059c901ed757763b4b35e90))

### 🐛 Bug Fixes

- **redis-smq:** check consumer group existence when relevant ([86df3d6](https://github.com/weyoss/redis-smq/commit/86df3d60187612efa0a8af89a5c201d6604f7c03))

### 📝 Documentation

- **redis-smq:** clarify consumer group behavior for PubSub queues ([de1d4ce](https://github.com/weyoss/redis-smq/commit/de1d4cef6154273051898248e89e408bd142bb2d))

## [9.0.0-next.7](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.6...v9.0.0-next.7) (2025-10-13)

**Note:** Version bump only for package redis-smq

## [9.0.0-next.6](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.5...v9.0.0-next.6) (2025-10-13)

**Note:** Version bump only for package redis-smq

## [9.0.0-next.5](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.4...v9.0.0-next.5) (2025-10-12)

### 🚀 Chore

- **redis-smq:** update dependencies to latest versions ([552621a](https://github.com/weyoss/redis-smq/commit/552621a006e5925491ceebf4e7fe79179efb9f38))

### 📝 Documentation

- add GitHub note callouts in README files ([4c42582](https://github.com/weyoss/redis-smq/commit/4c42582dbfa3349a3d414a39a1f41a1e372913c0))
- fix navigation breadcrumb ([ea920dd](https://github.com/weyoss/redis-smq/commit/ea920ddd8c5934db4c534d2a8828bef822636f01))
- **redis-smq:** update docs and clean up ([f7a75c9](https://github.com/weyoss/redis-smq/commit/f7a75c9109032f530049714c0ef2ffed537a76a4))
- standardize "next" branch reference ([ba24b3b](https://github.com/weyoss/redis-smq/commit/ba24b3bac54af4c2658699e0866c27bec4febdfc))
- streamline and improve documentation structure and readability ([b773260](https://github.com/weyoss/redis-smq/commit/b773260955bb77b820c5a343ab15837657b42f3d))
- update README files for next branch with pre-release badges and doc links ([005ccf4](https://github.com/weyoss/redis-smq/commit/005ccf411df460984615a4101b385a2d8023dab5))

## [9.0.0-next.4](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.3...v9.0.0-next.4) (2025-10-09)

### ⚠ BREAKING CHANGES

- **redis-smq:** modernize exchange system with unified API and enhanced routing

### ✨ Features

- **redis-smq:** add create method to exchange implementations ([f5285a2](https://github.com/weyoss/redis-smq/commit/f5285a2f3af1800c6d98a87681378e9bae3b3279))
- **redis-smq:** add factory methods for exchange types ([dd024a4](https://github.com/weyoss/redis-smq/commit/dd024a49064087ec1efc333cb9f8f10b6b085b2a))
- **redis-smq:** implement simplified API,connection pooling,and reorganize architecture ([9fca6b0](https://github.com/weyoss/redis-smq/commit/9fca6b0ed06ac533a712d0f6e997d72fa8f2d3de))
- **redis-smq:** modernize exchange system with unified API and enhanced routing ([7f659e0](https://github.com/weyoss/redis-smq/commit/7f659e0a31c4bc2f1ab19376c1d3e6a297d0d507))

### 🐛 Bug Fixes

- **redis-smq:** validate topic exchange params as regex patterns ([3fa6afd](https://github.com/weyoss/redis-smq/commit/3fa6afd97e3cef0dc09fc797ef8ca47e7ec9201f))

### 📝 Documentation

- **redis-smq:** add create method documentation, fix parameter ordering in exchange API reference ([0166fec](https://github.com/weyoss/redis-smq/commit/0166fec961ca14c79b5740a5e167f83bb121d621))
- **redis-smq:** add JSDoc documentation for ExchangeTopic class ([4a45675](https://github.com/weyoss/redis-smq/commit/4a45675b029795e5e8ff6ca4eda2944ca9b45f8a))
- **redis-smq:** rewrite message exchanges documentation ([3096964](https://github.com/weyoss/redis-smq/commit/3096964df948c8dd433d69e243055730b8b3b1b6))
- **redis-smq:** update and clean up documentation ([ea91bb8](https://github.com/weyoss/redis-smq/commit/ea91bb89d76539af121e9217561e36913e8fb896))
- **redis-smq:** update API documentation and clean up ([ef4139a](https://github.com/weyoss/redis-smq/commit/ef4139a6fafbd809170abcfecd85fad26f1fcbd6))
- **redis-smq:** update API reference ([8f248ef](https://github.com/weyoss/redis-smq/commit/8f248ef97727c73ed4594e401db985bfc0e9f3e7))
- **redis-smq:** update API reference for modernized exchange system ([864c851](https://github.com/weyoss/redis-smq/commit/864c851318382389b02d66c8a350ead12eac2a91))
- **redis-smq:** update JSDoc for ExchangeFanout class ([e35b5fb](https://github.com/weyoss/redis-smq/commit/e35b5fb22b9937e54c6ec50834bf0c331561a7e7))
- **redis-smq:** update topic exchange documentation ([eb7cdf3](https://github.com/weyoss/redis-smq/commit/eb7cdf394afbf51328d335a0079cb97fc4a00dd6))
- rewrite README and configuration documentation for v9 simplified API ([f48a319](https://github.com/weyoss/redis-smq/commit/f48a319d24aab6d19349e9766f31503474d12797))

### ♻️ Code Refactoring

- **redis-smq:** improve Configuration class documentation and initialization ([fb7889c](https://github.com/weyoss/redis-smq/commit/fb7889c8af68797d9f24b6693dd32da01edfb434))
- **redis-smq:** integrate connection pooling and reorganize error handling ([af20b9c](https://github.com/weyoss/redis-smq/commit/af20b9c4438d26bd51608d36ca7177f6ed097866))
- **redis-smq:** migrate test utilities to use RedisConnectionPool ([c443e98](https://github.com/weyoss/redis-smq/commit/c443e9855de092a8bab2548b4f39d8fa5b838b7d))
- **redis-smq:** migrate test utilities to use RedisSMQ factory methods ([4a89c0c](https://github.com/weyoss/redis-smq/commit/4a89c0cd1ee2e2742176be0687c2e7d7371ab8e6))
- **redis-smq:** rename config getter functions to use parse prefix ([2f3a32c](https://github.com/weyoss/redis-smq/commit/2f3a32cfa9fc8cd500d46fe0ce5a566cde98db4e))
- **redis-smq:** reorganize imports and codebase structure ([8bf631e](https://github.com/weyoss/redis-smq/commit/8bf631eb7692c31d179d9b0123a86312e2ba7f23))
- **redis-smq:** update copyright headers ([fc6bc5d](https://github.com/weyoss/redis-smq/commit/fc6bc5dc0b1665a01276e0d3766d49de725ede0c))
- **redis-smq:** use IRedisClient interface instead of RedisClient class ([da7a4c2](https://github.com/weyoss/redis-smq/commit/da7a4c2aba472d9f8608eddb8ccf260a7da407a4))

## [9.0.0-next.3](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.2...v9.0.0-next.3) (2025-09-09)

### 🐛 Bug Fixes

- **redis-smq:** add optional Redis client peer dependencies ([b9b60cc](https://github.com/weyoss/redis-smq/commit/b9b60cc96ca59611a0a17e510020889df4cf1c41))

### 📝 Documentation

- **redis-smq:** fix API documentation links ([79fa7de](https://github.com/weyoss/redis-smq/commit/79fa7de4d74fa5b4ca52447bc4a5d8007dafa3fb))
- **redis-smq:** update API documentation for configuration interfaces ([0e764fd](https://github.com/weyoss/redis-smq/commit/0e764fdbc5e1e1923dd61f44cb2f7eed24e35b47))

### ♻️ Code Refactoring

- **redis-smq:** improve configuration parsing ([9e5408d](https://github.com/weyoss/redis-smq/commit/9e5408d6d1888d8edea86d247c39baf7c14681fa))

## [9.0.0-next.2](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.1...v9.0.0-next.2) (2025-09-07)

**Note:** Version bump only for package redis-smq

## [9.0.0-next.1](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.0...v9.0.0-next.1) (2025-09-06)

### 🐛 Bug Fixes

- **redis-smq:** update Redis data structure version ([abedf40](https://github.com/weyoss/redis-smq/commit/abedf408702afa2bca76ac12c659d8c2d65f28df))

## [9.0.0-next.0](https://github.com/weyoss/redis-smq/compare/v8.3.1...v9.0.0-next.0) (2025-09-06)

### ⚠ BREAKING CHANGES

- **redis-smq-rest-api:** implement missing API endpoints
- **redis-smq:** improve message lifecycle observability

### ✨ Features

- **redis-smq-rest-api:** implement missing API endpoints ([838fe4f](https://github.com/weyoss/redis-smq/commit/838fe4f66f2b2217d17309a591a92d726aca6697))
- **redis-smq:** improve message lifecycle observability ([0f1b259](https://github.com/weyoss/redis-smq/commit/0f1b25917a1d7e693ab65b4322084bc96bf2f836))

### 📝 Documentation

- **redis-smq:** add message storage documentation ([634ab21](https://github.com/weyoss/redis-smq/commit/634ab215c0b01cb81e5b657096d17ad746fd4ab6))
- **redis-smq:** add QueuePendingMessages class to configuration docs ([26eba59](https://github.com/weyoss/redis-smq/commit/26eba59eb6a48806e8e8cb2c280a8d25b72b5f2a))
- **redis-smq:** improve message storage documentation and class references ([3b47ade](https://github.com/weyoss/redis-smq/commit/3b47ade6b1cc1bdfaef95a57d983225af6c785b5))
- **redis-smq:** update API documentation format and structure ([f74c878](https://github.com/weyoss/redis-smq/commit/f74c878d7a8f0416baf1d5d7b92165f264a1c9cf))

## [8.3.1](https://github.com/weyoss/redis-smq/compare/v8.3.0...v8.3.1) (2025-05-06)

### ⚡ Performance Improvements

- **redis-smq:** optimize and clean up LUA scripts for better Redis performance ([46c54f8](https://github.com/weyoss/redis-smq/commit/46c54f8113101e12227b4a7af041c885f7d33944))

## [8.3.0](https://github.com/weyoss/redis-smq/compare/v8.2.1...v8.3.0) (2025-05-04)

### 🐛 Bug Fixes

- **redis-smq:** make message deletion more resilient to race conditions and inconsistent states ([6138a46](https://github.com/weyoss/redis-smq/commit/6138a46298332f6bdead6242bc42ed6fd91c953c))

### 📝 Documentation

- **redis-smq:** update class references ([3ddf002](https://github.com/weyoss/redis-smq/commit/3ddf002f252b94caf2dc60f7021804264f4ed866))

### ♻️ Code Refactoring

- **redis-smq:** improve callback patterns and use new async utils ([62c5317](https://github.com/weyoss/redis-smq/commit/62c531711c1056313b86347d258dbf164c30175d))

## [8.2.1](https://github.com/weyoss/redis-smq/compare/v8.2.0...v8.2.1) (2025-04-22)

### 🐛 Bug Fixes

- **redis-smq:** use correct cursor for SSCAN operation, clean up ([fffb4e2](https://github.com/weyoss/redis-smq/commit/fffb4e21c35a9350cbb7fc75fb7f54c826b75458))

### 📝 Documentation

- **redis-smq:** add pageSize to IQueueMessagesPageParams typing ([4294a61](https://github.com/weyoss/redis-smq/commit/4294a6103210b567198308c0d7edd433fb207712))
- **redis-smq:** improve logging and documentation ([d0470b2](https://github.com/weyoss/redis-smq/commit/d0470b2cb69269660eb73474654be8a7804f738b))

### ✅ Tests

- **redis-smq:** add new tests for queue message storage implementations ([0b03d5d](https://github.com/weyoss/redis-smq/commit/0b03d5daf971b7a5246df9268c310fe3869be431))

## [8.2.0](https://github.com/weyoss/redis-smq/compare/v8.1.0...v8.2.0) (2025-04-20)

### ✨ Features

- **redis-smq:** enhance logging with detailed debug information ([779a754](https://github.com/weyoss/redis-smq/commit/779a754d1c4a8c4415abc9920ea2e567aa00e21c))

### 🐛 Bug Fixes

- **redis-smq:** await async queue consumers retrieval in test ([b40cb1c](https://github.com/weyoss/redis-smq/commit/b40cb1c4eda2986f5a847d9b5edf93f2c6b7312d))

### 📝 Documentation

- **redis-smq:** fix typos and enhance API documentation ([fb3f0ec](https://github.com/weyoss/redis-smq/commit/fb3f0ec351e06a75f2771196a6396cdfff544698))
- **redis-smq:** update configuration examples ([58c8ad8](https://github.com/weyoss/redis-smq/commit/58c8ad8ec19efd0a5b7ecfaff2aeddd4c078ac02))
- update logs documentation link ([9ff9d54](https://github.com/weyoss/redis-smq/commit/9ff9d5499d1e0a00c70bad6d11d4ca7a34c577d0))
- update redis-smq references ([ff6666f](https://github.com/weyoss/redis-smq/commit/ff6666f9c47862142ba23f829494d8bd43b09c71))
- update redis-smq-common references ([3b4083d](https://github.com/weyoss/redis-smq/commit/3b4083d34d5d12facf848d5c614732522f9eab84))

## [8.1.0](https://github.com/weyoss/redis-smq/compare/v8.0.3...v8.1.0) (2025-04-16)

### 🐛 Bug Fixes

- **redis-smq:** prevent duplicate message publishing for scheduled tasks ([8304c94](https://github.com/weyoss/redis-smq/commit/8304c9423b3a59c4159fba504065662499c1dd63))

### 📝 Documentation

- **redis-smq:** update documentation and interfaces ([3cf744a](https://github.com/weyoss/redis-smq/commit/3cf744ad9d1996eeac58d4765bde2d33595ba309))

### ♻️ Code Refactoring

- **redis-smq:** improve queue message management system with storage abstractions ([614b1fa](https://github.com/weyoss/redis-smq/commit/614b1fab2bda335c912d529beef3279765bc1979))
- **redis-smq:** rename IQueueMessages interface to IQueueMessageManager ([39171e0](https://github.com/weyoss/redis-smq/commit/39171e022959f7c07a814c3a9692018e8e98f6c3))

## [8.0.3](https://github.com/weyoss/redis-smq/compare/v8.0.2...v8.0.3) (2025-04-14)

### 🚀 Chore

- **redis-smq-common:** enhance Redis server management with CLI and scripts ([73074ce](https://github.com/weyoss/redis-smq/commit/73074cef7a04e93ad6db2a3c3717411d5cfe118b))

### 📝 Documentation

- fix ERedisConfigClient import, update installation instruction ([49a9ac9](https://github.com/weyoss/redis-smq/commit/49a9ac9f8a7b170c75ea76a00adaea05349257b6))

## [8.0.2](https://github.com/weyoss/redis-smq/compare/v8.0.1...v8.0.2) (2025-04-14)

### 📝 Documentation

- reorganize and enhance documentation across packages ([128d333](https://github.com/weyoss/redis-smq/commit/128d33329adc9e4659a07f42fc552ede618e1a57))

## [8.0.1](https://github.com/weyoss/redis-smq/compare/v8.0.0...v8.0.1) (2025-04-13)

### 📝 Documentation

- **redis-smq:** update links to REST API and Web UI documentation ([6d35753](https://github.com/weyoss/redis-smq/commit/6d35753c2eb53ff60a09284fc09a3881ab46a1fd))

### ♻️ Code Refactoring

- **redis-smq:** improve redis-keys module with better organization and documentation ([3377d51](https://github.com/weyoss/redis-smq/commit/3377d51b9e0c9a448789c8b4493dffe616e44384))
- **redis-smq:** update key prefix with version-based naming scheme ([7cac5d6](https://github.com/weyoss/redis-smq/commit/7cac5d61d1a877a2f712c2a8910237e7d01e75fd))

## [8.0.0](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.36...v8.0.0) (2025-04-13)

**Note:** Version bump only for package redis-smq

## [8.0.0-rc.36](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.35...v8.0.0-rc.36) (2025-04-11)

### ♻️ Code Refactoring

- **redis-smq-common:** download and use pre-built Redis binaries ([e71be54](https://github.com/weyoss/redis-smq/commit/e71be54919f185613fffb08a7c977700fea9fbf6))

## [8.0.0-rc.35](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.34...v8.0.0-rc.35) (2025-03-22)

**Note:** Version bump only for package redis-smq

## [8.0.0-rc.34](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.33...v8.0.0-rc.34) (2025-03-22)

**Note:** Version bump only for package redis-smq

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

## [8.0.0-rc.29](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.28...v8.0.0-rc.29) (2025-02-14)

### Bug Fixes

- **deps:** regenerate package-lock.json ([24ffd68](https://github.com/weyoss/redis-smq/commit/24ffd682a3d0c8e61c67b93d9aaa23ccdaf1e87b))

### Documentation

- **api:** update API documentation and references ([3ce916f](https://github.com/weyoss/redis-smq/commit/3ce916f2aece6a0fcff697f37a40f1a5c5320e67))
- **contributing:** update guidelines and improve language ([74464f7](https://github.com/weyoss/redis-smq/commit/74464f752e5083810f15d498a3fe3dfe47b38444))
- **README:** update installation and usage instructions ([61030de](https://github.com/weyoss/redis-smq/commit/61030de5c608d25367eda89a81b122b5e6767886))

### Codebase Refactoring

- remove unnecessary factory patterns ([f1f42d5](https://github.com/weyoss/redis-smq/commit/f1f42d5c69f9290580f4d929db93900f86697c95))
- **tests:** update imports and usage of EventBus and RedisClient ([74db728](https://github.com/weyoss/redis-smq/commit/74db728ec66ccef3bcf3c0a01251c8a98fc07fc3))

### Misc

- **deps:** update redis-smq-common to 3.0.0-rc.17 ([e40a094](https://github.com/weyoss/redis-smq/commit/e40a094e833e76f68c3e0f348bee6cccef8a0bc8))

## [8.0.0-rc.28](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.27...v8.0.0-rc.28) (2025-02-05)

### Bug Fixes

- **message:** revert back shutdown method to arrow function ([9d98433](https://github.com/weyoss/redis-smq/commit/9d9843370b09d15ef5fdbb5d7a709db2c6ad0eee))

### Documentation

- **api:** enhance class documentation with detailed descriptions and examples ([0b16152](https://github.com/weyoss/redis-smq/commit/0b161524cb09ef2d9728c3c4e0677dec92e4e0c1))
- **api:** separate error classes from main classes ([ce5dcef](https://github.com/weyoss/redis-smq/commit/ce5dcefda4869a9cf8e10a27054bfe569742a4d2))
- **README:** update HTTP REST API reference link ([e391ed8](https://github.com/weyoss/redis-smq/commit/e391ed8f91a68c544ce749d15d7434581abaca5e))
- update logo, improve content readability ([4554f68](https://github.com/weyoss/redis-smq/commit/4554f680143db79ba884a35d810e9d78e45c9362))

### Codebase Refactoring

- improve code structure and readability ([30dee60](https://github.com/weyoss/redis-smq/commit/30dee60a5a54dd359d03b803ec08060348cf6607))

# Changelog

## [8.0.0-rc.27](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.26...v8.0.0-rc.27) (2025-01-09)

### Continuous Integration

- fix broken CHANGELOG.md for v8.0.0-rc.26 ([c6b9a58](https://github.com/weyoss/redis-smq/commit/c6b9a58612017bd149585ec05928a5dc30edadec))

## [8.0.0-rc.26](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.25...v8.0.0-rc.26) (2025-01-09)

### Documentation

- update API reference ([fb1d0aa](https://github.com/weyoss/redis-smq/commit/fb1d0aa6d6dd76c3c54ed31f2c8777da59b03997))

### Codebase Refactoring

- use queue-scoped workers instead of global ones ([f93ee18](https://github.com/weyoss/redis-smq/commit/f93ee183c2121658f0eef14046fdfcb806d3af65))

### Continuous Integration

- add support for node.js v22 ([0f4eae5](https://github.com/weyoss/redis-smq/commit/0f4eae5e7716c816a5ec98124b8e8269519afbd0))
- upgrade eslint and other deprecated dependencies ([efe92ec](https://github.com/weyoss/redis-smq/commit/efe92ec2b9e8820ea8903fc978621b3cc904286f))

## [8.0.0-rc.25](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.24...v8.0.0-rc.25) (2024-07-07)

### Documentation

- add a link to redis-smq-rest-api ([409a496](https://github.com/weyoss/redis-smq/commit/409a496ed4ea7e44316ce8b523fe9877574f2005))

### Misc

- make redis-smq-common a peer dependency ([fc242b6](https://github.com/weyoss/redis-smq/commit/fc242b61e835b1c3403a5a61303e86daf5d68d54))

## [8.0.0-rc.24](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.23...v8.0.0-rc.24) (2024-05-15)

### Bug Fixes

- **namespace:** replace generic error in getNamespaceQueues() ([4e61c8b](https://github.com/weyoss/redis-smq/commit/4e61c8bccba94e83ddd48f86ca13153f68143bbd))
- **queue-rate-limit:** always validate queue existence ([1228361](https://github.com/weyoss/redis-smq/commit/12283614846cbf2ca2a4b8449ae33d9ba0877513))

### Documentation

- add new error classes reference ([8e2ed15](https://github.com/weyoss/redis-smq/commit/8e2ed155caab2a17ca7b8ef1f8d4eddc3d34acac))

### Codebase Refactoring

- **queue-rate-limit:** move QueueRateLimit.set() logic to LUA ([d49d80b](https://github.com/weyoss/redis-smq/commit/d49d80bc424399b128309a475cd1383fce460010))
- **queue:** return the original error instance ([dbdb1bc](https://github.com/weyoss/redis-smq/commit/dbdb1bceb1a09315676a37501e0ca5fbffafc1e9))

## [8.0.0-rc.23](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.22...v8.0.0-rc.23) (2024-05-10)

### Bug Fixes

- use namespaced errors ([fffb05b](https://github.com/weyoss/redis-smq/commit/fffb05bdb83a3ca3f72b7a440247c1ae5cf7ad8e))
- validate queue delivery model before adding consumer groups ([84ab379](https://github.com/weyoss/redis-smq/commit/84ab3799612b4fc1ce1bd05f1208f887e1ab98d5))

### Documentation

- add new error classes reference ([8091eee](https://github.com/weyoss/redis-smq/commit/8091eeed8d130b17f38216f16a5c78234770882a))
- update Message API reference ([ccb13d4](https://github.com/weyoss/redis-smq/commit/ccb13d4919ad3aacb66ae0b74efbb86ae21bcd1b))

### Tests

- use QueueMessagesConsumerGroupIdRequiredError class ([74703ae](https://github.com/weyoss/redis-smq/commit/74703ae86752bdda5b40fa4f80703cb706dd1751))

## [8.0.0-rc.22](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.21...v8.0.0-rc.22) (2024-05-04)

### Features

- use more granular error classes for reporting errors ([a63aade](https://github.com/weyoss/redis-smq/commit/a63aade048a979d28aa1ff9292c203c64c86bf7a))

### Bug Fixes

- **exchange:** use more granular error classes for reporting errors ([83f0385](https://github.com/weyoss/redis-smq/commit/83f03859e32ca6d5d57722b1552dfe17f489bc36))

### Documentation

- add missing error classes ([f7eb1aa](https://github.com/weyoss/redis-smq/commit/f7eb1aabac9cf329a71b75fd55394c57d495a996))

## [8.0.0-rc.21](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.20...v8.0.0-rc.21) (2024-04-29)

### Bug Fixes

- **message:** correct logic for deleting multiple messages by IDs ([1f6c9ca](https://github.com/weyoss/redis-smq/commit/1f6c9caf9fccf2ef5fdb1abfed14f32da0cf2db6))

### Documentation

- improve RC release status description, clean up ([7796ae4](https://github.com/weyoss/redis-smq/commit/7796ae4cb01e5f85f6b95084fcd88f183d27316b))
- update examples ([14120a9](https://github.com/weyoss/redis-smq/commit/14120a97bc61a3924312cf3e3994f2adb12e34b0))

### Codebase Refactoring

- optimize imports ([b5d33b1](https://github.com/weyoss/redis-smq/commit/b5d33b1b2aca6b95217d516baa5ddcf110ab9b4d))
- remove unused error classes and clean up ([57d7261](https://github.com/weyoss/redis-smq/commit/57d72612a9f01cf6577d9260a096c3e471fa6b06))
- shorten imports ([8abf113](https://github.com/weyoss/redis-smq/commit/8abf113554e259cd276c156e864a9492cf7f70d7))

### Tests

- increase code coverage ([0da9bfb](https://github.com/weyoss/redis-smq/commit/0da9bfb3fec9a5edbe3f4d4dc60ac4d666096577))

### Misc

- clean up package.json ([512163b](https://github.com/weyoss/redis-smq/commit/512163bd1f7bbd41b9d012e3312a5f3cc82377b3))
- update LICENSE ([e073844](https://github.com/weyoss/redis-smq/commit/e073844065e788db4b84dd41908f0cb1163106da))

## [8.0.0-rc.20](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.19...v8.0.0-rc.20) (2024-03-24)

### Bug Fixes

- include missing enums when exporting esm/cjs modules ([18e2463](https://github.com/weyoss/redis-smq/commit/18e2463b9a1a98dd733d9b7e8a83988e95accbbd))

## [8.0.0-rc.19](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.18...v8.0.0-rc.19) (2024-03-24)

### Documentation

- fix incorrect generated anchor texts ([a784b1d](https://github.com/weyoss/redis-smq/commit/a784b1de13c72c3748f00422cc94c9de46f994c1))

## [8.0.0-rc.18](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.17...v8.0.0-rc.18) (2024-03-24)

### ⚠ BREAKING CHANGES

- rebase on redis-smq-common@3.0.0-rc.14

### Documentation

- update documentation and API reference ([5b6ae3e](https://github.com/weyoss/redis-smq/commit/5b6ae3ee855200747b3450bd7101f92e575ffddb))

### Codebase Refactoring

- do not throw errors for async functions ([4892054](https://github.com/weyoss/redis-smq/commit/489205409aaf85d7ba947763235ff2a0721f0202))
- rebase on redis-smq-common@3.0.0-rc.14 ([77966d6](https://github.com/weyoss/redis-smq/commit/77966d69645c95bcd482f74c64b90f55262df114))

## [8.0.0-rc.17](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.16...v8.0.0-rc.17) (2024-01-30)

### Documentation

- add missing error classes ([4ef0c07](https://github.com/weyoss/redis-smq/commit/4ef0c0763effb5f0d20d16102fe61619999a448e))
- simplify and unify class/method naming and referencing ([aa57a4b](https://github.com/weyoss/redis-smq/commit/aa57a4b128a965980ceeec3a8fd4d25b0b611c08))

### Codebase Refactoring

- improve MessageHandler error handling ([76fb034](https://github.com/weyoss/redis-smq/commit/76fb0342eca1c1258689b387280a13e2c6839495))

## [8.0.0-rc.16](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.15...v8.0.0-rc.16) (2024-01-28)

### Features

- allow running/sandboxing message handlers using worker threads ([bfe1293](https://github.com/weyoss/redis-smq/commit/bfe129353136cac92dd42dd16ee4cc2e335a560b))

### Bug Fixes

- export message handler errors ([274a950](https://github.com/weyoss/redis-smq/commit/274a95052a6053d896496c85465b84eea10a678c))

### Documentation

- **ConsumeMessageWorker:** update docs and clean up ([74ea882](https://github.com/weyoss/redis-smq/commit/74ea8821975d01b2f5288f7fd291bc7e54f40ddc))
- fix broken links ([33dcfe8](https://github.com/weyoss/redis-smq/commit/33dcfe8c47a2a531e2de8aaa8dd0956ce34f50d6))
- update messages and queues documentation ([36c2d13](https://github.com/weyoss/redis-smq/commit/36c2d130b310dbf3ec64897cbb5e7e16e2dacc91))

### Codebase Refactoring

- **ConsumeMessageWorker:** improve typings ([48d91c0](https://github.com/weyoss/redis-smq/commit/48d91c0d42ff6ff04f1170e33f4e2c9af61c929a))

### Tests

- allow running/sandboxing message handlers using worker threads ([ea9f84c](https://github.com/weyoss/redis-smq/commit/ea9f84c4f57e3deaaa22da093e13d92da8c25d71))

## [8.0.0-rc.15](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.14...v8.0.0-rc.15) (2024-01-25)

### Features

- add Pub/Sub delivery model, refactor and clean up ([b9a0d28](https://github.com/weyoss/redis-smq/commit/b9a0d289b8def024bd180f91ef2b7a671094b622))

### Documentation

- add a notification about the latest release, clean up ([1ebed87](https://github.com/weyoss/redis-smq/commit/1ebed87bc533f2f4eed261959976a634ca25eb9f))
- add Pub/Sub delivery model, refactor and clean up ([7cc0732](https://github.com/weyoss/redis-smq/commit/7cc0732eb75bc65310ab1aa06503f744e2e8be07))
- clean up ([79f7c73](https://github.com/weyoss/redis-smq/commit/79f7c733efea519c594b065930dde8277db66a43))

### Misc

- bump up redis-smq-common to v3.0.0-rc.8 ([300a4f4](https://github.com/weyoss/redis-smq/commit/300a4f4d315007d7ee3b4c5fd8c7c314066ed94c))
- bump up redis-smq-common to v3.0.0-rc9 ([8b60579](https://github.com/weyoss/redis-smq/commit/8b605797f1758ff23d9aaa0419091a4d7da4947a))

## [8.0.0-rc.14](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.13...v8.0.0-rc.14) (2024-01-03)

### Documentation

- add new diagrams and update existing ones ([89f0c62](https://github.com/weyoss/redis-smq/commit/89f0c62020e777957da74886013504e948555418))
- **event-listeners:** add a link to IRedisSMQConfig interface ([dd6db7c](https://github.com/weyoss/redis-smq/commit/dd6db7c78c4b82243399bf0ba505862132f2e514))
- scale down diagrams ([daaaa49](https://github.com/weyoss/redis-smq/commit/daaaa49d270b624f0282c87cb8b01d462636da1f))
- update exchange diagrams ([a7314a3](https://github.com/weyoss/redis-smq/commit/a7314a354657e2dfe583235f44ef169a0557c121))

### Codebase Refactoring

- **event-listeners:** clean up ([8fbc52c](https://github.com/weyoss/redis-smq/commit/8fbc52cd4f833c66505fc71d7fea263628d10d4f))
- **exchanges:** improve typings ([31d0189](https://github.com/weyoss/redis-smq/commit/31d01897c6f1f306d85f283f453cbb1876e23fc2))
- **message:** handle various errors when deleting a message ([589eee3](https://github.com/weyoss/redis-smq/commit/589eee324185288b4ab21a41f4af4400931d4c5c))

### Tests

- **message:** handle various errors when deleting a message ([22eebee](https://github.com/weyoss/redis-smq/commit/22eebeeea206dd0b70a0e7069b0ea7d9f4f0269e))

## [8.0.0-rc.13](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.12...v8.0.0-rc.13) (2023-12-23)

### ⚠ BREAKING CHANGES

- **event-listeners:** unify consumer/producer event listeners

### Documentation

- **event-listeners:** update documentation ([f86e224](https://github.com/weyoss/redis-smq/commit/f86e224f241391d5846eca95a07d94f0e2be8a1a))

### Codebase Refactoring

- **event-listeners:** unify consumer/producer event listeners ([a7115f8](https://github.com/weyoss/redis-smq/commit/a7115f87fb447c7cbc4b9db1dec178badd936fe4))

### Tests

- **event-listeners:** unify consumer/producer event listeners ([c028286](https://github.com/weyoss/redis-smq/commit/c0282865862f1b3a94b9f163940fa107d9205e2d))

## [8.0.0-rc.12](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.11...v8.0.0-rc.12) (2023-12-18)

### Misc

- update logo ([9c0cfc8](https://github.com/weyoss/redis-smq/commit/9c0cfc849e507af419f61bb8026bcaf8eeac4ce2))

## [8.0.0-rc.11](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.10...v8.0.0-rc.11) (2023-12-18)

### Documentation

- **IConsumableMessage:** clean up ([f41ee94](https://github.com/weyoss/redis-smq/commit/f41ee94d997f3aca2092d83a14bdd83108dea25a))

### Codebase Refactoring

- **MessageEnvelope:** clean up ([800a0b6](https://github.com/weyoss/redis-smq/commit/800a0b66152cab05a41d0c180300fe1c6090b10a))
- rename \_createRMessage to \_createConsumableMessage ([103677e](https://github.com/weyoss/redis-smq/commit/103677e84b631121797a3b2f02529c4d71271c29))

### Tests

- **ConsumableMessage:** increase code coverage ([b7f77ab](https://github.com/weyoss/redis-smq/commit/b7f77abf9225f64d8f2b7d08a4de71b9fd18f583))

## [8.0.0-rc.10](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.9...v8.0.0-rc.10) (2023-12-17)

### ⚠ BREAKING CHANGES

- add ProducibleMessage/ConsumableMessage/MessageEnvelope

### Features

- add ProducibleMessage/ConsumableMessage/MessageEnvelope ([20c0d23](https://github.com/weyoss/redis-smq/commit/20c0d2388bf6979883d5d4cd658c3a39faa20b10))

### Documentation

- add ProducibleMessage/ConsumableMessage/MessageEnvelope ([9db6264](https://github.com/weyoss/redis-smq/commit/9db62648b1421999672c909be99c79a4e1d436a3))
- **QueueMessages:** fix outdated class reference ([224803c](https://github.com/weyoss/redis-smq/commit/224803c6622939769264e561ddfffffa1c261b2b))
- update examples ([467fa2f](https://github.com/weyoss/redis-smq/commit/467fa2f2e6f0cf7fc31aca6b2916d43bd07c2823))

### Tests

- add ProducibleMessage/ConsumableMessage/MessageEnvelope ([cc70e06](https://github.com/weyoss/redis-smq/commit/cc70e06a821a1e9c89cdf7bd7ddef387713a4cdb))

### Misc

- update health-check ([5d6d3b5](https://github.com/weyoss/redis-smq/commit/5d6d3b5dd33fcb1533cae9aade2f5d8edc397074))

## [8.0.0-rc.9](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.8...v8.0.0-rc.9) (2023-12-11)

### Documentation

- update documentation ([29452cf](https://github.com/weyoss/redis-smq/commit/29452cff326d4da4338dad20777f1cc1bf7f5fc2))

### Codebase Refactoring

- **MessageEnvelope:** improve setPriority/getPriority typings ([92b2e1b](https://github.com/weyoss/redis-smq/commit/92b2e1bef2c901257ea6280b0492c0be7218c312))

### Tests

- **MessageEnvelope:** improve setPriority/getPriority typings ([99d0591](https://github.com/weyoss/redis-smq/commit/99d059147340206a91d309cef8788e56ef117d53))

## [8.0.0-rc.8](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.7...v8.0.0-rc.8) (2023-12-11)

### ⚠ BREAKING CHANGES

- **Message:** remove Message.MessagePriority, add EMessagePriority
- **QueueMessages:** move message methods to Message,add MessageEnvelope

### Features

- **Message:** add getMessageStatus() method ([e3e98a3](https://github.com/weyoss/redis-smq/commit/e3e98a3d05872881f92f18a195da029cab7e5652))

### Bug Fixes

- **Message:** export missing error classes ([357f30e](https://github.com/weyoss/redis-smq/commit/357f30eceea903b283bf1463b6d5c517c5e8666f))

### Documentation

- update documentation and examples ([0872081](https://github.com/weyoss/redis-smq/commit/087208143f84efa31a494b790f070d33687aeb1b))

### Codebase Refactoring

- **Message:** remove Message.MessagePriority, add EMessagePriority ([3af0110](https://github.com/weyoss/redis-smq/commit/3af011039426e434d6dd61ad19dc49070f663e1c))
- **QueueMessages:** move message methods to Message,add MessageEnvelope ([697a889](https://github.com/weyoss/redis-smq/commit/697a88931d0ac94490332026b9672fcdac77fa33))

### Tests

- **Message:** add getMessageStatus() method ([6b7c89c](https://github.com/weyoss/redis-smq/commit/6b7c89c61f5a42ba3fb1d86c7b81fa76730828e1))
- **Message:** remove Message.MessagePriority, add EMessagePriority ([e37b2d9](https://github.com/weyoss/redis-smq/commit/e37b2d93bf193d0879f6e78d582edcaca5d24294))
- **QueueMessages:** move message methods to Message,add MessageEnvelope ([3d05e46](https://github.com/weyoss/redis-smq/commit/3d05e46939529e84ff967d17f444e1b93a5f0302))

## [8.0.0-rc.7](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.6...v8.0.0-rc.7) (2023-12-09)

### ⚠ BREAKING CHANGES

- **QueueMessages:** remove redundant method deleteMessage()

### Documentation

- **QueueMessages:** remove redundant method deleteMessage() ([eeefbcd](https://github.com/weyoss/redis-smq/commit/eeefbcd64f191e2eecbb6b7e93b5dca76da7310a))

### Codebase Refactoring

- **QueueMessages:** remove redundant method deleteMessage() ([9a8006d](https://github.com/weyoss/redis-smq/commit/9a8006db06a212d5b000e33edbaee6c5a4499880))

### Tests

- **QueueMessages:** remove redundant method deleteMessage() ([5ea9346](https://github.com/weyoss/redis-smq/commit/5ea9346aa9f9241a326d4870722dd63111bd2095))

## [8.0.0-rc.6](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.5...v8.0.0-rc.6) (2023-12-09)

### ⚠ BREAKING CHANGES

- **QueueMessages:** rename deleteMessagesById to deleteMessageById

### Documentation

- **QueueMessages:** rename deleteMessagesById to deleteMessageById ([3fa91aa](https://github.com/weyoss/redis-smq/commit/3fa91aacdb4a26d1ae73f0094735a497988bafdd))

### Codebase Refactoring

- **QueueMessages:** rename deleteMessagesById to deleteMessageById ([8f5245f](https://github.com/weyoss/redis-smq/commit/8f5245fc754060d7b87d5d37340189084b1fb58e))

## [8.0.0-rc.5](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.4...v8.0.0-rc.5) (2023-12-03)

### Documentation

- clean up ([deb3c04](https://github.com/weyoss/redis-smq/commit/deb3c04c20e1891b7c5a0f232291e140a6485add))

### Codebase Refactoring

- improve typings ([50ed88c](https://github.com/weyoss/redis-smq/commit/50ed88cd50972fcfe96a8278769f130a30557ce4))

## [8.0.0-rc.4](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.3...v8.0.0-rc.4) (2023-12-02)

### Documentation

- clean up outdated examples ([a2aa539](https://github.com/weyoss/redis-smq/commit/a2aa539144e7a9589372fe981f5b4b90ab880607))

### Misc

- move redis-smq-common from dev-deps to deps ([b8c59f0](https://github.com/weyoss/redis-smq/commit/b8c59f01ddc527c1332b570edcfe879a68cd2ddf))

## [8.0.0-rc.3](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.2...v8.0.0-rc.3) (2023-12-02)

### Bug Fixes

- **scheduler:** handle unacked messages with retry delay correctly ([3ba8c34](https://github.com/weyoss/redis-smq/commit/3ba8c34bf9a19b6e657493db83563be202cbaa9e))

### Documentation

- update Message reference ([5d24241](https://github.com/weyoss/redis-smq/commit/5d242419744efa4588d46ed94ae8375480d072c8))
- update TRedisSMQEvent reference ([4b960a3](https://github.com/weyoss/redis-smq/commit/4b960a3600ada02e6aa1c9a513b0001d7e957ce5))

### Tests

- **message:** add new test cases covering message status ([627cda8](https://github.com/weyoss/redis-smq/commit/627cda8050dee739a5eb15655bf9b7049e63b659))

## [8.0.0-rc.2](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.1...v8.0.0-rc.2) (2023-11-27)

### ⚠ BREAKING CHANGES

- **events:** use typed events, remove legacy events
- add message status, return message IDs for produced messages

### Features

- add message status, return message IDs for produced messages ([7d3cabc](https://github.com/weyoss/redis-smq/commit/7d3cabc9e50fa7f37e0a8a5e202787717e1eeadd))
- **events:** use typed events, remove legacy events ([e163af2](https://github.com/weyoss/redis-smq/commit/e163af28f665046f21a107b974b0db5fe7192189))

### Documentation

- **README.md:** update features description ([dcc58e7](https://github.com/weyoss/redis-smq/commit/dcc58e774309545fc5def6d6df996eab4f4c2ff1))
- update configuration.md ([becfc68](https://github.com/weyoss/redis-smq/commit/becfc6882f5550b6e9852e3d7e694450299cd843))
- use typed events, remove legacy events ([4ee8508](https://github.com/weyoss/redis-smq/commit/4ee850825b287bbceb3bf433f662084c17209267))

### Tests

- add message status, return message IDs for produced messages ([c215549](https://github.com/weyoss/redis-smq/commit/c21554952f2bf086bbf7f51eacb70b1fff6f5ad9))
- use typed events, remove legacy events ([8a95011](https://github.com/weyoss/redis-smq/commit/8a9501198464bb8cb5ec65bf6bd8f094b332ef66))

## [8.0.0-rc.1](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.0...v8.0.0-rc.1) (2023-11-21)

### Codebase Refactoring

- pass keyQueueMessages as a key for SCHEDULE_MESSAGE script ([7fc9a66](https://github.com/weyoss/redis-smq/commit/7fc9a66254ab243987757e1ef13a319aad4519cd))

### Tests

- fix unpredictable error throwing when deleting a namespace ([fcfc117](https://github.com/weyoss/redis-smq/commit/fcfc1172a4869e43d83e5d71a9049d1feccbdcfc))

### Misc

- update lint-staged configuration ([03d145e](https://github.com/weyoss/redis-smq/commit/03d145ecc0d025760099ee911a71cdfa5d847a1e))

## [8.0.0-rc.0](https://github.com/weyoss/redis-smq/compare/v7.2.3...v8.0.0-rc.0) (2023-11-20)

### ⚠ BREAKING CHANGES

- use latest redis-smq-common release, fix breaking changes

### Features

- allow to track a published message by its ID ([250a8c3](https://github.com/weyoss/redis-smq/commit/250a8c3049e8ed181a2ec5add6ebeb51126c42e2))

### Bug Fixes

- **exchange:** fix json argument typings for \_fromJSON() ([5d2df1c](https://github.com/weyoss/redis-smq/commit/5d2df1cf766fb608cd9542a1c771fea7aa4d6d4c))

### Documentation

- add missing error classes reference, clean up ([ab723a9](https://github.com/weyoss/redis-smq/commit/ab723a9b741befd08ce2e6429ed34187dc10923e))
- **api:** improve IQueueProperties description ([ec34d74](https://github.com/weyoss/redis-smq/commit/ec34d74f17809e49fc1f29665ad43dda3960fb7f))
- fix empty links ([8c46e6a](https://github.com/weyoss/redis-smq/commit/8c46e6a880b2807f4b92021b8ce8560a2406a975))
- fix javascript/typescript examples ([990e4a1](https://github.com/weyoss/redis-smq/commit/990e4a10547b1bc7c0e55238e85238424dc14a07))
- **queue:** update IQueueProperties interface reference ([9a2b9d8](https://github.com/weyoss/redis-smq/commit/9a2b9d84263e65cd132dd612bcc632d2faf07af9))
- **README.md:** add pre-release notice ([ee58cf6](https://github.com/weyoss/redis-smq/commit/ee58cf603438b57d9ae9b5031689da449a0b78d0))
- **README.md:** fix typo ([94640f6](https://github.com/weyoss/redis-smq/commit/94640f6c5779a642434eb9b803bc966246d34b67))
- **README.md:** update minimal supported Redis version ([906e416](https://github.com/weyoss/redis-smq/commit/906e41668f14bfce1f539ae15e8e5edfd172fc12))
- **README:** fix heading hierarchy ([7cd1399](https://github.com/weyoss/redis-smq/commit/7cd1399b10ea21610b31f696856a6d7101525909))
- update docs ([640a27b](https://github.com/weyoss/redis-smq/commit/640a27bc0bed02e79eb61d0d1623a9a847b2f060))
- update examples ([5e15375](https://github.com/weyoss/redis-smq/commit/5e15375e531be465c5ae3ff5a2c54931f226b371))

### Codebase Refactoring

- **queue:** use friendly keys for queue properties object ([5438cbc](https://github.com/weyoss/redis-smq/commit/5438cbc1877a88b0c1407db6fc858d71a18898d1))
- use latest redis-smq-common release, fix breaking changes ([f122a47](https://github.com/weyoss/redis-smq/commit/f122a4717e5102d5a9d69b2253cdc7523602c3f1))

### Tests

- fix breaking changes from latest redis-smq-common ([44740bc](https://github.com/weyoss/redis-smq/commit/44740bcebad85d795f0d622949bb44a2a021ae4b))
- fix QueueMessageNotFoundError checking ([a90e875](https://github.com/weyoss/redis-smq/commit/a90e8751f18e438df976bdb16f259770d1f0980a))
- fix tests ([f2dec71](https://github.com/weyoss/redis-smq/commit/f2dec7187878e407b9887af12f37364ef790882a))

### Misc

- add npm scripts ([2664aa7](https://github.com/weyoss/redis-smq/commit/2664aa760171e73f121e92062e5a6421e1b4e3e9))
- bump up redis-smq-common to v3.0.0-rc.6 ([9c8834a](https://github.com/weyoss/redis-smq/commit/9c8834aa2b3a091e95ca513826fdbe181e7c7d68))
- bump up type-coverage to v2.27.0 ([f1cf76f](https://github.com/weyoss/redis-smq/commit/f1cf76f0cd99d98cb7e519a3138c77bddabdc3e0))
- fix incorrect imports ([f175fcf](https://github.com/weyoss/redis-smq/commit/f175fcfcb6108ba4ebb794db1c52328b2902d2c6))
- update both .gitignore and .npmignore files ([6a40f20](https://github.com/weyoss/redis-smq/commit/6a40f20a67b6091a1e773ed2bea169c1ead3f20a))
- update package-lock.json ([d53628c](https://github.com/weyoss/redis-smq/commit/d53628ce75df8f20ce3fe5dc01edb80456b23d84))
- update project copyright annotation ([5bbcb2a](https://github.com/weyoss/redis-smq/commit/5bbcb2af205b557ad20ac9bd597c5b349ffa1b0b))

### Continuous Integration

- drop support for redis server 2.8 and 3 ([c51366c](https://github.com/weyoss/redis-smq/commit/c51366ceefa93f5e2d54391b79aae8b5d8da1493))
- update minimal supported versions for nodejs and redis ([3cf0b3b](https://github.com/weyoss/redis-smq/commit/3cf0b3b27358895e214e869c2c4eea70984e10ec))

## 7.2.3 (2023-03-26)

- test(consumer-heartbeat): update tests (2ee7167)
- refactor(consumer-heartbeat): clean up and improve API (95ca78f)

## 7.2.2 (2023-03-25)

- test(workers): update tests (5b5638c)
- perf(workers): use offset/count for schedule and watchdog workers (bdc962b)
- build: bump up redis-smq-common to v2.0.0 (99639d6)
- build: clean up (8015783)

## 7.2.1 (2023-02-15)

- build: update deps (82a30e8)
- fix: use path.resolve() to fix 'no such file or directory' error (9161d5c)
- build: bump up redis-smq-common to v1.0.6 (0642712)

## 7.2.0 (2023-01-06)

- build: fix NPM vulnerability warnings (9b4e45b)
- build: bump up redis-smq-common to v1.0.5 (2467070)
- docs(readme): update documentation (2b9e0da)
- refactor(message-state): improve getSetExpired() logic (26b14f3)
- test(queue): test settings parsing compatibility with v7.1 (946c443)
- refactor(queue): move out settings parsing logic from getSettings() (a2d5033)
- fix(queue): Keep compatibility with v7.1 queue settings schema (478b957)
- docs(queue-manager): update queue.getSettings() reference (56315c6)
- chore: update license (9a552c0)
- docs(queues): improve documentation (c783c2c)
- docs(queue-manager): update docs (cb69fc5)
- fix(examples): use save() method to create queues (734fd51)
- test(queue-manager): test FIFO queues (a4ed4f4)
- refactor(queue-manager): clean up (150bb1d)
- refactor(message-manager): refactor and clean up (c5d593c)
- feat(queue-manager): allow to create and use FIFO queues (d5d0241)
- docs(message-manager): update scheduled messages API reference (187e41f)

## 7.1.3 (2022-10-26)

- test(FanOutExchangeManager): test binding queues of different types (9f912cf)
- fix(FanOutExchangeManager): forbid binding queues of different types (9721a51)

## 7.1.2 (2022-10-22)

- fix(FanOutExchangeManager): fix unbindQueue() transaction handling (a49a5db)
- fix(FanOutExchangeManager): fix bindQueue() transaction handling (fb001f8)
- docs(queues): fix typos (1d16449)
- docs(queues): add queues.md reference, clean up (066813f)
- docs: improve documentation, add missing links (054dee2)

## 7.1.1 (2022-10-11)

- docs(message-exchanges): update docs (3311369)
- docs: update README (871c0d6)

## 7.1.0 (2022-10-06)

- docs: update README.md (2a5a243)
- build: update npm dependencies (d27f41c)
- test(FanOutExchangeManager): increase code coverage (509909a)
- refactor(FanOutExchangeManager): improve unbindQueue() logic (e6ab44e)
- docs: update docs (a67a016)
- fix: fix typing error (7387a1b)
- test: increase code coverage (90cc3e9)
- refactor: rename saveExchange() to createExchange() (9419870)
- refactor: improve TQueueSettings typing (7bea3f5)
- refactor: bump up redis keys version (30f1493)
- refactor: add EQueueSettingType, remove KEY*QUEUE_SETTINGS*\* keys (6ffb717)
- refactor(queue-manager): update queue.create() reply payload (b9dcea1)
- feat(FanOutExchangeManager): add saveExchange(), deleteExchange() (7fa6849)
- refactor(redis-keys): clean up validateRedisKey() (50fb079)
- fix(FanOutExchange): fix bindingParams validation (5b5c8ae)
- test(exchange): increase code coverage (5a15f04)
- feat(exchange): allow retrieving fanout exchange list (7976702)
- refactor(exchange): improve exchange tag naming (9722c22)
- refactor(message): improve message.exchange typing (1f0e610)
- refactor(queue-manager): clean up (c9b5ac4)
- docs(message): update MessageMetadata references (1abcfaf)
- test(message): update MessageMetadata references (659ce6f)
- refactor(message): rename MessageMetadata to MessageState, clean up (12b5092)
- docs(exchange): improve documentation (0735946)
- docs(producer): update docs (910750b)
- docs(exchange): fix typos (fb2ebfe)
- test(exchange): test exchanges with unmatched queues (d87e4a2)
- fix(exchange): return an error for exchanges with unmatched queues (eeedc92)
- docs(message): add missing method references (a4192b8)
- docs(exchange): update docs (dab10e2)
- refactor(exchange): rename FanOutExchangeManager methods (d76b4c0)
- docs(exchange): add FanOutExchangeManager reference (5a01158)
- test(exchange): update fanout-exchange tests (21aec66)
- feat(exchange): add FanOutExchangeManager (e5e73f9)
- refactor(exchange): rename files (2d29855)
- build: update workflow names (a2eeff8)
- docs(readme): display the status of codeql.yml workflow (f43eec2)
- perf(redis-keys): fix inefficient regex complexity (c4a8ad5)
- build: set up code scanning (c1f9422)
- docs(exchange): update message-exchanges.md (1d1a7b7)
- test(exchange): fix test errors (0ec722e)
- docs(exchange): fix typos (d827baf)
- fix(redis-keys): enforce a redis key to start with a letter (a-z) (0d7d7f7)
- docs(exchange): update docs (wip) (ac7d7d9)
- fix(exchange): export DirectExchange/TopicExchange/FanOutExchange classes (4d63dbd)
- test(exchange): increase code coverage (23eca90)
- refactor(exchange): add and use InvalidExchangeDataError (bfe8fc7)
- docs(readme): add reference to current release documentation (d848147)
- docs(producer): update producer.produce() parameters (cc3b470)
- fix: fix various typings issues (7b58867)
- chore: update examples (fb6dd3c)
- refactor: update tests (b5ab73e)
- test(exchange): test fanout and topic exchanges (20d7978)
- feat(queue-manager): allow to bind/unbind a queue to an exchange (aa7d925)
- refactor(exchange): remove code redundancies and clean up (4a2f910)
- chore: bump up redis-smq-common to v1.0.4 (65e872f)
- feat(exchange): implement missing methods of TopicExchange class (b2de1e4)
- feat(redis-keys): allow redis keys to include a dot (42901b1)
- perf(queue-manager): use sscan instead of smembers (7e8b089)
- feat(exchange): implement direct, fanout, and topic exchanges (1cb70c0)
- chore: bump up redis-smq-common to 1.0.3 (0b86f0e)
- chore: clean up (4c60294)

## 7.0.7 (2022-08-10)

- Bump up redis-smq-common to v1.0.2 (f3135d5)
- Update docs (fb4e07c)

## 7.0.6 (2022-08-08)

- Improve consumer/producer shutdown handling (4571775)
- Update docs (243087d)
- Update examples (6e7fbef)
- Fix tests (74ff9c8)
- Add and use ProducerNotRunningError error class (57d0c38)
- Fix a potential MaxListenersExceededWarning exception throwing (5319a49)
- Make producers to be run manually before producing messages (e1b2e96)

## 7.0.5 (2022-07-20)

- Remove code redundancies (ea7681e)
- Update event listeners docs (eef6926)
- Refactor IEventListener interface, clean up (80ffc71)

## 7.0.4 (2022-07-14)

- Fix dev dependencies (f25e9ef)
- Update installation info (1f913c6)
- Make redis-smq-common as a peer dependency (8471242)

## 7.0.3 (2022-07-13)

- Fix consuming-messages/test00012 (8cacff1)

## 7.0.2 (2022-07-13)

- Bump up redis-smq-common to v1.0.1 (49c8a13)
- Bump up typescript to v4.7.4 (69b52d4)
- Fix npm vulnerability warnings (30d9b5a)
- Clean up examples (6599a43)

## 7.0.1 (2022-06-18)

- Update migrating.md (de00143)
- Update README.md (af98940)

## 7.0.0 (2022-06-18)

- Fix typing issue (abdd569)
- Bump up redis-smq-common to v1.0.0 (ad46bdf)
- Update callback vs promise vs async/await benchmarks (6200584)
- Update README.md (6d229f8)

## 7.0.0-rc.8 (2022-06-09)

- Update docs (f55ef6f)
- Test consumers/producers event listeners (a2dd1b5)
- Implement consumers/producers event listeners (16502d5)

## 7.0.0-rc.7 (2022-06-07)

- Update redis keys prefix (c1ff86c)
- Use codecov instead of coveralls (c8a04ff)
- Improve consuming-messages/test00013 (ff4a41d)
- Improve consuming-messages/test00010 (62411cc)
- Test WatchdogWorker (a59b1f0)
- Clean up (0e43a8e)
- Improve unacknowleged messages handling, refactor (450c118)
- Fix outdated javascript examples (e733000)
- Keep a clean directory structure (37424c7)
- Update README.md (3a18f36)
- Clean up tests (f3f0d2e)

## 7.0.0-rc.6 (2022-05-31)

- Bump up redis-smq-common to v1.0.0-rc.11 (49856d6)

## 7.0.0-rc.5 (2022-05-31)

- Bump up redis-smq-common to v1.0.0-rc.10 (865c8b3)
- Update docs (3e5a134)

## 7.0.0-rc.4 (2022-05-30)

- Update README.md (4009b69)
- Support node-redis v4 (7ff9533)
- Drop support for node.js v12 (5e7707f)
- Fix outdated documentation (a714af4)
- Fix broken link (8fb8f46)

## 7.0.0-rc.3 (2022-05-26)

- Update migration/configuration/message/message-manager references (208985f)
- Update docs (4c7f3b3)
- Bump up redis-smq-common to v1.0.0-rc.3, refactor (6096b81)
- Bump up redis-smq-common to v1.0.0-rc.2 (8ff64dc)
- Remove singletons, use instance based configuration (6e79f96)
- Fix 'fsevents not accessible from jest-haste-map' error (f64c957)
- Use shared components from redis-smq-common (6299b21)
- Reorganize codebase fnewers (6941724)
- Clean up redis-keys.ts (91edc0e)
- Add PluginRegistrationNotAllowedError error, clean up (7f1bfa1)
- Update tests (0c056f9)
- Implement a plugging system for using the web-ui as an extension (90dd890)
- Fix tests (1097832)
- Reorganize codebase files (9d64efc)
- Remove the web ui from codebase, clean up (037e093)
- Update http-api.md (cfc4975)

## 7.0.0-rc.2 (2022-05-18)

- Fix typo (1421d00)
- Update docs (d4b52f4)
- Update misc scripts (a78f75b)
- Clean up WebsocketRateStreamWorker, use incremental timestamp (0cf66eb)

## 7.0.0-rc.1 (2022-05-15)

- Update docs (1bba591)
- Fix consuming-messages/test00015 test (558eb18)
- Clean up and simplify the consumer.consume() callback argument (c4aff38)
- Update docs (f38ed6d)
- Update tests (e779ed8)
- Refactor configuration object (18a8861)
- Make QueueManager constructor private (ab114c9)
- Update redisKeys version (6fe4183)
- Update scheduling-messages.md (776f2f5)
- Update multiplexing.md (976481e)

## 7.0.0-rc.0 (2022-05-13)

- Update LICENSE (de15e07)
- Update multiplexing.md (07bd135)
- Add v7 migration guide (a3ae66e)
- Add error codes for message publishing/scheduling failures (3cb5cae)
- Update examples (257cc2e)
- Update docs (b7ebfa6)
- Bump up redis-smq-monitor to v7.0.0-rc.0 (ea0412c)
- Update docs (755dbb1)
- Fix http-api/test00001 test (236768c)
- Update docs (6258af0)
- Update tests (22dcfce)
- Improve QueueManager methods naming (a696666)
- Clean up (89c5735)
- Fix pending messages related data in websocket streams (b08ac19)
- Clean up (ca1f678)
- Update examples (e389960)
- Update tests (ac70d90)
- Unify pending messages API for both LIFO and Priority messages (61a4e98)
- Fix tests (c8272cd)
- Fix queue creation, handle properly queue settings (2af0938)
- Clean up Queue class (fbe51e0)
- Update tests (2a927bf)
- Clean up QueueManager (a8e8cba)
- Validate the message queue before scheduling a message (589f96e)
- Refactor MessageManager API, clean up (4476b81)
- Fix various tests errors due to incompatible APIs (9fca191)
- Refactor Producer/Consumer/QueueManager APIs (0c4cfa1)
- Refactor consumer class, update consumer.consume() signature (3b4f5ef)
- Expect the number messages to be at greater than 6 (2a34035)
- Improve consuming-messages/test00031 (7ca223a)
- Clean up (5946a8f)
- Bump up redis-smq-monitor to v6.5.7 (0ac7535)
- Fix consuming-messages/test00014 (9a013d3)
- Merge branch 'lock-manager' (91f83b7)
- Throw an error when a lock could not be acquired or extended (cbb13c9)
- Refactor LockManager to allow auto extending locks (269ac03)

## 6.4.2 (2022-04-23)

- Test expired locks (5cfa25a)
- Do not throw an exception and try to acquire again an expired lock (8b7e5a4)
- Bump up redis-smq-monitor to v6.5.6 (5134dd0)
- Fix NPM security vulnerabilities (2a890fc)
- Clean up monitor-server services (0614470)

## 6.4.1 (2022-03-22)

- Fix fsevents not accessible from jest-haste-map (e58366e)
- Fix broken url in the Web UI docs (213e367)

## 6.4.0 (2022-03-22)

- Update Web UI docs (55c35b4)
- Bump up redis-smq-monitor to v6.5.5 (e764f93)
- Test monitor.basePath configuration (531b9fa)
- Support basePath when running web ui from behind a reverse proxy (767850a)

## 6.3.1 (2022-03-15)

- Fix typos (139435c)

## 6.3.0 (2022-03-15)

- Update docs (da9f5a1)
- Use colons instead of dots for joining Redis key segments (db53694)
- Continue testing consumer message multiplexing (4ce6ecf)
- Improve multiplexing delay when dequeuing messages (84383c6)
- Remove deprecated consumer.cancel(queue,priority,cb), add new tests (66bf070)
- Fix test errors, clean up (4bff69f)
- Prefer method definition over arrow function property (c135cdc)
- Implement MultiplexedMessageHandlerRunner (0b080ec)
- Refactor MessageHandler to allow more modular structures (f15ba6e)

## 6.2.6 (2022-03-04)

- Clean up (f5df3ac)
- Implement MessageHandlerRunner (625394c)

## 6.2.5 (2022-03-03)

- Update Consumer API docs (fe5bdd0)
- Do not consume messages with and without priority from the same queue (e602d39)
- Use default parameters when creating a Ticker instance (ab43147)
- Update consumer queue list upon shutting down a message handler (a8a655a)

## 6.2.4 (2022-02-23)

- Fix consuming-messages/test00015 error (a9c74f5)

## 6.2.3 (2022-02-23)

- Bump up redis-smq-monitor to v6.5.3 (2e56973)
- Remove gracefully a message handler (9bdeba6)
- Add MessageHandlerAlreadyExistsError custom error (9494643)

## 6.2.2 (2022-02-21)

- Fix a queue rate limiting bug allowing to save invalid Redis keys (b3eb7d3)
- Bump up redis-smq-monitor to v6.5.2 (ceeea1d)
- Update docs (727b19d)

## 6.2.1 (2022-02-19)

- Remove unused code (2effde9)

## 6.2.0 (2022-02-19)

- Bump up redis-smq-monitor to v6.5.1 (7dbf6a4)
- Improve consumer message rate time series handling (b40e255)
- Update docs (6cd893f)
- Allow configuring queue rate limiting from the HTTP API (360cfd3)
- Test message consumption rate limiting (349e9c0)
- Implement message consumption rate limiting (dd3f086)

## 6.1.0 (2022-02-14)

- Allow configuring which messages to store with extended parameters (6706850)

## 6.0.4 (2022-02-13)

- Fix missing type definition for koa-bodyparser (fadcbfe)

## 6.0.3 (2022-02-13)

- Increase code coverage (d778bd4)

## 6.0.2 (2022-02-12)

- Update architecture overview diagram (f43e39f)
- Improve offline consumers handling & message recovery strategy (21fb512)
- Fix typos and update README.md (edb745b)

## 6.0.1 (2022-02-11)

- Update docs (3f4d9ef)
- Clean up WorkerPool class (fde0005)

## 6.0.0 (2022-02-08)

- Bump up redis-smq-monitor version to 6.4.0 (1a7c89b)
- Implement TimeSeriesWorker (afe2436)
- When deleting a namespace throw an error if it does not exist (b3fab26)
- Fix schedule-message.lua parameters (43ff54f)
- Allow managing namespaces, update HTTP API, test (698d3a6)
- Rename setScheduledPeriod() to setScheduledRepeatPeriod() (4014017)
- Improve Redis keys handling (391c7f3)
- Improve LUA scripts parameters handling (2cd749e)
- Remove redundant call to this.getMainKeys() (ecf32ba)
- Update docs (afedc36)

## 6.0.0-rc.11 (2022-02-02)

- Fix tests/purging-queues/test00007 (41f6bfc)
- Update pre-push hook (13d8c66)
- Clean up (da5552e)
- Fix broken pre-release v6.0.0-rc.10 due to missing dependency (d01d924)

## 6.0.0-rc.10 (2022-02-01)

- Improve locking mechanisms, remove redlock package, refactor (ad56cbf)
- Continue Message class refactoring, update docs and examples (10a9b3a)
- Fix consuming-messages/test00006 test errors, refactor Message class (7f25712)
- Fix at-most-once message delivery (0b36534)
- Update tests (2eac459)
- Bump up redis-smq-monitor to v6.3.0 (99d3262)
- Update time series data only when message rate > 0 (f039303)
- Remove dependency on async package and clean up (1f8548d)
- Use worker pool for system workers and monitor-server workers (f18a0aa)
- Test producing duplicate messages (f4abb16)
- Remove redundant code related to message.isSchedulable() (c8e09df)
- Update Redis keys prefix (adc26b0)
- Forbid producing a message more than once, introduce MessageMetadata (5219ba7)

## 6.0.0-rc.9 (2022-01-27)

- Check object reference equality before clearing singleton instance (8e7cab6)
- Improve namespaced logger (9717853)
- Support external loggers, use system-wide config, refactor codebase (b093163)
- Make storing acknowledged & dead-lettered messages optional (adf2466)
- Fix typos and update readme (0976c57)

## 6.0.0-rc.8 (2022-01-24)

- Update migration guide (72e09bd)
- Test multi-queue consumer, update docs (8fd14e5)
- Fix ticker waitlock issue (d19e8c4)
- Handle gracefully run/shutdown call errors, fix test errors, clean up (bd91933)
- Clean up (45133e6)
- Update examples (6fcd1a5)
- Implement multi-queue consumers, refactor and clean up (21b564e)
- Fix typo in README.md (a23cb5b)

## 6.0.0-rc.7 (2022-01-21)

- Update package.json keywords (2a77c16)
- Remove extra spacing in message-manager.md (1003c28)
- Update QueueManager API reference (6c03603)
- Move purge operations to handlers (4dd40c1)
- Rename and move purgePendingMessagesWithPriority to MessageManager (f0c65e9)
- Rename and move purgePendingMessages to MessageManager (4e684b4)
- Rename and move purgeScheduledMessages to MessageManager (f2718e9)
- Rename and move purgeAcknowledgedMessages to MessageManager (4c062a0)
- Rename and move purgeDeadLetteredMessages to MessageManager (406d243)
- Update message-manager.md (8a46c7d)
- Rename requeueMessageFromDLQueue to requeueDeadLetteredMessage (5ebdd79)
- Rename requeueMessageFromAcknowledgedQueue to requeueAcknowledgedMessage (77ee6db)
- Rename deleteDeadLetterMessage to deleteDeadLetteredMessage (a7967dc)
- Rename getDeadLetterMessages to getDeadLetteredMessages (0292b9a)
- Update migration guide (a0753ac)

## 6.0.0-rc.6 (2022-01-20)

- Bump up redis-smq-monitor to v6.1.0 (0ee628e)
- Update README.md (eb32fbb)
- Make Producer stateless, drop MultiQueueProducer, refactor, clean up (936bcaf)

## 6.0.0-rc.5 (2022-01-18)

- Fix a possible EventEmitter memory leak in WorkerRunner (7c3d165)
- Fix MultiQueueProducer bug with queueName not being validated, test (eb7e284)

## 6.0.0-rc.4 (2022-01-18)

- Bump redis-smq-monitor to v6.1.0 (d41f59c)
- Improve error message (16cff6c)
- Make MultiQueueProducer publish a message as a single atomic operation (fb43c7b)
- Always invoke setUpMessageQueue() when publishing a message (5f26d8f)
- Test scheduled messages publication when dst queue is deleted (7a838f6)
- Make sure scheduled messages aren't published if dst queue is deleted (ba92258)
- Fix a typo (08ad425)
- Fix delete queue validation bug causing request to hang forever (8c0243e)
- Update typescript/javascript examples (98cf35f)
- Update queue-manager.md (4d3980c)
- Update HTTP API endpoints documentation (0d6b48a)
- Improve HTTP API error handling (e1a3076)
- Allow to delete a message queue from HTTP API, test, update docs (d7c38c9)
- Fix husky v7 setup (b6f938d)
- Update HTTP API reference (a9815c8)
- Fix npm vulnerability warnings (71fb8e6)
- Refactor monitor server HTTP API routing (5ecbf29)

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
- Fixed broken redis parameters parsing for new configuration syntax used before v1.1.0

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
