import { IsOptional, IsInt, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQueryDto } from './pagination-query.dto';

export class GetPhanCongQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  giangVienId?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  nienKhoaId?: number;

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
  hocKyId?: number;

  // ← THÊM LỌC THEO TRẠNG THÁI
  @IsOptional()
  @IsIn(['DANG_HOC', 'DA_KET_THUC', 'CHUA_BAT_DAU'])
  trangThai?: 'DANG_HOC' | 'DA_KET_THUC' | 'CHUA_BAT_DAU';
}