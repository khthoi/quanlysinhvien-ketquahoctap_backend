import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsString, Length } from 'class-validator';

export class UpdateLopHocPhanDto {

  @ApiPropertyOptional({ description: 'Mã lớp học phần', example: 'LHP001' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  maLopHocPhan?: string;

  @ApiPropertyOptional({ description: 'ID giảng viên', example: 5 })
  @IsOptional()
  @IsInt()
  giangVienId?: number;

  @ApiPropertyOptional({ description: 'Ghi chú', example: 'Lớp học phần buổi tối' })
  @IsOptional()
  @IsString()
  ghiChu?: string;
}
