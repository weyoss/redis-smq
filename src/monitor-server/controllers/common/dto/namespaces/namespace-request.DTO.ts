import { IsNotEmpty, IsString } from 'class-validator';

export class NamespaceRequestDTO {
  @IsString()
  @IsNotEmpty()
  ns!: string;
}
