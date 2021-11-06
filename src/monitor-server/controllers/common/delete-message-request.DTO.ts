import { IsInt, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class DeleteMessageRequestDTO {
  @IsString()
  @IsNotEmpty()
  ns!: string;

  @IsString()
  @IsNotEmpty()
  queueName!: string;

  @IsUUID('4')
  id!: string;

  @IsInt()
  @Type(() => Number)
  sequenceId!: number;
}
