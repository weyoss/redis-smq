/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import axios from 'axios';
import fs from 'fs';
import os from 'node:os';
import Stream from 'node:stream';
import path from 'path';

const tarballs: Record<string, Record<string, string>> = {
  linux: {
    x64: 'https://github.com/weyoss/valkey/releases/download/v7.2.8-1/valkey-server-linux-x64-v7.2.8-1.tar.gz',
    ia32: 'https://github.com/weyoss/valkey/releases/download/v7.2.8-1/valkey-server-linux-x86-v7.2.8-1.tar.gz',
    arm64:
      'https://github.com/weyoss/valkey/releases/download/v7.2.8-1/valkey-server-linux-arm64-v7.2.8-1.tar.gz',
  },
  darwin: {
    x64: 'https://github.com/weyoss/valkey/releases/download/v7.2.8-1/valkey-server-macos-x64-v7.2.8-1.tar.gz',
    arm64:
      'https://github.com/weyoss/valkey/releases/download/v7.2.8-1/valkey-server-macos-arm64-v7.2.8-1.tar.gz',
  },
};

async function fetchPackage(packageUrl: string, packagePath: string) {
  const response = await axios<Stream, { data: Stream }>({
    method: 'get',
    url: packageUrl,
    responseType: 'stream',
  });

  const writer = fs.createWriteStream(packagePath);

  response.data.pipe(writer);

  return new Promise<void>((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

export async function downloadRedisBinary(
  downloadPath: string,
): Promise<string> {
  const platform = os.platform();
  const arch = os.arch();
  if (!tarballs[platform][arch]) {
    throw new Error(
      `Unsupported platform and architecture: ${platform} ${arch}`,
    );
  }
  const url = tarballs[platform][arch];
  const filePath = path.join(downloadPath, 'redis-server');
  await fetchPackage(url, filePath);

  // Verify the downloaded file
  if (!(await fs.promises.stat(filePath)).isFile()) {
    throw new Error('Redis package not found after download.');
  }

  return filePath;
}
