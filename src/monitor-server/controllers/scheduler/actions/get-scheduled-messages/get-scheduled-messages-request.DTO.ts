import { IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class GetScheduledMessagesRequestDTO {
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  skip?: number;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  take?: number;
}
