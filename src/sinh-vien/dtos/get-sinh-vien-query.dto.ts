import { IsOptional, IsInt, IsString, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { TinhTrangHocTapEnum } from '../enums/tinh-trang-hoc-tap.enum';

export class GetSinhVienQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  lopId?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  nganhId?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  nienKhoaId?: number;

  @IsOptional()
  @IsEnum(TinhTrangHocTapEnum)
  tinhTrang?: TinhTrangHocTapEnum;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  limit?: number = 10;
}