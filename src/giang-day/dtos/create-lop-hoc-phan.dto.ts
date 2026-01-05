import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsInt, IsString, Length, IsOptional } from 'class-validator';

export class CreateLopHocPhanDto {
  @ApiProperty({ description: 'Mã lớp học phần', example: 'LHP001' })
  @IsNotEmpty()
  @Length(1, 50)
  maLopHocPhan: string;

  @ApiPropertyOptional({ description: 'ID giảng viên', example: 5 })
  @IsOptional()
  @IsInt()
  giangVienId?: number;

  @ApiProperty({ description: 'ID môn học', example: 10 })
  @IsNotEmpty()
  @IsInt()
  monHocId: number;

  @ApiProperty({ description: 'ID học kỳ', example: 2 })
  @IsNotEmpty()
  @IsInt()
  hocKyId: number;

  @ApiProperty({ description: 'ID niên khóa', example: 2023 })
  @IsNotEmpty()
  @IsInt()
  nienKhoaId: number;

  @ApiProperty({ description: 'ID ngành', example: 3 })
  @IsNotEmpty()
  @IsInt()
  nganhId: number;

  @ApiPropertyOptional({ description: 'Ghi chú', example: 'Lớp học phần buổi tối' })
  @IsString()
  ghiChu?: string;

  @ApiPropertyOptional({ description: 'Có khóa điểm hay không', example: false })
  @IsOptional()
  khoaDiem?: boolean;
}