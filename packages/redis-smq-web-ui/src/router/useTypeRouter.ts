/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { useRouter } from 'vue-router';
import type { RouteName, RouteParamsMap } from '@/router/types.ts';

export const useTypedRouter = () => {
  const router = useRouter();
  const {
    push: originalPush,
    resolve: originalResolve,
    replace: originalReplace,
    ...rest
  } = router;

  return {
    ...rest,

    isActiveRoute: (routeName: RouteName) => {
      return router.currentRoute.value.name === routeName;
    },

    navigateTo: (to: string) => {
      return originalPush(to);
    },

    push: <T extends RouteName>(
      name: T,
      ...args: RouteParamsMap[T] extends undefined
        ? []
        : [params: RouteParamsMap[T]]
    ) => {
      const routeParams = args[0] as RouteParamsMap[T] | undefined;
      if (routeParams) {
        return originalPush({
          name,
          ...routeParams,
        });
      }
      return originalPush({ name });
    },

    replace: <T extends RouteName>(
      name: T,
      ...args: RouteParamsMap[T] extends undefined
        ? []
        : [params: RouteParamsMap[T]]
    ) => {
      const params = args[0] as RouteParamsMap[T] | undefined;
      if (params) {
        return originalReplace({
          name,
          ...params,
        });
      }
      return originalReplace({ name });
    },

    resolve: <T extends RouteName>(
      name: T,
      ...args: RouteParamsMap[T] extends undefined
        ? []
        : [params: RouteParamsMap[T]]
    ) => {
      const params = args[0] as RouteParamsMap[T] | undefined;
      if (params) {
        return originalResolve({
          name,
          ...params,
        });
      }
      return originalResolve({ name });
    },
  };
};
