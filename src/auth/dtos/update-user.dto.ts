import { IsEnum, IsOptional } from 'class-validator';
import { VaiTroNguoiDungEnum } from '../enums/vai-tro-nguoi-dung.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsEnum(VaiTroNguoiDungEnum)
  vaiTro?: VaiTroNguoiDungEnum;

  @IsOptional()
  password?: string;
}