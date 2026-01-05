import { IsOptional, IsString, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetHocKyQueryDto {
  @ApiPropertyOptional({ description: 'ID năm học', example: 2021 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  namHocId?: number;

  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm', example: 'Học kỳ 1' })
  @IsOptional()
  @IsString()
  search?: string;
}