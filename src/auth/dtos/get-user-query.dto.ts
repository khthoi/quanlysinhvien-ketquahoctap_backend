import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, IsString, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetUsersQueryDto {
  @ApiPropertyOptional({ description: 'Trang hiện tại', example: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Số bản ghi mỗi trang', example: 10 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Tìm kiếm theo tên đăng nhập hoặc vai trò', example: 'admin' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo vai trò',
    enum: ['SINH_VIEN', 'GIANG_VIEN', 'ADMIN', 'CAN_BO_PHONG_DAO_TAO'],
    example: 'SINH_VIEN',
  })
  @IsOptional()
  @IsIn(['SINH_VIEN', 'GIANG_VIEN', 'ADMIN', 'CAN_BO_PHONG_DAO_TAO'])
  vaiTro?: string;
}