import { IsNotEmpty, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PhanCongGiangVienDto {
  @ApiProperty({ description: 'ID giảng viên', example: 5 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  giangVienId: number;
}