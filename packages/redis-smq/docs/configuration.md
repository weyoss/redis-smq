[RedisSMQ](../README.md) / [Docs](README.md) / Configuration

# Configuration

RedisSMQ must be initialized once per process before creating any producers, consumers, or managers.

Required initialization options:

- `RedisSMQ.initialize(redisConfig, cb)`
- `RedisSMQ.initializeWithConfig(redisSMQConfig, cb)`

After global initialization, using the Configuration class is optional. You can read or update the persisted
configuration if needed, but you do not need to call `Configuration.initialize` directly; it is handled internally by
`RedisSMQ.initialize` or `RedisSMQ.initializeWithConfig`.

This guide covers:

- Global initialization (required)
- Optional configuration persistence and management
- Example configuration shapes and best practices

## Global Initialization (required)

Initialize RedisSMQ once at startup.

### Option A: Initialize with Redis connection (recommended for most)

```typescript
import { RedisSMQ } from 'redis-smq';
import { ERedisConfigClient } from 'redis-smq-common';

// Initialize once with Redis connection details
RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: {
      host: '127.0.0.1',
      port: 6379,
    },
  },
  (err) => {
    if (err) console.error('Failed to initialize RedisSMQ:', err);
  },
);
```

### Option B: Initialize with full RedisSMQ configuration (persisted in Redis)

Use when you want configuration to be persisted and shared across processes. On first run, the configuration is saved
to Redis. Subsequent processes can simply call `RedisSMQ.initialize(...)` or `initializeWithConfig(...)` to reuse it.

```typescript
import { RedisSMQ } from 'redis-smq';
import { ERedisConfigClient, EConsoleLoggerLevel } from 'redis-smq-common';

RedisSMQ.initializeWithConfig(
  {
    namespace: 'my_project_name',
    redis: {
      client: ERedisConfigClient.IOREDIS,
      options: {
        host: '127.0.0.1',
        port: 6379,
      },
    },
    logger: {
      enabled: true,
      options: {
        logLevel: EConsoleLoggerLevel.INFO,
      },
    },
    messageAudit: false,
    eventBus: {
      enabled: false,
    },
  },
  (err) => {
    if (err) {
      console.error('Failed to initialize with config:', err);
      return;
    }
    console.log('RedisSMQ initialized (configuration persisted in Redis)');
  },
);
```

Note

- Do not call `Configuration.initialize` in application code. `RedisSMQ.initialize` or `RedisSMQ.initializeWithConfig`
  will load or persist configuration and prepare the singleton for you.

## Optional: Inspecting and Managing Configuration

After RedisSMQ has been initialized, you may read or update the configuration via the Configuration class.

### Read current configuration

```typescript
import { RedisSMQ } from 'redis-smq';
import { Configuration } from 'redis-smq';

RedisSMQ.initialize(
  {
    /* redis config */
  } as any,
  (err) => {
    if (err) return console.error('Init failed:', err);

    const cfg = Configuration.getConfig(); // parsed, validated config
    console.log('Namespace:', cfg.namespace);
    console.log('Redis host:', cfg.redis.options.host);
    console.log('EventBus enabled:', cfg.eventBus.enabled);
  },
);
```

### Update selected fields and persist

```typescript
import { RedisSMQ } from 'redis-smq';
import { Configuration } from 'redis-smq';

RedisSMQ.initialize(
  {
    /* redis config */
  } as any,
  (err) => {
    if (err) return console.error('Init failed:', err);

    const cfg = Configuration.getInstance();
    cfg.updateConfig(
      {
        logger: { enabled: true },
        messageAudit: {
          acknowledged: { queueSize: 2000 },
        },
      },
      (updateErr) => {
        if (updateErr) return console.error('Update failed:', updateErr);
        console.log('Configuration updated and saved to Redis');
      },
    );
  },
);
```

### Save a new configuration object

```typescript
import { RedisSMQ } from 'redis-smq';
import { Configuration } from 'redis-smq';

RedisSMQ.initialize(
  {
    /* redis config */
  } as any,
  (err) => {
    if (err) return console.error('Init failed:', err);

    const cfg = Configuration.getInstance();
    cfg.save(
      {
        logger: { enabled: false },
      },
      (err) => {
        if (err) return console.error('Save failed:', err);
        console.log('Configuration saved to Redis');
      },
    );
  },
);
```

### Check if configuration exists in Redis

```typescript
import { RedisSMQ } from 'redis-smq';
import { Configuration } from 'redis-smq';

RedisSMQ.initialize(
  {
    /* redis config */
  } as any,
  (err) => {
    if (err) return console.error('Init failed:', err);

    const cfg = Configuration.getInstance();
    cfg.exists((err, exists) => {
      if (err) return console.error('Exists check failed:', err);
      console.log(
        exists
          ? 'Configuration exists in Redis'
          : 'No configuration found in Redis',
      );
    });
  },
);
```

### Reset to defaults and persist

```typescript
import { RedisSMQ } from 'redis-smq';
import { Configuration } from 'redis-smq';

RedisSMQ.initialize(
  {
    /* redis config */
  },
  (err) => {
    if (err) return console.error('Init failed:', err);

    const cfg = Configuration.getInstance();
    cfg.reset((err) => {
      if (err) return console.error('Reset failed:', err);
      console.log('Configuration reset to defaults and persisted to Redis');
    });
  },
);
```

## Configuration parameters

Here’s an example of a complete RedisSMQ configuration:

```typescript
import { IRedisSMQConfig } from 'redis-smq';
import { ERedisConfigClient, EConsoleLoggerLevel } from 'redis-smq-common';

const config: IRedisSMQConfig = {
  namespace: 'my_project_name',
  redis: {
    client: ERedisConfigClient.IOREDIS,
    options: {
      host: '127.0.0.1',
      port: 6379,
      connect_timeout: 3600000, // 1 hour
    },
  },
  logger: {
    enabled: true,
    options: {
      logLevel: EConsoleLoggerLevel.INFO,
      // ...
    },
  },
  messageAudit: false, // Set to true to enable message audit
  eventBus: {
    enabled: false, // Set to true to enable the event bus
  },
};
```

### Message Audit Configuration

RedisSMQ supports flexible message audit configuration for acknowledged and dead-lettered messages.

- Simple boolean

```typescript
import { IRedisSMQConfig } from 'redis-smq';

const config: IRedisSMQConfig = {
  // ... other config
  messageAudit: true, // Enables storage for all message types with default settings
};
```

- Advanced configuration

```typescript
import { IRedisSMQConfig } from 'redis-smq';

const config: IRedisSMQConfig = {
  // ... other config
  messageAudit: {
    acknowledgedMesssages: {
      queueSize: 1000, // Maximum number of messages to store
      expire: 3600, // Message expiration time in seconds (1 hour)
    },
    deadLetteredMessages: {
      queueSize: 500, // Store up to 500 dead-lettered messages
      expire: 86400, // Keep for 24 hours
    },
  },
};
```

- Mixed configuration

```typescript
import { IRedisSMQConfig } from 'redis-smq';

const config: IRedisSMQConfig = {
  // ... other config
  messageAudit: {
    acknowledgedMessages: true, // Enable with default settings
    deadLetteredMessages: {
      queueSize: 100,
      expire: 7200, // 2 hours
    },
  },
};
```

- Selective configuration

```typescript
import { IRedisSMQConfig } from 'redis-smq';

const config: IRedisSMQConfig = {
  // ... other config
  messageAudit: {
    acknowledgedMessages: false, // Disable acknowledged message audit
    deadLetteredMessages: {
      // Enable only dead-lettered message audit
      queueSize: 200,
      expire: 604800, // 7 days
    },
  },
};
```

## Configuration Best Practices

1. Initialize once per process using RedisSMQ.initialize(...) or RedisSMQ.initializeWithConfig(...). This is required.
2. Use Redis-backed configuration (initializeWithConfig) when:
   - Multiple processes must share the same settings
   - You want configuration to persist across restarts
3. Use clear, environment-specific namespaces to avoid collisions (e.g., my_app_dev, my_app_staging, my_app_prod).
4. Plan message audit carefully:
   - Enable in development/staging when you need visibility
   - Set retention and queue sizes appropriate for production load
5. Treat the object returned by Configuration.getConfig() as read-only. Use updateConfig or save to persist changes safely.

For detailed API, see:

- Configuration class: [api/classes/Configuration.md](api/classes/Configuration.md)
- IRedisSMQConfig: [api/interfaces/IRedisSMQConfig.md](api/interfaces/IRedisSMQConfig.md)
- Message audit: [message-audit.md](message-audit.md)
