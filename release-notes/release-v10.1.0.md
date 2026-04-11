# RedisSMQ v10.1.0 Release Notes (2026-04-11)

## ⚠ BREAKING CHANGES

- **redis-smq:** improve redis keys hierarchy
- **redis-smq:** simplify RedisSMQ class API
- **redis-smq:** update IRedisSMQConfig.logger to support boolean values
- refactor build process and script naming
- rename "docs" script to "document"

## ✨ Features

- **redis-smq-ci:** add CI tools for RedisSMQ ([ec52e72](https://github.com/weyoss/redis-smq/commit/ec52e720c57b94a2fbeec39ffd9c5092a83ad48b))
- **redis-smq-rest-api:** add API endpoint for updating config ([e91f2c6](https://github.com/weyoss/redis-smq/commit/e91f2c6bd935d67bc375b13a7ae8c7a0dcdc4d76))
- **redis-smq-rest-api:** add endpoint for fetching message unack history ([ae43bfc](https://github.com/weyoss/redis-smq/commit/ae43bfcbf5acd220528f987df6e78c255594f3d6))
- **redis-smq-web-ui:** add configuration view and management ([fd51b00](https://github.com/weyoss/redis-smq/commit/fd51b004106e3345d7d477172287e356568f99e9))
- **redis-smq-web-ui:** add message failure history tracking ([1f9d330](https://github.com/weyoss/redis-smq/commit/1f9d330dd9b5ef6d3300d784cdbd0ed8528fc378))
- **redis-smq-web-ui:** support message unack history viewing ([cb91ecb](https://github.com/weyoss/redis-smq/commit/cb91ecb0fe8630840c3e9e82d805fbbc9929f7d8))
- **redis-smq:** add cross-instance configuration synchronization ([0b10045](https://github.com/weyoss/redis-smq/commit/0b100455ab9763c66fe02067142454fef48c5d17))
- **redis-smq:** add message failure history tracking ([29bef17](https://github.com/weyoss/redis-smq/commit/29bef17a897dfa4efd4aac47fcc817020981b451))
- **redis-smq:** support async/await message handlers ([8046412](https://github.com/weyoss/redis-smq/commit/8046412557ddec9ccb6df8c1c9eb30e0c86c4cc5))

## 🐛 Bug Fixes

- **redis-smq:** audit messages only when enabled explicitly ([43e52d5](https://github.com/weyoss/redis-smq/commit/43e52d553835e153f0eb98c5ea822d4a29cdc5f6))
- **redis-smq:** validate message handler function signature ([e673596](https://github.com/weyoss/redis-smq/commit/e673596402abd27edf4b2ee907887d7d788ddbd3))
- detect staged changes in post-merge hook ([5552f6f](https://github.com/weyoss/redis-smq/commit/5552f6fb7033546a8e4397927d6ae548b73f6895))

## 📝 Documentation

- **redis-smq-ci:** remove NPM badge for private package ([9ebd062](https://github.com/weyoss/redis-smq/commit/9ebd062542ddd7fda8d19cb727335bffe7c42c14))
- **redis-smq:** improve promise usage section to include queue creation ([08ae3a6](https://github.com/weyoss/redis-smq/commit/08ae3a60bfca89a8659644a2b9e2f3f1083f8eb4))
- **redis-smq:** update dual callback & promise support docs ([76bb961](https://github.com/weyoss/redis-smq/commit/76bb9615ec9aa4d41836fac3965bc734dd623522))
- **redis-smq:** update examples in IRedisSMQConfig JSDocs ([d9dc170](https://github.com/weyoss/redis-smq/commit/d9dc170c4dac5d6778d05805db05b7a753ded25f))
- fix incorrect link to batch acks documentation ([38dd022](https://github.com/weyoss/redis-smq/commit/38dd022a20aec577c4d719a4107daba09ebc738b))
- update READMEs (v10.0.0 → next) ([8247b2f](https://github.com/weyoss/redis-smq/commit/8247b2f19d7caefcac6efdebd33f5592f743a1e7))
- update changelog commit hashes after email change ([ce13adf](https://github.com/weyoss/redis-smq/commit/ce13adfc8cf2e9a5b7f2573a413e534ed4cafec3))

## ♻️ Code Refactoring

- **redis-smq-benchmarks:** use new configuration/bootstrap API ([bfcf2d1](https://github.com/weyoss/redis-smq/commit/bfcf2d1a17e2f0396baf0267e9a60adb0a16eeef))
- **redis-smq-common:** add exists() method to IRedisClient ([ec7d6c7](https://github.com/weyoss/redis-smq/commit/ec7d6c76f5219199d446ee2907ed35b28228fa33))
- **redis-smq-rest-api:** update error map ([ede436f](https://github.com/weyoss/redis-smq/commit/ede436f65437d594e268ac3426b4657ca8c057d0))
- **redis-smq-rest-api:** use new configuration/bootstrap API ([da27b9a](https://github.com/weyoss/redis-smq/commit/da27b9ac20c8103afe34629a5363cee18e81be83))
- **redis-smq-web-server:** use new configuration/bootstrap API ([1a3bb45](https://github.com/weyoss/redis-smq/commit/1a3bb45b7bdac58babebf6112f17ff5631c7bd3a))
- **redis-smq-web-ui:** remove unused QueuePropertiesCard component ([89cf01d](https://github.com/weyoss/redis-smq/commit/89cf01d988e9ebf38eb9e3343e00d74b16d427f8))
- **redis-smq-web-ui:** unify all message views into single MessagesView ([5b9f177](https://github.com/weyoss/redis-smq/commit/5b9f17789fe6fa70e09a27a2df434c649484bf7b))
- **redis-smq-web-ui:** use typed router, clean up codebase ([2b58fe0](https://github.com/weyoss/redis-smq/commit/2b58fe0d64375b606874f885d8b0a2f63701d098))
- **redis-smq:** add lastProcessedAt prop to MessageState ([c664159](https://github.com/weyoss/redis-smq/commit/c6641598844861444c279a6f760930830738d279))
- **redis-smq:** improve redis keys hierarchy ([5155e6d](https://github.com/weyoss/redis-smq/commit/5155e6df8d6acae02e3f270c2ab14c438b1c9905))
- **redis-smq:** simplify RedisSMQ class API ([913b6e8](https://github.com/weyoss/redis-smq/commit/913b6e862198caff18c1177948f556d9e9d7e418))
- **redis-smq:** update IRedisSMQConfig.logger to support boolean values ([b2cb422](https://github.com/weyoss/redis-smq/commit/b2cb422b7404b4aa8e37ef91b4e04ef7dadf302a))

## 🚀 Chore

- **redis-smq-ci:** add sync-releases and update-changelog-hashes utils ([6ef95dc](https://github.com/weyoss/redis-smq/commit/6ef95dc5d2d9bbf9594c54418ce902c9f2f44f22))
- add scripts for sync-releases and update-changelog-hashes ([c51b33c](https://github.com/weyoss/redis-smq/commit/c51b33ccf66c3a84dfb9c90371f6134c1fa36d7a))
- rename "docs" script to "document" ([265d58c](https://github.com/weyoss/redis-smq/commit/265d58c86fa0c99493d1d984349b390b0ce35e9e))

## 📦 Build System

- add strict bash script options for robustness and debugging ([64f1a0a](https://github.com/weyoss/redis-smq/commit/64f1a0ab5b13982b9e039530f94cdc1016d18adf))
- fix shell compatibility by using bash ([3066eea](https://github.com/weyoss/redis-smq/commit/3066eea5bb4e7ddff744e1e855753881d8fb8ed1))
- fix typo in "prepare" script ([6065951](https://github.com/weyoss/redis-smq/commit/60659512e615bbd6fc49c9fc32e65f745482729b))

## 👷 Continuous Integration

- consolidate changelogs into release artifacts ([84a30ef](https://github.com/weyoss/redis-smq/commit/84a30efe2b87a5df3ec5b1311d2ba27325e2d7f0))
- detect branch correctly during rebase operations ([6ae0309](https://github.com/weyoss/redis-smq/commit/6ae0309ee377040271d5f1c75d1aecd4b68ce6c9))
- refactor build process and script naming ([516186c](https://github.com/weyoss/redis-smq/commit/516186cb0bf3be248eadab3c05515d1acad26456))
- remove post-merge hooks ([af9bed6](https://github.com/weyoss/redis-smq/commit/af9bed6ad1b7390937d7cd7fef7f15d37fa5908f))
- skip README update to avoid detached HEAD issues ([9f8806f](https://github.com/weyoss/redis-smq/commit/9f8806faccde33089c2c95470282ab620ff77d52))
