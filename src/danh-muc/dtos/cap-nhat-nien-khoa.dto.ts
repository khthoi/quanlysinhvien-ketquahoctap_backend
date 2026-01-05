import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsString } from 'class-validator';

export class UpdateNienKhoaDto {

  @ApiProperty({ description: 'Mã niên khóa', example: 'NK001' })
  @IsString()
  maNienKhoa: string;

  @ApiPropertyOptional({ description: 'Tên niên khóa', example: 'Niên khóa 2021-2025' })
  @IsOptional()
  @IsString()
  tenNienKhoa?: string;

  @ApiPropertyOptional({ description: 'Năm bắt đầu niên khóa', example: 2021 })
  @IsOptional()
  @IsInt()
  namBatDau?: number;

  @ApiPropertyOptional({ description: 'Năm kết thúc niên khóa', example: 2025 })
  @IsOptional()
  @IsInt()
  namKetThuc?: number;

  @ApiPropertyOptional({ description: 'Mô tả về niên khóa', example: 'Niên khóa dành cho sinh viên nhập học năm 2021' })
  @IsOptional()
  @IsString()
  moTa?: string;
}