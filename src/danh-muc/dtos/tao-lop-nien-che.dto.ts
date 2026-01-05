import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsInt } from 'class-validator';

export class CreateLopDto {

  @ApiProperty({ description: 'Mã lớp niên chế', example: 'LNC001' })
  @IsNotEmpty({ message: 'Mã lớp không được để trống' })
  maLop: string;

  @ApiProperty({ description: 'Tên lớp niên chế', example: 'Lớp Kỹ thuật 1' })
  @IsNotEmpty({ message: 'Tên lớp không được để trống' })
  tenLop: string;

  @ApiProperty({ description: 'ID ngành', example: 3 })
  @IsNotEmpty({ message: 'Phải chọn ngành' })
  @IsInt({ message: 'nganhId phải là số' })
  nganhId: number;

  @ApiProperty({ description: 'ID niên khóa', example: 2021 })
  @IsNotEmpty({ message: 'Phải chọn niên khóa' })
  @IsInt({ message: 'nienKhoaId phải là số' })
  nienKhoaId: number;
}