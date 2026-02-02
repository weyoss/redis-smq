[RedisSMQ](../README.md) / [Docs](README.md) / Version Compatibility

# Version Compatibility

For optimal performance and stability, keep all RedisSMQ packages aligned to the same version number.

## Required Packages

Make sure these packages share the same version:

- `redis-smq`
- `redis-smq-common`
- `redis-smq-rest-api`
- `redis-smq-web-ui`
- `redis-smq-web-server`
- `redis-smq-benchmarks`

## How to Install

### Install Latest Versions (Recommended)

```bash
npm install redis-smq@latest redis-smq-common@latest redis-smq-rest-api@latest redis-smq-web-server@latest redis-smq-web-ui@latest redis-smq-benchmarks@latest
```

### Install Specific Version

```bash
npm install redis-smq@9.0.12 redis-smq-common@9.0.12 redis-smq-rest-api@9.0.12 redis-smq-web-server@9.0.12 redis-smq-web-ui@9.0.12 redis-smq-benchmarks@9.0.12
```

## Check Your Versions

Run this command to see installed versions:

```bash
npm install redis-smq redis-smq-common redis-smq-rest-api redis-smq-web-server redis-smq-web-ui redis-smq-benchmarks
```

## Solving Version Issues

### Common Problems

If versions don’t match, you might encounter:

- API errors
- Type errors
- Unexpected crashes

### How to Fix

1. Check current versions with `npm list`
2. Update all packages to the same version
3. Clear npm cache if problems persist:
   ```bash
   npm cache clean --force
   ```
