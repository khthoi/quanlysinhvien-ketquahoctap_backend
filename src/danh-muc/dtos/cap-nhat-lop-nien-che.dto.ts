import { IsOptional, IsInt, IsString } from 'class-validator';

export class UpdateLopDto {
  @IsOptional()
  @IsString()
  tenLop?: string;

  @IsOptional()
  @IsInt()
  nganhId?: number;

  @IsOptional()
  @IsInt()
  nienKhoaId?: number;
}