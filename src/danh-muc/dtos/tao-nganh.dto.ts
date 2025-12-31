import { IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class CreateNganhDto {
  @IsNotEmpty({ message: 'Tên ngành không được để trống' })
  tenNganh: string;

  @IsOptional()
  moTa?: string;

  @IsNotEmpty({ message: 'Phải chọn khoa' })
  @IsInt({ message: 'khoaId phải là số' })
  khoaId: number;
}