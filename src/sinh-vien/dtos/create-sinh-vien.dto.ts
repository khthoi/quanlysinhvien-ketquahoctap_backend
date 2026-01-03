import { IsNotEmpty, IsEmail, IsOptional, IsDate, IsEnum, IsString, Length, IsDateString } from 'class-validator';
import { GioiTinh } from 'src/danh-muc/enums/gioi-tinh.enum';
import { TinhTrangHocTapEnum } from '../enums/tinh-trang-hoc-tap.enum';

export class CreateSinhVienDto {
  @IsNotEmpty()
  @Length(1, 40)
  maSinhVien: string;

  @IsNotEmpty()
  @Length(1, 100)
  hoTen: string;

  @IsNotEmpty()
  @IsDateString({}, { message: 'ngaySinh phải có định dạng YYYY-MM-DD' })
  ngaySinh: string;

  @IsOptional()
  @IsEnum(GioiTinh)
  gioiTinh?: GioiTinh;

  @IsOptional()
  @IsString()
  diaChi?: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @Length(10, 15)
  sdt: string;

  @IsNotEmpty()
  @IsDateString({}, { message: 'ngayNhapHoc phải có định dạng YYYY-MM-DD' })
  ngayNhapHoc: string;

  @IsOptional()
  @IsEnum(TinhTrangHocTapEnum)
  tinhTrang?: TinhTrangHocTapEnum;

  @IsNotEmpty()
  lopId: number;
}