import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt, Min, IsDateString } from 'class-validator';

export class CreateHocKyDto {
  @ApiProperty({ description: 'Thứ tự học kỳ trong năm học (1, 2, ...)', example: 1 })
  @IsNotEmpty()
  @IsInt()
  @Min(1, { message: 'Thứ tự học kỳ phải lớn hơn hoặc bằng 1' })
  hocKy: number;

  @ApiProperty({ description: 'Ngày bắt đầu học kỳ', example: '2025-09-01' })
  @IsNotEmpty()
  @IsDateString({}, { message: 'Ngày bắt đầu không hợp lệ' })
  ngayBatDau: string;

  @ApiProperty({ description: 'Ngày kết thúc học kỳ', example: '2026-01-20' })
  @IsNotEmpty()
  @IsDateString({}, { message: 'Ngày kết thúc không hợp lệ' })
  ngayKetThuc: string;

  @ApiProperty({ description: 'ID năm học', example: 5 })
  @IsNotEmpty()
  @IsInt()
  namHocId: number;
}