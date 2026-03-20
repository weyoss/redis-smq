/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { useRouter } from 'vue-router';
import { EExchangeType } from '@/types/exchanges.ts';
import type { IExchangeParsedParams } from '@/types';

export function useExchangeNavigation() {
  const router = useRouter();

  const goToExchangePage = (ex: IExchangeParsedParams) => {
    const routeParams = {
      name: 'Exchange Details',
      params: {
        exchange: ex.name,
        ns: ex.ns,
        type: '',
      },
    };

    switch (ex.type) {
      case EExchangeType.DIRECT:
        routeParams.params.type = 'direct';
        break;
      case EExchangeType.TOPIC:
        routeParams.params.type = 'topic';
        break;
      case EExchangeType.FANOUT:
      default:
        routeParams.params.type = 'fanout';
    }
    router.push(routeParams);
  };

  return {
    goToExchangePage,
  };
}
