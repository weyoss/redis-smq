[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / TLifecycleTarget

# Type Alias: TLifecycleTarget

> **TLifecycleTarget** = `"UP"` \| `"DOWN"`

The two stable states a transition can target.

`'UP'` corresponds to the `DOWN → GOING_UP → UP` path; `'DOWN'` to the
`UP → GOING_DOWN → DOWN` path. Used by the protected `switchTo()` method
that subclass overrides may call.
