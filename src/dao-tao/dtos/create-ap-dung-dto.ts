import { IsNotEmpty, IsInt, IsDateString, IsOptional } from 'class-validator';

export class CreateApDungDto {
  @IsNotEmpty()
  @IsInt()
  chuongTrinhId: number;

  @IsNotEmpty()
  @IsInt()
  nganhId: number;

  @IsNotEmpty()
  @IsInt()
  nienKhoaId: number;

  @IsNotEmpty()
  @IsDateString()
  ngayApDung: string;

  @IsOptional()
  ghiChu?: string;
}