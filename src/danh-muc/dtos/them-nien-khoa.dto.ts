import { IsNotEmpty, IsInt, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNienKhoaDto {

  @ApiProperty({ description: 'Mã niên khóa', example: 'NK001' })
  @IsNotEmpty({ message: 'Mã niên khóa không được để trống' })
  @IsString()
  maNienKhoa: string;

  @ApiProperty({ description: 'Tên niên khóa', example: 'Niên khóa 2021-2025' })
  @IsNotEmpty({ message: 'Tên niên khóa không được để trống' })
  @IsString()
  tenNienKhoa: string;

  @ApiProperty({ description: 'Năm bắt đầu niên khóa', example: 2021 })
  @IsNotEmpty({ message: 'Năm bắt đầu không được để trống' })
  @IsInt()
  namBatDau: number;

  @ApiProperty({ description: 'Năm kết thúc niên khóa', example: 2025 })
  @IsNotEmpty({ message: 'Năm kết thúc không được để trống' })
  @IsInt()
  namKetThuc: number;

  @ApiPropertyOptional({ description: 'Mô tả về niên khóa', example: 'Niên khóa dành cho sinh viên nhập học năm 2021' })
  @IsOptional()
  @IsString()
  moTa?: string;
}