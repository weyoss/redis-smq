[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IConsoleLoggerOptions

# Interface: IConsoleLoggerOptions

## Table of contents

### Properties

- [colorize](IConsoleLoggerOptions.md#colorize)
- [dateFormat](IConsoleLoggerOptions.md#dateformat)
- [includeTimestamp](IConsoleLoggerOptions.md#includetimestamp)
- [logLevel](IConsoleLoggerOptions.md#loglevel)

## Properties

### colorize

• `Optional` **colorize**: `boolean`

Whether to colorize log messages with ANSI color codes

**`Default`**

```ts
true
```

___

### dateFormat

• `Optional` **dateFormat**: [`TConsoleLoggerOptionsDateFormatter`](../README.md#tconsoleloggeroptionsdateformatter)

Custom date formatter function to format timestamps
If not provided, ISO string format will be used

**`Example`**

```ts
// Format as local time
dateFormat: (date) => date.toLocaleTimeString()

// Format as YYYY-MM-DD HH:MM:SS
dateFormat: (date) => {
  return date.toISOString().replace('T', ' ').split('.')[0];
}
```

___

### includeTimestamp

• `Optional` **includeTimestamp**: `boolean`

Whether to include timestamps in log messages

**`Default`**

```ts
true
```

___

### logLevel

• `Optional` **logLevel**: ``"INFO"`` \| ``"DEBUG"`` \| [`EConsoleLoggerLevel`](../enums/EConsoleLoggerLevel.md) \| ``"WARN"`` \| ``"ERROR"``

Minimum log level to display
Can be specified as a string ('DEBUG', 'INFO', 'WARN', 'ERROR') or
using the numeric enum values from EConsoleLoggerLevel
Messages with a level lower than this will be suppressed

**`Default`**

```ts
EConsoleLoggerLevel.DEBUG (0)
```
