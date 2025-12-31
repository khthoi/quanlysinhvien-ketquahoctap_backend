import { IsOptional, IsInt, IsString } from 'class-validator';

export class UpdateNganhDto {
  @IsOptional()
  @IsString()
  tenNganh?: string;

  @IsOptional()
  @IsString()
  moTa?: string;

  @IsOptional()
  @IsInt()
  khoaId?: number;
}