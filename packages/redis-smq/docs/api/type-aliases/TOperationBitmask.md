[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / TOperationBitmask

# Type Alias: TOperationBitmask

> **TOperationBitmask** = `number`

A combined mask of operations.

The value is the bitwise OR of the `OperationBitmask` entries for a
set of allowed operations. Testing whether an operation is allowed
reduces to `(mask & OperationBitmask[op]) !== 0`.
