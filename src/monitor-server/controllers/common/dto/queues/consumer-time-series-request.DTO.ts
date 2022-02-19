import { IsUUID } from 'class-validator';
import { TimeSeriesRequestDTO } from '../time-series/time-series-request.DTO';

export class ConsumerTimeSeriesRequestDTO extends TimeSeriesRequestDTO {
  @IsUUID('4')
  consumerId!: string;
}
