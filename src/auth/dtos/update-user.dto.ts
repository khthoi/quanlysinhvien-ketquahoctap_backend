import { IsEnum, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEnum(['Admin', 'GiangVien', 'SinhVien', 'CanBo'])
  vaiTro?: 'Admin' | 'GiangVien' | 'SinhVien' | 'CanBo';

  @IsOptional()
  password?: string;
}