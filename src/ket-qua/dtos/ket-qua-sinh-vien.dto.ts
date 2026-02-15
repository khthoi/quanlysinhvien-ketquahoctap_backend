import { ApiProperty } from '@nestjs/swagger';

class LopHocPhanDiemDto {
  @ApiProperty()
  lopHocPhanId: number;

  @ApiProperty()
  maLopHocPhan: string;

  @ApiProperty()
  khoaDiem: boolean;

  @ApiProperty({ example: 1, description: 'Số thứ tự học kỳ (1, 2, 3, ...)' })
  hocKy: number;

  @ApiProperty()
  maNamHoc: string;

  @ApiProperty()
  tenNamHoc: string;

  @ApiProperty()
  ngayBatDau: Date;

  @ApiProperty()
  ngayKetThuc: Date;

  @ApiProperty({ example: 8 })
  diemQuaTrinh: number | null;

  @ApiProperty({ example: 7.5 })
  diemThanhPhan: number | null;

  @ApiProperty({ example: 6.5 })
  diemThi: number | null;

  @ApiProperty({ nullable: true, description: 'Điểm TBCHP hệ 10' })
  tbchp: number | null;

  @ApiProperty({ nullable: true, description: 'Điểm quy đổi hệ 4' })
  diemHe4: number | null;

  @ApiProperty({ nullable: true, description: 'Điểm chữ (A, B+, ...)' })
  diemChu: string | null;
}

class KetQuaTheoMonHocDto {
  @ApiProperty()
  monHocId: number;

  @ApiProperty()
  maMonHoc: string;

  @ApiProperty()
  tenMonHoc: string;

  @ApiProperty({ nullable: true })
  soTinChi: number | null;

  @ApiProperty()
  loaiMonHoc: string;

  @ApiProperty({ type: [LopHocPhanDiemDto] })
  lopHocPhans: LopHocPhanDiemDto[];
}

class SinhVienThongTinKetQuaDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  maSinhVien: string;

  @ApiProperty()
  hoTen: string;

  @ApiProperty({ nullable: true })
  ngaySinh: Date | null;

  @ApiProperty({ nullable: true })
  gioiTinh: string | null;

  @ApiProperty({ description: 'Tình trạng học tập hiện tại của sinh viên' })
  tinhTrang: string;

  @ApiProperty({ nullable: true })
  maLop: string | null;

  @ApiProperty({ nullable: true })
  tenLop: string | null;

  @ApiProperty({ nullable: true })
  maNganh: string | null;

  @ApiProperty({ nullable: true })
  tenNganh: string | null;

  @ApiProperty({ nullable: true })
  maNienKhoa: string | null;

  @ApiProperty({ nullable: true })
  tenNienKhoa: string | null;
}

class KetQuaXetTotNghiepMiniDto {
  @ApiProperty({ nullable: true, description: 'GPA hệ 4 được dùng xét tốt nghiệp' })
  gpa: number | null;

  @ApiProperty({ nullable: true, description: 'Xếp loại tốt nghiệp theo GPA' })
  xepLoaiTotNghiep: string | null;
}

export class KetQuaSinhVienResponseDto {
  @ApiProperty({ type: SinhVienThongTinKetQuaDto })
  sinhVien: SinhVienThongTinKetQuaDto;

  @ApiProperty({ type: [KetQuaTheoMonHocDto] })
  ketQuaTheoMon: KetQuaTheoMonHocDto[];

  @ApiProperty({
    nullable: true,
    description:
      'Điểm trung bình chung học phần hệ 10 (lấy điểm TBCHP cao nhất của mỗi môn để tính trung bình)',
  })
  tbchpHe10: number | null;

  @ApiProperty({ nullable: true, description: 'GPA hệ 4 tính từ điểm cao nhất mỗi môn' })
  gpa: number | null;

  @ApiProperty({ nullable: true, description: 'Xếp loại học lực theo GPA' })
  xepLoaiHocLuc: string | null;

  @ApiProperty({
    type: KetQuaXetTotNghiepMiniDto,
    nullable: true,
    description:
      'Kết quả xét tốt nghiệp (chỉ có nếu tình trạng sinh viên là ĐÃ TỐT NGHIỆP, ngược lại trả về null)',
  })
  ketQuaXetTotNghiep: KetQuaXetTotNghiepMiniDto | null;
}

