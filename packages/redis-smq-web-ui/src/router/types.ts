/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import 'vue-router';
import { EMessageType } from '@/types';

export type RouteParamsMap = {
  // Top-level routes (no params)
  home: undefined;
  namespaces: undefined;
  queues: undefined;
  exchanges: undefined;

  // Namespace-scoped routes
  namespaceQueues: { params: { ns: string } };
  namespaceExchanges: { params: { ns: string } };

  // Queue routes
  queue: { params: { ns: string; queue: string } };

  //
  messages: {
    params: { ns: string; queue: string };
    query: { type: EMessageType; consumerGroupId?: string };
  };

  // Exchange route
  exchangeDetails: { params: { ns: string; exchange: string } };

  // System routes
  configuration: undefined;
  notFound: undefined;
};

// Extract all route names as a union type
export type RouteName = keyof RouteParamsMap;
