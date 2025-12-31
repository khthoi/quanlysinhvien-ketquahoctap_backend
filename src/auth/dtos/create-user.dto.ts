import { IsEnum, IsOptional, IsEmail, IsString, MinLength } from 'class-validator';
import { VaiTroNguoiDungEnum } from '../enums/vai-tro-nguoi-dung.enum';

export class CreateUserDto {
  @IsString()
  tenDangNhap: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(VaiTroNguoiDungEnum)
  vaiTro: VaiTroNguoiDungEnum;

  @IsOptional()
  sinhVienId?: number;

  @IsOptional()
  giangVienId?: number;
}