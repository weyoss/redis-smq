/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export const exchangeErrors = {
  ExchangeFanOutError: [500, 'ExchangeFanOutError'],
  ExchangeFanOutExchangeHasBoundQueuesError: [
    403,
    'ExchangeFanOutExchangeHasBoundQueuesError',
  ],
  ExchangeFanOutQueueTypeError: [403, 'ExchangeFanOutQueueTypeError'],
  ExchangeInvalidFanOutParamsError: [422, 'ExchangeInvalidFanOutParamsError'],
  ExchangeInvalidQueueParamsError: [422, 'ExchangeInvalidQueueParamsError'],
  ExchangeInvalidTopicParamsError: [422, 'ExchangeInvalidTopicParamsError'],
  ExchangeQueueIsNotBoundToExchangeError: [
    400,
    'ExchangeQueueIsNotBoundToExchangeError',
  ],
} as const;
