import { IsNotEmpty, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNganhDto {

  @ApiProperty({ description: 'Mã ngành', example: 'N001' })
  @IsNotEmpty({ message: 'Mã ngành không được để trống' })
  maNganh: string;

  @ApiProperty({ description: 'Tên ngành', example: 'Công nghệ Thông tin' })
  @IsNotEmpty({ message: 'Tên ngành không được để trống' })
  tenNganh: string;

  @ApiPropertyOptional({ description: 'Mô tả về ngành', example: 'Ngành chuyên về công nghệ thông tin và lập trình' })
  @IsOptional()
  moTa?: string;

  @ApiProperty({ description: 'ID khoa', example: 2 })
  @IsNotEmpty({ message: 'Phải chọn khoa' })
  @IsInt({ message: 'khoaId phải là số' })
  khoaId: number;
}