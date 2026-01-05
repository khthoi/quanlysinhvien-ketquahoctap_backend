import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsEmail } from 'class-validator';

export class ResetPasswordDto {
  @ApiPropertyOptional({ description: 'ID người dùng cần reset mật khẩu', example: 1 })
  @IsNumber()
  userId: number;
  @ApiPropertyOptional({ description: 'Email người dùng cần reset mật khẩu', example: 'user@example.com' })
  @IsEmail()
  email: string;
  @ApiPropertyOptional({ description: 'Số điện thoại người dùng cần reset mật khẩu', example: '0123456789' })
  @IsString()
  sdt: string;
}