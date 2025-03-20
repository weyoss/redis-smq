/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { exec } from 'child_process';

async function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    exec(`lsof -i :${port}`, (error, stdout) => {
      resolve(stdout !== '');
    });
  });
}

export async function getRandomPort(): Promise<number> {
  let port = 0;
  while (!port || (await isPortInUse(port))) {
    port = Math.floor(Math.random() * 64000) + 1024;
  }
  return port;
}
