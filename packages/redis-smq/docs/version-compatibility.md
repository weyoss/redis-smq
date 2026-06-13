[RedisSMQ](../README.md) / [Documentation](README.md) / Version Compatibility

# Version Compatibility

All RedisSMQ packages must use the same version. Mismatched versions can cause API errors, type errors, and unexpected behavior.

## Required Packages

Keep these packages at the same version:

- `redis-smq`
- `redis-smq-common`
- `redis-smq-rest-api`
- `redis-smq-web-ui`
- `redis-smq-web-server`

## Installation

### Latest Versions (Recommended)

```bash
npm install redis-smq@next redis-smq-common@next redis-smq-rest-api@next redis-smq-web-ui@next redis-smq-web-server@next
```

### Specific Version

```bash
npm install redis-smq@9.0.12 redis-smq-common@9.0.12 redis-smq-rest-api@9.0.12 redis-smq-web-ui@9.0.12 redis-smq-web-server@9.0.12
```

## Checking Versions

```bash
npm list redis-smq redis-smq-common redis-smq-rest-api redis-smq-web-ui redis-smq-web-server
```

## Troubleshooting

### Version Mismatch

If versions don't match, you may see:

- API errors
- TypeScript type errors
- Unexpected runtime behavior

### Fix

1. Check installed versions: `npm list redis-smq redis-smq-common`
2. Update all packages to the same version
3. Clear npm cache if issues persist: `npm cache clean --force`
4. Delete `node_modules` and `package-lock.json`, then reinstall
