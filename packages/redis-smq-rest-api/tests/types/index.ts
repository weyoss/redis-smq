/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export type TResponse<Data extends readonly [unknown, unknown]> = {
  status: number;
  body: null | {
    data?: Data extends readonly [200 | 201, unknown] ? Data[1] : never;
    error?: {
      code: number;
      message: string;
      details: Record<string, unknown>;
    };
  };
};
