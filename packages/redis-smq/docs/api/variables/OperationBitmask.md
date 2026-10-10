[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / OperationBitmask

# Variable: OperationBitmask

> `const` **OperationBitmask**: `Record`\<[`EQueueOperation`](../enumerations/EQueueOperation.md), `number`\>

The bit position of each operation.

`OperationBitmask[op]` is `1 << op`. The registry combines these with
bitwise OR to represent the set of operations allowed under a given
queue state, and tests membership with bitwise AND.

The map is a plain object rather than a computed expression so that
TypeScript can infer `Record<EQueueOperation, number>` precisely. An
alternative construction would be:

const OperationBitmask = Object.fromEntries(
Object.values(EQueueOperation)
.filter((v) => typeof v === 'number')
.map((v) => [v, 1 << v]),
) as Record<EQueueOperation, number>;

which is what the source does NOT do; it spells each entry out. The
explicit form is preserved here.
