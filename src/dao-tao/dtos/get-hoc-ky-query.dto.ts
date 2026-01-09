import { IsOptional, IsString, IsInt, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetHocKyQueryDto {
  @ApiPropertyOptional({ description: 'ID năm học', example: 2021 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  namHocId?: number;

  @ApiPropertyOptional({ description: 'Tìm theo thứ tự học kỳ', example: '1' })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  hockythu?: string;

  @ApiPropertyOptional({ description: 'Tìm theo trang', example: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  page?: number;

  @ApiPropertyOptional({ description: 'Số mục trên mỗi trang', example: 10 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  limit?: number;
}