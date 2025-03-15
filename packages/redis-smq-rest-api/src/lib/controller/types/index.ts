/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { TApplicationMiddleware } from '../../application/types/index.js';

type TControllerResponseData =
  | object
  | number
  | string
  | boolean
  | null
  | undefined;

export interface IControllerResponseNoDataDTO {
  status: 204;
  body: null;
}

export interface IControllerResponseDTO<
  Status extends number,
  T extends TControllerResponseData,
> {
  status: Status;
  body: IControllerResponseBodyDTO<T>;
}

export type IControllerResponseBodyDTO<T> = {
  data: T;
};

export type IControllerErrorResponseBodyDTO<
  Status extends number,
  Message extends string,
> = {
  error: {
    code: Status;
    message: Message;
    details: object;
  };
};

export interface IControllerResponseErrorDTO<
  Status extends number,
  Message extends string,
> {
  status: Status;
  body: IControllerErrorResponseBodyDTO<Status, Message>;
}

export enum EControllerRequestPayload {
  PATH,
  QUERY,
  BODY,
}

export enum EControllerRequestMethod {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  DELETE = 'delete',
}

export type TControllerRequestHandler<
  RequestPathDTO,
  RequestQueryDTO,
  RequestBodyDTO,
  ResponseDTO extends readonly [number, unknown],
> = (
  ...args: Parameters<
    TApplicationMiddleware<RequestPathDTO, RequestQueryDTO, RequestBodyDTO>
  >
) => Promise<ResponseDTO>;

export type TControllerRequestHandlerGeneric = TControllerRequestHandler<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  readonly [number, unknown]
>;

export type TControllerRequestPayloadEmpty = Record<string, never>;
