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
import { downloadPrebuiltBinary } from '../src/redis-server/redis-binary.js';

program
  .command('redis')
  .description('Handle Redis server tasks')
  .option('--download-binary', 'Download Redis binary')
  .option('--build-from-source', 'Build Redis binary')
  .action(
    async (
      options: {
        downloadBinary?: boolean;
        buildFromSource?: boolean;
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
      console.error(
        'No Redis task specified. Use --download-binary or --build-from-source.',
      );
    },
  );

program.parse(process.argv);
