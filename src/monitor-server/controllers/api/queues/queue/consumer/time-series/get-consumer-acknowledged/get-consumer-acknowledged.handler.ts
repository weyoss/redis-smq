import { TApplication } from '../../../../../../../types/common';
import { TConsumerTimeSeriesRequestContext } from '../../../producer/time-series/context';

export function GetConsumerAcknowledgedHandler(app: TApplication) {
  return async (ctx: TConsumerTimeSeriesRequestContext) => {
    const { consumerTimeSeriesService } = app.context.services;
    return consumerTimeSeriesService.acknowledged(ctx.state.dto);
  };
}
