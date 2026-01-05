import { IsOptional, IsInt, IsString, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { TinhTrangHocTapEnum } from '../enums/tinh-trang-hoc-tap.enum';
import { ApiPropertyOptional } from '@nestjs/swagger';
export class GetSinhVienQueryDto {

  @ApiPropertyOptional({ description: 'ID lớp học phần', example: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  lopId?: number;

  @ApiPropertyOptional({ description: 'ID ngành', example: 2 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  nganhId?: number;

  @ApiPropertyOptional({ description: 'ID niên khóa', example: 2021 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  nienKhoaId?: number;

  @ApiPropertyOptional({ description: 'Tình trạng học tập của sinh viên', example: 'DANG_HOC - THOI_HOC - BAO_LUU - DA_TOT_NGHIEP' })
  @IsOptional()
  @IsEnum(TinhTrangHocTapEnum)
  tinhTrang?: TinhTrangHocTapEnum;

  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm (tên hoặc mã sinh viên)', example: 'Nguyen' })
  @IsOptional()
  @IsString()
  search?: string;

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