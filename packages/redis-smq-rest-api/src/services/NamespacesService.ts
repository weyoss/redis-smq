/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { NamespaceManager } from 'redis-smq';

const { promisifyAll } = bluebird;

export class NamespacesService {
  protected namespaceManager;

  constructor(namespaceManager: NamespaceManager) {
    this.namespaceManager = promisifyAll(namespaceManager);
  }

  getNamespaces() {
    return this.namespaceManager.getNamespacesAsync();
  }

  getNamespaceQueues(ns: string) {
    return this.namespaceManager.getNamespaceQueuesAsync(ns);
  }

  deleteNamespace(ns: string) {
    return this.namespaceManager.deleteAsync(ns);
  }
}
