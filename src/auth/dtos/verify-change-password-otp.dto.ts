import { IsString, Length, MinLength } from 'class-validator';

export class VerifyChangePasswordOtpDto {
  @IsString()
  @Length(6, 6)
  otp: string;
}