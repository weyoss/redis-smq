/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { execSync } from 'child_process';

export function getRepositoryFromGit(): { owner: string; repo: string } {
  const remoteUrl = execSync('git config --get remote.origin.url', {
    encoding: 'utf-8',
  }).trim();
  const match = remoteUrl.match(/(?:github\.com\/)?([^/]+)\/([^/]+)/);

  if (!match) {
    throw new Error('Unable to determine repository from git remote');
  }

  return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
}
