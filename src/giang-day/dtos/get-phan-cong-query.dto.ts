import { IsOptional, IsInt, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQueryDto } from './pagination-query.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetPhanCongQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'ID giảng viên', example: 5 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  giangVienId?: number;

  @ApiPropertyOptional({ description: 'ID niên khóa', example: 2023 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  nienKhoaId?: number;

  @ApiPropertyOptional({ description: 'ID môn học', example: 10 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  monHocId?: number;

  @ApiPropertyOptional({ description: 'ID ngành', example: 3 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  nganhId?: number;

  @ApiPropertyOptional({ description: 'ID học kỳ', example: 2 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  hocKyId?: number;

  // ← THÊM LỌC THEO TRẠNG THÁI
  @IsOptional()
  @IsIn(['DANG_HOC', 'DA_KET_THUC', 'CHUA_BAT_DAU'])
  trangThai?: 'DANG_HOC' | 'DA_KET_THUC' | 'CHUA_BAT_DAU';
}