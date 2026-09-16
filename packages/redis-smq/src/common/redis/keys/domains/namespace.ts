/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { key } from '../builder.js';

export const namespace = {
  getNamespaceKeys(ns: string) {
    return {
      keyNamespaceQueues: key('ns', ns, 'q'),
      keyNamespaceExchanges: key('ns', ns, 'exs'),
    };
  },
};
