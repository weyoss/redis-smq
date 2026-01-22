# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [9.0.11-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.10-next.4...v9.0.11-next.0) (2026-01-22)

### 🚀 Chore

- continue updating packages to fix security vulnerabilities ([e92a155](https://github.com/weyoss/redis-smq/commit/e92a155cffa92e68bb159ac397d54a549bf1acb6))

### 📝 Documentation

- improve README files for clarity ([6ba6543](https://github.com/weyoss/redis-smq/commit/6ba65433d6743d336141e7351ee6267de42a0219))

## [9.0.10-next.4](https://github.com/weyoss/redis-smq/compare/v9.0.10-next.3...v9.0.10-next.4) (2026-01-16)

### 📝 Documentation

- adjust badges position to enhance page styling ([ef3e2fe](https://github.com/weyoss/redis-smq/commit/ef3e2fe19a1f61fb0cbd861090686c7ccfe3bbbe))
- refine notifications for master and next branch clarity ([63fef1b](https://github.com/weyoss/redis-smq/commit/63fef1bd430680e0de7eba7fe2b8c8f82e821bb9))

### ✅ Tests

- **redis-smq-benchmarks:** increase wait duration for benchmark results ([f59baf9](https://github.com/weyoss/redis-smq/commit/f59baf9b0d42a8f66760f4901704454776baf98e))

## [9.0.10-next.3](https://github.com/weyoss/redis-smq/compare/v9.0.10-next.2...v9.0.10-next.3) (2026-01-16)

### ✅ Tests

- **redis-smq-benchmark:** run benchmarks using 100 messages/10 consumers/5 producers ([99a0332](https://github.com/weyoss/redis-smq/commit/99a03322337a1cdb75ce41c8dcd105116aaf82f9))

## [9.0.10-next.2](https://github.com/weyoss/redis-smq/compare/v9.0.10-next.1...v9.0.10-next.2) (2026-01-10)

### 📝 Documentation

- **redis-smq-benchmarks:** remove unused heading ([0efbcaf](https://github.com/weyoss/redis-smq/commit/0efbcaf867a660e4fde5beba673bafaba44fb2fe))

## [9.0.10-next.1](https://github.com/weyoss/redis-smq/compare/v9.0.10-next.0...v9.0.10-next.1) (2026-01-10)

### ♻️ Code Refactoring

- **redis-smq-benchmarks:** add npm and codecov badges to README ([0e45f1c](https://github.com/weyoss/redis-smq/commit/0e45f1c7e2821f79aced45ef3b4ec3ff1054e68b))
- **redis-smq-benchmarks:** remove explicit process.exit() upon benchmark completion ([24a89ee](https://github.com/weyoss/redis-smq/commit/24a89eeb6d0296796d57c17895bd431f447218ed))

### ✅ Tests

- **redis-smq-benchmarks:** add tests to ensure functionality and reliability ([169f2f1](https://github.com/weyoss/redis-smq/commit/169f2f1f7bbe257a267657716f290fde5c6415f8))

## [9.0.10-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.9...v9.0.10-next.0) (2026-01-09)

### 🚀 Chore

- **redis-smq-benchmarks:** correct tag suffix in README template ([1bc1c01](https://github.com/weyoss/redis-smq/commit/1bc1c01af89079b5d2171e1659fc99dab657c507))
- update READMEs after merging 'v9.0.9' into 'next' ([12dc2bc](https://github.com/weyoss/redis-smq/commit/12dc2bc7c5d88d5a62613db05e0b43aa3047ca1b))

## [9.0.9](https://github.com/weyoss/redis-smq/compare/v9.0.9-next.5...v9.0.9) (2026-01-09)

### 🚀 Chore

- update READMEs after merging 'origin/next' into 'master' ([ebe66cc](https://github.com/weyoss/redis-smq/commit/ebe66cceb3c6e8067b0324c3e4076dfb496d49be))

## [9.0.9-next.5](https://github.com/weyoss/redis-smq/compare/v9.0.9-next.4...v9.0.9-next.5) (2026-01-09)

### 🚀 Chore

- **redis-smq-benchmarks:** update copyright headers ([bc84c45](https://github.com/weyoss/redis-smq/commit/bc84c452a4e0e8b8be6a462463ddc32837112d65))

## [9.0.9-next.4](https://github.com/weyoss/redis-smq/compare/v9.0.9-next.3...v9.0.9-next.4) (2026-01-09)

### 🐛 Bug Fixes

- **redis-smq-benchmarks:** correct worker ID to be zero-based ([4743b02](https://github.com/weyoss/redis-smq/commit/4743b028054e0865a6a12c7d674d158fd4a3bbea))

## [9.0.9-next.3](https://github.com/weyoss/redis-smq/compare/v9.0.9-next.2...v9.0.9-next.3) (2026-01-09)

### ♻️ Code Refactoring

- **redis-smq-benchmarks:** improve throughput calculation and benchmark result reporting ([06c7f23](https://github.com/weyoss/redis-smq/commit/06c7f23987943a3993335fe19d612d2abebd5859))
- **redis-smq-benchmarks:** provide nanosecond-precision throughput measurements ([776f35a](https://github.com/weyoss/redis-smq/commit/776f35a583358b5799e2064f80fe17d067ed51a2))
- **redis-smq-benchmarks:** use strong typing for thread messages, clean up ([a74baf7](https://github.com/weyoss/redis-smq/commit/a74baf7de3bc63d15d52e656596a336336eb8e2d))

## [9.0.9-next.2](https://github.com/weyoss/redis-smq/compare/v9.0.9-next.1...v9.0.9-next.2) (2026-01-08)

### 🐛 Bug Fixes

- **redis-smq-benchmarks:** use correct redis config for non-dev environment ([8001b33](https://github.com/weyoss/redis-smq/commit/8001b33106130cd8495ca2cd7f66322726a8ec32))

## [9.0.9-next.1](https://github.com/weyoss/redis-smq/compare/v9.0.9-next.0...v9.0.9-next.1) (2026-01-08)

### 🐛 Bug Fixes

- **redis-smq-benchmarks:** make bin/cli.js executable ([512af9b](https://github.com/weyoss/redis-smq/commit/512af9bf51d1e7b89f85181e07bc6f3f90e94b21))

## [9.0.9-next.0](https://github.com/weyoss/redis-smq/compare/v9.0.8...v9.0.9-next.0) (2026-01-08)

### 🐛 Bug Fixes

- **redis-smq-benchmarks:** update bin script name to match pkg name ([b277b88](https://github.com/weyoss/redis-smq/commit/b277b887ee62f6eb3bf2dce69a4df8e6b99ae1bf))

### 📝 Documentation

- **redis-smq-benchmarks:** fix installation command ([173bb75](https://github.com/weyoss/redis-smq/commit/173bb755b140bc61a77fc3662934e312b7f87e36))
- **redis-smq-benchmarks:** update configuration default values ([37d38f1](https://github.com/weyoss/redis-smq/commit/37d38f1e9196ffa701f773e15d4d1aed128b0ddb))

### ⚡ Performance Improvements

- **redis-smq-benchmarks:** add benchmarking tool to assess performance and throughput ([57f672c](https://github.com/weyoss/redis-smq/commit/57f672cfbcf221cde3d75c0946741759bf52b742))
