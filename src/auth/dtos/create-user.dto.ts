import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { VaiTroNguoiDungEnum } from '../enums/vai-tro-nguoi-dung.enum';

export class CreateUserDto {
  @ApiProperty({ description: 'Tên đăng nhập duy nhất', example: 'admin2026' })
  @IsString()
  tenDangNhap: string;

  @ApiProperty({ description: 'Mật khẩu (tối thiểu 6 ký tự)', example: 'admin123456' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Vai trò của người dùng',
    enum: VaiTroNguoiDungEnum,
    example: VaiTroNguoiDungEnum.ADMIN,
  })
  @IsEnum(VaiTroNguoiDungEnum)
  vaiTro: VaiTroNguoiDungEnum;

  @ApiPropertyOptional({ description: 'ID sinh viên nếu tạo tài khoản cho sinh viên', example: 123 })
  @IsOptional()
  sinhVienId?: number;

  @ApiPropertyOptional({ description: 'ID giảng viên nếu tạo tài khoản cho giảng viên'})
  @IsOptional()
  giangVienId?: number;
}