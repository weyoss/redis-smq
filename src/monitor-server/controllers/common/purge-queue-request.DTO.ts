import { IsNotEmpty, IsString } from 'class-validator';

export class PurgeQueueRequestDTO {
  @IsString()
  @IsNotEmpty()
  queueName!: string;
}
