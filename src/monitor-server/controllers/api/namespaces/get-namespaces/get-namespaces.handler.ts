import { TRouteControllerActionHandler } from '../../../../lib/routing';
import { GetNamespacesRequestDTO } from './get-namespaces.request.DTO';
import { GetNamespacesResponseDTO } from './get-namespaces.response.DTO';

export const GetNamespacesHandler: TRouteControllerActionHandler<
  GetNamespacesRequestDTO,
  GetNamespacesResponseDTO
> = (app) => {
  return async () => {
    const { queuesService } = app.context.services;
    return queuesService.getNamespaces();
  };
};
