/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import KoaRouter from '@koa/router';
import {
  IApplicationMiddlewareContext,
  IApplicationMiddlewareState,
} from '../../types/application.js';
import {
  ERequestMethod,
  ERequestPayload,
  TControllerRequestHandlerGeneric,
} from '../../types/controller.js';

export type TRouter = KoaRouter<
  IApplicationMiddlewareState,
  IApplicationMiddlewareContext
>;

export interface IRouterResourceDescription {
  handler: TControllerRequestHandlerGeneric;
  description?: string;
  method: ERequestMethod;
  payload: ERequestPayload[];
}

export type TRouterResource =
  | IRouterResourceDescription
  | (TRouterResourceMap | IRouterResourceDescription)[];

export type TRouterResourceMap = {
  path: string;
  tags?: string[];
  resource: TRouterResource;
};
