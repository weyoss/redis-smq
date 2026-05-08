# Namespaces

Namespaces isolate queues and exchanges. Use them to separate environments or applications within the same Redis instance.

## Quick Start

```javascript
const { RedisSMQ } = require('redis-smq');
const queueManager = RedisSMQ.createQueueManager();
```

## Default Namespace

The default namespace comes from [configuration](configuration.md). When you use a simple queue name, the default namespace is applied:

```javascript
// Uses default namespace (e.g., 'production')
queueManager.save('orders', ...);
```

## Explicit Namespace

Specify a namespace per operation:

```javascript
// Uses 'staging' namespace regardless of default
queueManager.save({ ns: 'staging', name: 'orders' }, ...);
```

## Listing Namespaces

```javascript
queueManager.getNamespaces((err, namespaces) => {
  console.log('Namespaces:', namespaces);
  // ['production', 'staging', 'analytics']
});
```

## Deleting a Namespace

Deleting a namespace removes all queues and exchanges within it:

```javascript
queueManager.deleteNamespace('staging', (err) => {
  if (err) console.error('Failed:', err);
  else console.log('Namespace deleted');
});
```

## Multiple Namespaces

RedisSMQ supports any number of namespaces simultaneously. The configured default is only a fallback — it does not restrict using other namespaces:

```javascript
// All in the same Redis instance
queueManager.save('orders', ...);                          // default namespace
queueManager.save({ ns: 'analytics', name: 'orders' }, ...); // analytics namespace
queueManager.save({ ns: 'staging', name: 'orders' }, ...);   // staging namespace
```

## Valid Names

Namespace names follow the same rules as queue names:

- Start with a letter (a–z)
- Lowercase only
- Letters, digits, hyphens, underscores, dots

```
✅ production
✅ my-app
✅ app.staging

❌ Production   (uppercase)
❌ my app       (space)
❌ 3app         (starts with digit)
```

## Promise Style

```javascript
const namespaces = await queueManager.getNamespaces();
await queueManager.deleteNamespace('staging');
```

## Related

- [Configuration](configuration.md) — Setting the default namespace
- [Queue Management](queue-management.md) — Creating queues with namespaces
