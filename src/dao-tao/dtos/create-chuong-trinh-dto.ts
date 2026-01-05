import { IsNotEmpty, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChuongTrinhDto {

  @ApiProperty({ description: 'Mã chương trình đào tạo', example: 'CNTT2021' })
  @IsNotEmpty()
  maChuongTrinh: string;

  @ApiProperty({ description: 'Tên chương trình đào tạo', example: 'Cử nhân Công nghệ Thông tin' })
  @IsNotEmpty()
  tenChuongTrinh: string;

  @ApiProperty({ description: 'Thời gian đào tạo (số năm)', example: 4 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  thoiGianDaoTao: number; // số năm

  @ApiProperty({ description: 'ID ngành', example: 3 })
  @IsNotEmpty()
  @IsInt()
  nganhId: number;
}