import { IsNotEmpty, IsEmail, IsOptional, IsString, IsEnum, IsDateString, Length } from 'class-validator';
import { GioiTinh } from '../enums/gioi-tinh.enum';

export class CreateGiangVienDto {
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @IsString()
  hoTen: string;

  @IsOptional()
  @IsDateString()
  ngaySinh?: string;

  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsOptional()
  @Length(10, 15)
  sdt?: string;

  @IsOptional()
  @IsEnum(GioiTinh, { message: 'Giới tính không hợp lệ' })
  gioiTinh?: GioiTinh;

  @IsOptional()
  @IsString()
  diaChi?: string;
}