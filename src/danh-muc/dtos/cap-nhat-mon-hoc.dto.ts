import { IsOptional, IsEnum, IsInt, IsString, Min } from 'class-validator';
import { LoaiMonEnum } from '../enums/loai-mon.enum';

export class UpdateMonHocDto {
  @IsOptional()
  @IsString()
  tenMonHoc?: string;

  @IsOptional()
  @IsString()
  maMonHoc?: string;

  @IsOptional()
  @IsEnum(LoaiMonEnum)
  loaiMon?: LoaiMonEnum;

  @IsOptional()
  @IsInt()
  @Min(1)
  soTinChi?: number;

  @IsOptional()
  @IsString()
  moTa?: string;
}