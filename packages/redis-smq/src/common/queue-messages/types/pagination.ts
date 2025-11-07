/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export interface IPaginationPage<T> {
  totalItems: number;
  items: T[];
}

export type IPaginationPageParams = {
  pageSize: number;
  currentPage: number;
  offsetStart: number;
  offsetEnd: number;
  totalPages: number;
};
