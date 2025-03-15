/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import KoaRouter from '@koa/router';
import {
  IApplicationMiddlewareContext,
  IApplicationMiddlewareState,
} from '../../application/types/index.js';
import {
  EControllerRequestMethod,
  EControllerRequestPayload,
  TControllerRequestHandlerGeneric,
} from '../../controller/types/index.js';

export type TRouter = KoaRouter<
  IApplicationMiddlewareState,
  IApplicationMiddlewareContext
>;

export interface IRouterResourceDescription {
  handler: TControllerRequestHandlerGeneric;
  description?: string;
  method: EControllerRequestMethod;
  payload: EControllerRequestPayload[];
}

export type TRouterResource =
  | IRouterResourceDescription
  | (TRouterResourceMap | IRouterResourceDescription)[];

export type TRouterResourceMap = {
  path: string;
  tags?: string[];
  resource: TRouterResource;
};
