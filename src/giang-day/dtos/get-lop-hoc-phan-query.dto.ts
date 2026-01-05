import { IsOptional, IsInt, IsString, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetLopHocPhanQueryDto {
  @ApiPropertyOptional({ description: 'ID môn học', example: 10 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  monHocId?: number;

  @ApiPropertyOptional({ description: 'ID giảng viên', example: 5 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  giangVienId?: number;

  @ApiPropertyOptional({ description: 'ID học kỳ', example: 2 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  hocKyId?: number;

  @ApiPropertyOptional({ description: 'ID niên khóa', example: 2023 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  nienKhoaId?: number;

  @ApiPropertyOptional({ description: 'ID ngành', example: 3 })
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