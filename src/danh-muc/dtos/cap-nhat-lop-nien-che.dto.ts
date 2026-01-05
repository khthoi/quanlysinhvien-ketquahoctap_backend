import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsString } from 'class-validator';

export class UpdateLopDto {

  @ApiProperty({ description: 'Mã lớp niên chế', example: 'LNC001' })
  @IsString()
  maLop: string;

  @ApiPropertyOptional({ description: 'Tên lớp niên chế', example: 'Lớp Kỹ thuật 1' })
  @IsOptional()
  @IsString()
  tenLop?: string;

  @ApiPropertyOptional({ description: 'ID ngành', example: 3 })
  @IsOptional()
  @IsInt()
  nganhId?: number;

  @ApiPropertyOptional({ description: 'ID niên khóa', example: 2021 })
  @IsOptional()
  @IsInt()
  nienKhoaId?: number;
}