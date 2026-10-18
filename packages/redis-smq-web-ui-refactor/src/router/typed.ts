/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { useRouter } from 'vue-router';
import type { RouteName } from './types';

type ParamsFor<T extends RouteName> =
  T extends keyof import('./types').RouteParams
    ? import('./types').RouteParams[T]
    : undefined;

export function useTypedRouter() {
  const router = useRouter();

  return {
    router,
    go: <T extends RouteName>(name: T, params?: ParamsFor<T>) =>
      router.push({ name, params }),
    replace: <T extends RouteName>(name: T, params?: ParamsFor<T>) =>
      router.replace({ name, params }),
  };
}
