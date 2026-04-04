[RedisSMQ](../README.md) / [Documentation](README.md) / Configuration

# Configuration

**RedisSMQ splits system startup from behavior settings into two APIs:**

**1. System initialization** – `RedisSMQ.initialize()`
Connects to Redis, loads the config, and starts the system. Call once before any queue operations.

**2. Behavior configuration** – `ConfigManager`
Controls settings like namespace, audit logs, and logging. Changes sync instantly across all app instances—no restart needed.

Initialize once at startup, then use `ConfigManager` to adjust settings anytime.

**Important:** Configuration lives **inside Redis**, not in your code. This keeps settings consistent across your entire system.

And there's only one way to initialize: `RedisSMQ.initialize()`. The Redis connection details you pass only tell
it **where Redis is**—they don't configure the queue system itself.

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
    else console.log('RedisSMQ ready - configuration loaded from Redis');
  },
);
```

## Updating Configuration

To change configuration settings (like enabling message audit), use `ConfigManager`:

```javascript
import { ConfigManager } from 'redis-smq';

// Get the config manager instance
const configManager = new ConfigManager();

// Update configuration
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

## Cross-Instance Configuration Synchronization

When running multiple application instances, configuration changes automatically synchronize across all instances.

**How it works:**

- RedisSMQ listens for configuration changes via the internal event bus
- When one instance updates configuration, it publishes the change
- All other instances receive the update and reload automatically
- Version checking prevents race conditions and stale updates

```javascript
// Instance A updates configuration
await configManager.updateConfig({ messageAudit: true });

// Instance B automatically receives the change (no manual reload needed)
// Configuration.updated event is emitted on all instances
```

## Configuration Options

### Core Settings

```javascript
const config = {
  namespace: 'myapp', // Isolates your app's queues (stored in Redis)
  logger: false, // Console logging
  messageAudit: false, // Track processed messages
};
```

**Note:** Redis connection settings (`host`, `port`, `password`, etc.) are **NOT** part of the stored configuration. They're passed to `initialize()` on every startup.

### Complete Configuration Flow

```javascript
// Step 1: Initialize the system (creates default config if needed)
await RedisSMQ.initialize({
  client: ERedisConfigClient.IOREDIS,
  options: { host: '192.168.1.10', port: 6380 },
});

// Step 2: Update configuration as needed
const configManager = new ConfigManager();
await configManager.updateConfig({
  namespace: 'production-app',
  messageAudit: true,
  logger: {
    enabled: true,
    options: {
      logLevel: 'DEBUG',
    },
  },
});

// Step 3: Verify configuration
const currentConfig = configManager.getConfig();
console.log('Current namespace:', currentConfig.namespace);
console.log('Message audit enabled:', currentConfig.messageAudit);
```

## Namespace Configuration

The `namespace` setting defines the **default namespace** used when queue operations don't explicitly specify a namespace.

```javascript
// Set default namespace
await configManager.updateConfig({
  namespace: 'myapp-prod',
});
```

**How namespace resolution works:**

```javascript
// When using simple queue name (string), default namespace is used
const msg = new ProducibleMessage();
msg.setQueue('user-events'); // Uses 'myapp-prod' namespace
msg.setDirectExchange('tasks'); // Uses 'myapp-prod' namespace

// When using full queue parameters, explicit namespace takes precedence
const queueManager = new QueueManager();
queueManager.save(
  { ns: 'analytics', name: 'user-events' }, // Uses 'analytics' namespace
  EQueueType.FIFO,
  EQueueDeliveryModel.POINT_TO_POINT,
  (err, result) => {
    /// ...
  },
);
```

**Multiple namespaces in same RedisSMQ instance:**

RedisSMQ supports multiple namespaces simultaneously. The configured `namespace` is simply the default fallback:

```javascript
// Default namespace: 'myapp-prod'
await configManager.updateConfig({ namespace: 'myapp-prod' });

// These queues exist in different namespaces within the same Redis instance
await queueManager.save(
  'orders',
  EQueueType.FIFO,
  EQueueDeliveryModel.POINT_TO_POINT,
);
await queueManager.save(
  { name: 'orders', ns: 'myapp-staging' },
  EQueueType.FIFO,
  EQueueDeliveryModel.POINT_TO_POINT,
);
await queueManager.save(
  { name: 'orders', ns: 'analytics' },
  EQueueType.FIFO,
  EQueueDeliveryModel.POINT_TO_POINT,
);
```

**Note:** The namespace setting only affects operations that don't explicitly provide a namespace. It does not restrict or prevent using other namespaces.

## Message Audit Configuration

Message audit creates dedicated Redis storage to track processed messages. Use it for monitoring, debugging, and compliance auditing.

### Storage Types

**Acknowledged Messages:** Tracks successfully processed message IDs per queue

**Dead-Lettered Messages:** Tracks messages that failed and exceeded retry limits

**Unacknowledgement History:** Stores detailed failure metadata per message (cause, action, attempt count)

### Enable All Tracking

```javascript
await configManager.updateConfig({
  messageAudit: true, // Enables acknowledged + dead-lettered with defaults
});
```

### Enable with Failure History

```javascript
await configManager.updateConfig({
  messageAudit: {
    acknowledgedMessages: true,
    deadLetteredMessages: true,
    unacknowledgementHistory: true, // Track failure details
  },
});
```

### Selective Tracking

```javascript
await configManager.updateConfig({
  messageAudit: {
    acknowledgedMessages: true, // Track successful messages only
    deadLetteredMessages: false, // Don't track failed messages
    unacknowledgementHistory: true, // Track failure details
  },
});
```

### Advanced Configuration with Limits

```javascript
await configManager.updateConfig({
  messageAudit: {
    acknowledgedMessages: {
      enabled: true,
      queueSize: 5000, // Keep last 5000 successful messages per queue
      expire: 43200, // Delete after 12 hours
    },
    deadLetteredMessages: {
      enabled: true,
      queueSize: 10000, // Keep last 10000 failed messages per queue
      expire: 604800, // Delete after 7 days
    },
    unacknowledgementHistory: {
      enabled: true,
      maxSize: 100, // Keep last 100 failure records per message
    },
  },
});
```

### Understanding Storage Limits

| Setting     | Purpose                         | Default       | Behavior                    |
| ----------- | ------------------------------- | ------------- | --------------------------- |
| `queueSize` | Max messages per queue          | 0 (unlimited) | Oldest evicted when reached |
| `expire`    | Retention time in seconds       | 0 (unlimited) | Auto-delete after TTL       |
| `maxSize`   | Max failure records per message | 100           | Oldest evicted when reached |

### Performance Impact

- **Disabled (default):** No overhead, no visibility
- **Enabled with limits:** Minimal Redis memory overhead, good for production
- **Unlimited storage:** Can consume significant memory, use cautiously

## Managing Configuration

### Check Current Settings

```javascript
const { Configuration } = require('redis-smq');
const config = Configuration.getConfig();

console.log('Namespace:', config.namespace);
console.log('Message audit:', config.messageAudit);
console.log('Logger enabled:', config.logger.enabled);
```

### Reload Configuration from Redis

```javascript
const configManager = new ConfigManager();

// Manual reload (usually not needed due to auto-sync)
await configManager.reload();

const updatedConfig = configManager.getConfig();
```

### Update Configuration

```javascript
// Reset to default values
await configManager.updateConfig({
  namespace: 'my-namespace',
  messageAudit: false,
  logger: { enabled: false },
});
```

## Best Practices

### 1. Initialize Once at Application Startup

```javascript
// app.js - Application entry point
async function startApp() {
  try {
    await RedisSMQ.initialize({
      client: ERedisConfigClient.IOREDIS,
      options: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
    });

    // Now create producers, consumers, etc.
    const producer = await RedisSMQ.startProducer();

    console.log('Application ready');
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}
```

### 2. Configure Before Creating Components

```javascript
// ✅ CORRECT: Configure first, then create components
await RedisSMQ.initialize(redisConnection);
const configManager = new ConfigManager();
await configManager.updateConfig({ messageAudit: true });
const producer = await RedisSMQ.createProducer(); // Uses updated config

// ❌ WRONG: Creating components before configuration is complete
const producer = await RedisSMQ.createProducer(); // Uses default config
await configManager.updateConfig({ messageAudit: true }); // Too late
```

### 3. Set Production-Ready Audit Limits

```javascript
if (process.env.NODE_ENV === 'production') {
  await configManager.updateConfig({
    messageAudit: {
      acknowledgedMessages: {
        enabled: true,
        queueSize: 10000, // Keep 10k successful messages
        expire: 86400, // Delete after 24 hours
      },
      deadLetteredMessages: {
        enabled: true,
        queueSize: 5000, // Keep 5k failed messages
        expire: 604800, // Delete after 7 days
      },
      unacknowledgementHistory: {
        enabled: true,
        maxSize: 50, // Keep 50 failure records per message
      },
    },
  });
}
```

---

**Related**:

- [Message Audit](message-audit.md) - Tracking processed messages
- [EventBus](event-bus.md) - System event monitoring
- [Performance](performance.md) - Optimization tips
- [ConfigManager](api/classes/ConfigManager.md) - Complete configuration options
