import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsInt } from 'class-validator';

export class PhanCongMonHocDto {
  @ApiProperty({ description: 'ID giảng viên', example: 1 })
  @IsNotEmpty({ message: 'giangVienId không được để trống' })
  @IsInt()
  giangVienId: number;

  @ApiProperty({ description: 'ID môn học', example: 101 })
  @IsNotEmpty({ message: 'monHocId không được để trống' })
  @IsInt()
  monHocId: number;
}