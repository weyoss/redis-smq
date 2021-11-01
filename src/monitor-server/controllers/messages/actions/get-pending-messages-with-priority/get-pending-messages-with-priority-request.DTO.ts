import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class GetPendingMessagesWithPriorityRequestDTO {
  @IsString()
  @IsNotEmpty()
  queueName!: string;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  skip?: number;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  take?: number;
}
