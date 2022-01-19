import { TApplication } from '../../../../../../../types/common';
import { TConsumerTimeSeriesRequestContext } from '../../../time-series/context';

export function GetConsumerDeadLetteredHandler(app: TApplication) {
  return async (ctx: TConsumerTimeSeriesRequestContext) => {
    const { consumerTimeSeriesService } = app.context.services;
    return consumerTimeSeriesService.deadLettered(ctx.state.dto);
  };
}
