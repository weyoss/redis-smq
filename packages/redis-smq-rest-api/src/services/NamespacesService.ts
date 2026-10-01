/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { INamespaceManager } from 'redis-smq';

export class NamespacesService {
  constructor(protected namespaceManager: INamespaceManager) {}

  getNamespaces() {
    return this.namespaceManager.getNamespaces();
  }

  getNamespaceQueues(ns: string) {
    return this.namespaceManager.getNamespaceQueues(ns);
  }

  deleteNamespace(ns: string) {
    return this.namespaceManager.delete(ns);
  }
}
