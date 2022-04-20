import { TRouteControllerActionHandler } from '../../../../lib/routing';
import { GetNamespacesRequestDTO } from './get-namespaces.request.DTO';
import { GetNamespacesResponseDTO } from './get-namespaces.response.DTO';
import { queuesServiceInstance } from '../../../../services';

export const GetNamespacesHandler: TRouteControllerActionHandler<
  GetNamespacesRequestDTO,
  GetNamespacesResponseDTO
> = () => {
  return async () => {
    return queuesServiceInstance().getNamespaces();
  };
};
