import { IsEnum, IsOptional } from 'class-validator';
import { VaiTroNguoiDungEnum } from '../enums/vai-tro-nguoi-dung.enum';

export class UpdateUserDto {

  @IsOptional()
  tenDangNhap?: string;

  @IsOptional()
  @IsEnum(VaiTroNguoiDungEnum)
  vaiTro?: VaiTroNguoiDungEnum;

}