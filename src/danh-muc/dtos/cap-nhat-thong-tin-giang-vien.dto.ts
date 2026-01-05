import { IsOptional, IsEmail, IsString, IsEnum, IsDateString, Length } from 'class-validator';
import { GioiTinh } from '../enums/gioi-tinh.enum';

export class UpdateGiangVienDto {

  @IsOptional()
  @IsString()
  hoTen?: string;

  @IsOptional()
  @IsDateString()
  ngaySinh?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @Length(10, 15)
  sdt?: string;

  @IsOptional()
  @IsEnum(GioiTinh)
  gioiTinh?: GioiTinh;

  @IsOptional()
  @IsString()
  diaChi?: string;
}