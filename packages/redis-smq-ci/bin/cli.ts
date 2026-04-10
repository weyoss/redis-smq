#!/usr/bin/env node

/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Command } from 'commander';
import packageJson from '../package.json' with { type: 'json' };
import { consolidateChangelogCommand } from '../src/consolidate-changelog/consolidate-changelog-command.js';
import { syncReleasesCommand } from '../src/sync-releases/sync-releases-command.js';
import { updateChangelogHashesCommand } from '../src/update-changelog-hashes/update-changelog-hashes-command.js';

const program = new Command();

program
  .name('redis-smq-ci')
  .description('Redis SMQ CLI tools')
  .version(packageJson.version);

consolidateChangelogCommand(program);
syncReleasesCommand(program);
updateChangelogHashesCommand(program);

program.parse(process.argv);
