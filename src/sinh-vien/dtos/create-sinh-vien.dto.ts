import { IsNotEmpty, IsEmail, IsOptional, IsDate, IsEnum, IsString, Length, IsDateString } from 'class-validator';
import { GioiTinh } from 'src/danh-muc/enums/gioi-tinh.enum';
import { TinhTrangHocTapEnum } from '../enums/tinh-trang-hoc-tap.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSinhVienDto {
  @ApiProperty({ description: 'Mã sinh viên', example: 'SV001' })
  @IsNotEmpty()
  @Length(1, 40)
  maSinhVien: string;

  @ApiProperty({ description: 'Họ tên sinh viên', example: 'Nguyễn Văn A' })
  @IsNotEmpty()
  @Length(1, 100)
  hoTen: string;

  @ApiProperty({ description: 'Ngày sinh của sinh viên', example: '2000-01-15' })
  @IsNotEmpty()
  @IsDateString({}, { message: 'ngaySinh phải có định dạng YYYY-MM-DD' })
  ngaySinh: string;

  @ApiPropertyOptional({ description: 'Giới tính của sinh viên', example: 'NAM' })
  @IsOptional()
  @IsEnum(GioiTinh)
  gioiTinh?: GioiTinh;

  @ApiPropertyOptional({ description: 'Địa chỉ của sinh viên', example: '123 Đường ABC, Quận 1, TP.HCM' })
  @IsOptional()
  @IsString()
  diaChi?: string;

  @ApiProperty({ description: 'Email của sinh viên', example: 'nguyenvana@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Số điện thoại của sinh viên', example: '0123456789' })
  @IsNotEmpty()
  @Length(10, 15)
  sdt: string;

  @ApiProperty({ description: 'Ngày nhập học của sinh viên', example: '2023-09-01' })
  @IsNotEmpty()
  @IsDateString({}, { message: 'ngayNhapHoc phải có định dạng YYYY-MM-DD' })
  ngayNhapHoc: string;

  @ApiPropertyOptional({ description: 'Tình trạng học tập của sinh viên', example: 'DANG_HOC' })
  @IsOptional()
  @IsEnum(TinhTrangHocTapEnum)
  tinhTrang?: TinhTrangHocTapEnum;

  @ApiProperty({ description: 'ID lớp sinh viên', example: 1 })
  @IsNotEmpty()
  lopId: number;
}