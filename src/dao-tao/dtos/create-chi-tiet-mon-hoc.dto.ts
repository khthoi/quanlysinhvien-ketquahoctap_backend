import { IsNotEmpty, IsInt, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChiTietMonHocDto {
  @ApiProperty({ description: 'Thứ tự học kỳ', example: 1 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  thuTuHocKy: number;

  @ApiProperty({ description: 'ID môn học', example: 101 })
  @IsNotEmpty()
  @IsInt()
  monHocId: number;

  @ApiPropertyOptional({ description: 'Ghi chú', example: 'Môn học bắt buộc' })
  @IsOptional()
  ghiChu?: string;
}