import { IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TimeSeriesResponseBodyDataItemDTO {
  @IsInt()
  timestamp!: number;

  @IsInt()
  value!: number;
}

export class TimeSeriesResponseBodyDTO {
  @ValidateNested({ each: true })
  @Type(() => TimeSeriesResponseBodyDataItemDTO)
  data!: TimeSeriesResponseBodyDataItemDTO[];
}

export class TimeSeriesResponseDTO {
  @IsInt()
  status!: number;

  @ValidateNested()
  @Type(() => TimeSeriesResponseBodyDTO)
  body!: TimeSeriesResponseBodyDTO;
}
