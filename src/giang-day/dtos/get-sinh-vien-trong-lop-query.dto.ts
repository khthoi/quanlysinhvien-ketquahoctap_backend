import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { LoaiHinhThamGiaLopHocPhanEnum } from '../enums/loai-hinh-tham-gia-lop-hoc-phan.enum';

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

  @ApiPropertyOptional({
    description: 'Lọc theo loại tham gia lớp học phần',
    enum: LoaiHinhThamGiaLopHocPhanEnum,
    example: LoaiHinhThamGiaLopHocPhanEnum.CHINH_QUY,
  })
  @IsOptional()
  @IsEnum(LoaiHinhThamGiaLopHocPhanEnum)
  loaiThamGia?: LoaiHinhThamGiaLopHocPhanEnum;

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