[RedisSMQ](../README.md) / [Documentation](README.md) / Configuring RedisSMQ

# Configuring RedisSMQ

RedisSMQ splits system startup from behavior configuration into two separate APIs.

**System initialization** — `RedisSMQ.initialize()` — connects to Redis, loads configuration, and starts the system. Call once before any queue operations.

**Behavior configuration** — `ConfigManager` — controls settings like namespace, audit logs, and logging. Changes sync instantly across all application instances without restart.

Configuration lives **inside Redis**, not in your code. This keeps settings consistent across your entire system.

## System Initialization

```javascript
const { RedisSMQ } = require('redis-smq');
const { ERedisConfigClient } = require('redis-smq-common');

RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: {
      host: '192.168.1.10',
      port: 6380,
    },
  },
  (err) => {
    if (err) console.error('Initialization failed:', err);
    else console.log('RedisSMQ ready');
  },
);
```

The Redis connection details passed to `initialize()` only tell it where Redis is — they don't configure the queue system itself. Configuration is loaded from Redis after connecting.

## Updating Configuration

Use `ConfigManager` to change settings:

```javascript
import { ConfigManager } from 'redis-smq';

const configManager = new ConfigManager();

// Enable message audit and logging
await configManager.updateConfig({
  messageAudit: true,
  logger: true,
});

// Or with callback
configManager.updateConfig({ messageAudit: true }, (err) => {
  if (err) console.error('Update failed:', err);
  else console.log('Configuration updated');
});
```

## Cross-Instance Synchronization

When running multiple application instances, configuration changes automatically sync across all instances:

- RedisSMQ listens for configuration changes via the internal event bus
- When one instance updates configuration, it publishes the change
- All other instances receive the update and reload automatically
- Version checking prevents race conditions and stale updates

```javascript
// Instance A updates configuration
await configManager.updateConfig({ messageAudit: true });

// Instance B automatically receives the change
// No manual reload needed
```

## Reading Configuration

```javascript
const { Configuration } = require('redis-smq');

const config = Configuration.getConfig();

console.log('Namespace:', config.namespace);
console.log('Message audit:', config.messageAudit);
console.log('Logger enabled:', config.logger.enabled);
```

## Configuration Options

### Namespace

The default namespace used when queue operations don't explicitly specify one:

```javascript
await configManager.updateConfig({
  namespace: 'production-app',
});
```

**How namespace resolution works:**

```javascript
// Simple queue name → uses default namespace
msg.setQueue('user-events'); // Uses 'production-app'

// Full queue params → explicit namespace takes precedence
msg.setQueue({ ns: 'analytics', name: 'user-events' }); // Uses 'analytics'
```

Multiple namespaces can coexist. The configured namespace is only the default fallback — it does not restrict using other namespaces.

### Logger

Controls console output:

```javascript
await configManager.updateConfig({
  logger: {
    enabled: true,
    options: {
      logLevel: 0, // 0=DEBUG, 1=INFO, 2=WARN, 3=ERROR
      includeTimestamp: true,
      colorize: true,
    },
  },
});

// Simple enable/disable
await configManager.updateConfig({ logger: true });
await configManager.updateConfig({ logger: false });
```

Disable logging in production for maximum throughput.

### Message Audit

Tracks processed messages for monitoring and debugging:

```javascript
// Enable all audit types
await configManager.updateConfig({ messageAudit: true });

// Enable selectively
await configManager.updateConfig({
  messageAudit: {
    acknowledgedMessages: true, // Track successful messages
    deadLetteredMessages: true, // Track failed messages
    unacknowledgementHistory: true, // Track failure timeline per message
  },
});

// With storage limits
await configManager.updateConfig({
  messageAudit: {
    acknowledgedMessages: {
      enabled: true,
      queueSize: 5000, // Keep last 5000 messages per queue
      expire: 43200, // Delete after 12 hours (seconds)
    },
    deadLetteredMessages: {
      enabled: true,
      queueSize: 10000,
      expire: 604800, // Delete after 7 days
    },
    unacknowledgementHistory: {
      enabled: true,
      maxSize: 100, // Keep last 100 failure records per message
    },
  },
});
```

**Storage limits:**

| Setting     | Purpose                         | Default       |
| ----------- | ------------------------------- | ------------- |
| `queueSize` | Max messages per queue          | 0 (unlimited) |
| `expire`    | Retention time in seconds       | 0 (unlimited) |
| `maxSize`   | Max failure records per message | 100           |

## Complete Configuration Flow

```javascript
// 1. Initialize the system
await RedisSMQ.initialize({
  client: ERedisConfigClient.IOREDIS,
  options: { host: '192.168.1.10', port: 6380 },
});

// 2. Update configuration
const configManager = new ConfigManager();
await configManager.updateConfig({
  namespace: 'production-app',
  messageAudit: {
    acknowledgedMessages: true,
    deadLetteredMessages: true,
  },
  logger: {
    enabled: true,
    options: { logLevel: 1 }, // INFO
  },
});

// 3. Verify
const config = Configuration.getConfig();
console.log('Namespace:', config.namespace);
console.log('Audit enabled:', config.messageAudit);
```

## Best Practices

- **Initialize once at startup** — call `RedisSMQ.initialize()` before creating any components
- **Configure before creating components** — updated configuration takes effect for new components
- **Set production-ready audit limits** — unlimited storage can consume significant Redis memory
- **Disable logging and audit in production** unless needed for monitoring
- **Let configuration sync automatically** — don't manually reload; the event bus handles it
