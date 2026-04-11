# RedisSMQ v10.1.0 Release Notes (2026-04-11)

## ✨ Features

- **redis-smq-rest-api:** add API endpoint for updating config ([e91f2c6](https://github.com/weyoss/redis-smq/commit/e91f2c6bd935d67bc375b13a7ae8c7a0dcdc4d76))
- **redis-smq-web-ui:** add configuration view and management ([fd51b00](https://github.com/weyoss/redis-smq/commit/fd51b004106e3345d7d477172287e356568f99e9))

## 🐛 Bug Fixes

- detect staged changes in post-merge hook ([5552f6f](https://github.com/weyoss/redis-smq/commit/5552f6fb7033546a8e4397927d6ae548b73f6895))

## 📝 Documentation

- **redis-smq:** update examples in IRedisSMQConfig JSDocs ([d9dc170](https://github.com/weyoss/redis-smq/commit/d9dc170c4dac5d6778d05805db05b7a753ded25f))
- fix incorrect link to batch acks documentation ([38dd022](https://github.com/weyoss/redis-smq/commit/38dd022a20aec577c4d719a4107daba09ebc738b))
- update READMEs (v10.0.0 → next) ([8247b2f](https://github.com/weyoss/redis-smq/commit/8247b2f19d7caefcac6efdebd33f5592f743a1e7))
- update changelog commit hashes after email change ([ce13adf](https://github.com/weyoss/redis-smq/commit/ce13adfc8cf2e9a5b7f2573a413e534ed4cafec3))

## ♻️ Code Refactoring

- **redis-smq-web-ui:** remove unused QueuePropertiesCard component ([89cf01d](https://github.com/weyoss/redis-smq/commit/89cf01d988e9ebf38eb9e3343e00d74b16d427f8))
- **redis-smq-web-ui:** unify all message views into single MessagesView ([5b9f177](https://github.com/weyoss/redis-smq/commit/5b9f17789fe6fa70e09a27a2df434c649484bf7b))
- **redis-smq-web-ui:** use typed router, clean up codebase ([2b58fe0](https://github.com/weyoss/redis-smq/commit/2b58fe0d64375b606874f885d8b0a2f63701d098))

## 👷 Continuous Integration

- detect branch correctly during rebase operations ([6ae0309](https://github.com/weyoss/redis-smq/commit/6ae0309ee377040271d5f1c75d1aecd4b68ce6c9))
- remove post-merge hooks ([af9bed6](https://github.com/weyoss/redis-smq/commit/af9bed6ad1b7390937d7cd7fef7f15d37fa5908f))
- skip README update to avoid detached HEAD issues ([9f8806f](https://github.com/weyoss/redis-smq/commit/9f8806faccde33089c2c95470282ab620ff77d52))

## 🚀 Chore

- **redis-smq-ci:** add sync-releases and update-changelog-hashes utils ([6ef95dc](https://github.com/weyoss/redis-smq/commit/6ef95dc5d2d9bbf9594c54418ce902c9f2f44f22))
- add scripts for sync-releases and update-changelog-hashes ([c51b33c](https://github.com/weyoss/redis-smq/commit/c51b33ccf66c3a84dfb9c90371f6134c1fa36d7a))
