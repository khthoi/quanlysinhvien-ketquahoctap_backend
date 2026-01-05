import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RequestChangePasswordDto {
  @ApiPropertyOptional({ description: 'Mật khẩu cũ của người dùng', example: 'oldPassword123' })
  @IsString()
  @MinLength(6)
  oldPassword: string;

  @ApiPropertyOptional({ description: 'Mật khẩu mới của người dùng', example: 'newPassword123' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}