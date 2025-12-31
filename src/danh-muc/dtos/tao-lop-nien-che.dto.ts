import { IsNotEmpty, IsInt } from 'class-validator';

export class CreateLopDto {
  @IsNotEmpty({ message: 'Tên lớp không được để trống' })
  tenLop: string;

  @IsNotEmpty({ message: 'Phải chọn ngành' })
  @IsInt({ message: 'nganhId phải là số' })
  nganhId: number;

  @IsNotEmpty({ message: 'Phải chọn niên khóa' })
  @IsInt({ message: 'nienKhoaId phải là số' })
  nienKhoaId: number;
}