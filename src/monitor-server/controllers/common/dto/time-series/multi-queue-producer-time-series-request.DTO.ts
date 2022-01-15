import { IsUUID } from 'class-validator';
import { TimeSeriesRequestDTO } from './time-series-request.DTO';

export class MultiQueueProducerTimeSeriesRequestDTO extends TimeSeriesRequestDTO {
  @IsUUID('4')
  producerId!: string;
}
