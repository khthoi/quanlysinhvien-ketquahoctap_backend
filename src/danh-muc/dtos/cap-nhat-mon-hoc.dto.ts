import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, IsString, Min } from 'class-validator';
import { LoaiMonEnum } from '../enums/loai-mon.enum';

export class UpdateMonHocDto {
  @ApiPropertyOptional({ description: 'Tên môn học', example: 'Toán Cao Cấp' })
  @IsOptional()
  @IsString()
  tenMonHoc?: string;

  @ApiPropertyOptional({ description: 'Mã môn học', example: 'MATH101' })
  @IsOptional()
  @IsString()
  maMonHoc?: string;

  @ApiPropertyOptional({ description: 'Loại môn học', example: LoaiMonEnum.CHUYEN_NGANH, enum: LoaiMonEnum })
  @IsOptional()
  @IsEnum(LoaiMonEnum)
  loaiMon?: LoaiMonEnum;

  @ApiPropertyOptional({ description: 'Số tín chỉ của môn học', example: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  soTinChi?: number;

  @ApiPropertyOptional({ description: 'Mô tả về môn học', example: 'Môn học về các khái niệm cơ bản của toán cao cấp' })
  @IsOptional()
  @IsString()
  moTa?: string;
}