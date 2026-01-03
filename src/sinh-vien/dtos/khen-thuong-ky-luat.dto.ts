import { IsNotEmpty, IsEnum, IsDateString } from 'class-validator';
import { LoaiKhenThuongKyLuatEnum } from '../entity/khenthuong-kyluat.entity';

export class KhenThuongKyLuatDto {
  @IsNotEmpty()
  @IsEnum(LoaiKhenThuongKyLuatEnum)
  loai: LoaiKhenThuongKyLuatEnum;

  @IsNotEmpty()
  noiDung: string;

  @IsNotEmpty()
  @IsDateString({}, { message: 'ngayQuyetDinh phải có định dạng YYYY-MM-DD' })
  ngayQuyetDinh: string;
}