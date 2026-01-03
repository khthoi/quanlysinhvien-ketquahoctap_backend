import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetKetQuaLopQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  limit?: number = 10;
}