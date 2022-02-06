import { IsInt, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class GetNamespacesResponseBodyDTO {
  @IsString({ each: true })
  data!: string[];
}

export class GetNamespacesResponseDTO {
  @IsInt()
  status!: number;

  @ValidateNested()
  @Type(() => GetNamespacesResponseBodyDTO)
  body!: GetNamespacesResponseBodyDTO;
}
