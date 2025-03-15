/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Middleware } from '@koa/router';
import { AwilixContainer } from 'awilix';
import { IContextScope } from '../../../app/container/types/container.js';

export interface IApplicationMiddlewareContext<
  RequestPathDTO = unknown,
  RequestQueryDTO = unknown,
  RequestBodyDTO = unknown,
> {
  mySlowToInitializeClient: string;
  scope: AwilixContainer<
    IContextScope<RequestPathDTO, RequestQueryDTO, RequestBodyDTO>
  >;
}

export interface IApplicationMiddlewareState {
  responseSchemaKey: string;
}

export type TApplicationMiddleware<
  RequestPathDTO = unknown,
  RequestQueryDTO = unknown,
  RequestBodyDTO = unknown,
> = Middleware<
  IApplicationMiddlewareState,
  IApplicationMiddlewareContext<RequestPathDTO, RequestQueryDTO, RequestBodyDTO>
>;
