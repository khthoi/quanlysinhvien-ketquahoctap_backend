import { IsOptional, IsInt, IsString, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetLopHocPhanQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  monHocId?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  giangVienId?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  hocKyId?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  nienKhoaId?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  nganhId?: number;

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

  // ← THÊM LỌC THEO TRẠNG THÁI
  @IsOptional()
  @IsIn(['DANG_HOC', 'DA_KET_THUC', 'CHUA_BAT_DAU'])
  trangThai?: 'DANG_HOC' | 'DA_KET_THUC' | 'CHUA_BAT_DAU';
}