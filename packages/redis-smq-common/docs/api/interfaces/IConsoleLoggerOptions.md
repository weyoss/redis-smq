[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IConsoleLoggerOptions

# Interface: IConsoleLoggerOptions

## Properties

### colorize?

> `optional` **colorize**: `boolean`

Whether to colorize log messages with ANSI color codes

#### Default

```ts
true
```

***

### dateFormat?

> `optional` **dateFormat**: [`TConsoleLoggerOptionsDateFormatter`](../type-aliases/TConsoleLoggerOptionsDateFormatter.md)

Custom date formatter function to format timestamps
If not provided, ISO string format will be used

#### Example

```ts
// Format as local time
dateFormat: (date) => date.toLocaleTimeString()

// Format as YYYY-MM-DD HH:MM:SS
dateFormat: (date) => {
  return date.toISOString().replace('T', ' ').split('.')[0];
}
```

***

### includeTimestamp?

> `optional` **includeTimestamp**: `boolean`

Whether to include timestamps in log messages

#### Default

```ts
true
```

***

### logLevel?

> `optional` **logLevel**: `"INFO"` \| `"DEBUG"` \| [`EConsoleLoggerLevel`](../enumerations/EConsoleLoggerLevel.md) \| `"WARN"` \| `"ERROR"`

Minimum log level to display
Can be specified as a string ('DEBUG', 'INFO', 'WARN', 'ERROR') or
using the numeric enum values from EConsoleLoggerLevel
Messages with a level lower than this will be suppressed

#### Default

```ts
EConsoleLoggerLevel.DEBUG (0)
```
