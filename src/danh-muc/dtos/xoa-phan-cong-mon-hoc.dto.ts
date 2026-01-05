import { IsNotEmpty, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class XoaPhanCongMonHocDto {
  @ApiProperty({ description: 'ID giảng viên', example: 1 })
  @IsNotEmpty()
  @IsInt()
  giangVienId: number;

  @ApiProperty({ description: 'ID môn học', example: 101 })
  @IsNotEmpty()
  @IsInt()
  monHocId: number;
}