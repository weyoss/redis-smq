/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import fs from 'fs';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

/**
 * Reads a chunk of data from a file at a specified offset.
 *
 * @param filePath - The path to the file.
 * @param offset - The starting offset in the file to begin reading.
 * @param blockSize - The block size for reading the chunk. Default is 1.
 * @param blockCount - The number of blocks to read. Default is 1.
 *
 * @returns A Promise that resolves to a Buffer containing the read data.
 */
async function readChunkFromFile(
  filePath: string,
  offset: number,
  blockSize: number = 1,
  blockCount: number = 1,
): Promise<Buffer> {
  const stream = fs.createReadStream(filePath, {
    start: offset,
    end: offset + blockSize * blockCount - 1,
  });
  const buffers: Buffer[] = [];
  let data: Buffer;
  for await (data of stream) {
    buffers.push(data);
  }
  return Buffer.concat(buffers);
}

/**
 * Calculates the size and offset of the RPM header in a given file.
 *
 * @param filePath - The path to the RPM package file.
 * @param headerOffset - The starting offset in the file where the RPM header is expected.
 *
 * @throws Will throw an error if the file does not look like an RPM package.
 *
 * @returns A Promise that resolves to an object containing the size and offset of the RPM header.
 * The size is the total size of the header in bytes, and the offset is the position in the file
 * where the next section starts after the header.
 */
async function calculateRpmHeaderSize(
  filePath: string,
  headerOffset: number,
): Promise<{ size: number; offset: number }> {
  const magic = (
    await readChunkFromFile(filePath, headerOffset, 3, 1)
  ).toString('hex');
  if (magic !== '8eade8') {
    throw new Error(`File doesn't look like rpm`);
  }
  let offset = headerOffset + 8;
  const bytes = Array.from(await readChunkFromFile(filePath, offset, 8, 1));
  const size =
    8 +
    ((bytes[0] << 24) + (bytes[1] << 16) + (bytes[2] << 8) + bytes[3]) * 16 +
    (bytes[4] << 24) +
    (bytes[5] << 16) +
    (bytes[6] << 8) +
    bytes[7];
  offset += size;
  return { size, offset };
}

/**
 * Determines the appropriate decompression command for a given payload magic number.
 *
 * @param payloadMagic - The magic number of the payload compression format.
 *
 * @throws Will throw an error if the payload compression format is unrecognized.
 *
 * @returns The decompression command for the specified payload magic number.
 */
function getPayloadDecompressionCommand(payloadMagic: string): string {
  const decompressCommands: Record<string, string> = {
    '425a': 'bunzip2',
    '1f8b': 'gunzip',
    fd37: 'xzcat',
    '5d00': 'unlzma',
    '28b5': 'unzstd',
  };

  const command = decompressCommands[payloadMagic];
  if (!command) {
    throw new Error(`Unrecognized payload compression format: ${payloadMagic}`);
  }
  return command;
}

/**
 * Extracts the contents of an RPM package to a specified directory.
 *
 * @param filePath - The path to the RPM package file.
 * @param destinationDirectory - The directory where the extracted contents will be saved.
 *
 * @throws Will throw an error if the file does not look like an RPM package.
 *
 * @remarks
 * This function reads the RPM package file, extracts the payload, and decompresses it using the appropriate command.
 * The extracted contents are saved in the specified destination directory.
 *
 * @returns {Promise<void>} - A promise that resolves when the extraction is complete.
 */
export async function extractRpm(
  filePath: string,
  destinationDirectory: string,
): Promise<void> {
  const rpmMagic = (await readChunkFromFile(filePath, 0, 4, 1)).toString('hex');
  if (rpmMagic !== 'edabeedb') {
    throw new Error(`File doesn't look like rpm: ${filePath}`);
  }
  const { size, offset } = await calculateRpmHeaderSize(filePath, 96);
  const { offset: payloadOffset } = await calculateRpmHeaderSize(
    filePath,
    offset + ((8 - (size % 8)) % 8),
  );
  const payloadMagic = (
    await readChunkFromFile(filePath, payloadOffset, 2, 1)
  ).toString('hex');
  const decompressCommand = getPayloadDecompressionCommand(payloadMagic);
  await execAsync(
    `dd if="${filePath}" skip="${payloadOffset}" iflag=skip_bytes status=none | ${decompressCommand} | cpio -idmv`,
    { cwd: destinationDirectory },
  );
}
