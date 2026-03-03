import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendFormInformationDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsNotEmpty()
  @IsString()
  message: string;
}
