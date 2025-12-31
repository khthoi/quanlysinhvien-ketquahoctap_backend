import { IsNotEmpty, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { LoaiMonEnum } from '../enums/loai-mon.enum';

export class CreateMonHocDto {
  @IsNotEmpty({ message: 'Tên môn học không được để trống' })
  @IsString()
  tenMonHoc: string;

  @IsNotEmpty({ message: 'Loại môn phải được chọn' })
  @IsEnum(LoaiMonEnum, { message: 'Loại môn không hợp lệ' })
  loaiMon: LoaiMonEnum;

  @IsNotEmpty({ message: 'Số tín chỉ không được để trống' })
  @IsInt()
  @Min(1, { message: 'Số tín chỉ phải lớn hơn hoặc bằng 1' })
  soTinChi: number;

  @IsOptional()
  @IsString()
  moTa?: string;
}