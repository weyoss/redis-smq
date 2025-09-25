[RedisSMQ](../README.md) / [Docs](README.md) / ESM & CJS Modules

# ESM & CJS Modules

JavaScript has evolved significantly, and today, ES modules (ESM) are recognized as the official standard packaging
format for both backend and frontend applications. However, CommonJS modules (CJS) continue to enjoy popularity and
are widely utilized by numerous NPM packages.

To accommodate a diverse range of developer preferences and use cases, RedisSMQ packages are available in both ESM and
CJS formats. This flexibility enables developers to choose the appropriate module system that best fits their
application's architecture.

## Using RedisSMQ with ES Modules (ESM)

To use RedisSMQ as an ES module, you can leverage the `import` syntax. Here’s a simple example:

```javascript
import { Queue } from 'redis-smq';

// Instantiate a new RedisSMQ Queue
const queue = new Queue();
```

### Benefits of ESM

- Static Analysis: ESM allows for static analysis, making it easier to identify and eliminate unused code.

- Tree Shaking: Bundlers can more effectively remove dead code, potentially reducing the size of your final application
  bundle.

- Improved Readability: The syntax is generally clearer and more intuitive, especially for new developers.

## Using RedisSMQ with CommonJS Modules (CJS)

For those using CommonJS, you can require RedisSMQ with the `require` syntax. Here’s an example:

```javascript
const { Queue } = require('redis-smq');

// Instantiate a new RedisSMQ Queue
const queue = new Queue();
```

### Benefits of CJS

- Widespread Compatibility: CJS is the traditional module format for Node.js and has broad compatibility with existing
  packages and libraries.

- Dynamic Loading: CommonJS allows for dynamic imports, which can be beneficial in certain scenarios where the module
  path is not known until runtime.

By offering RedisSMQ in both ESM and CJS formats, we aim to provide developers with the flexibility needed to integrate
seamlessly into their projects, regardless of their preferred module system. Whether you're building a modern
application with ES modules or maintaining legacy systems with CommonJS, RedisSMQ is designed to meet your needs.
