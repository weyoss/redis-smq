/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Writable } from 'node:stream';

export class WorkerLogger extends Writable {
  private readonly isError: boolean;

  constructor(isError: boolean = false) {
    super({
      write: (chunk, encoding, callback) => {
        try {
          if (this.isError) {
            process.stderr.write(chunk);
          } else {
            process.stdout.write(chunk);
          }
          callback();
        } catch (err) {
          callback(err as Error);
        }
      },
      final: (callback) => {
        callback();
      },
    });
    this.isError = isError;
  }
}
