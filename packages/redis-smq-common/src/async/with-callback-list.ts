/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async } from './async.js';
import { ICallback } from './types/index.js';

/**
 * A specialized version of withCallback that handles multiple resources
 *
 * This function is useful when your operation needs multiple resources that
 * are prepared by different setup functions.
 *
 * @param setups - Array of setup functions that prepare resources
 * @param operation - The main operation to execute with all setup results
 * @param callback - The callback to invoke with the final result
 * @typeparam S - The type of data returned by the setup functions (as a tuple)
 * @typeparam T - The type of data returned by the main operation
 *
 * @example
 * ```javascript
 * // Initialize application with multiple resources
 * withCallbackList(
 *   [
 *     // Setup 1: Load configuration
 *     (cb) => {
 *       fs.readFile('config.json', 'utf8', (err, data) => {
 *         if (err) return cb(err);
 *         try {
 *           const config = JSON.parse(data);
 *           cb(null, config);
 *         } catch (parseErr) {
 *           cb(new Error(`Invalid config file: ${parseErr.message}`));
 *         }
 *       });
 *     },
 *
 *     // Setup 2: Connect to database
 *     (cb) => {
 *       const db = new Database();
 *       db.connect((err, connection) => {
 *         if (err) return cb(err);
 *         cb(null, connection);
 *       });
 *     },
 *
 *     // Setup 3: Initialize cache
 *     (cb) => {
 *       const cache = new Cache();
 *       cache.initialize((err, client) => {
 *         if (err) return cb(err);
 *         cb(null, client);
 *       });
 *     }
 *   ],
 *
 *   // Main operation using all resources
 *   ([config, dbConnection, cacheClient], cb) => {
 *     const app = new Application(config, dbConnection, cacheClient);
 *     app.start((err, server) => {
 *       if (err) return cb(err);
 *       console.log(`Server started on port ${server.port}`);
 *       cb(null, server);
 *     });
 *   },
 *
 *   // Final callback
 *   (err, server) => {
 *     if (err) {
 *       console.error('Failed to start application:', err);
 *       process.exit(1);
 *     }
 *
 *     // Application successfully started
 *     console.log(`Application is running with PID ${process.pid}`);
 *   }
 * );
 *```
 */
export function withCallbackList<S extends unknown[], T>(
  setups: { [K in keyof S]: (cb: ICallback<S[K]>) => void },
  operation: (resources: S, cb: ICallback<T>) => void,
  callback: ICallback<T>,
): void {
  const results: unknown[] = [];
  let hasError = false;

  // If there are no setup functions, execute the operation immediately
  if (setups.length === 0) {
    // @ts-expect-error TS2345
    return operation(results, callback);
  }

  async.eachOf(
    setups,
    (setup, index, done) => {
      setup((err, resource) => {
        // If we already encountered an error, do nothing
        if (hasError) return;

        // Handle setup errors
        if (err) {
          hasError = true;
          return done(err);
        }

        // Handle undefined resources, null resource is allowed
        if (resource === undefined) {
          hasError = true;
          return done(
            new Error(
              `Setup operation at index ${index} returned empty result`,
            ),
          );
        }

        // Store the resource
        results[index] = resource;
        done();
      });
    },
    (err) => {
      if (err) return callback(err);
      // @ts-expect-error TS2345
      operation(results, callback);
    },
  );
}
