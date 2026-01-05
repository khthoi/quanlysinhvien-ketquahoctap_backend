import { IsString, IsDateString, IsEnum, IsOptional, IsEmail, Length, Matches } from 'class-validator';
import { GioiTinh } from 'src/danh-muc/enums/gioi-tinh.enum';
import { TinhTrangHocTapEnum } from '../enums/tinh-trang-hoc-tap.enum';
import { ApiProperty } from '@nestjs/swagger';

export class ImportSinhVienDto {
  @IsString()
  @Length(8, 40)
  @Matches(/^[^\\s]+$/, { message: 'Mã sinh viên không được chứa khoảng trắng' })
  maSinhVien: string;

  @IsString()
  hoTen: string;

  @IsOptional()
  @IsDateString()
  ngaySinh?: string;

  @IsOptional()
  @IsEnum(GioiTinh)
  gioiTinh?: GioiTinh;

  @IsOptional()
  @IsString()
  diaChi?: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @Length(10, 15)
  sdt?: string;

  @IsDateString()
  ngayNhapHoc: string;

  @IsOptional()
  @IsEnum(TinhTrangHocTapEnum)
  tinhTrang?: TinhTrangHocTapEnum = TinhTrangHocTapEnum.DANG_HOC;

  @IsString()
  @Length(1, 30)
  maLop: string; // ← Dùng mã lớp thay vì ID
}

export class ImportSinhVienBatchDto {
  sinhViens: ImportSinhVienDto[];
}