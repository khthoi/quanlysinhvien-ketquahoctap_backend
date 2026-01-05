import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MonHoc } from '../entity/mon-hoc.entity';
import { GioiTinh } from '../enums/gioi-tinh.enum';

export class GiangVienInfoDto {
  id: number;
  maGiangVien: string;
  hoTen: string;
  email: string;
  sdt: string | null;
  ngaySinh: Date | null;
  gioiTinh: GioiTinh;
  diaChi: string | null;
}

export class PhanCongMonHocResponseDto {
  @ApiProperty({ description: 'Thông tin giảng viên được phân công' })
  giangVien: GiangVienInfoDto;
  @ApiProperty({ description: 'Danh sách môn học được phân công' })
  monHocs: MonHoc[];
}