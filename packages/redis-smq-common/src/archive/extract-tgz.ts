/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import fs from 'fs';
import * as zlib from 'node:zlib';
import * as tar from 'tar';

/**
 * Extracts a .tgz (tar.gz) file to the specified destination directory.
 *
 * @param {string} tgzPath - The path to the .tgz file.
 * @param {string} destDir - The destination directory where the contents will be extracted.
 * @returns {Promise<void>} - A promise that resolves when the extraction is complete.
 */
export async function extractTgz(
  tgzPath: string,
  destDir: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(tgzPath);
    const gunzip = zlib.createGunzip();
    const extract = tar.extract({ cwd: destDir });

    readStream
      .pipe(gunzip)
      .pipe(extract)
      .on('finish', () => {
        resolve();
      })
      .on('error', (err: Error) => {
        reject(err);
      });
  });
}
