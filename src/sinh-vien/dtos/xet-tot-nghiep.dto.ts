import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class XetTotNghiepDto {
  @ApiProperty({
    description: 'ID của niên khóa cần xét tốt nghiệp',
    example: 1,
  })
  @IsNotEmpty({ message: 'Niên khóa không được để trống' })
  @IsNumber({}, { message:  'Niên khóa phải là số' })
  nienKhoaId: number;
}