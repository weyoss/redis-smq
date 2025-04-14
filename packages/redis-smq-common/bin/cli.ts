#!/usr/bin/env node

/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { program } from 'commander';
import { buildRedisBinary } from '../src/redis-server/build-redis.js';
import { RedisServer } from '../src/redis-server/index.js';
import { downloadPrebuiltBinary } from '../src/redis-server/redis-binary.js';

program
  .command('redis')
  .description('Handle Redis server tasks')
  .option('--download-binary', 'Download Redis binary')
  .option('--build-from-source', 'Build Redis binary')
  .option('--start-server', 'Start Redis server')
  .option('--port <number>', 'Redis server port', '6379')
  .action(
    async (
      options: {
        downloadBinary?: boolean;
        buildFromSource?: boolean;
        startServer?: boolean;
        port?: string;
      } = {},
    ) => {
      if (options.downloadBinary) {
        console.log('Downloading Redis binary...');
        await downloadPrebuiltBinary();
        console.log('Done.');
        return;
      }
      if (options.buildFromSource) {
        console.log('Building Redis binary...');
        await buildRedisBinary();
        console.log('Done.');
        return;
      }
      if (options.startServer) {
        const port = parseInt(options.port || '6379', 10);
        const shutdown = async () => {
          console.log('\nShutting down Redis server...');
          await server.shutdown();
          process.exit(0);
        };

        console.log(`Starting Redis server on ${port}...`);
        const server = new RedisServer();

        // Handle process termination
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

        await server.start(port);
        console.log('Redis server is running. Press Ctrl+C to stop.');
        return;
      }
      console.error(
        'No Redis task specified. Use --download-binary, --build-from-source, or --start-server',
      );
    },
  );

program.parse(process.argv);
