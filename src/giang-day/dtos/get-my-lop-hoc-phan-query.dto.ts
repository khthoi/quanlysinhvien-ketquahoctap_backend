import { IsOptional, IsInt, Min, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetMyLopHocPhanQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  hocKyId?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  monHocId?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  nganhId?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  nienKhoaId?: number;

  // ← THÊM LỌC THEO TRẠNG THÁI
  @IsOptional()
  @IsIn(['DANG_HOC', 'DA_KET_THUC', 'CHUA_BAT_DAU'])
  trangThai?: 'DANG_HOC' | 'DA_KET_THUC' | 'CHUA_BAT_DAU';
}