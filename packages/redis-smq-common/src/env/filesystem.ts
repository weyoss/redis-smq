/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import axios from 'axios';
import fs, { readdir } from 'fs';
import { access, constants, mkdir } from 'node:fs/promises';
import { join } from 'path';
import Stream from 'node:stream';
import { ICallback } from '../async/index.js';

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

/**
 * Recursively scan a directory for files ending with a pattern
 *
 * @param directoryPath - The directory to start scanning from
 * @param pattern - The pattern to match at the end of filenames (e.g., '.txt', '.ts')
 * @param callback - Callback function that receives found files or error
 */
export function findFilesByPattern(
  directoryPath: string,
  pattern: string,
  callback: ICallback<string[]>,
): void {
  const scanDirectory = (
    dir: string,
    onComplete: (error: Error | null, results?: string[]) => void,
  ): void => {
    readdir(dir, { withFileTypes: true }, (error, entries) => {
      if (error) {
        return onComplete(error);
      }

      const foundFiles: string[] = [];
      let pendingOperations = 0;
      let hasError = false;

      // Handle case where directory is empty
      if (entries.length === 0) {
        return onComplete(null, []);
      }

      const checkComplete = () => {
        if (--pendingOperations === 0 && !hasError) {
          onComplete(null, foundFiles);
        }
      };

      const handleError = (error: Error) => {
        if (!hasError) {
          hasError = true;
          onComplete(error);
        }
      };

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          pendingOperations++;
          scanDirectory(fullPath, (error, nestedFiles) => {
            if (error) {
              handleError(error);
            } else if (nestedFiles) {
              foundFiles.push(...nestedFiles);
            }
            checkComplete();
          });
        } else if (entry.isFile() && entry.name.endsWith(pattern)) {
          foundFiles.push(fullPath);
        }
      }

      // Check if we need to call complete for files-only directories
      if (pendingOperations === 0) {
        onComplete(null, foundFiles);
      }
    });
  };

  scanDirectory(directoryPath, callback);
}
