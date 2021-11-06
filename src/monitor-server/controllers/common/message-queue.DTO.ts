import { IsNotEmpty, IsString } from 'class-validator';

export class MessageQueueDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  ns!: string;
}
