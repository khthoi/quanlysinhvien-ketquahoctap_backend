import { IsNotEmpty, IsInt, IsString, Length, IsOptional } from 'class-validator';

export class CreateLopHocPhanDto {
  @IsNotEmpty()
  @Length(1, 50)
  maLopHocPhan: string;

  @IsOptional()
  @IsInt()
  giangVienId?: number;

  @IsNotEmpty()
  @IsInt()
  monHocId: number;

  @IsNotEmpty()
  @IsInt()
  hocKyId: number;

  @IsNotEmpty()
  @IsInt()
  nienKhoaId: number;

  @IsNotEmpty()
  @IsInt()
  nganhId: number;

  @IsString()
  ghiChu?: string;

  @IsOptional()
  khoaDiem?: boolean;
}