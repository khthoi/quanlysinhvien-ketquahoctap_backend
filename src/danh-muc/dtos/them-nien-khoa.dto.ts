import { IsNotEmpty, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateNienKhoaDto {
  @IsNotEmpty({ message: 'Tên niên khóa không được để trống' })
  @IsString()
  tenNienKhoa: string;

  @IsNotEmpty({ message: 'Năm bắt đầu không được để trống' })
  @IsInt()
  namBatDau: number;

  @IsNotEmpty({ message: 'Năm kết thúc không được để trống' })
  @IsInt()
  namKetThuc: number;

  @IsOptional()
  @IsString()
  moTa?: string;
}