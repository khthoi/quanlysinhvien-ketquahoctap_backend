import { MonHoc } from '../entity/mon-hoc.entity';
import { GioiTinh } from '../enums/gioi-tinh.enum';

export class GiangVienInfoDto {
  id: number;
  hoTen: string;
  email: string;
  sdt: string | null;
  ngaySinh: Date | null;
  gioiTinh: GioiTinh;
  diaChi: string | null;
}

export class PhanCongMonHocResponseDto {
  giangVien: GiangVienInfoDto;
  monHocs: MonHoc[];
}