/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { Namespace } from 'redis-smq';

const { promisifyAll } = bluebird;

export class NamespacesService {
  protected namespace;

  constructor(namespace: Namespace) {
    this.namespace = promisifyAll(namespace);
  }

  getNamespaces() {
    return this.namespace.getNamespacesAsync();
  }

  getNamespaceQueues(ns: string) {
    return this.namespace.getNamespaceQueuesAsync(ns);
  }

  deleteNamespace(ns: string) {
    return this.namespace.deleteAsync(ns);
  }
}
