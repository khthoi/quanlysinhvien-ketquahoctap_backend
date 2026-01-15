import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, Min } from 'class-validator';

export class LenKeHoachTaoLhpDto {
  @ApiProperty({ example: 'NH2026', description: 'Mã năm học' })
  @IsNotEmpty()
  @IsString()
  maNamHoc: string;

  @ApiProperty({ example: 1, description: 'Học kỳ' })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  hocKy: number;
}