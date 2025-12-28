import { IsNumber, IsString, IsEmail } from 'class-validator';

export class ResetPasswordDto {
  @IsNumber()
  userId: number;

  @IsEmail()
  email: string;

  @IsString()
  sdt: string;
}