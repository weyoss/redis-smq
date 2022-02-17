import {
  ERouteControllerActionMethod,
  ERouteControllerActionPayload,
  IRouteController,
} from '../../../../../lib/routing';
import { SetRateLimitHandler } from './set-rate-limit/set-rate-limit.handler';
import { SetRateLimitRequestDTO } from './set-rate-limit/set-rate-limit.request.DTO';
import { SetRateLimitResponseDTO } from './set-rate-limit/set-rate-limit.response.DTO';
import { GetRateLimitHandler } from './get-rate-limit/get-rate-limit.handler';
import { GetRateLimitRequestDTO } from './get-rate-limit/get-rate-limit.request.DTO';
import { GetRateLimitResponseDTO } from './get-rate-limit/get-rate-limit.response.DTO';
import { ClearRateLimitHandler } from './clear-rate-limit/clear-rate-limit.handler';
import { ClearRateLimitRequestDTO } from './clear-rate-limit/clear-rate-limit.request.DTO';
import { ClearRateLimitResponseDTO } from './clear-rate-limit/clear-rate-limit.response.DTO';

export const controller: IRouteController = {
  path: '/rate-limit',
  actions: [
    {
      path: '/',
      method: ERouteControllerActionMethod.POST,
      payload: [
        ERouteControllerActionPayload.PATH,
        ERouteControllerActionPayload.BODY,
      ],
      Handler: SetRateLimitHandler,
      RequestDTO: SetRateLimitRequestDTO,
      ResponseDTO: SetRateLimitResponseDTO,
    },
    {
      path: '/',
      method: ERouteControllerActionMethod.GET,
      payload: [ERouteControllerActionPayload.PATH],
      Handler: GetRateLimitHandler,
      RequestDTO: GetRateLimitRequestDTO,
      ResponseDTO: GetRateLimitResponseDTO,
    },
    {
      path: '/',
      method: ERouteControllerActionMethod.DELETE,
      payload: [ERouteControllerActionPayload.PATH],
      Handler: ClearRateLimitHandler,
      RequestDTO: ClearRateLimitRequestDTO,
      ResponseDTO: ClearRateLimitResponseDTO,
    },
  ],
};
