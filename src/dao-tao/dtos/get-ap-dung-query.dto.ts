import { IsOptional, IsInt, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetApDungQueryDto {
  @ApiPropertyOptional({ description: 'ID ngành', example: 3 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  nganhId?: number;

  @ApiPropertyOptional({ description: 'ID niên khóa', example: 2021 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  nienKhoaId?: number;

  @ApiPropertyOptional({ description: 'ID chương trình đào tạo', example: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  chuongTrinhId?: number;

  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm', example: 'Công nghệ' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Trang hiện tại', example: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  limit?: number = 10;
}