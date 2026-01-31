import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'ID người dùng cần reset mật khẩu', example: 1 })
  @IsNumber()
  userId: number;
}
