/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * Response shape of `GET /api/namespaces`.
 *
 * Returns every namespace that has at least one queue or exchange.
 * A namespace with no resources doesn't exist — it's created
 * implicitly by the first queue or exchange registered under it — so
 * an empty list means the runtime has no resources at all.
 *
 * No error branches: `getNamespaces()` on a running runtime returns
 * the current set or an empty array; it doesn't raise a domain error.
 */
export type GetNamespacesControllerResponseDTO = readonly [200, string[]];
