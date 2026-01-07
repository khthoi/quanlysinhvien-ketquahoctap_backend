import { ApiProperty } from '@nestjs/swagger';

class SinhVienTheoTinhTrangDto {
  @ApiProperty({ example: 8456 })
  dangHoc: number;

  @ApiProperty({ example: 120 })
  baoLuu: number;

  @ApiProperty({ example: 85 })
  thoiHoc: number;

  @ApiProperty({ example: 2150 })
  daTotNghiep: number;
}

class SinhVienTheoNienKhoaDto {
  @ApiProperty({ example: 'K2024' })
  nienKhoa: string;

  @ApiProperty({ example: 2145 })
  soLuong: number;
}

class ThongKeSinhVienDto {

  @ApiProperty({ example: 11611 })
  tongSinhVien: number;

  @ApiProperty({ type: SinhVienTheoTinhTrangDto })
  theoTinhTrang: SinhVienTheoTinhTrangDto;

  @ApiProperty({ type: [SinhVienTheoNienKhoaDto] })
  theoNienKhoa: SinhVienTheoNienKhoaDto[]; // chỉ đang học
}

class ThongKeLopHocPhanDto {
  @ApiProperty({ example: 'Lớp học phần HK1 2025-2026' })
  tieuDe: string;

  @ApiProperty({ example: 245 })
  tongLop: number;

  @ApiProperty({ example: 230 })
  coGiangVien: number;

  @ApiProperty({ example: 15 })
  chuaCoGiangVien: number;
}

export class ThongKeKetQuaDto {
  @ApiProperty({ example: 'Kết quả học kỳ HK2 2024-2025' })
  tieuDe: string;

  @ApiProperty({ example: 89.2 })
  tyLeDat: number;

  @ApiProperty({ example: 7.23 })
  diemTbChung: number;

  @ApiProperty()
  phanLoai: {
    gioi: number;
    kha: number;
    trungBinh: number;
    yeuKem: number;
  };
}

export class ThongKeTongQuanResponseDto {
  @ApiProperty()
  sinhVien: ThongKeSinhVienDto;

  @ApiProperty({ example: 156 })
  tongGiangVien: number;

  @ApiProperty()
  lopHocPhan: ThongKeLopHocPhanDto;

  @ApiProperty()
  ketQuaHocTap: ThongKeKetQuaDto | { tieuDe: string };
}