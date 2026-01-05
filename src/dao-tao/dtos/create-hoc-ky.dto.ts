import { IsNotEmpty, IsInt, IsOptional, IsDateString, Length, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHocKyDto {

  @ApiProperty({ description: 'Mã học kỳ', example: 'HK1_2024' })
  @IsNotEmpty({ message: 'Mã học kỳ là bắt buộc' })
  @Length(1, 10)
  maHocKy: string;

  @ApiProperty({ description: 'Tên học kỳ', example: 'Học kỳ 1' })
  @IsNotEmpty({ message: 'Tên học kỳ là bắt buộc' })
  @Length(1, 10)
  tenHocKy: string;

  @ApiProperty({ description: 'Ngày bắt đầu học kỳ', example: '2024-09-01' })
  @IsNotEmpty()
  @IsDateString({}, { message: 'Ngày bắt đầu không hợp lệ' })
  ngayBatDau: string;

  @ApiProperty({ description: 'Ngày kết thúc học kỳ', example: '2025-01-15' })
  @IsNotEmpty()
  @IsDateString({}, { message: 'Ngày kết thúc không hợp lệ' })
  ngayKetThuc: string;

  @ApiProperty({ description: 'ID năm học', example: 2024 })
  @IsNotEmpty({ message: 'Năm học là bắt buộc' })
  @IsInt()
  namHocId: number;
}