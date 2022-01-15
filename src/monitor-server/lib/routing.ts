import * as Router from '@koa/router';
import { ClassConstructor } from 'class-transformer';
import { RequestValidator } from '../middlewares/request-validator';
import { ResponseValidator } from '../middlewares/response-validator';
import { TApplication, TRequestContext } from '../types/common';
import { posix } from 'path';

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

export type TRouteControllerActionHandler = (
  app: TApplication,
) => (ctx: TRequestContext<any, any>) => Promise<Record<any, any> | void>;

export type TRouteControllerAction = {
  path: string;
  method: ERouteControllerActionMethod;
  payload: ERouteControllerActionPayload[];
  Handler: TRouteControllerActionHandler;
  RequestDTO: ClassConstructor<any>;
  ResponseDTO: ClassConstructor<any>;
};

export interface IRouteController {
  path: string;
  actions: (IRouteController | TRouteControllerAction)[];
}

function isRouteController(
  object: IRouteController | TRouteControllerAction,
): object is IRouteController {
  return object.hasOwnProperty('actions');
}

export function getControllerActionRouter(
  app: TApplication,
  action: TRouteControllerAction,
): Router {
  const router = new Router();
  router[action.method](
    action.path,
    RequestValidator(action.RequestDTO, action.payload),
    async (ctx: TRequestContext<any>, next) => {
      const data = await action.Handler(app)(ctx);
      if (data) {
        ctx.status = 200;
        ctx.body = { data };
      } else {
        ctx.status = 204;
        ctx.body = undefined;
      }
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
        posix.join(path, item.path),
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
