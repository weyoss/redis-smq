/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { key } from '../builder.js';

const exchangePath = (ns: string, exchange: string) => [
  'ns',
  ns,
  'exs',
  exchange,
];

export const exchange = {
  getExchangeKeys(ns: string, exchangeName: string) {
    return {
      keyExchange: key(...exchangePath(ns, exchangeName)),
      keyExchangeProperties: key(...exchangePath(ns, exchangeName), 'prop'),
    };
  },

  getExchangeDirectKeys(ns: string, exchangeName: string) {
    return {
      keyExchangeRoutingKeys: key(...exchangePath(ns, exchangeName), 'rk'),
    };
  },

  getExchangeDirectRoutingKeyKeys(
    ns: string,
    exchangeName: string,
    routingKey: string,
  ) {
    return {
      keyRoutingKeyQueues: key(
        ...exchangePath(ns, exchangeName),
        'rk',
        routingKey,
        'q',
      ),
    };
  },

  getExchangeTopicKeys(ns: string, exchangeName: string) {
    return {
      keyExchangeBindingPatterns: key(...exchangePath(ns, exchangeName), 'pat'),
    };
  },

  getExchangeTopicBindingPatternKeys(
    ns: string,
    exchangeName: string,
    pattern: string,
  ) {
    return {
      keyBindingPatternQueues: key(
        ...exchangePath(ns, exchangeName),
        'pat',
        pattern,
        'q',
      ),
    };
  },

  getExchangeFanoutKeys(ns: string, exchangeName: string) {
    return {
      keyFanoutQueues: key(...exchangePath(ns, exchangeName), 'q'),
    };
  },
};
