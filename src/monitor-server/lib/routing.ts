import * as Router from '@koa/router';
import { ClassConstructor } from 'class-transformer';
import { RequestValidator } from '../middlewares/request-validator';
import { ResponseValidator } from '../middlewares/response-validator';
import {
  IContext,
  IContextState,
  IResponseBody,
  TApplication,
} from '../types/common';
import { posix } from 'path';
import { Next, ParameterizedContext } from 'koa';

export enum ERouteControllerActionPayload {
  QUERY = 'query',
  BODY = 'body',
  PATH = 'path',
}

export enum ERouteControllerActionMethod {
  GET = 'get',
  POST = 'post',
  DELETE = 'delete',
}

export type TRequestContext<
  RequestDTO,
  ResponseDTO extends TResponseDTO,
> = ParameterizedContext<
  IContextState<RequestDTO>,
  IContext,
  ResponseDTO['body']
>;

export type TResponseDTO<Body = any> = {
  status: number;
  body: IResponseBody<Body> | void;
};

export class CRequestDTO {}

export type TRouteControllerActionHandler<
  RequestDTO extends CRequestDTO,
  ResponseDTO extends TResponseDTO,
> = (
  app: TApplication,
) => (
  ctx: TRequestContext<RequestDTO, ResponseDTO>,
) => Promise<
  ResponseDTO['body'] extends Record<any, any>
    ? ResponseDTO['body']['data']
    : void
>;

export type TRouteControllerAction<
  RequestDTO extends CRequestDTO,
  ResponseDTO extends TResponseDTO,
> = {
  path: string;
  method: ERouteControllerActionMethod;
  payload: ERouteControllerActionPayload[];
  Handler: TRouteControllerActionHandler<RequestDTO, ResponseDTO>;
  RequestDTO: ClassConstructor<any>;
  ResponseDTO: ClassConstructor<any>;
};

export interface IRouteController {
  path: string;
  actions: (IRouteController | TRouteControllerAction<any, any>)[];
}

function isRouteController(
  object: IRouteController | TRouteControllerAction<any, any>,
): object is IRouteController {
  return object.hasOwnProperty('actions');
}

export function getControllerActionRouter<
  RequestDTO extends CRequestDTO,
  ResponseDTO extends TResponseDTO,
>(
  app: TApplication,
  action: TRouteControllerAction<RequestDTO, ResponseDTO>,
): Router {
  const router = new Router();
  router[action.method](
    action.path,
    RequestValidator(action.RequestDTO, action.payload),
    async (ctx: TRequestContext<RequestDTO, ResponseDTO>, next: Next) => {
      const data = await action.Handler(app)(ctx);
      ctx.status = data ? 200 : 204;
      ctx.body = data ? { data } : data;
      await next();
    },
    ResponseValidator(action.ResponseDTO),
  );
  return router;
}

export function registerControllerRoutes(
  app: TApplication,
  controller: IRouteController,
  mainRouter: Router,
  path = '/',
): void {
  for (const item of controller.actions) {
    if (isRouteController(item)) {
      registerControllerRoutes(
        app,
        item,
        mainRouter,
        item.path === '/' ? path : posix.join(path, item.path),
      );
    } else {
      const router = getControllerActionRouter(app, item);
      mainRouter.use(path, router.routes());
    }
  }
}

export function getApplicationRouter(
  app: TApplication,
  controllers: IRouteController[],
): Router {
  const applicationRouter = new Router();
  for (const controller of controllers) {
    registerControllerRoutes(
      app,
      controller,
      applicationRouter,
      controller.path,
    );
  }
  return applicationRouter;
}
