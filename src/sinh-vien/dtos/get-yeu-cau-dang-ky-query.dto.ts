import { IsOptional, IsInt, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TrangThaiYeuCauHocPhanEnum, LoaiYeuCauHocPhanEnum } from 'src/giang-day/enums/yeu-cau-hoc-phan.enum';

export class GetYeuCauDangKyQueryDto {
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
}
