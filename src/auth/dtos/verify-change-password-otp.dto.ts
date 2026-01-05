import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, Length, MinLength } from 'class-validator';

export class VerifyChangePasswordOtpDto {
  @ApiPropertyOptional({ description: 'Mã OTP xác nhận thay đổi mật khẩu', example: '123456' })
  @IsString()
  @Length(6, 6)
  otp: string;
}