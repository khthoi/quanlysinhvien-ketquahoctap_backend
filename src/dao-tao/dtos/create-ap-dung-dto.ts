import { IsNotEmpty, IsInt, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApDungDto {
  @ApiProperty({ description: 'ID chương trình đào tạo', example: 1 })
  @IsNotEmpty()
  @IsInt()
  chuongTrinhId: number;

  @ApiProperty({ description: 'ID ngành', example: 3 })
  @IsNotEmpty()
  @IsInt()
  nganhId: number;

  @ApiProperty({ description: 'ID niên khóa', example: 2021 })
  @IsNotEmpty()
  @IsInt()
  nienKhoaId: number;

  @ApiPropertyOptional({ description: 'Ngày áp dụng', example: '2024-09-01' })
  @IsOptional()
  @IsDateString()
  ngayApDung?: string;

  @ApiPropertyOptional({ description: 'Ghi chú', example: 'Áp dụng từ học kỳ 1 năm 2024' })
  @IsOptional()
  ghiChu?: string;
}