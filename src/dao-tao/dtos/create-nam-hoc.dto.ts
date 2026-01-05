import { IsNotEmpty, IsInt, Min, Max, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNamHocDto {

  @ApiProperty({ description: 'Mã năm học', example: 'NH2024' })
  @IsNotEmpty({ message: 'Mã năm học là bắt buộc' })
  @Length(1, 20)
  maNamHoc: string;

  @ApiProperty({ description: 'Tên năm học', example: '2024-2025' })
  @IsNotEmpty({ message: 'Tên năm học là bắt buộc' })
  @Length(1, 20)
  tenNamHoc: string;

  @ApiProperty({ description: 'Năm bắt đầu', example: 2024 })
  @IsNotEmpty({ message: 'Năm bắt đầu là bắt buộc' })
  @IsInt()
  @Min(1900)
  @Max(2100)
  namBatDau: number;

  @ApiProperty({ description: 'Năm kết thúc', example: 2025 })
  @IsNotEmpty({ message: 'Năm kết thúc là bắt buộc' })
  @IsInt()
  @Min(1900)
  @Max(2100)
  namKetThuc: number;
}