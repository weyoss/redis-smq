import * as Koa from 'koa';
import { ICompatibleLogger, IConfig } from '../../../types';
import { RedisClient } from '../../system/common/redis-client/redis-client';

export interface IResponseBodyError {
  code: number;
  message: string;
  details?: Record<string, any>;
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
  logger: ICompatibleLogger;
}

export type TApplication = Koa<Koa.DefaultState, IContext>;

export type TMiddleware<DTO = Record<string, any>> = Koa.Middleware<
  IContextState<DTO>,
  IContext & { params: Record<string, string> },
  IResponseBody
>;
