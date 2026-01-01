import { IsOptional, IsInt, IsString } from 'class-validator';

export class UpdateNienKhoaDto {
  @IsOptional()
  @IsString()
  tenNienKhoa?: string;

  @IsOptional()
  @IsInt()
  namBatDau?: number;

  @IsOptional()
  @IsInt()
  namKetThuc?: number;

  @IsOptional()
  @IsString()
  moTa?: string;
}