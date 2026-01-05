import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { VaiTroNguoiDungEnum } from '../enums/vai-tro-nguoi-dung.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Tên đăng nhập mới', example: 'newusername' })
  @IsOptional()
  tenDangNhap?: string;

  @ApiPropertyOptional({
    description: 'Vai trò mới',
    enum: VaiTroNguoiDungEnum,
    example: VaiTroNguoiDungEnum.GIANG_VIEN,
  })
  @IsOptional()
  @IsEnum(VaiTroNguoiDungEnum)
  vaiTro?: VaiTroNguoiDungEnum;
}