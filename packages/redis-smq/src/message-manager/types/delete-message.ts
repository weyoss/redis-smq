/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export type TMessageDeleteStatus =
  | 'OK'
  | 'PARTIAL_SUCCESS'
  | 'MESSAGE_NOT_FOUND'
  | 'MESSAGE_IN_PROCESS'
  | 'MESSAGE_NOT_DELETED'
  | 'INVALID_PARAMETERS';

// The response can be either a string or an array
export type TMessageDeleteRawResponse =
  | TMessageDeleteStatus
  | [number, number, number, number];

export interface IMessageManagerDeleteResponse {
  status: TMessageDeleteStatus;
  stats: {
    processed: number;
    success: number;
    notFound: number;
    inProcess: number;
  };
}
