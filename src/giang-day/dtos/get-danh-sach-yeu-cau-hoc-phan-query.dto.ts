import { IsOptional, IsInt, IsString, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TrangThaiYeuCauHocPhanEnum, LoaiYeuCauHocPhanEnum } from '../enums/yeu-cau-hoc-phan.enum';

export class GetDanhSachYeuCauHocPhanQueryDto {
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

  @ApiPropertyOptional({
    description: 'Lọc theo trạng thái yêu cầu',
    enum: TrangThaiYeuCauHocPhanEnum,
    example: TrangThaiYeuCauHocPhanEnum.CHO_DUYET,
  })
  @IsOptional()
  @IsEnum(TrangThaiYeuCauHocPhanEnum)
  trangThai?: TrangThaiYeuCauHocPhanEnum;

  @ApiPropertyOptional({
    description: 'Lọc theo loại yêu cầu',
    enum: LoaiYeuCauHocPhanEnum,
    example: LoaiYeuCauHocPhanEnum.HOC_CAI_THIEN,
  })
  @IsOptional()
  @IsEnum(LoaiYeuCauHocPhanEnum)
  loaiYeuCau?: LoaiYeuCauHocPhanEnum;

  @ApiPropertyOptional({
    description: 'Tìm kiếm theo mã sinh viên hoặc tên sinh viên',
    example: 'SV2024001',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
