import { Equals, IsInt } from 'class-validator';

export class NoContentHttpResponseDTO {
  @IsInt()
  status!: number;

  @Equals(undefined)
  body: undefined;
}
