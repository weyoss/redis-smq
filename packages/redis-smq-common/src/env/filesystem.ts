/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import axios from 'axios';
import fs from 'fs';
import { access, constants, mkdir } from 'node:fs/promises';
import Stream from 'node:stream';

/**
 * Checks if a file or directory exists.
 *
 * @param {string} filePath - The path to check.
 * @returns {Promise<boolean>} - True if the file or directory exists, false otherwise.
 */
export async function doesPathExist(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates a directory if it doesn't exist.
 *
 * @param {string} dirPath - The directory path to create.
 * @returns {Promise<void>}
 */
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await access(dirPath, constants.F_OK);
  } catch {
    await mkdir(dirPath, { recursive: true });
  }
}

export async function downloadFile(
  url: string,
  savePath: string,
): Promise<void> {
  const response = await axios<void, { data: Stream }>({
    url,
    responseType: 'stream',
  });
  const writer = fs.createWriteStream(savePath);
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}
