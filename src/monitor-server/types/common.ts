import * as Koa from 'koa';
import { IConfig } from '../../../types';
import { RedisClient } from '../../system/common/redis-client/redis-client';
import { Services } from '../services';
import { ParameterizedContext } from 'koa';
import Logger from 'bunyan';

export interface IResponseBodyError {
  code: number;
  message: string;
  details?: Record<any, any>;
}

export interface IResponseBody<Data = Record<string, any>> {
  data?: Data;
  error?: IResponseBodyError;
}

export type TResponsePaginationBody<PageItem> = IResponseBody<{
  total: number;
  items: PageItem[];
}>;

export interface IContextState<DTO> extends Koa.DefaultState {
  dto: DTO;
}

export interface IContext extends Koa.DefaultContext {
  config: IConfig;
  redis: RedisClient;
  services: ReturnType<typeof Services>;
  logger: Logger;
}

export type TApplication = Koa<Koa.DefaultState, IContext>;

export type TRequestContext<
  DTO,
  ResponseBody = Record<any, any>,
> = ParameterizedContext<
  IContextState<DTO>,
  IContext,
  IResponseBody<ResponseBody> | undefined
>;

export type TMiddleware<DTO = Record<string, any>> = Koa.Middleware<
  IContextState<DTO>,
  IContext & { params: Record<string, string> },
  IResponseBody
>;
