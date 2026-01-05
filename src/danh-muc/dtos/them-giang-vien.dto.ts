import { IsNotEmpty, IsEmail, IsOptional, IsString, IsEnum, IsDateString, Length } from 'class-validator';
import { GioiTinh } from '../enums/gioi-tinh.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGiangVienDto {
  @ApiProperty({ description: 'Mã giảng viên', example: 'GV001' })
  @IsNotEmpty({ message: 'Mã giảng viên không được để trống' })
  @IsString()
  maGiangVien: string;

  @ApiProperty({ description: 'Họ tên giảng viên', example: 'Nguyễn Văn A' })
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @IsString()
  hoTen: string;

  @ApiPropertyOptional({ description: 'Ngày sinh của giảng viên', example: '1990-01-01' })
  @IsOptional()
  @IsDateString()
  ngaySinh?: string;

  @ApiProperty({ description: 'Email giảng viên', example: 'nguyenvana@example.com' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiPropertyOptional({ description: 'Số điện thoại giảng viên', example: '0123456789' })
  @IsOptional()
  @Length(10, 15)
  sdt?: string;

  @ApiPropertyOptional({ description: 'Giới tính của giảng viên', example: GioiTinh.NAM, enum: GioiTinh })
  @IsOptional()
  @IsEnum(GioiTinh, { message: 'Giới tính không hợp lệ' })
  gioiTinh?: GioiTinh;

  @ApiPropertyOptional({ description: 'Địa chỉ của giảng viên', example: '123 Đường ABC, Quận 1, TP.HCM' })
  @IsOptional()
  @IsString()
  diaChi?: string;
}