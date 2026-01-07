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
}