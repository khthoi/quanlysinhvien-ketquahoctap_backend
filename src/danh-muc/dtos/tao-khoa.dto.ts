import { IsString, IsOptional, IsDate } from 'class-validator';

export class CreateKhoaDto {
  @IsString()
  tenKhoa: string;

  @IsOptional()
  @IsString()
  moTa?: string;

  @IsOptional()
  @IsDate()
  ngayThanhLap?: Date;
}