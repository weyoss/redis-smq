[RedisSMQ](../README.md) / [Docs](README.md) / Version Compatibility

# Version Compatibility

## Package Version Alignment

It is crucial to maintain version alignment between all RedisSMQ packages to ensure compatibility and prevent potential
issues. Always install matching versions of:

- `redis-smq`
- `redis-smq-common`
- `redis-smq-rest-api`
- `redis-smq-web-ui`
- `redis-smq-web-server`

## Installation Example

```bash
# Installing specific version (recommended)
npm install redis-smq@8.0.2 redis-smq-common@8.0.2 redis-smq-rest-api@8.0.2 redis-smq-web-ui@8.0.2

# Or using the same tag
npm install redis-smq@latest redis-smq-common@latest redis-smq-rest-api@latest redis-smq-web-ui@latest
```

## Version Check

You can verify package versions in your project:

```bash
npm list redis-smq redis-smq-common redis-smq-rest-api redis-smq-web-ui 
```

## Troubleshooting

If you encounter version mismatch issues, you may see errors like:

- Incompatible API calls
- Type mismatches
- Runtime exceptions

To resolve:

1. Check current versions using `npm list`
2. Update all packages to matching versions
3. Clear npm cache if needed: `npm cache clean --force`
