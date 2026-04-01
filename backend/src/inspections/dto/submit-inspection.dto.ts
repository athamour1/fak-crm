import { Type } from 'class-transformer';
import {
  IsArray, IsDateString, IsInt, IsOptional,
  IsString, Min, ValidateNested,
} from 'class-validator';

export class InspectionItemDto {
  @IsString()
  kitItemId: string;

  @IsInt()
  @Min(0)
  quantityFound: number;

  @IsDateString()
  @IsOptional()
  expirationDateFound?: string | null;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class SubmitInspectionDto {
  @IsString()
  kitId: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InspectionItemDto)
  items: InspectionItemDto[];
}
