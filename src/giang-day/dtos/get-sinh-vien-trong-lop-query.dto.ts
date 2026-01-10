import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetSinhVienTrongLopQueryDto {
  @ApiPropertyOptional({
    description: 'Tìm kiếm theo mã sinh viên (chính xác) hoặc tên sinh viên (gần đúng)',
    example: 'SV001 hoặc Nguyễn Văn',
  })
  @IsOptional()
  @IsString()
  search?: string; // Giữ lại để tìm chung (mã hoặc tên)

  @ApiPropertyOptional({
    description: 'Tìm chính xác theo mã sinh viên (ưu tiên dùng field này nếu có)',
    example: 'SV001',
  })
  @IsOptional()
  @IsString()
  maSinhVienSearch?: string; // ← Mới: tìm chính xác theo mã SV

  @ApiPropertyOptional({ description: 'Trang số', example: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Số mục trên trang', example: 10 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  limit?: number = 10;
}