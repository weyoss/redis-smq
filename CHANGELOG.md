# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [10.1.0](https://github.com/weyoss/redis-smq/compare/v10.1.0-next.1...v10.1.0) (2026-04-11)

> 📖 **Detailed Release Notes**: [RedisSMQ v10.1.0](https://github.com/weyoss/redis-smq/blob/master/release-notes/release-v10.1.0.md)

**Note:** Version bump only for package root

## [10.1.0-next.1](https://github.com/weyoss/redis-smq/compare/v10.1.0-next.0...v10.1.0-next.1) (2026-04-11)

### 🚀 Chore

- add scripts for sync-releases and update-changelog-hashes ([c51b33c](https://github.com/weyoss/redis-smq/commit/c51b33ccf66c3a84dfb9c90371f6134c1fa36d7a))
- **redis-smq-ci:** add sync-releases and update-changelog-hashes utils ([6ef95dc](https://github.com/weyoss/redis-smq/commit/6ef95dc5d2d9bbf9594c54418ce902c9f2f44f22))

### 📝 Documentation

- **redis-smq:** update examples in IRedisSMQConfig JSDocs ([d9dc170](https://github.com/weyoss/redis-smq/commit/d9dc170c4dac5d6778d05805db05b7a753ded25f))
- update changelog commit hashes after email change ([ce13adf](https://github.com/weyoss/redis-smq/commit/ce13adfc8cf2e9a5b7f2573a413e534ed4cafec3))

### ♻️ Code Refactoring

- **redis-smq-web-ui:** remove unused QueuePropertiesCard component ([89cf01d](https://github.com/weyoss/redis-smq/commit/89cf01d988e9ebf38eb9e3343e00d74b16d427f8))
- **redis-smq-web-ui:** unify all message views into single MessagesView ([5b9f177](https://github.com/weyoss/redis-smq/commit/5b9f17789fe6fa70e09a27a2df434c649484bf7b))

## [10.1.0-next.0](https://github.com/weyoss/redis-smq/compare/v10.0.0...v10.1.0-next.0) (2026-04-07)

### ✨ Features

- **redis-smq-rest-api:** add API endpoint for updating config ([e91f2c6](https://github.com/weyoss/redis-smq/commit/e91f2c6bd935d67bc375b13a7ae8c7a0dcdc4d76))
- **redis-smq-web-ui:** add configuration view and management ([fd51b00](https://github.com/weyoss/redis-smq/commit/fd51b004106e3345d7d477172287e356568f99e9))

### 🐛 Bug Fixes

- detect staged changes in post-merge hook ([5552f6f](https://github.com/weyoss/redis-smq/commit/5552f6fb7033546a8e4397927d6ae548b73f6895))

### 📝 Documentation

- fix incorrect link to batch acks documentation ([38dd022](https://github.com/weyoss/redis-smq/commit/38dd022a20aec577c4d719a4107daba09ebc738b))
- update READMEs (v10.0.0 → next) ([8247b2f](https://github.com/weyoss/redis-smq/commit/8247b2f19d7caefcac6efdebd33f5592f743a1e7))

### ♻️ Code Refactoring

- **redis-smq-web-ui:** use typed router, clean up codebase ([2b58fe0](https://github.com/weyoss/redis-smq/commit/2b58fe0d64375b606874f885d8b0a2f63701d098))

### 👷 Continuous Integration

- detect branch correctly during rebase operations ([6ae0309](https://github.com/weyoss/redis-smq/commit/6ae0309ee377040271d5f1c75d1aecd4b68ce6c9))
- remove post-merge hooks ([af9bed6](https://github.com/weyoss/redis-smq/commit/af9bed6ad1b7390937d7cd7fef7f15d37fa5908f))
- skip README update to avoid detached HEAD issues ([9f8806f](https://github.com/weyoss/redis-smq/commit/9f8806faccde33089c2c95470282ab620ff77d52))

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
- rename "docs" script to "document"
- **redis-smq:** simplify RedisSMQ class API
- refactor build process and script naming

### ✨ Features

- **redis-smq-ci:** add CI tools for RedisSMQ ([ec52e72](https://github.com/weyoss/redis-smq/commit/ec52e720c57b94a2fbeec39ffd9c5092a83ad48b))
- **redis-smq-rest-api:** add endpoint for fetching message unack history ([ae43bfc](https://github.com/weyoss/redis-smq/commit/ae43bfcbf5acd220528f987df6e78c255594f3d6))
- **redis-smq-web-ui:** add message failure history tracking ([1f9d330](https://github.com/weyoss/redis-smq/commit/1f9d330dd9b5ef6d3300d784cdbd0ed8528fc378))
- **redis-smq-web-ui:** support message unack history viewing ([cb91ecb](https://github.com/weyoss/redis-smq/commit/cb91ecb0fe8630840c3e9e82d805fbbc9929f7d8))
- **redis-smq:** add cross-instance configuration synchronization ([0b10045](https://github.com/weyoss/redis-smq/commit/0b100455ab9763c66fe02067142454fef48c5d17))

### 🐛 Bug Fixes

- **redis-smq:** audit messages only when enabled explicitly ([43e52d5](https://github.com/weyoss/redis-smq/commit/43e52d553835e153f0eb98c5ea822d4a29cdc5f6))

### 🚀 Chore

- rename "docs" script to "document" ([265d58c](https://github.com/weyoss/redis-smq/commit/265d58c86fa0c99493d1d984349b390b0ce35e9e))

### 📝 Documentation

- **redis-smq-ci:** remove NPM badge for private package ([9ebd062](https://github.com/weyoss/redis-smq/commit/9ebd062542ddd7fda8d19cb727335bffe7c42c14))

### ♻️ Code Refactoring

- **redis-smq-benchmarks:** use new configuration/bootstrap API ([bfcf2d1](https://github.com/weyoss/redis-smq/commit/bfcf2d1a17e2f0396baf0267e9a60adb0a16eeef))
- **redis-smq-rest-api:** use new configuration/bootstrap API ([da27b9a](https://github.com/weyoss/redis-smq/commit/da27b9ac20c8103afe34629a5363cee18e81be83))
- **redis-smq-web-server:** use new configuration/bootstrap API ([1a3bb45](https://github.com/weyoss/redis-smq/commit/1a3bb45b7bdac58babebf6112f17ff5631c7bd3a))
- **redis-smq:** add lastProcessedAt prop to MessageState ([c664159](https://github.com/weyoss/redis-smq/commit/c6641598844861444c279a6f760930830738d279))
- **redis-smq:** simplify RedisSMQ class API ([913b6e8](https://github.com/weyoss/redis-smq/commit/913b6e862198caff18c1177948f556d9e9d7e418))
- **redis-smq:** update IRedisSMQConfig.logger to support boolean values ([b2cb422](https://github.com/weyoss/redis-smq/commit/b2cb422b7404b4aa8e37ef91b4e04ef7dadf302a))

### 📦 Build System

- add strict bash script options for robustness and debugging ([64f1a0a](https://github.com/weyoss/redis-smq/commit/64f1a0ab5b13982b9e039530f94cdc1016d18adf))
- fix shell compatibility by using bash ([3066eea](https://github.com/weyoss/redis-smq/commit/3066eea5bb4e7ddff744e1e855753881d8fb8ed1))
- fix typo in "prepare" script ([6065951](https://github.com/weyoss/redis-smq/commit/60659512e615bbd6fc49c9fc32e65f745482729b))

### 👷 Continuous Integration

- consolidate changelogs into release artifacts ([84a30ef](https://github.com/weyoss/redis-smq/commit/84a30efe2b87a5df3ec5b1311d2ba27325e2d7f0))
- refactor build process and script naming ([516186c](https://github.com/weyoss/redis-smq/commit/516186cb0bf3be248eadab3c05515d1acad26456))

## [10.0.0-next.1](https://github.com/weyoss/redis-smq/compare/v10.0.0-next.0...v10.0.0-next.1) (2026-03-28)

### ⚠ BREAKING CHANGES

- **redis-smq:** improve redis keys hierarchy

### ✨ Features

- **redis-smq:** add message failure history tracking ([29bef17](https://github.com/weyoss/redis-smq/commit/29bef17a897dfa4efd4aac47fcc817020981b451))
- **redis-smq:** support async/await message handlers ([8046412](https://github.com/weyoss/redis-smq/commit/8046412557ddec9ccb6df8c1c9eb30e0c86c4cc5))

### 🐛 Bug Fixes

- **redis-smq:** validate message handler function signature ([e673596](https://github.com/weyoss/redis-smq/commit/e673596402abd27edf4b2ee907887d7d788ddbd3))

### 📝 Documentation

- **redis-smq:** improve promise usage section to include queue creation ([08ae3a6](https://github.com/weyoss/redis-smq/commit/08ae3a60bfca89a8659644a2b9e2f3f1083f8eb4))
- **redis-smq:** update dual callback & promise support docs ([76bb961](https://github.com/weyoss/redis-smq/commit/76bb9615ec9aa4d41836fac3965bc734dd623522))

### ♻️ Code Refactoring

- **redis-smq-common:** add exists() method to IRedisClient ([ec7d6c7](https://github.com/weyoss/redis-smq/commit/ec7d6c76f5219199d446ee2907ed35b28228fa33))
- **redis-smq-rest-api:** update error map ([ede436f](https://github.com/weyoss/redis-smq/commit/ede436f65437d594e268ac3426b4657ca8c057d0))
- **redis-smq:** improve redis keys hierarchy ([5155e6d](https://github.com/weyoss/redis-smq/commit/5155e6df8d6acae02e3f270c2ab14c438b1c9905))

## [10.0.0-next.0](https://github.com/weyoss/redis-smq/compare/v9.1.0-next.6...v10.0.0-next.0) (2026-03-25)

### ⚠ BREAKING CHANGES

- **redis-smq:** make redis key structure more intuitive and consistent
- **redis-smq:** move purge job logic to PurgeQueueJobManager
- **redis-smq:** remove deprecated boolean constructor option for Consumer
- **redis-smq-rest-api:** update OpenAPI specs to v3.1, refactor project structure
- **redis-smq:** use short error class names for clarity
- **redis-smq:** rename methods for clarity and add new bindings methods
- **redis-smq:** store published messages using LISTs for efficient pagination
- **redis-smq-rest-api:** redesign API to best follow REST conventions

### ✨ Features

- **redis-smq:** add dual callback and promise support to public API ([558e309](https://github.com/weyoss/redis-smq/commit/558e309de9385a25d2226132e7f53f444a68a57c))
- **redis-smq:** enable retrieval of queue consumption status by consumer ([4df8b23](https://github.com/weyoss/redis-smq/commit/4df8b238e69cd3c7fb7dde77a7c3e539df5902a8))

### 🐛 Bug Fixes

- **redis-smq-common:** update IRedisClient.md reference ([8777608](https://github.com/weyoss/redis-smq/commit/877760825abde9aa6698f390f99c883907561559))
- **redis-smq-web-ui:** make 'total messages' header clickable ([a5f9d4f](https://github.com/weyoss/redis-smq/commit/a5f9d4fa14d26fbd8316ecd83eeb6508b870cc6e))
- **redis-smq-web-ui:** replace useInfiniteQuery with useQuery for better performance ([7a691b4](https://github.com/weyoss/redis-smq/commit/7a691b48f10b8722b94296fa60d4e3dd5d83a6bf))
- **redis-smq-web-ui:** update EMessagePropertyStatus to fix wrong message statuses ([578dbf9](https://github.com/weyoss/redis-smq/commit/578dbf9e4b2c6f66d62a30bd3ef7a639b7190404))
- **redis-smq:** expect InvalidExchangeRoutingKeyError for invalid routing keys ([a4b97d5](https://github.com/weyoss/redis-smq/commit/a4b97d55a938461651ab624dbeea19ab3dcd1f4f))

### 🚀 Chore

- **redis-smq-common:** update tar to v7.5.12 to address security issues ([b7cf083](https://github.com/weyoss/redis-smq/commit/b7cf0836659e50e9299d839b3706aeff262ab21a))
- upgrade eslint to v10 ([53c724f](https://github.com/weyoss/redis-smq/commit/53c724f49cd89b95febe2e865a04bbb8af86b298))
- use underscore for script filename convention ([4d942b6](https://github.com/weyoss/redis-smq/commit/4d942b619b2e7680398723277e01bbbfba3d0f30))

### 📝 Documentation

- add promise support examples ([94806f6](https://github.com/weyoss/redis-smq/commit/94806f628aa04f379e308359a478a77b837c7755))
- **redis-smq:** clean up dual-callback-and-promise-support.md ([acfa7f7](https://github.com/weyoss/redis-smq/commit/acfa7f718164fbacbbb663b7486a68bbada7dc76))
- **redis-smq:** fix incorrect error class names in JSDocs ([f49f675](https://github.com/weyoss/redis-smq/commit/f49f6755fa2355ea2efa6e8bfa2277a71ff984c0))

### ♻️ Code Refactoring

- **redis-smq-common:** add 'zpoplpush' command ([138b075](https://github.com/weyoss/redis-smq/commit/138b07512ad1cf103773dec4e5e9001225c92512))
- **redis-smq-common:** add withOptionalCallback to async utils ([72a11c6](https://github.com/weyoss/redis-smq/commit/72a11c6f79eee197c9d62da835f88e196d25a2dd))
- **redis-smq-rest-api:** redesign API to best follow REST conventions ([518e38b](https://github.com/weyoss/redis-smq/commit/518e38bdfb33bf6b170b4ce5715efe1a4468d865))
- **redis-smq-rest-api:** update OpenAPI specs to v3.1, refactor project structure ([70b13f5](https://github.com/weyoss/redis-smq/commit/70b13f5943f00a0f55cf854b3a52147be0523ecd))
- **redis-smq-web-ui:** delete unused QueueStatsCard.vue component ([18cd530](https://github.com/weyoss/redis-smq/commit/18cd53064e8a2cef74adaaec3015563c875087f7))
- **redis-smq-web-ui:** improve UI components for clarity and maintainability ([fbc3cb3](https://github.com/weyoss/redis-smq/commit/fbc3cb3d7d2b33bf51e7d3b2459c1673549a89d7))
- **redis-smq:** make redis key structure more intuitive and consistent ([950df98](https://github.com/weyoss/redis-smq/commit/950df98e7ed8377f921cf28efeeded9fdf97c74d))
- **redis-smq:** move purge job logic to PurgeQueueJobManager ([07b8add](https://github.com/weyoss/redis-smq/commit/07b8add560f751e09b9ca5375d3a765a27f482cf))
- **redis-smq:** remove deprecated boolean constructor option for Consumer ([9fca59c](https://github.com/weyoss/redis-smq/commit/9fca59c58d0540d337db236545ea6a2c640f0889))
- **redis-smq:** rename methods for clarity and add new bindings methods ([12905b7](https://github.com/weyoss/redis-smq/commit/12905b7b84ae7caed6e2826d30c9b345257d5e1e))
- **redis-smq:** store published messages using LISTs for efficient pagination ([de7f621](https://github.com/weyoss/redis-smq/commit/de7f62175a9798f39d727eba4b4347951cf609af))
- **redis-smq:** use short error class names for clarity ([3990c5f](https://github.com/weyoss/redis-smq/commit/3990c5ff1f317d1c395de40c3cc041f7b92d69ff))
- **redis-smq:** use ZPOPLPUSH instead of ZPOPRPUSH when dequeuing priority queue messages ([aa26bd0](https://github.com/weyoss/redis-smq/commit/aa26bd0fcf80afdace2d30d7da1c08ba4e969145))

### ✅ Tests

- **redis-smq-web-server:** make sure to initialize RedisSMQ before each test ([fec784c](https://github.com/weyoss/redis-smq/commit/fec784c86e99ae7686b4300057469b6afd21baf2))

## [9.1.0-next.6](https://github.com/weyoss/redis-smq/compare/v9.1.0-next.5...v9.1.0-next.6) (2026-03-12)

### ✨ Features

- **redis-smq-rest-api:** add pause/stop/resume queue API endpoints ([0778b07](https://github.com/weyoss/redis-smq/commit/0778b075614c7ac548d7dab226219f43b6a860cb))
- **redis-smq-rest-api:** add queue operational state module ([bb5e132](https://github.com/weyoss/redis-smq/commit/bb5e1328501fa63c15a3dd4d23b32e273853d083))
- **redis-smq-web-ui:** add operational state history tracking ([75e4213](https://github.com/weyoss/redis-smq/commit/75e421344e96195334fea0a8330993bc9e097732))
- **redis-smq-web-ui:** add queue operational state management ([b7568a4](https://github.com/weyoss/redis-smq/commit/b7568a43be16d60a5c9d7ae16a2c300ab39aab83))

### 📝 Documentation

- **redis-smq:** add message lifecycle and reliability documents ([0879ba3](https://github.com/weyoss/redis-smq/commit/0879ba3dae0ee7659a790e052357798882108a40))

### ♻️ Code Refactoring

- **redis-smq-rest-api:** disable type coercion in AJV validator ([4f44150](https://github.com/weyoss/redis-smq/commit/4f4415029f5cd0e758d0a1854f6d5478b123a9f3))
- **redis-smq-rest-api:** enable type coercion selectively in AJV request validation ([278538a](https://github.com/weyoss/redis-smq/commit/278538a06376e1cda97eef76e3a5487968083662))
- **redis-smq-web-ui:** make formatDateSince() output more human ([4858bee](https://github.com/weyoss/redis-smq/commit/4858bee478b0eeac4b5723704212667a5fb38e9c))
- **redis-smq-web-ui:** remove queue rate limit section in QueueConfigurationCard ([ca7d4ea](https://github.com/weyoss/redis-smq/commit/ca7d4ea4534e95cf32bb29bc3cfadc90e24c97f1))
- **redis-smq:** separate system and user state transition reasons ([2704e0c](https://github.com/weyoss/redis-smq/commit/2704e0cf5a8749850b921ed9bcf42c12d7e4f223))

## [9.1.0-next.5](https://github.com/weyoss/redis-smq/compare/v9.1.0-next.4...v9.1.0-next.5) (2026-03-10)

### 🚀 Chore

- **redis-smq-rest-api:** update koa to v3.1.2 to address security vulnerability ([b2652c5](https://github.com/weyoss/redis-smq/commit/b2652c52abcc3fd7f4f356adb8d46d0cb9a204a8))

### 📝 Documentation

- **redis-smq:** update README with initializeWithConfig() notice ([0c60fec](https://github.com/weyoss/redis-smq/commit/0c60feca98323d621530d5c9ec0b57e074baf689))

### ♻️ Code Refactoring

- **redis-smq-common:** integrate Backoff into existing components ([9ac5dbb](https://github.com/weyoss/redis-smq/commit/9ac5dbb9c67f42dcf5c6ba79228b7222906127f3))
- **redis-smq-common:** modularize Backoff strategies for better integration ([88f5c1d](https://github.com/weyoss/redis-smq/commit/88f5c1d473d2979dd097a2432e58900d98ce8b10))
- **redis-smq-common:** simplify Timer utility ([7c900d2](https://github.com/weyoss/redis-smq/commit/7c900d2d9bbaa5aa724216bdd45b423484f17bce))
- **redis-smq-common:** update API reference ([6e80316](https://github.com/weyoss/redis-smq/commit/6e80316170eeca2bc7c69667be221068551a325a))
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

- **redis-smq-common:** update err type to handle any kind of thrown errors ([404c27d](https://github.com/weyoss/redis-smq/commit/404c27d55500d7c5218d5caa4c5662244415eeff))
- **redis-smq-rest-api:** add ProcessingQueueNotEmptyError to error map ([551c35f](https://github.com/weyoss/redis-smq/commit/551c35fc1960afe1c9fb82ff622bd9d8df67c164))
- suppress error reporting for non-operational Runnable instances ([3c897b0](https://github.com/weyoss/redis-smq/commit/3c897b0ae44682e6baf0959088b2f39e6dfc8b62))

### ⚡ Performance Improvements

- **redis-smq-benchmarks:** maximize consumer speed and track messages accurately ([1ee32b7](https://github.com/weyoss/redis-smq/commit/1ee32b799ede9de293014f0180c5c190d270ba99))

## [9.1.0-next.1](https://github.com/weyoss/redis-smq/compare/v9.1.0-next.0...v9.1.0-next.1) (2026-02-25)

### 📝 Documentation

- **redis-smq:** update API reference ([5eb591e](https://github.com/weyoss/redis-smq/commit/5eb591e25969759645d4ed1c6143c5abfd8c6a34))

### ♻️ Code Refactoring

- **redis-smq-rest-api:** add QueuePausedError to error map ([ea636df](https://github.com/weyoss/redis-smq/commit/ea636dfb5559545f64ac0a06da6432a98b24a65f))
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
- upgrade packages to latest versions to mitigate security vulnerabilities ([bf55522](https://github.com/weyoss/redis-smq/commit/bf55522ebc97f8a66e929d231a7d05caabac24d9))

### 📝 Documentation

- **redis-smq-common:** update API reference ([cca024c](https://github.com/weyoss/redis-smq/commit/cca024cd444816a051788869fc8fc6ece294bd72))
- **redis-smq-common:** update API reference ([7575e18](https://github.com/weyoss/redis-smq/commit/7575e184365b9b6bf21e379d27ef1fd0f75a144d))
- **redis-smq:** add queue state management guide and update API reference ([158e337](https://github.com/weyoss/redis-smq/commit/158e33730eaff3fa5b68ed1c59577d1da247fc56))
- **redis-smq:** add QueueOperationValidator documentation ([55dbde8](https://github.com/weyoss/redis-smq/commit/55dbde8869572bc2edeaf0ca10fda410ac7a0ac1))
- **redis-smq:** clarify difference between initialize/initializeWithConfig ([29eb6fc](https://github.com/weyoss/redis-smq/commit/29eb6fce69827c736355d51a101b69787cb366a3))
- **redis-smq:** update API reference ([ddf0801](https://github.com/weyoss/redis-smq/commit/ddf080182e9daf1374ba4fdd3e07953b36eed062))

### ♻️ Code Refactoring

- **redis-smq-common:** improve Runnable for safe concurrent lifecycle calls ([d4f885b](https://github.com/weyoss/redis-smq/commit/d4f885bb5679f3402acd1a8b9554b5843799cbae))
- **redis-smq-common:** introduce 'lindex' method to IRedisClient Interface ([e925f27](https://github.com/weyoss/redis-smq/commit/e925f27ca9bd3a69386951ceb907ec0aff8b9e97))
- **redis-smq-common:** modularize CPUMonitor for improved component integration ([c9df955](https://github.com/weyoss/redis-smq/commit/c9df95540ea81912a6e90430123c0c7393c0813e))
- **redis-smq-common:** modularize Heartbeat for improved component integration ([ca361c0](https://github.com/weyoss/redis-smq/commit/ca361c04fb3d6efca5aaa359b4412e4342f58931))
- **redis-smq-common:** optimize debug and info usage throughout codebase ([0ac4a20](https://github.com/weyoss/redis-smq/commit/0ac4a20d8c159dc3427c2b044df0c08c3dcba30c))
- **redis-smq-common:** require 'ns' argument for createLogger() ([d194f9f](https://github.com/weyoss/redis-smq/commit/d194f9fb4a6b4bf4c3bd4449c3b422c6f8490202))
- **redis-smq-common:** restructure WorkerCluster for clearer responsibility separation ([1cbda77](https://github.com/weyoss/redis-smq/commit/1cbda770e4d6e0a22f2e56d6861831a14a741739))
- **redis-smq-rest-api:** update error map ([fbe800f](https://github.com/weyoss/redis-smq/commit/fbe800fa32f53c8d84804439311e7d07afbb50ef))
- **redis-smq-rest-api:** update errors map, fix create queue test case issues ([131d020](https://github.com/weyoss/redis-smq/commit/131d020a71e9153591cb40b311f5cc8a1f9d255d))
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

- **redis-smq-common:** update tar to v7.5.7 to address security vulnerability ([fab495d](https://github.com/weyoss/redis-smq/commit/fab495d603efecb9fd9b6aef6259aadd1fdca4ce))
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

- **redis-smq-web-ui:** update orval to v8.0.3 to address security vulnerability ([d40af85](https://github.com/weyoss/redis-smq/commit/d40af85703c33e9772c0f25e6f35db1c3df100c1))
- **redis-smq:** fix build script to correctly copy lua files ([6fea887](https://github.com/weyoss/redis-smq/commit/6fea887f285a46adcf532f5cacb66380c86c329e))
- update pnpm-lock.yaml ([fb853f3](https://github.com/weyoss/redis-smq/commit/fb853f37e65b8b7286be6cbccb9394bcc3efcdff))
- update READMEs after merging 'v9.0.11' into 'next' ([055ab50](https://github.com/weyoss/redis-smq/commit/055ab50bd0096472c46f434c60c52ca59c157bc9))

### 📝 Documentation

- **redis-smq-common:** update API reference ([54ba6d2](https://github.com/weyoss/redis-smq/commit/54ba6d23f13304bcd6975281fe486e41af7d431f))
- **redis-smq:** update API reference ([511bc72](https://github.com/weyoss/redis-smq/commit/511bc72aee9f59e277fa90f9b869c14fdb32445c))
- **redis-smq:** update API reference ([d44b4ba](https://github.com/weyoss/redis-smq/commit/d44b4ba76052552f9c4bd28dd47a97660ba7e432))
- **redis-smq:** update RedisSMQ class API reference ([76fb06d](https://github.com/weyoss/redis-smq/commit/76fb06d8d9ad161cd9a3ca0fe247381ce3685b02))

### ♻️ Code Refactoring

- **redis-smq-common:** load workers recursively from a directory ([bfb869f](https://github.com/weyoss/redis-smq/commit/bfb869ff0999b2b3dd6078e13d431f6324368196))
- **redis-smq-common:** make RedisServer more resilient to startup and shutdown errors ([af9ecef](https://github.com/weyoss/redis-smq/commit/af9ecef9c55f54f654526d78bef6b271e6d524f5))
- **redis-smq-common:** mov lua scripts loading to a goingUp() procedure ([dd940ec](https://github.com/weyoss/redis-smq/commit/dd940ec928f4c9ff32441e16e4256b29c2275132))
- **redis-smq-common:** update API reference ([f2f33f0](https://github.com/weyoss/redis-smq/commit/f2f33f00bbf4d4811f64b3f0ff76ed0b853cdc3e))
- **redis-smq-rest-api:** update error mapping with new error classes ([6d849ef](https://github.com/weyoss/redis-smq/commit/6d849ef6fcda0e45d8b60ceacff8104df76ca365))
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

### 🚀 Chore

- fix CHANGELOG broken formatting ([168f84b](https://github.com/weyoss/redis-smq/commit/168f84b72f3ab1f0f991ad5addb7892b515ceb08))
- revert lerna replacement with lerna-lite ([96048d8](https://github.com/weyoss/redis-smq/commit/96048d858aa35a35998b8b411775ef4099e0ff5d))

## [9.0.11-next.1](https://github.com/weyoss/redis-smq/compare/v9.0.11-next.0...v9.0.11-next.1) (2026-01-22)

### 🚀 Chore

- replace lerna with lerna-lite due to security vulnerabilities in outdated tar package ([461d99e](https://github.com/weyoss/redis-smq/commit/461d99e))
- update lodash to v4.17.23 to address security vulnerabilities ([17bda3e](https://github.com/weyoss/redis-smq/commit/17bda3e))

### 📝 Documentation

- **redis-smq:** update API reference ([9e8595f](https://github.com/weyoss/redis-smq/commit/9e8595f))

### ♻️ Code Refactoring

- **redis-smq:** clean up and improve queue messages implementations ([513c4fa](https://github.com/weyoss/redis-smq/commit/513c4fa))

## [9.0.11-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.10-next.4...v9.0.11-next.0) (2026-01-22)

### 🚀 Chore

- continue updating packages to fix security vulnerabilities ([975c9a6](https://github.com/weyoss/redis-smq/commit/975c9a6eaf266b4d0799da9e2ae1b9d516b4a9bc))
- downgrade vitest to 3.2.4 due to incorrect code coverage results ([3c9b646](https://github.com/weyoss/redis-smq/commit/3c9b6468adade4a8676ab49717529e5ef4951ddb))
- remove redundant variables from README.template.md ([fe41c8e](https://github.com/weyoss/redis-smq/commit/fe41c8e6342567cb53ed48212c6df528e6e25fc5))
- update packages to latest versions to address security vulnerabilities ([157bad1](https://github.com/weyoss/redis-smq/commit/157bad181e14df398de93ba46c3eebf351383151))

### 📝 Documentation

- improve README files for clarity ([2f30700](https://github.com/weyoss/redis-smq/commit/2f3070058b07425825ae91bdce52bbb2f4aa50aa))
- improve table formatting in README.template.md ([c31f469](https://github.com/weyoss/redis-smq/commit/c31f469c70d7f028ba92c2ea0769cbc6d48269bb))
- **redis-smq-common:** update API reference ([ec6109e](https://github.com/weyoss/redis-smq/commit/ec6109e983be3f9ee22d927ff53bf2e935ed08e1))
- **redis-smq:** update API reference ([fbb2813](https://github.com/weyoss/redis-smq/commit/fbb2813540964d7860e49f60b8c1a477382b1d1e))

### ♻️ Code Refactoring

- **redis-smq-common:** add 'set' method to IRedisTransaction interface ([c2e138f](https://github.com/weyoss/redis-smq/commit/c2e138f5c50d861d2b42b673d4ca39fc5fd3d7f1))
- **redis-smq-rest-api:** rename queue to queueParams to correctly pass IQueueParsedParams ([3215f6e](https://github.com/weyoss/redis-smq/commit/3215f6ee856facbf07494ae184d68b79f93c66cf))
- **redis-smq-rest-api:** update error mapping ([c194240](https://github.com/weyoss/redis-smq/commit/c19424032f43331fddecf14b090f6bf427302349))
- **redis-smq:** clean up MessageBrowserAbstract and BrowserStorageAbstract implementations ([3fbea2c](https://github.com/weyoss/redis-smq/commit/3fbea2c97fabda7813fd728b6d0028610f81304d))
- **redis-smq:** implement background jobs for purge queue management ([23763ce](https://github.com/weyoss/redis-smq/commit/23763ce4ed0bbbf13548701e40e253eedc011799))

### ✅ Tests

- **redis-smq-rest-api:** fix purge messages test cases ([4080863](https://github.com/weyoss/redis-smq/commit/40808633a11324e957ccf04d1f5f693135790b5b))

## [9.0.10-next.4](https://github.com/weyoss/redis-smq/compare/v9.0.10-next.3...v9.0.10-next.4) (2026-01-16)

### 📝 Documentation

- adjust badges position to enhance page styling ([89309c6](https://github.com/weyoss/redis-smq/commit/89309c671d7e52265a4c6e0df4d6126e91b6e408))
- **redis-smq:** update Consumer and Producer references ([670ac78](https://github.com/weyoss/redis-smq/commit/670ac78de38b7a5803cf58f641efa7608a4c452d))
- refine notifications for master and next branch clarity ([e1e755e](https://github.com/weyoss/redis-smq/commit/e1e755e7086a98d4128ec3173c28056a8008acec))

### ♻️ Code Refactoring

- **redis-smq-common:** enhance class and type naming throughout codebase ([5ce50ed](https://github.com/weyoss/redis-smq/commit/5ce50edfcd7bfda18036569cc0c9b2946aec5620))
- **redis-smq:** update to new class and type names from redis-smq-common ([dcd5d8c](https://github.com/weyoss/redis-smq/commit/dcd5d8cc257e4b0abfe7ebcec9ff48409b00daad))

### ✅ Tests

- **redis-smq-benchmarks:** increase wait duration for benchmark results ([3080bd4](https://github.com/weyoss/redis-smq/commit/3080bd48938fc4495a9606bed4d76cd0a113a042))

## [9.0.10-next.3](https://github.com/weyoss/redis-smq/compare/v9.0.10-next.2...v9.0.10-next.3) (2026-01-16)

### 🐛 Bug Fixes

- **redis-smq-common:** resolve event emitter memory leak in piping, enhance worker architecture ([b5f21a0](https://github.com/weyoss/redis-smq/commit/b5f21a09a57979e50f3fa7501621aafe314ef7e9))
- **redis-smq:** wait for workers to be loaded before invoking callback ([a10b999](https://github.com/weyoss/redis-smq/commit/a10b999e6099e847f4f5c49edcb4130a37e1ec9d))

### ♻️ Code Refactoring

- **redis-smq-common:** add class-based support for worker threads ([bc6515c](https://github.com/weyoss/redis-smq/commit/bc6515c12a36727963f92476e60ab279eb4fb1f6))
- **redis-smq-common:** clean up WorkerResourceGroup.shutDownWorkers() method ([c06954a](https://github.com/weyoss/redis-smq/commit/c06954a3f396e010dd49a2f264f3001ff90f1d80))
- **redis-smq-common:** enhance Runnable base class implementation ([1e1717f](https://github.com/weyoss/redis-smq/commit/1e1717f3bba9f83f2d69fb2bdf9bda2ced03f3d3))
- **redis-smq:** make use of redis-smq-common latest updates ([af8c2cf](https://github.com/weyoss/redis-smq/commit/af8c2cf80ff954412082b7ca542b84aaa4c4c514))
- **redis-smq:** rename \_purgeMessages() to purgeMessages() ([3bd60f6](https://github.com/weyoss/redis-smq/commit/3bd60f6847c77faa05c00aad58856bbc4fbc372f))

### ✅ Tests

- **redis-smq-benchmark:** run benchmarks using 100 messages/10 consumers/5 producers ([4adccac](https://github.com/weyoss/redis-smq/commit/4adccac4820d03123bad2f0a170a9adef44dadc0))

## [9.0.10-next.2](https://github.com/weyoss/redis-smq/compare/v9.0.10-next.1...v9.0.10-next.2) (2026-01-10)

### 📝 Documentation

- **redis-smq-benchmarks:** remove unused heading ([b7f009d](https://github.com/weyoss/redis-smq/commit/b7f009d3d3dc71f72e193c12952a0481a66ce10c))

## [9.0.10-next.1](https://github.com/weyoss/redis-smq/compare/v9.0.10-next.0...v9.0.10-next.1) (2026-01-10)

### ♻️ Code Refactoring

- **redis-smq-benchmarks:** add npm and codecov badges to README ([fa3b7e7](https://github.com/weyoss/redis-smq/commit/fa3b7e79baa051e2547288513526cf0879b5045d))
- **redis-smq-benchmarks:** remove explicit process.exit() upon benchmark completion ([86a004a](https://github.com/weyoss/redis-smq/commit/86a004a4241c09631bf0ffc0132e32160462d854))

### ✅ Tests

- **redis-smq-benchmarks:** add tests to ensure functionality and reliability ([0db5db1](https://github.com/weyoss/redis-smq/commit/0db5db1e0be4e5f693f1b628a8dda830de82d45c))

## [9.0.10-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.9...v9.0.10-next.0) (2026-01-09)

### 🚀 Chore

- **redis-smq-benchmarks:** correct tag suffix in README template ([0d466a3](https://github.com/weyoss/redis-smq/commit/0d466a3eae3589086899611834eaa35c59ed8602))
- **redis-smq-web-server:** update express to v4.22.1 to address security vulnerability ([27c5b70](https://github.com/weyoss/redis-smq/commit/27c5b70724531a13fcbc4edfc77ca4cf3982f8e0))
- update READMEs after merging 'v9.0.9' into 'next' ([f463934](https://github.com/weyoss/redis-smq/commit/f463934b59b6196d231e5552402f449d2b986a25))

## [9.0.9](https://github.com/weyoss/redis-smq/compare/v9.0.9-next.5...v9.0.9) (2026-01-09)

### 🚀 Chore

- update READMEs after merging 'origin/next' into 'master' ([c046d46](https://github.com/weyoss/redis-smq/commit/c046d462c3c9ee32cda218cbbbf24a93f4cee829))

## [9.0.9-next.5](https://github.com/weyoss/redis-smq/compare/v9.0.9-next.4...v9.0.9-next.5) (2026-01-09)

### 🚀 Chore

- **redis-smq-benchmarks:** update copyright headers ([359ccd0](https://github.com/weyoss/redis-smq/commit/359ccd0f77b892356abc9e8850aecf8437c7b61f))

## [9.0.9-next.4](https://github.com/weyoss/redis-smq/compare/v9.0.9-next.3...v9.0.9-next.4) (2026-01-09)

### 🐛 Bug Fixes

- **redis-smq-benchmarks:** correct worker ID to be zero-based ([21a46c2](https://github.com/weyoss/redis-smq/commit/21a46c2ff46145e8870554d102f17f0f4743e667))

## [9.0.9-next.3](https://github.com/weyoss/redis-smq/compare/v9.0.9-next.2...v9.0.9-next.3) (2026-01-09)

### ♻️ Code Refactoring

- **redis-smq-benchmarks:** improve throughput calculation and benchmark result reporting ([f7b7000](https://github.com/weyoss/redis-smq/commit/f7b7000563f16e4271d792aeae25dc5c9e89db17))
- **redis-smq-benchmarks:** provide nanosecond-precision throughput measurements ([39a70d4](https://github.com/weyoss/redis-smq/commit/39a70d44f7e3f9aa3b5ec00a808858301fbdc798))
- **redis-smq-benchmarks:** use strong typing for thread messages, clean up ([02b7bdf](https://github.com/weyoss/redis-smq/commit/02b7bdfe5a1d7656fd50b0b151fa2b16f77273f6))

## [9.0.9-next.2](https://github.com/weyoss/redis-smq/compare/v9.0.9-next.1...v9.0.9-next.2) (2026-01-08)

### 🐛 Bug Fixes

- **redis-smq-benchmarks:** use correct redis config for non-dev environment ([eaae78d](https://github.com/weyoss/redis-smq/commit/eaae78dd2ad5f4b25835afadd61ccab3b15408c6))

## [9.0.9-next.1](https://github.com/weyoss/redis-smq/compare/v9.0.9-next.0...v9.0.9-next.1) (2026-01-08)

### 🐛 Bug Fixes

- **redis-smq-benchmarks:** make bin/cli.js executable ([3c1b013](https://github.com/weyoss/redis-smq/commit/3c1b0137259bc3d12ff82119cbf6695c894cd12f))

## [9.0.9-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.8...v9.0.9-next.0) (2026-01-08)

### 🐛 Bug Fixes

- **redis-smq-benchmarks:** update bin script name to match pkg name ([1ddaf79](https://github.com/weyoss/redis-smq/commit/1ddaf7921415640c4066d9b4bf72fab649be379c))
- **redis-smq-common:** include 'bin' directory in npm package ([b927668](https://github.com/weyoss/redis-smq/commit/b927668455b7290748831c2edcbd800acdd812d4))
- **redis-smq-rest-api:** include 'bin' directory in npm package ([3e52bdb](https://github.com/weyoss/redis-smq/commit/3e52bdbb58cc33302b8fdbda6ab6176ac2bc0bb1))

### 🚀 Chore

- update READMEs after merging 'v9.0.8' into 'next' ([be16380](https://github.com/weyoss/redis-smq/commit/be16380741ba4625d1469aa3cc9d6075ead70e6f))

### 📝 Documentation

- add link to benchmarking tool package in RedisSMQ ecosystem ([399a975](https://github.com/weyoss/redis-smq/commit/399a97561ac6c983bf843438d98cc45dd043df9c))
- **redis-smq-benchmarks:** fix installation command ([959413d](https://github.com/weyoss/redis-smq/commit/959413d0f45455343245c61d40b9b7d6dafdbeb5))
- **redis-smq-benchmarks:** update configuration default values ([5d97107](https://github.com/weyoss/redis-smq/commit/5d97107238be65d518a8e84f56fd8812a0a08752))
- **redis-smq:** update performance.md with a link to benchmarking tool ([00845c9](https://github.com/weyoss/redis-smq/commit/00845c905ba69ef9539a156571c43a366d98495d))

### ♻️ Code Refactoring

- **redis-smq-common:** enhance logger interface with child logger support ([94c2f84](https://github.com/weyoss/redis-smq/commit/94c2f8479d089f91fc714a5630f11a15894bf16e))
- **redis-smq:** improve logger context with hierarchical namespaces ([cb25c29](https://github.com/weyoss/redis-smq/commit/cb25c2982219e7d0f6e7f851225c7f3dbf321e83))

### ⚡ Performance Improvements

- **redis-smq-benchmarks:** add benchmarking tool to assess performance and throughput ([e82d39e](https://github.com/weyoss/redis-smq/commit/e82d39ef574d59e3a9e0c4666f6e31ce0a486ed6))

## [9.0.8](https://github.com/weyoss/redis-smq/compare/v9.0.8-next.0...v9.0.8) (2026-01-04)

### 🚀 Chore

- update READMEs after merging 'origin/next' into 'master' ([9250c21](https://github.com/weyoss/redis-smq/commit/9250c21f14bf0ee8f64db057ccaac091ba202891))

## [9.0.8-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.7-next.0...v9.0.8-next.0) (2026-01-03)

### 📝 Documentation

- fix markdown formatting and improve consistency ([0639c66](https://github.com/weyoss/redis-smq/commit/0639c668dfdca90e9542c599ef6bc57b6179dda2))

### ♻️ Code Refactoring

- consolidate linting into unified script ([c314a66](https://github.com/weyoss/redis-smq/commit/c314a66c113f510b6a2926054c8254e82ac41e74))

### 👷 Continuous Integration

- standardize quote style in GitHub issue templates ([d497a53](https://github.com/weyoss/redis-smq/commit/d497a530d1531111f0679d92ac2089629186e4c7))

## [9.0.7-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.6...v9.0.7-next.0) (2026-01-03)

### 🐛 Bug Fixes

- **redis-smq:** delete specific namespace queues when deleting a ns ([0da3de2](https://github.com/weyoss/redis-smq/commit/0da3de2ad35439f98fcde8be6070019f88b1800c))
- **redis-smq:** validate queue delivery model before deleting a consumerGroupId ([725f10f](https://github.com/weyoss/redis-smq/commit/725f10f50cb8dfab5449dab2fffb21510dd9db03))

### 🚀 Chore

- update READMEs after merging 'v9.0.6' into 'next' ([d73c0e3](https://github.com/weyoss/redis-smq/commit/d73c0e336134566b7342fa23029cb78c28952d71))

### 📝 Documentation

- **redis-smq:** update class refs ([e9b5433](https://github.com/weyoss/redis-smq/commit/e9b5433fe8cc3ad587b33e913772ed911085f28f))

### ♻️ Code Refactoring

- **redis-smq-common:** enhance error system with structured errors ([e64f068](https://github.com/weyoss/redis-smq/commit/e64f06801db2e477f678d34b3e5853fc5be19c73))
- **redis-smq-rest-api:** use structured errors ([7da628f](https://github.com/weyoss/redis-smq/commit/7da628f897b91b32f312095077f8e27288dc0ee0))
- **redis-smq:** optimize imports ([cf6944f](https://github.com/weyoss/redis-smq/commit/cf6944f20094f9a57a8b7be0d28adff735cfb986))
- **redis-smq:** shorten imports ([03bff14](https://github.com/weyoss/redis-smq/commit/03bff146a3b6f76900eb99b0c46cd26a058dec06))
- **redis-smq:** use EventMultiplexer instead of EventBus ([0addf13](https://github.com/weyoss/redis-smq/commit/0addf1372d08b68382ca38282c5551c998bf0371))
- **redis-smq:** use structured errors ([fd45033](https://github.com/weyoss/redis-smq/commit/fd45033169fc5c693e8b7ca8ed61e043ec7002b1))

## [9.0.6](https://github.com/weyoss/redis-smq/compare/v9.0.6-next.2...v9.0.6) (2025-12-27)

### 🚀 Chore

- update READMEs after merging 'origin/next' into 'master' ([173e226](https://github.com/weyoss/redis-smq/commit/173e2262de8da26d86b366c6edd94e166a092445))

## [9.0.6-next.2](https://github.com/weyoss/redis-smq/compare/v9.0.6-next.1...v9.0.6-next.2) (2025-12-26)

### 📝 Documentation

- **redis-smq-common:** update class EventBus/EventBusRedis refs ([5a847df](https://github.com/weyoss/redis-smq/commit/5a847dfc40b7d623035f079d476122632d81e0fd))
- **redis-smq:** update class refs ([698d620](https://github.com/weyoss/redis-smq/commit/698d6209ac9bbe214c2aa36d147e78f34c392c71))

### ♻️ Code Refactoring

- **redis-smq-common:** add namespace support to EventBus classes ([bb455f9](https://github.com/weyoss/redis-smq/commit/bb455f96685f02fd10e2a126487f3750524bd0fc))
- **redis-smq-rest-api:** sync codebase with recent redis-smq updates ([be1ff92](https://github.com/weyoss/redis-smq/commit/be1ff928610772a0a5302484e7a8c58c3a8d7301))
- **redis-smq:** introduce InternalEventBus for system communication ([a4fa5a9](https://github.com/weyoss/redis-smq/commit/a4fa5a9d6c6d63d19c55cd8f170cd326562c6a3c))

### ✅ Tests

- **redis-smq-common:** add test for EventBus custom namespace usage ([3f736aa](https://github.com/weyoss/redis-smq/commit/3f736aaf7e7bdb191a15f80bb97b7e65d80cdcf5))

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

- **redis-smq-rest-api:** include ConsumerSetMismatchError in error list map ([91a8dfb](https://github.com/weyoss/redis-smq/commit/91a8dfb9a62eef2bb32a72e2ac3d94f80fdb02f8))
- **redis-smq:** do not pollute log with redundant debug info ([e7c063b](https://github.com/weyoss/redis-smq/commit/e7c063be170071c6bc1d37c88477788edc72ac23))
- **redis-smq:** make use of consumer context ([62da2f0](https://github.com/weyoss/redis-smq/commit/62da2f077b60be6753fc627a9999dc0b072a639a))
- **redis-smq:** migrate the queue deletion logic to LUA ([4b7c9d5](https://github.com/weyoss/redis-smq/commit/4b7c9d5c0b7ae667dfcd937aa74bc49e6b278040))
- **redis-smq:** update getQueueKeys() to accept ns and name as args ([a147858](https://github.com/weyoss/redis-smq/commit/a14785859c93465a43bed1d08c085cce3349b5d3))

### ✅ Tests

- **redis-smq-common:** test async.series() error handling ([53a53d7](https://github.com/weyoss/redis-smq/commit/53a53d7149b6ece2799155ba75bb3d1058b79f99))
- **redis-smq:** cover edge cases in queue deletion errors ([6253a06](https://github.com/weyoss/redis-smq/commit/6253a06be798d9a176dd99883edba885684b4fe6))
- **redis-smq:** simplify namespace deleting test case ([9792ecb](https://github.com/weyoss/redis-smq/commit/9792ecba98c4f91274232438d69f64f014afb0e4))

## [9.0.5](https://github.com/weyoss/redis-smq/compare/v9.0.5-next.1...v9.0.5) (2025-12-15)

### 🚀 Chore

- update READMEs after merging 'next' into 'master' ([75334e3a](https://github.com/weyoss/redis-smq/commit/75334e3a337363ef8d949f4740887f6817d5cd18))

## [9.0.5-next.1](https://github.com/weyoss/redis-smq/compare/v9.0.5-next.0...v9.0.5-next.1) (2025-12-14)

### 🚀 Chore

- update copyright email address in LICENSE ([75fdb62](https://github.com/weyoss/redis-smq/commit/75fdb62b9a42553ecf7907d714c569b30e2719d2))

### 📝 Documentation

- **redis-smq-common:** improve formatting ([4eb04af](https://github.com/weyoss/redis-smq/commit/4eb04af18ce77effb252aef5d72d7cdc26472922))
- **redis-smq:** update API reference for MessageBrowser ([ef73e83](https://github.com/weyoss/redis-smq/commit/ef73e83868b4f8a42b5b8dbcbb19729e4eef20a8))

### ♻️ Code Refactoring

- **redis-smq-rest-api:** adopt IBrowserPage type from redis-smq ([3f5cb3a](https://github.com/weyoss/redis-smq/commit/3f5cb3acd715f6e8d2911fe138c720e0947c9768))
- **redis-smq:** introduce MessageBrowser for message listing logic ([0d5e2a6](https://github.com/weyoss/redis-smq/commit/0d5e2a6377684bb80a67edca99222811f19ac0a7))
- **redis-smq:** remove invalid 'instanceof' check ([ee66142](https://github.com/weyoss/redis-smq/commit/ee6614249e253281e4e4335c42d71c589ab96765))

## [9.0.5-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.4...v9.0.5-next.0) (2025-12-04)

### 🐛 Bug Fixes

- **redis-smq:** fail when acked message audit is not enabled ([cf75fa2](https://github.com/weyoss/redis-smq/commit/cf75fa2d4c08f07333863813a56404db0b524d54))
- **redis-smq:** fail when unacked message audit is not enabled ([f91b759](https://github.com/weyoss/redis-smq/commit/f91b7598109aacb903f6fef7b5cec2d63d26f89c))

### 🚀 Chore

- update READMEs after merging 'v9.0.4' into 'next' ([f899525](https://github.com/weyoss/redis-smq/commit/f899525ff2a689e5189fa61e4a39829b4694f513))

### 📝 Documentation

- **redis-smq-common:** update API reference ([a4e02cb](https://github.com/weyoss/redis-smq/commit/a4e02cba6b26a325cee839d7a309801448ba0b27))
- **redis-smq:** improve code examples ([f104c67](https://github.com/weyoss/redis-smq/commit/f104c678f0d82d239e484937cf8dce0600731179))
- **redis-smq:** remove unused import ([7d3205e](https://github.com/weyoss/redis-smq/commit/7d3205ecb3436ee66fe5566cccb60cbab7907401))
- **redis-smq:** update API reference ([3346bba](https://github.com/weyoss/redis-smq/commit/3346bbaa9909e8f6e6c08755a24c0fca800a425c))

### ♻️ Code Refactoring

- **redis-smq-rest-api:** add new error classes ([8d2dd31](https://github.com/weyoss/redis-smq/commit/8d2dd31c137b70b83e66febe7be68d2ff72e43e2))
- **redis-smq-web-ui:** consolidate acked messages configuration logic ([a989713](https://github.com/weyoss/redis-smq/commit/a98971386c3b05b9bb94beb6b39a98051e22a590))
- **redis-smq-web-ui:** consolidate dl messages configuration logic ([f4aaabb](https://github.com/weyoss/redis-smq/commit/f4aaabbbc0b76e5e13777e0c31e296b86675168a))

### ✅ Tests

- **redis-smq:** update tests to expect audit errors when audit is disabled ([eeffebb](https://github.com/weyoss/redis-smq/commit/eeffebbe12f3f0f87d675b5c1f0b8c49b7ba461c))

## [9.0.4](https://github.com/weyoss/redis-smq/compare/v9.0.4-next.0...v9.0.4) (2025-11-13)

### 🚀 Chore

- update READMEs after merging 'origin/next' into 'master' ([f2dfdb8](https://github.com/weyoss/redis-smq/commit/f2dfdb8bfe73e1b04c47f5931fbcd9ca2f6596c3))

## [9.0.4-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.3...v9.0.4-next.0) (2025-11-11)

### 🚀 Chore

- update READMEs after merging 'v9.0.3' into 'next' ([d973314](https://github.com/weyoss/redis-smq/commit/d973314abddc2a5497b53b7a8e1ab3fdf785ebae))

### ♻️ Code Refactoring

- **redis-smq:** expand IRedisClient with additional Redis operations ([25c9f7f](https://github.com/weyoss/redis-smq/commit/25c9f7fa8d03c5a0171ee8758640ede5f881c983))
- **redis-smq:** improve MultiplexedMessageHandlerRunner scheduling ([d5bccbc](https://github.com/weyoss/redis-smq/commit/d5bccbc573a6d41919dbe7afc4e7044df86c6f29))
- **redis-smq:** improve queue comparison logic ([ef406a9](https://github.com/weyoss/redis-smq/commit/ef406a9d599da1abbb02bb4095d5904f57cd97ef))
- **redis-smq:** rename tickIntervalMs to multiplexingTickIntervalMs ([1e3b8d8](https://github.com/weyoss/redis-smq/commit/1e3b8d80652c843787c40ceea72e73336167bacf))

### ⚡ Performance Improvements

- **redis-smq:** avoid N+1 query problem by using isConsumerListAlive ([b168396](https://github.com/weyoss/redis-smq/commit/b16839686e3da4dcef7c65a6c6bdaa6ea6f2278f))

### ✅ Tests

- **redis-smq-common:** make scan operation tests more flexible ([4aa1115](https://github.com/weyoss/redis-smq/commit/4aa1115aab0deacd3c6e0e0f6a5397e65f35d911))

## [9.0.3](https://github.com/weyoss/redis-smq/compare/v9.0.3-next.1...v9.0.3) (2025-11-10)

### 🚀 Chore

- update READMEs after merging 'origin/next' into 'master' ([45472c2](https://github.com/weyoss/redis-smq/commit/45472c2cb1bec7c76fc2dd6db6449ed1a34f43cf))

## [9.0.3-next.1](https://github.com/weyoss/redis-smq/compare/v9.0.3-next.0...v9.0.3-next.1) (2025-11-10)

### 🐛 Bug Fixes

- **redis-smq:** handle gracefully message checkout race condition ([fcdfb1b](https://github.com/weyoss/redis-smq/commit/fcdfb1b4bdf380ce5bbc3a3bb1f8f936715c81aa))

### ♻️ Code Refactoring

- improve post-merge hook with dynamic commit messages ([c3cbcab](https://github.com/weyoss/redis-smq/commit/c3cbcab1163823d3b50af1c80efa12c2739e7ad4))
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

### 🐛 Bug Fixes

- update deps to resolve security vulnerabilities ([eeec75f](https://github.com/weyoss/redis-smq/commit/eeec75fdb7813a05dabc332185416a1377c6e7dd))

### 📝 Documentation

- add v9 release notes and upgrade notice to README ([8ebfebf](https://github.com/weyoss/redis-smq/commit/8ebfebf2567d56009dfbf7aeedbdf5a3dff3e3ce))
- update npm badge links to point to GitHub releases ([c6421ac](https://github.com/weyoss/redis-smq/commit/c6421acacfce4aec3950357e5e7543cda7c495c5))

## [9.0.2-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.1...v9.0.2-next.0) (2025-11-08)

### 🚀 Chore

- update copyright header ([fa3716d](https://github.com/weyoss/redis-smq/commit/fa3716dce96c20b55f77105e5bd801fd1a496650))

### ✅ Tests

- rename test_workspace_esm.sh to test-workspace-esm.sh ([8e22339](https://github.com/weyoss/redis-smq/commit/8e22339cf87b3abc3fe71ac61fd9d93a9e8be869))

### 📦‍ Build System

- automate README.md files update ([7d4811f](https://github.com/weyoss/redis-smq/commit/7d4811f3d152feb7cb98298513425a2e0b1baf01))

## [9.0.1](https://github.com/weyoss/redis-smq/compare/v9.0.0...v9.0.1) (2025-11-07)

### 📝 Documentation

- **redis-smq:** do not include preleases for release badge ([6e63299](https://github.com/weyoss/redis-smq/commit/6e632991009a490ab751510de988981963656966))
- update install commands to use [@latest](https://github.com/latest) instead of [@next](https://github.com/next) ([07f2109](https://github.com/weyoss/redis-smq/commit/07f2109455120d8d314e594e6b3f35d0460e7c1d))
- update README files for release v9 ([805886d](https://github.com/weyoss/redis-smq/commit/805886d41212b28eb537796c12f736fe9202e014))

### 📦‍ Build System

- preserve README versions during merges ([9b06515](https://github.com/weyoss/redis-smq/commit/9b065159f8f90d2648a9440d7f5da524dc00846c))

## [9.0.0](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.18...v9.0.0) (2025-11-07)

**Note:** Version bump only for package root

## [9.0.0-next.18](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.17...v9.0.0-next.18) (2025-11-07)

### 📝 Documentation

- convert relative paths to absolute URLs in package READMEs ([1da8173](https://github.com/weyoss/redis-smq/commit/1da817349fed106e0551fdb069321609cc373c8c))
- **redis-smq-web-ui:** fix screenshot URL to use raw GitHub content ([8f597c6](https://github.com/weyoss/redis-smq/commit/8f597c604978779f0b57b405f88b5c5d16b52307))

## [9.0.0-next.17](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.16...v9.0.0-next.17) (2025-11-07)

### ⚠ BREAKING CHANGES

- **redis-smq-web-server:** remove apiServer from IRedisSMQWebServerConfig

### 📝 Documentation

- **redis-smq-common:** restructure README, move details to separate files ([08c3605](https://github.com/weyoss/redis-smq/commit/08c3605380ce58af1a33833216d02187411a5521))
- **redis-smq-rest-api:** restructure README, move details to separate files ([faa4157](https://github.com/weyoss/redis-smq/commit/faa4157cbfc2c8699d1fb7e830f4bb881126d075))
- **redis-smq-web-server:** restructure README, move details to separate files ([89a5aae](https://github.com/weyoss/redis-smq/commit/89a5aaed3cca3153f0e0dad1eb2a3fd0f1a71e51))
- **redis-smq-web-ui:** restructure README, move details to separate files ([8f63c84](https://github.com/weyoss/redis-smq/commit/8f63c8458ca1940d0029edac643d161d9c55f7de))
- **redis-smq:** improve classes/interfaces formatting ([7d9fd74](https://github.com/weyoss/redis-smq/commit/7d9fd740718a9208ec4df8c6a6350beca1fba8ee))
- standardize documentation links to use relative paths ([56f25b2](https://github.com/weyoss/redis-smq/commit/56f25b2dfff77708bb99c94f9d3f72caa6b1105b))

### ♻️ Code Refactoring

- **redis-smq-web-server:** remove apiServer from IRedisSMQWebServerConfig ([781e154](https://github.com/weyoss/redis-smq/commit/781e15433afc88190937fd5d3707f1b27e186c2c))
- **redis-smq-web-ui:** improve message audit disabled alert text clarity ([09bac5d](https://github.com/weyoss/redis-smq/commit/09bac5dadd07414fcb84a0568fefbf02dd6ca628))
- **redis-smq-web-ui:** remove unused custom-fetch.ts ([f19b1ec](https://github.com/weyoss/redis-smq/commit/f19b1ec72d55fc240205538180f33540fd5bf4f9))

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

- **redis-smq-rest-api:** remove QueueExplorerError from API error list ([9a0fa15](https://github.com/weyoss/redis-smq/commit/9a0fa15ce151d9c2c67396232a634c8eab32b3e4))
- **redis-smq:** rename QueueExplorer to QueueMessagesAbstract ([7c97a1e](https://github.com/weyoss/redis-smq/commit/7c97a1e089da3ae89b63e87dc0e0534151f09faa))
- **redis-smq:** rename QueueStorage to QueueStorageAbstract ([e30cb5e](https://github.com/weyoss/redis-smq/commit/e30cb5e17536e79b2ac070be2123fd0f1a7f6b28))

## [9.0.0-next.15](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.14...v9.0.0-next.15) (2025-10-31)

### ⚠ BREAKING CHANGES

- **redis-smq:** improve message audit configuration and parsing logic

### 📝 Documentation

- **redis-smq-web-server:** add reverse proxy deployment guide ([365d643](https://github.com/weyoss/redis-smq/commit/365d6436321e2aae7dcb3147c714e4c2b0c394ef))
- **redis-smq:** update message audit related documentation and api ([d17ac49](https://github.com/weyoss/redis-smq/commit/d17ac49036468aa97cd4934683b3718e415f63e3))

### ♻️ Code Refactoring

- **redis-smq-rest-api:** update message audit config and error classes ([f490cac](https://github.com/weyoss/redis-smq/commit/f490cac51b73637301c6e3ee9a73ec0730cfc6b9))
- **redis-smq-web-ui:** update message audit configuration handling ([9c43a4f](https://github.com/weyoss/redis-smq/commit/9c43a4f524daf2eb07e6a40b8671da6eea6f7ba4))
- **redis-smq:** improve message audit configuration and parsing logic ([5c0cf9a](https://github.com/weyoss/redis-smq/commit/5c0cf9a67b6494e633cd18cf7f99546ddb2a97ba))

### ✅ Tests

- **redis-smq-rest-api:** fix expected configuration object keys ([5dfd409](https://github.com/weyoss/redis-smq/commit/5dfd409a3ddfd1f7ca3677d88112b5399f95ce6d))

## [9.0.0-next.14](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.13...v9.0.0-next.14) (2025-10-28)

### ⚠ BREAKING CHANGES

- **redis-smq-web-server:** fix base path routing and improve middleware setup
- **redis-smq-rest-api:** reorganize Swagger UI routing

### 🐛 Bug Fixes

- **redis-smq-web-server:** fix base path routing and improve middleware setup ([daf200a](https://github.com/weyoss/redis-smq/commit/daf200ad0e11cba198da324ef8d6f0b4a9a4ad5e))
- **redis-smq-web-ui:** fix base path handling ([6cd2999](https://github.com/weyoss/redis-smq/commit/6cd29994a85a198772e4c71da9a154c5b7531fdd))

### ♻️ Code Refactoring

- **redis-smq-rest-api:** reorganize Swagger UI routing ([5278bda](https://github.com/weyoss/redis-smq/commit/5278bda865d15aa5b6c20ef2457a83b2bcdd8c0a))

## [9.0.0-next.13](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.12...v9.0.0-next.13) (2025-10-28)

### 🐛 Bug Fixes

- **redis-smq-web-server:** ensure API server inherits correct base path configuration ([e184dbd](https://github.com/weyoss/redis-smq/commit/e184dbd34ae0790daa8e9f13df237ed2b415de66))

### 🚀 Chore

- **redis-smq-rest-api:** fix security vulnerabilities by upgrading koa to v3.1.1 ([0ee4285](https://github.com/weyoss/redis-smq/commit/0ee4285fed1ab398609d964fbed9af373553b735))

### 📝 Documentation

- **redis-smq-web-server:** update apiProxyTarget notes ([073e49f](https://github.com/weyoss/redis-smq/commit/073e49f529616e0f8067ae7dbbc3b1265694209f))

## [9.0.0-next.12](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.11...v9.0.0-next.12) (2025-10-27)

### 🚀 Chore

- add copyright headers to source files ([8cf3331](https://github.com/weyoss/redis-smq/commit/8cf333150129aabd91b68204cf0eca428888efc7))

### 📝 Documentation

- fix license section formatting and standardize project names ([9752491](https://github.com/weyoss/redis-smq/commit/9752491d72f19a5b470f95f6afb79bdb132b78f2))

## [9.0.0-next.11](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.10...v9.0.0-next.11) (2025-10-27)

### 🐛 Bug Fixes

- correct codecov badge URL format ([2b9e3f0](https://github.com/weyoss/redis-smq/commit/2b9e3f09d923d6e2310ef447bc1be60180af200d))

### ✅ Tests

- **redis-smq-web-server:** add CLI and API proxy e2e tests ([76e938e](https://github.com/weyoss/redis-smq/commit/76e938e769331aeeb290f6c670bb550af152cdea))

## [9.0.0-next.10](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.9...v9.0.0-next.10) (2025-10-26)

### 🐛 Bug Fixes

- **redis-smq-rest-api:** add missing RoutingKeyRequiredError to error mappings ([0ed55de](https://github.com/weyoss/redis-smq/commit/0ed55de5871248f0671e85d5b9c56bf1db5d84ab))
- **redis-smq-web-server:** add rate limiting middleware to prevent DoS attacks ([69020d6](https://github.com/weyoss/redis-smq/commit/69020d6a4f50e6b1b1ddff886521d1095df7caa5))
- **redis-smq-web-server:** improve base path handling and routing logic ([d4ef03a](https://github.com/weyoss/redis-smq/commit/d4ef03a9ecd7b93debd2637e8c36746de46363ca))
- **redis-smq-web-ui:** handle correctly base path ([ed53bc0](https://github.com/weyoss/redis-smq/commit/ed53bc0c6a21caf07d202e9ac96c7ec09dbf1195))

### 🚀 Chore

- **redis-smq-web-ui:** upgrade playwright to version 1.56.1 ([0734efd](https://github.com/weyoss/redis-smq/commit/0734efdcb35914d9020507305a4c85c08e9b40e2))
- **redis-smq-web-ui:** upgrade vite to version 7.1.12 ([59b67eb](https://github.com/weyoss/redis-smq/commit/59b67eb6afdb07acf45afe5d29e29d51fad93c48))

### 📝 Documentation

- **redis-smq-web-server:** add npm version/code coverage badges ([9cdfc56](https://github.com/weyoss/redis-smq/commit/9cdfc56bc75a3b6372db3646f9bf280371b0c271))

### ✅ Tests

- **redis-smq-web-server:** add comprehensive E2E test suite ([1407e75](https://github.com/weyoss/redis-smq/commit/1407e75f5139b59ae5c292a94aa5d79118a0de84))

## [9.0.0-next.9](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.8...v9.0.0-next.9) (2025-10-21)

### 🐛 Bug Fixes

- **redis-smq:** add missing RoutingKeyRequiredError class ([8d1aeb1](https://github.com/weyoss/redis-smq/commit/8d1aeb1fb8cfab2e689a550a08f368620eba4a3a))

### 📝 Documentation

- **redis-smq-common:** standardize markdown formatting in API documentation ([7509e66](https://github.com/weyoss/redis-smq/commit/7509e662c5ff8e04fa9c53deaa8696ebdbebc1d8))
- **redis-smq:** update documentation and improve md formatting ([8aaaead](https://github.com/weyoss/redis-smq/commit/8aaaead0280784ee37fac4a4f746a9e947608eb6))

### ♻️ Code Refactoring

- **redis-smq:** rename QueueConsumerGroupsCache to PubSubTargetResolver, clean up Producer docs ([67a6be3](https://github.com/weyoss/redis-smq/commit/67a6be329bcaec7304eca8b866f48d90cbb72f81))

## [9.0.0-next.8](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.7...v9.0.0-next.8) (2025-10-18)

### ✨ Features

- **redis-smq:** make consumerGroupId optional for PubSub queue consumers ([84daeec](https://github.com/weyoss/redis-smq/commit/84daeec701e3cbdd4059c901ed757763b4b35e90))

### 🐛 Bug Fixes

- **redis-smq-web-ui:** make loading screen responsive with fluid scaling ([8c62840](https://github.com/weyoss/redis-smq/commit/8c6284069be1fbf67554752e4fee9c159a65965b))
- **redis-smq-web-ui:** offer to create the first queue only when no queues exist ([5d0e276](https://github.com/weyoss/redis-smq/commit/5d0e2763cd2b6a8e7898029f8e4d2216fb23a3a3))
- **redis-smq:** check consumer group existence when relevant ([86df3d6](https://github.com/weyoss/redis-smq/commit/86df3d60187612efa0a8af89a5c201d6604f7c03))

### 📝 Documentation

- **redis-smq-web-ui:** update README screenshot to home view ([8591bb2](https://github.com/weyoss/redis-smq/commit/8591bb27086e4865f2caa54dce3ff64320d9e96b))
- **redis-smq:** clarify consumer group behavior for PubSub queues ([de1d4ce](https://github.com/weyoss/redis-smq/commit/de1d4cef6154273051898248e89e408bd142bb2d))

### ♻️ Code Refactoring

- **redis-smq-web-ui:** integrate CreateQueueModal into HomeView, simplify dashboard ([9bbbda4](https://github.com/weyoss/redis-smq/commit/9bbbda4fbade19b00b6fc584fbb1ec98babfe2ef))
- **redis-smq-web-ui:** make CreateQueueModal self-contained ([0ddd363](https://github.com/weyoss/redis-smq/commit/0ddd36369cf08e0ebe7b2d8f77ca73746e0d3916))

## [9.0.0-next.7](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.6...v9.0.0-next.7) (2025-10-13)

### 📝 Documentation

- **redis-smq-web-ui:** update web ui screenshot ([e5447d6](https://github.com/weyoss/redis-smq/commit/e5447d69c6512130cdc968d81ac015cad7d361ce))

### ♻️ Code Refactoring

- **redis-smq-web-ui:** extract ClearRateLimitConfirmationModal component ([57d625d](https://github.com/weyoss/redis-smq/commit/57d625dcca0d5f4055ee44de102571fb3b8ce8ec))
- **redis-smq-web-ui:** unify queue display format to name@namespace ([245c791](https://github.com/weyoss/redis-smq/commit/245c79167ac3e08aa027a12e9365cca5835a125b))

## [9.0.0-next.6](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.5...v9.0.0-next.6) (2025-10-13)

### ✨ Features

- **redis-smq-web-ui:** add notification for exchange deletion with bound queues ([91a63e5](https://github.com/weyoss/redis-smq/commit/91a63e57c3068ffc08f7fa3c7a484ff08dad35c3))
- **redis-smq-web-ui:** add unified DeleteExchangeModal for all exchange types ([eaca121](https://github.com/weyoss/redis-smq/commit/eaca1211d168ef0507cb202995ec13e1fc71fb89))

### ♻️ Code Refactoring

- **redis-smq-web-ui:** remove unused DeleteFanoutExchangeModal ([0adcf62](https://github.com/weyoss/redis-smq/commit/0adcf62e5bbb4870b892cdcc2a4e940a4cde4f6a))

## [9.0.0-next.5](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.4...v9.0.0-next.5) (2025-10-12)

### ✨ Features

- **redis-smq-rest-api:** add configuration endpoint ([35bdb00](https://github.com/weyoss/redis-smq/commit/35bdb00b12d7066613b0866f8bc22d56246484be))
- **redis-smq-web-ui:** improve mobile experience ([315cd4a](https://github.com/weyoss/redis-smq/commit/315cd4a0d33f5218ce27cb3f7f9cef1f0d1aed44))
- **redis-smq-web-ui:** notify about disabled message storage for ack/dl messages ([de749da](https://github.com/weyoss/redis-smq/commit/de749da6905713a02c885c20a5a1828fabc33643))

### 🐛 Bug Fixes

- **redis-smq-web-ui:** fix sudden CreateExchangeModal closure ([3cf1d98](https://github.com/weyoss/redis-smq/commit/3cf1d989cf160ce2d9b650d0ed84b83d1e2652ac))

### 🚀 Chore

- add gitattributes for README merge strategy ([a007b1f](https://github.com/weyoss/redis-smq/commit/a007b1f7bfbcd7bbd92856fd89cefddbe4da73e7))
- improve lint-staged configuration for better file type handling ([4913759](https://github.com/weyoss/redis-smq/commit/4913759dff07a159274ccc7d0259343d8396466a))
- **redis-smq-rest-api:** update dependencies to latest versions ([47c738d](https://github.com/weyoss/redis-smq/commit/47c738de6fe43dc0d8cfa751c4cb28d8a715e7e2))
- **redis-smq-web-server:** update dependencies to latest versions ([ee58105](https://github.com/weyoss/redis-smq/commit/ee5810556a7ae708ecdb070fb80340994b27ba22))
- **redis-smq-web-ui:** update dependencies to latest versions ([fd5406e](https://github.com/weyoss/redis-smq/commit/fd5406e3591f1d818a358aafe43ff87820f103d0))
- **redis-smq:** update dependencies to latest versions ([552621a](https://github.com/weyoss/redis-smq/commit/552621a006e5925491ceebf4e7fe79179efb9f38))
- update dependencies to latest versions ([0415585](https://github.com/weyoss/redis-smq/commit/0415585e8bcf0d42cb8eb637581d42ab18379ae2))
- update GitHub workflows to include next branch ([91f8eaa](https://github.com/weyoss/redis-smq/commit/91f8eaa0702da18fa7365afa4ae0d9b2bb53e106))

### 📝 Documentation

- add GitHub note callouts in README files ([4c42582](https://github.com/weyoss/redis-smq/commit/4c42582dbfa3349a3d414a39a1f41a1e372913c0))
- fix master branch README link ([0d59c3a](https://github.com/weyoss/redis-smq/commit/0d59c3a6eccc2c055cb0bc0ddfa26146b764b262))
- fix navigation breadcrumb ([ea920dd](https://github.com/weyoss/redis-smq/commit/ea920ddd8c5934db4c534d2a8828bef822636f01))
- **redis-smq-common:** update docs and clean up ([6e21508](https://github.com/weyoss/redis-smq/commit/6e21508c6cf3c0ab868a4637b82bd5707bc406bb))
- **redis-smq-web-ui:** fix license statement ([0ee3958](https://github.com/weyoss/redis-smq/commit/0ee395850bb7f6ae532e021e031a686d68eb2497))
- **redis-smq-web-ui:** improve README clarity and structure ([ec48893](https://github.com/weyoss/redis-smq/commit/ec4889347558e71fce7a4adc774f16a5da5dd135))
- **redis-smq:** update docs and clean up ([f7a75c9](https://github.com/weyoss/redis-smq/commit/f7a75c9109032f530049714c0ef2ffed537a76a4))
- standardize "next" branch reference ([ba24b3b](https://github.com/weyoss/redis-smq/commit/ba24b3bac54af4c2658699e0866c27bec4febdfc))
- streamline and improve documentation structure and readability ([b773260](https://github.com/weyoss/redis-smq/commit/b773260955bb77b820c5a343ab15837657b42f3d))
- update README files for next branch with pre-release badges and doc links ([005ccf4](https://github.com/weyoss/redis-smq/commit/005ccf411df460984615a4101b385a2d8023dab5))

### ♻️ Code Refactoring

- **redis-smq-common:** upgrade node-redis client to v5 ([82a0171](https://github.com/weyoss/redis-smq/commit/82a0171171240d526e45f7991c71cca2a8f66683))
- **redis-smq-web-ui:** migrate scripts utils to use RedisSMQ class ([b4c9952](https://github.com/weyoss/redis-smq/commit/b4c995261523778a4145c150fddd841b95d0a1fc))
- **redis-smq-web-ui:** remove unused CreateFanoutExchangeModal ([ffae0c8](https://github.com/weyoss/redis-smq/commit/ffae0c86206d60482dea0039042abdd4cfbcf4c8))
- **redis-smq-web-ui:** reorder navigation menu items ([ed07519](https://github.com/weyoss/redis-smq/commit/ed07519505ff8aa5f5270e7814aa644aaa5dec46))

## [9.0.0-next.4](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.3...v9.0.0-next.4) (2025-10-09)

### ⚠ BREAKING CHANGES

- **redis-smq-rest-api:** add exchange API endpoints for direct, fanout, and topic exchanges
- **redis-smq:** modernize exchange system with unified API and enhanced routing
- **redis-smq-common:** consolidate Redis client creation logic into factory class
- **redis-smq-common:** simplify logger architecture, improve namespace handling

### ✨ Features

- **redis-smq-common:** add child logger creation ([ee2d70d](https://github.com/weyoss/redis-smq/commit/ee2d70d68645a48612270033046855c975cffb9b))
- **redis-smq-common:** add WATCH/MULTI/EXEC transaction helper with retry logic ([60f3ef9](https://github.com/weyoss/redis-smq/commit/60f3ef929f77cc68d73848c05b98b386ed099594))
- **redis-smq-rest-api:** add exchange API endpoints for direct, fanout, and topic exchanges ([47ed7b6](https://github.com/weyoss/redis-smq/commit/47ed7b64115d3ef85e41ad5b4dce84303854ca06))
- **redis-smq-rest-api:** add GET endpoint for namespace exchanges ([c351f9c](https://github.com/weyoss/redis-smq/commit/c351f9c3698fb36e561fcf61762352d6c2addf3b))
- **redis-smq-web-ui:** add exchange management system ([c147aa8](https://github.com/weyoss/redis-smq/commit/c147aa82972f103d2760c5793db29518cc09fd04))
- **redis-smq:** add create method to exchange implementations ([f5285a2](https://github.com/weyoss/redis-smq/commit/f5285a2f3af1800c6d98a87681378e9bae3b3279))
- **redis-smq:** add factory methods for exchange types ([dd024a4](https://github.com/weyoss/redis-smq/commit/dd024a49064087ec1efc333cb9f8f10b6b085b2a))
- **redis-smq:** implement simplified API,connection pooling,and reorganize architecture ([9fca6b0](https://github.com/weyoss/redis-smq/commit/9fca6b0ed06ac533a712d0f6e997d72fa8f2d3de))
- **redis-smq:** modernize exchange system with unified API and enhanced routing ([7f659e0](https://github.com/weyoss/redis-smq/commit/7f659e0a31c4bc2f1ab19376c1d3e6a297d0d507))

### 🐛 Bug Fixes

- **redis-smq-web-ui:** fix error message reference ([d4947ab](https://github.com/weyoss/redis-smq/commit/d4947ab3573d0a67d0d550211088182571b77902))
- **redis-smq-web-ui:** initialize RedisSMQ before starting API server ([2e2a6fd](https://github.com/weyoss/redis-smq/commit/2e2a6fdc5bb07e1c3c8266f9f80a720d38136d36))
- **redis-smq-web-ui:** update branding ([3abc18a](https://github.com/weyoss/redis-smq/commit/3abc18a1bde84eaf3a9ba1cd7a4f49f32a752660))
- **redis-smq:** validate topic exchange params as regex patterns ([3fa6afd](https://github.com/weyoss/redis-smq/commit/3fa6afd97e3cef0dc09fc797ef8ca47e7ec9201f))

### 🚀 Chore

- update pnpm lockfile ([0e697a8](https://github.com/weyoss/redis-smq/commit/0e697a8f06bb8e606e5d0c228fe32f77aa7f7c90))

### 📝 Documentation

- fix version compatibility documentation link in README ([daccd87](https://github.com/weyoss/redis-smq/commit/daccd87568c97beac8a808389a37f811dfd5b375))
- **redis-smq-common:** add API documentation for WATCH transaction helper ([12d51ae](https://github.com/weyoss/redis-smq/commit/12d51ae27cebbe846939b9a0910b24d288903632))
- **redis-smq-common:** restructure and expand logger documentation ([912ce54](https://github.com/weyoss/redis-smq/commit/912ce547957ef7592313c9bee71e81008930a634))
- **redis-smq-common:** update API reference ([9f4cf94](https://github.com/weyoss/redis-smq/commit/9f4cf9428e8824f98fbbb24f62971c2f7151e6a2))
- **redis-smq-common:** update error classes reference ([6db6516](https://github.com/weyoss/redis-smq/commit/6db651642ccf86e7f1c8f5f54e92fb8d2ceafcc1))
- **redis-smq-common:** update Redis client documentation ([145c5a3](https://github.com/weyoss/redis-smq/commit/145c5a3ff89f7c850b3327eb2d2bfebf72c2da4e))
- **redis-smq-web-ui:** improve README formatting ([1fc0e3f](https://github.com/weyoss/redis-smq/commit/1fc0e3f02b58e9303ab778d339d6193c0a7aeba4))
- **redis-smq:** add create method documentation, fix parameter ordering in exchange API reference ([0166fec](https://github.com/weyoss/redis-smq/commit/0166fec961ca14c79b5740a5e167f83bb121d621))
- **redis-smq:** add JSDoc documentation for ExchangeTopic class ([4a45675](https://github.com/weyoss/redis-smq/commit/4a45675b029795e5e8ff6ca4eda2944ca9b45f8a))
- **redis-smq:** rewrite message exchanges documentation ([3096964](https://github.com/weyoss/redis-smq/commit/3096964df948c8dd433d69e243055730b8b3b1b6))
- **redis-smq:** update and clean up documentation ([ea91bb8](https://github.com/weyoss/redis-smq/commit/ea91bb89d76539af121e9217561e36913e8fb896))
- **redis-smq:** update API documentation and clean up ([ef4139a](https://github.com/weyoss/redis-smq/commit/ef4139a6fafbd809170abcfecd85fad26f1fcbd6))
- **redis-smq:** update API reference ([8f248ef](https://github.com/weyoss/redis-smq/commit/8f248ef97727c73ed4594e401db985bfc0e9f3e7))
- **redis-smq:** update API reference for modernized exchange system ([864c851](https://github.com/weyoss/redis-smq/commit/864c851318382389b02d66c8a350ead12eac2a91))
- **redis-smq:** update JSDoc for ExchangeFanout class ([e35b5fb](https://github.com/weyoss/redis-smq/commit/e35b5fb22b9937e54c6ec50834bf0c331561a7e7))
- **redis-smq:** update README code examples and formatting ([c7ba04b](https://github.com/weyoss/redis-smq/commit/c7ba04be1ccf0b674f6b287b399698e89eb97b59))
- **redis-smq:** update topic exchange documentation ([eb7cdf3](https://github.com/weyoss/redis-smq/commit/eb7cdf394afbf51328d335a0079cb97fc4a00dd6))
- rewrite README and configuration documentation for v9 simplified API ([f48a319](https://github.com/weyoss/redis-smq/commit/f48a319d24aab6d19349e9766f31503474d12797))
- update documentation reference instructions in README ([35b4482](https://github.com/weyoss/redis-smq/commit/35b4482d00d316cb06afdf5d6e83cc007d07a1a2))

### ♻️ Code Refactoring

- **redis-smq-common:** clean up ConsoleLogger ([0d71a78](https://github.com/weyoss/redis-smq/commit/0d71a786f88f8fa50932375c4235af5a83dccb95))
- **redis-smq-common:** consolidate Redis client creation logic into factory class ([46804f8](https://github.com/weyoss/redis-smq/commit/46804f899055dc49a45c4920011a0e0ee95e54ca))
- **redis-smq-common:** redesign event bus architecture with Runnable base class ([8ae3bfd](https://github.com/weyoss/redis-smq/commit/8ae3bfd3e0d46692e6b32a5c90714fcf332f338c))
- **redis-smq-common:** remove isFormatted method ([e09d4b0](https://github.com/weyoss/redis-smq/commit/e09d4b0466233ed238efd35a86a19c9408fabfb9))
- **redis-smq-common:** simplify logger architecture, improve namespace handling ([dad6399](https://github.com/weyoss/redis-smq/commit/dad6399b2c3605ba24a1763f602af3e1cd949911))
- **redis-smq-common:** update copyright headers ([6bde3d9](https://github.com/weyoss/redis-smq/commit/6bde3d9a1adb73e60df83291b7566f4cd1961725))
- **redis-smq-common:** update test utilities to use RedisClientFactory ([bc2adf8](https://github.com/weyoss/redis-smq/commit/bc2adf8557603ed26b55fe853b9d05eebb7b17ed))
- **redis-smq-common:** use RedisClientFactory in EventBusRedis ([e834484](https://github.com/weyoss/redis-smq/commit/e8344848b3dee1b28a772681e8739963efafac83))
- **redis-smq-rest-api:** improve mappings generation script, simplify build process ([105ec1e](https://github.com/weyoss/redis-smq/commit/105ec1eb9de22b88b4853e4ea74459c1e6514f4b))
- **redis-smq-rest-api:** use RedisSMQ factory methods,auto-generate error mappings ([2f5ba94](https://github.com/weyoss/redis-smq/commit/2f5ba94042423ba732b5d441a45bd072333bb538))
- **redis-smq-web-server:** replace console logging with app logger ([c891254](https://github.com/weyoss/redis-smq/commit/c891254ab58687873542954a983c067abb52f31d))
- **redis-smq-web-server:** use createLogger function ([e3aeba2](https://github.com/weyoss/redis-smq/commit/e3aeba27a7b173c0743294d5c9a1e08ce738e922))
- **redis-smq-web-ui:** standardize HTML formatting ([2069578](https://github.com/weyoss/redis-smq/commit/206957873b6db1672cc4c42ed1cfd7e881e1e993))
- **redis-smq:** improve Configuration class documentation and initialization ([fb7889c](https://github.com/weyoss/redis-smq/commit/fb7889c8af68797d9f24b6693dd32da01edfb434))
- **redis-smq:** integrate connection pooling and reorganize error handling ([af20b9c](https://github.com/weyoss/redis-smq/commit/af20b9c4438d26bd51608d36ca7177f6ed097866))
- **redis-smq:** migrate test utilities to use RedisConnectionPool ([c443e98](https://github.com/weyoss/redis-smq/commit/c443e9855de092a8bab2548b4f39d8fa5b838b7d))
- **redis-smq:** migrate test utilities to use RedisSMQ factory methods ([4a89c0c](https://github.com/weyoss/redis-smq/commit/4a89c0cd1ee2e2742176be0687c2e7d7371ab8e6))
- **redis-smq:** rename config getter functions to use parse prefix ([2f3a32c](https://github.com/weyoss/redis-smq/commit/2f3a32cfa9fc8cd500d46fe0ce5a566cde98db4e))
- **redis-smq:** reorganize imports and codebase structure ([8bf631e](https://github.com/weyoss/redis-smq/commit/8bf631eb7692c31d179d9b0123a86312e2ba7f23))
- **redis-smq:** update copyright headers ([fc6bc5d](https://github.com/weyoss/redis-smq/commit/fc6bc5dc0b1665a01276e0d3766d49de725ede0c))
- **redis-smq:** use IRedisClient interface instead of RedisClient class ([da7a4c2](https://github.com/weyoss/redis-smq/commit/da7a4c2aba472d9f8608eddb8ccf260a7da407a4))

### ✅ Tests

- **redis-smq-rest-api:** fix exchanges sorting in getExchangesController.test.ts ([9ac0a41](https://github.com/weyoss/redis-smq/commit/9ac0a41a3a1dfca75f39d9facf6b8d99f60ba83e))

## [9.0.0-next.3](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.2...v9.0.0-next.3) (2025-09-09)

### 🐛 Bug Fixes

- **redis-smq-rest-api:** update peer dependencies ([7e53873](https://github.com/weyoss/redis-smq/commit/7e5387325512a545665ccec5641391cbdf1d41e0))
- **redis-smq-web-server:** set default Redis database to 0 ([65c0b5c](https://github.com/weyoss/redis-smq/commit/65c0b5c6f8dfe4bc116b864a7095dcbedf3cd2e7))
- **redis-smq-web-server:** update peer dependencies ([fca8464](https://github.com/weyoss/redis-smq/commit/fca846411e999253a85c5f8ede7ad6c955540c33))
- **redis-smq-web-ui:** move redis-smq-rest-api from peer to dev deps ([fb54139](https://github.com/weyoss/redis-smq/commit/fb54139382fa4c569855e35558ddc25130bfaa20))
- **redis-smq:** add optional Redis client peer dependencies ([b9b60cc](https://github.com/weyoss/redis-smq/commit/b9b60cc96ca59611a0a17e510020889df4cf1c41))

### 📝 Documentation

- **redis-smq-common:** update console logger documentation ([029500b](https://github.com/weyoss/redis-smq/commit/029500b912523f96f9614729639aa4d6dabf0cf3))
- **redis-smq-rest-api:** add Redis client installation instructions ([dde1848](https://github.com/weyoss/redis-smq/commit/dde184879eb4e902592c64fb83103d9e8c6f266e))
- **redis-smq-rest-api:** add Redis client installation instructions ([42f852c](https://github.com/weyoss/redis-smq/commit/42f852c01b39a323ab9db292168950e1ce62efd2))
- **redis-smq-rest-api:** update CLI options documentation ([7b25eea](https://github.com/weyoss/redis-smq/commit/7b25eea9d64ee5c663d5e31528092084afea31bf))
- **redis-smq-rest-api:** update configuration and usage examples ([2766f69](https://github.com/weyoss/redis-smq/commit/2766f69f2e8a8c699d401730055d3a667f2c79a0))
- **redis-smq-web-server:** update configuration API and CLI options ([4705361](https://github.com/weyoss/redis-smq/commit/4705361230286e0c6cb2e908b6bc29def442ee9d))
- **redis-smq-web-ui:** include Priority Queues support ([4f0e8fe](https://github.com/weyoss/redis-smq/commit/4f0e8fe9c5a0d7f46cd6271c424208c4a6563de9))
- **redis-smq:** fix API documentation links ([79fa7de](https://github.com/weyoss/redis-smq/commit/79fa7de4d74fa5b4ca52447bc4a5d8007dafa3fb))
- **redis-smq:** update API documentation for configuration interfaces ([0e764fd](https://github.com/weyoss/redis-smq/commit/0e764fdbc5e1e1923dd61f44cb2f7eed24e35b47))

### ♻️ Code Refactoring

- **redis-smq-common:** remove custom date format support from console logger ([866f0e3](https://github.com/weyoss/redis-smq/commit/866f0e37c9cbe2f428856f223322ea83969be5cd))
- **redis-smq-rest-api:** improve CLI configuration and config parsing ([22d59b8](https://github.com/weyoss/redis-smq/commit/22d59b8a30962f84ea4590400cf48a1fed84ed03))
- **redis-smq-web-server:** improve CLI configuration and config parsing ([85f9b05](https://github.com/weyoss/redis-smq/commit/85f9b0528482f30220b10a5e4cd074c47fd03445))
- **redis-smq:** improve configuration parsing ([9e5408d](https://github.com/weyoss/redis-smq/commit/9e5408d6d1888d8edea86d247c39baf7c14681fa))

### 👷 Continuous Integration

- **codeql:** optimize workflow by running build:ca instead of install ([f90198c](https://github.com/weyoss/redis-smq/commit/f90198cd0b29db7dd81603a803306c2b45ea4817))

## [9.0.0-next.2](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.1...v9.0.0-next.2) (2025-09-07)

### 🐛 Bug Fixes

- **redis-smq-rest-api:** add shebang to CLI script for proper execution ([5230cb0](https://github.com/weyoss/redis-smq/commit/5230cb025a648f85bbb65cc4e93ddf50ca7c401e))
- **redis-smq-rest-api:** set default Redis database to 0 ([bb9ef29](https://github.com/weyoss/redis-smq/commit/bb9ef292e301230aa69dd66d902b3b102a61f965))
- **redis-smq-web-server:** add shebang to CLI script for proper execution ([255efca](https://github.com/weyoss/redis-smq/commit/255efca59e0275af4ce2a54dc9a64cc7ecbe1005))

### 📝 Documentation

- **redis-smq-rest-api:** remove outdated prerequisites section ([7e1f961](https://github.com/weyoss/redis-smq/commit/7e1f96130415fb1a46c4d6b1c2a3ca7b9508256a))
- **redis-smq-web-server:** fix installation/quick start commands ([793a2a0](https://github.com/weyoss/redis-smq/commit/793a2a0ce9ca2317e14bd166257f08b5d09c608e))
- **redis-smq-web-server:** fix npm install command ([cb43828](https://github.com/weyoss/redis-smq/commit/cb438288ced625296a1bc94adb8c17b2a4440757))
- **redis-smq-web-ui:** add screenshot to README ([75c618a](https://github.com/weyoss/redis-smq/commit/75c618ac3b61163c55970352311f2ec6734cad16))
- update installation instructions to include required deps ([e6d414d](https://github.com/weyoss/redis-smq/commit/e6d414d0f0ff7ab0b6bed4beab8dcfbd968b9751))

## [9.0.0-next.1](https://github.com/weyoss/redis-smq/compare/v9.0.0-next.0...v9.0.0-next.1) (2025-09-06)

### 🐛 Bug Fixes

- **redis-smq:** update Redis data structure version ([abedf40](https://github.com/weyoss/redis-smq/commit/abedf408702afa2bca76ac12c659d8c2d65f28df))

### 📝 Documentation

- **redis-smq-rest-api:** add CLI usage documentation and examples ([9ff748b](https://github.com/weyoss/redis-smq/commit/9ff748b0901daeecd3b16b1a4c5c05190840dbbd))

## [9.0.0-next.0](https://github.com/weyoss/redis-smq/compare/v8.3.1...v9.0.0-next.0) (2025-09-06)

### ⚠ BREAKING CHANGES

- **redis-smq-rest-api:** implement missing API endpoints
- **redis-smq:** improve message lifecycle observability

### ✨ Features

- **redis-smq-rest-api:** implement missing API endpoints ([838fe4f](https://github.com/weyoss/redis-smq/commit/838fe4f66f2b2217d17309a591a92d726aca6697))
- **redis-smq-web-server:** implement web server package for hosting RedisSMQ Web UI ([ac9a112](https://github.com/weyoss/redis-smq/commit/ac9a11227fed63354b9c6f03ef137e3fe943b7b3))
- **redis-smq-web-ui:** implement comprehensive Vue.js web interface for RedisSMQ management ([96819a8](https://github.com/weyoss/redis-smq/commit/96819a860816c7f1f55f58171a26518d1051be8f))
- **redis-smq:** improve message lifecycle observability ([0f1b259](https://github.com/weyoss/redis-smq/commit/0f1b25917a1d7e693ab65b4322084bc96bf2f836))

### 🐛 Bug Fixes

- **redis-smq-rest-api:** correct import path for routing module ([8a0edf6](https://github.com/weyoss/redis-smq/commit/8a0edf6188241f5944f66d9ac06435eed3df3ec3))
- **redis-smq-web-server:** correct package name in README ([4bf8e49](https://github.com/weyoss/redis-smq/commit/4bf8e49dba2920c39d01320a1bd27572a731a7ac))
- **redis-smq-web-server:** make test script pass without tests ([658c03f](https://github.com/weyoss/redis-smq/commit/658c03f941c6ba3e881075fab3c896c0d3152c9e))
- **redis-smq-web-ui:** add OpenAPI client generation to build process ([792821a](https://github.com/weyoss/redis-smq/commit/792821a1a7c652dbbbb5df556fe48bea779bc205))
- **redis-smq-web-ui:** clean up new files before OpenAPI client generation ([8c5132a](https://github.com/weyoss/redis-smq/commit/8c5132ae020431e55d96f2faee2ea37b96b28040))
- **redis-smq-web-ui:** correct import path for messages API module ([f21e66b](https://github.com/weyoss/redis-smq/commit/f21e66bf21e34b5dfa758fc6038439099b12be5b))
- **redis-smq-web-ui:** correct license statement in README ([2f8f4b1](https://github.com/weyoss/redis-smq/commit/2f8f4b1fe397ef6e77c568e154fc650be0d18cb0))
- **redis-smq-web-ui:** improve modal warning text and fix z-index ([11b28af](https://github.com/weyoss/redis-smq/commit/11b28af4cb346acb1772962f0cb49e6749871a71))
- **redis-smq-web-ui:** reduce app initialization delay and improve comments ([d1e8a88](https://github.com/weyoss/redis-smq/commit/d1e8a88f20ffe9261f900d7a37f8f2b6eb3a5911))
- **redis-smq-web-ui:** standardize import file extensions to .ts ([9ae3559](https://github.com/weyoss/redis-smq/commit/9ae35593767de2b22d144ff193734daa54f7b306))

### 🚀 Chore

- add .npmignore files to web packages for proper publishing ([5a1b3be](https://github.com/weyoss/redis-smq/commit/5a1b3be73f62f09ca077ce1b99867ce05df253b6))
- update dependencies to latest versions ([32634ad](https://github.com/weyoss/redis-smq/commit/32634ad64c4634587469cc0fa7dc51abbb8105e8))

### 📝 Documentation

- **redis-smq-common:** add missing copyright headers ([4469fc9](https://github.com/weyoss/redis-smq/commit/4469fc96d7400109b395f791772fd09373e5935b))
- **redis-smq-common:** improve documentation ([5325965](https://github.com/weyoss/redis-smq/commit/5325965db4440927f831413e91aaa9367b268a25))
- **redis-smq-common:** update API documentation format and structure ([38454e5](https://github.com/weyoss/redis-smq/commit/38454e5f5bcfc5793a706e48d3305c6e537fcdad))
- **redis-smq:** add message storage documentation ([634ab21](https://github.com/weyoss/redis-smq/commit/634ab215c0b01cb81e5b657096d17ad746fd4ab6))
- **redis-smq:** add QueuePendingMessages class to configuration docs ([26eba59](https://github.com/weyoss/redis-smq/commit/26eba59eb6a48806e8e8cb2c280a8d25b72b5f2a))
- **redis-smq:** improve message storage documentation and class references ([3b47ade](https://github.com/weyoss/redis-smq/commit/3b47ade6b1cc1bdfaef95a57d983225af6c785b5))
- **redis-smq:** update API documentation format and structure ([f74c878](https://github.com/weyoss/redis-smq/commit/f74c878d7a8f0416baf1d5d7b92165f264a1c9cf))
- update README with V9 announcement and ecosystem overview ([a509a85](https://github.com/weyoss/redis-smq/commit/a509a8594e90130e446f01784d2706923159c210))

### ♻️ Code Refactoring

- **redis-smq-common:** improve package.json metadata ([f99f6eb](https://github.com/weyoss/redis-smq/commit/f99f6eb5e2900c497d306b5f7b67a46139126dde))
- **redis-smq-common:** improve script loading to support multi-file scripts ([fa4b522](https://github.com/weyoss/redis-smq/commit/fa4b52293df6ea22f8404bf8d24d92c6e28b4cd8))

## [8.3.1](https://github.com/weyoss/redis-smq/compare/v8.3.0...v8.3.1) (2025-05-06)

### ⚡ Performance Improvements

- **redis-smq:** optimize and clean up LUA scripts for better Redis performance ([46c54f8](https://github.com/weyoss/redis-smq/commit/46c54f8113101e12227b4a7af041c885f7d33944))

## [8.3.0](https://github.com/weyoss/redis-smq/compare/v8.2.1...v8.3.0) (2025-05-04)

### ✨ Features

- **redis-smq-common:** implement additional async utilities and factories ([7358db6](https://github.com/weyoss/redis-smq/commit/7358db6e08451de6ea2b480de8c36898c4e56a6f))

### 🐛 Bug Fixes

- **redis-smq:** make message deletion more resilient to race conditions and inconsistent states ([6138a46](https://github.com/weyoss/redis-smq/commit/6138a46298332f6bdead6242bc42ed6fd91c953c))

### 📝 Documentation

- **redis-smq-common:** update ConsoleLogger constructor description ([10f085a](https://github.com/weyoss/redis-smq/commit/10f085a547f19303f281b477afc9de639b8a2657))
- **redis-smq:** update class references ([3ddf002](https://github.com/weyoss/redis-smq/commit/3ddf002f252b94caf2dc60f7021804264f4ed866))

### ♻️ Code Refactoring

- **redis-smq-common:** improve Redis server platform support and constants organization ([732fdb0](https://github.com/weyoss/redis-smq/commit/732fdb0e860433df6b64ab270f54581aabe7cd44))
- **redis-smq:** improve callback patterns and use new async utils ([62c5317](https://github.com/weyoss/redis-smq/commit/62c531711c1056313b86347d258dbf164c30175d))

## [8.2.1](https://github.com/weyoss/redis-smq/compare/v8.2.0...v8.2.1) (2025-04-22)

### 🐛 Bug Fixes

- **redis-smq-common:** set default log level to INFO ([98a66d4](https://github.com/weyoss/redis-smq/commit/98a66d4953f89662faac695c113bce220678a26b))
- **redis-smq:** use correct cursor for SSCAN operation, clean up ([fffb4e2](https://github.com/weyoss/redis-smq/commit/fffb4e21c35a9350cbb7fc75fb7f54c826b75458))

### 📝 Documentation

- **redis-smq:** add pageSize to IQueueMessagesPageParams typing ([4294a61](https://github.com/weyoss/redis-smq/commit/4294a6103210b567198308c0d7edd433fb207712))
- **redis-smq:** improve logging and documentation ([d0470b2](https://github.com/weyoss/redis-smq/commit/d0470b2cb69269660eb73474654be8a7804f738b))

### ✅ Tests

- **redis-smq:** add new tests for queue message storage implementations ([0b03d5d](https://github.com/weyoss/redis-smq/commit/0b03d5daf971b7a5246df9268c310fe3869be431))

## [8.2.0](https://github.com/weyoss/redis-smq/compare/v8.1.0...v8.2.0) (2025-04-20)

### ✨ Features

- **redis-smq-common:** implement ConsoleLogger and improve logging ([95024ca](https://github.com/weyoss/redis-smq/commit/95024caef5aa77ad7a14d8ebed18691fcb61af28))
- **redis-smq:** enhance logging with detailed debug information ([779a754](https://github.com/weyoss/redis-smq/commit/779a754d1c4a8c4415abc9920ea2e567aa00e21c))

### 🐛 Bug Fixes

- **redis-smq:** await async queue consumers retrieval in test ([b40cb1c](https://github.com/weyoss/redis-smq/commit/b40cb1c4eda2986f5a847d9b5edf93f2c6b7312d))

### 🚀 Chore

- add documentation bug report issue template ([28403a9](https://github.com/weyoss/redis-smq/commit/28403a90ae796a4f2479e9f187dad1ff8847ed90))
- use more descriptive labels for docs bug report ([beef330](https://github.com/weyoss/redis-smq/commit/beef3305d32238869659a5d393a27a69ad13a754))

### 📝 Documentation

- **redis-smq-common:** enhance logger documentation and add ConsoleLogger API reference ([f76725e](https://github.com/weyoss/redis-smq/commit/f76725e733dbb895fd791526a0e31208394d6484))
- **redis-smq-rest-api:** update package name reference in README ([daac8fb](https://github.com/weyoss/redis-smq/commit/daac8fb3e456bd3446c5962a72194eb9888517f6))
- **redis-smq:** fix typos and enhance API documentation ([fb3f0ec](https://github.com/weyoss/redis-smq/commit/fb3f0ec351e06a75f2771196a6396cdfff544698))
- **redis-smq:** update configuration examples ([58c8ad8](https://github.com/weyoss/redis-smq/commit/58c8ad8ec19efd0a5b7ecfaff2aeddd4c078ac02))
- update logs documentation link ([9ff9d54](https://github.com/weyoss/redis-smq/commit/9ff9d5499d1e0a00c70bad6d11d4ca7a34c577d0))
- update redis-smq references ([ff6666f](https://github.com/weyoss/redis-smq/commit/ff6666f9c47862142ba23f829494d8bd43b09c71))
- update redis-smq-common references ([3b4083d](https://github.com/weyoss/redis-smq/commit/3b4083d34d5d12facf848d5c614732522f9eab84))

### ✅ Tests

- **redis-smq-common:** enhance logger tests ([4c5e942](https://github.com/weyoss/redis-smq/commit/4c5e94261c9bc17c8423fded8c32ed246d5373fc))

## [8.1.0](https://github.com/weyoss/redis-smq/compare/v8.0.3...v8.1.0) (2025-04-16)

### ✨ Features

- **redis-smq-common:** add scard method to Redis client ([2ef536f](https://github.com/weyoss/redis-smq/commit/2ef536f19968983ea82a055748b4860573ce3926))

### 🐛 Bug Fixes

- **redis-smq:** prevent duplicate message publishing for scheduled tasks ([8304c94](https://github.com/weyoss/redis-smq/commit/8304c9423b3a59c4159fba504065662499c1dd63))

### 🚀 Chore

- add GitHub issue templates for bug reports and feature requests ([abe53dc](https://github.com/weyoss/redis-smq/commit/abe53dc5b494dfdd99db49d64a6da0f40a23ae1b))
- add Q&A discussion link ([a8b6bd9](https://github.com/weyoss/redis-smq/commit/a8b6bd9f26681378daa04e6dc8373309f2be8d56))
- improve issue templates with clearer labels and descriptions ([58c215a](https://github.com/weyoss/redis-smq/commit/58c215ab2b2c08ddab9f5cc38eb0ad5d69358eb9))
- update GitHub Actions dependencies to latest versions ([d9b2729](https://github.com/weyoss/redis-smq/commit/d9b2729e34099d2dfd8ba36b1704561131502f20))

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

### 🚀 Chore

- **redis-smq-common:** update Valkey server binary URLs to v7.2.8-2 ([5e821a3](https://github.com/weyoss/redis-smq/commit/5e821a3952d128a502f2bfcd3026e8175e48434e))

### 📝 Documentation

- **redis-smq-common:** update package description and documentation link ([54e6e54](https://github.com/weyoss/redis-smq/commit/54e6e544ca1740e82f226d3681c96b1212429297))
- reorganize and enhance documentation across packages ([128d333](https://github.com/weyoss/redis-smq/commit/128d33329adc9e4659a07f42fc552ede618e1a57))
- simplify and streamline v8 release notes ([46c4f93](https://github.com/weyoss/redis-smq/commit/46c4f936d9a68f35c438942ef5c9fee37e77857b))

## [8.0.1](https://github.com/weyoss/redis-smq/compare/v8.0.0...v8.0.1) (2025-04-13)

### 📝 Documentation

- **redis-smq-rest-api:** update README ([a9602b2](https://github.com/weyoss/redis-smq/commit/a9602b2bdc2a1dca978417c89e72057dd55f9ce4))
- **redis-smq-web-ui:** add initial README with feature overview ([83f5cbf](https://github.com/weyoss/redis-smq/commit/83f5cbf60348c48f95830676d1564eab07c74222))
- **redis-smq:** update links to REST API and Web UI documentation ([6d35753](https://github.com/weyoss/redis-smq/commit/6d35753c2eb53ff60a09284fc09a3881ab46a1fd))

### ♻️ Code Refactoring

- **redis-smq:** improve redis-keys module with better organization and documentation ([3377d51](https://github.com/weyoss/redis-smq/commit/3377d51b9e0c9a448789c8b4493dffe616e44384))
- **redis-smq:** update key prefix with version-based naming scheme ([7cac5d6](https://github.com/weyoss/redis-smq/commit/7cac5d61d1a877a2f712c2a8910237e7d01e75fd))

## [8.0.0](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.36...v8.0.0) (2025-04-13)

### 🚀 Chore

- expand release script options with semantic versioning commands ([12f037e](https://github.com/weyoss/redis-smq/commit/12f037e25413d3cf9a815852fe9be109bdc82d6b))

### 📝 Documentation

- add release notes for RedisSMQ v8 ([76c8db7](https://github.com/weyoss/redis-smq/commit/76c8db7a4f5fa66431be2c3227673b58698aa8eb))
- update README with v8 release announcement ([92512a9](https://github.com/weyoss/redis-smq/commit/92512a9850f67b91d42ff3dcc51078e358ef90e8))

## [8.0.0-rc.36](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.35...v8.0.0-rc.36) (2025-04-11)

### ⚠ BREAKING CHANGES

- **redis-smq-common:** implement FileLock class with improved locking mechanism

### ✨ Features

- **redis-smq-common:** add options to build/download Redis binary ([2021a63](https://github.com/weyoss/redis-smq/commit/2021a634932ba936bce268914c0bacaa47799545))

### 📝 Documentation

- **redis-smq-common:** clarify FileLock method descriptions ([86e44ba](https://github.com/weyoss/redis-smq/commit/86e44ba4cbc07d2c9a12912cf40df2f58b6f7ef8))
- **redis-smq-common:** clean up redis-client.md ([b6cd1b0](https://github.com/weyoss/redis-smq/commit/b6cd1b035f11a4badf02288439e46f4aa8ca0a68))
- **redis-smq-common:** fix capitalization of FileLock in README ([3bbf562](https://github.com/weyoss/redis-smq/commit/3bbf56274510b08a813f32072ba3f4b350bea156))
- **redis-smq-common:** fix typo in redis-server.md ([65f56f7](https://github.com/weyoss/redis-smq/commit/65f56f7555dc08e4819d2fc57d160290564707c0))
- **redis-smq-common:** improve documentation structure ([8b4e6f7](https://github.com/weyoss/redis-smq/commit/8b4e6f7806ba5182d312e3321b35254ea3b4a9f9))

### ♻️ Code Refactoring

- **redis-smq-common:** download and use pre-built Redis binaries ([e71be54](https://github.com/weyoss/redis-smq/commit/e71be54919f185613fffb08a7c977700fea9fbf6))
- **redis-smq-common:** implement FileLock class with improved locking mechanism ([ac5469a](https://github.com/weyoss/redis-smq/commit/ac5469a0d75254c6b7981ecec7973c50b31ff01d))
- **redis-smq-common:** rename createClient ([e8eb7fc](https://github.com/weyoss/redis-smq/commit/e8eb7fcf77e753ed83ef09c4a9e7f2d04a69b442))
- **redis-smq-common:** shorten imports ([80f72c5](https://github.com/weyoss/redis-smq/commit/80f72c5c8d12219a36419dbd7365779a9d533742))

### ✅ Tests

- **redis-smq-common:** use os.tmpdir() for test lock files ([b78d75b](https://github.com/weyoss/redis-smq/commit/b78d75be15b49fee3c5cddb27740f9468d44741f))

### 👷 Continuous Integration

- update workflow for improved code analysis ([3ba8d5c](https://github.com/weyoss/redis-smq/commit/3ba8d5c560376956e06685b1378419e7b1c4577f))

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

### 📦‍ Build System

- rename document script to document:all ([82d91ff](https://github.com/weyoss/redis-smq/commit/82d91ff55d3338c3dfd188393e224fbbf9d6c344))

## [8.0.0-rc.30](https://github.com/weyoss/redis-smq/compare/v8.0.0-rc.29...v8.0.0-rc.30) (2025-03-21)

### ✨ Features

- **redis-smq-tools:** handle concurrent startRedisServer() calls ([adf1f6a](https://github.com/weyoss/redis-smq/commit/adf1f6afd2b7677845f7a3d895d4fb6a26d0c64e))
- **redis-smq-tools:** use system redis-server instead of building from src ([29031b4](https://github.com/weyoss/redis-smq/commit/29031b4302c8b834b79d3f9013f38e402e910f44))

### 🐛 Bug Fixes

- **redis-smq-tools:** create dir if it doesn't exist ([f586c2e](https://github.com/weyoss/redis-smq/commit/f586c2ee6fcf29aa2918fde1dd35b85158f3743e))
- **redis-smq-tools:** ensure port 0 is not used ([c4a4f6b](https://github.com/weyoss/redis-smq/commit/c4a4f6bcb730cd359e8f7827526a51b8756113f3))
- **redis-smq-tools:** ensure Redis binary is executable and found ([900e405](https://github.com/weyoss/redis-smq/commit/900e405a00fff6cb46241845f692c7c0ea0f2a1f))
- **redis-smq-tools:** implement file locking for Redis setup ([877cade](https://github.com/weyoss/redis-smq/commit/877cade9807b4d0af5e9331c3aa4909c9260332f))

### 🚀 Chore

- add release:rc script to package.json ([c886ff9](https://github.com/weyoss/redis-smq/commit/c886ff989a58ff54d199bc125465c29661064256))
- migrate to monorepo structure ([37e0142](https://github.com/weyoss/redis-smq/commit/37e0142cfc140990d9367ee260ba2b08a82d626a))
- remove Redis server scripts and related commands ([1bd9eb8](https://github.com/weyoss/redis-smq/commit/1bd9eb801a327a425825079c438b7d848d21cc6b))

### 📝 Documentation

- update README files with latest release and coverage badges ([8eabf08](https://github.com/weyoss/redis-smq/commit/8eabf08d53fdf313d0e2708672f89c5386700ef6))

### ♻️ Code Refactoring

- **redis-smq-tools:** simplify Redis server setup ([9baf7f1](https://github.com/weyoss/redis-smq/commit/9baf7f14e7cf9d9c6b0b7ac7d4da4674d8655aa8))

### ✅ Tests

- double the test timeout to 240000 milliseconds ([f93f36a](https://github.com/weyoss/redis-smq/commit/f93f36a08b5899e8aedb46873a7bfd322e04e92a))
- increase hook timeout to 120 seconds ([6a4b8e2](https://github.com/weyoss/redis-smq/commit/6a4b8e2c97bd5671a452295a7c7a345241e139e9))
- remove unused data directory parameter from startRedisServer ([c1572b4](https://github.com/weyoss/redis-smq/commit/c1572b4ddae7e37a9ad70fed7eac3d6291df9ddd))

### 📦‍ Build System

- **deps:** remove pnpm from dev dependencies ([9c2553a](https://github.com/weyoss/redis-smq/commit/9c2553a2c179a7a65d60c1cae5be5a8bf05a7f08))
- **redis-smq-server:** update package description ([ac21046](https://github.com/weyoss/redis-smq/commit/ac210460acbfe0e7659d8370a143bc0ffccc125b))
- update dev dependency @types/node to v20 ([65caa14](https://github.com/weyoss/redis-smq/commit/65caa14f6f480b8762c4cb88d928fefd06fb9327))

### 👷 Continuous Integration

- add secret token for codecov ([994a683](https://github.com/weyoss/redis-smq/commit/994a6838361580f81c5d9b2f1b5a0e806a4b5198))
- reduce test timeout to 120 seconds ([520410b](https://github.com/weyoss/redis-smq/commit/520410be8c1de1d8f2e33e3448d19442966ee180))
- remove unnecessary directory navigation step ([6c93526](https://github.com/weyoss/redis-smq/commit/6c935264d0492be284cf4298569b4171ceabd583))
- update codecov action and install redis server ([c45d005](https://github.com/weyoss/redis-smq/commit/c45d00589098482bbfc7df9ec0b62ce5d7bcab6c))
- update CodeQL action and add PNPM installation ([ce2a744](https://github.com/weyoss/redis-smq/commit/ce2a74455f453950fc2a4c925b5a1857cc4d8992))
- update Redis server installation command ([57189bb](https://github.com/weyoss/redis-smq/commit/57189bb041bca12f81fd0c4b41990ecaa845f331))
