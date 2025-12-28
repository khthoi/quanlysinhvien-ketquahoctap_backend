import { IsEnum, IsOptional, IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  tenDangNhap: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(['Admin', 'GiangVien', 'SinhVien', 'CanBo'])
  vaiTro: 'Admin' | 'GiangVien' | 'SinhVien' | 'CanBo';

  @IsOptional()
  sinhVienId?: number;

  @IsOptional()
  giangVienId?: number;
}