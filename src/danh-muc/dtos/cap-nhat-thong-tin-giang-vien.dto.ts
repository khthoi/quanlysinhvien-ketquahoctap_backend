import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEmail, IsString, IsEnum, IsDateString, Length } from 'class-validator';
import { GioiTinh } from '../enums/gioi-tinh.enum';

export class UpdateGiangVienDto {

  @ApiProperty({ description: 'Mã giảng viên', example: 'GV001' })
  @IsOptional()
  @IsString()
  maGiangVien?: string;

  @ApiPropertyOptional({ description: 'Họ và tên giảng viên', example: 'Nguyễn Văn A' })
  @IsOptional()
  @IsString()
  hoTen?: string;

  @ApiPropertyOptional({ description: 'Ngày sinh của giảng viên', example: '1980-05-20' })
  @IsOptional()
  @IsDateString()
  ngaySinh?: string;

  @ApiPropertyOptional({ description: 'Email của giảng viên', example: 'nguyenvana@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Số điện thoại của giảng viên', example: '0123456789' })
  @IsOptional()
  @Length(10, 15)
  sdt?: string;

  @ApiPropertyOptional({ description: 'Giới tính của giảng viên', example: GioiTinh.NAM, enum: GioiTinh })
  @IsOptional()
  @IsEnum(GioiTinh)
  gioiTinh?: GioiTinh;

  @ApiPropertyOptional({ description: 'Địa chỉ của giảng viên', example: '123 Đường ABC, Quận 1, TP.HCM' })
  @IsOptional()
  @IsString()
  diaChi?: string;
}