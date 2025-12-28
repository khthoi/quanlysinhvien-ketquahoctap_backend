import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  tenDangNhap: string;

  @IsString()
  @MinLength(6)
  password: string;
}