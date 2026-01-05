import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'Tên đăng nhập của người dùng', example: 'sinhvien123' })
  @IsString()
  tenDangNhap: string;

  @ApiProperty({ description: 'Mật khẩu (tối thiểu 6 ký tự)', example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;
}