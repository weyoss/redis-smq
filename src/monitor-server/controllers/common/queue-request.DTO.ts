import { IsNotEmpty, IsString } from 'class-validator';

export class QueueRequestDTO {
  @IsString()
  @IsNotEmpty()
  ns!: string;

  @IsString()
  @IsNotEmpty()
  queueName!: string;
}
