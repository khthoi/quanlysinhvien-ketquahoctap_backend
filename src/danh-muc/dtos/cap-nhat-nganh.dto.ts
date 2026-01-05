import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsString } from 'class-validator';

export class UpdateNganhDto {

  @ApiProperty({ description: 'Mã ngành', example: 'N001' })
  @IsString()
  maNganh: string;

  @ApiPropertyOptional({ description: 'Tên ngành', example: 'Công nghệ Thông tin' })
  @IsOptional()
  @IsString()
  tenNganh?: string;

  @ApiPropertyOptional({ description: 'Mô tả về ngành', example: 'Ngành chuyên về công nghệ thông tin và lập trình' })
  @IsOptional()
  @IsString()
  moTa?: string;

  @ApiPropertyOptional({ description: 'ID khoa', example: 2 })
  @IsOptional()
  @IsInt()
  khoaId?: number;
}