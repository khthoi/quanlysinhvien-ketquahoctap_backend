import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, IsOptional } from 'class-validator';

export class GetDeXuatLopHocPhanChoHocLaiQueryDto {
  @ApiProperty({ description: 'Mã năm học', example: '2022-2023' })
  @IsNotEmpty()
  @IsString()
  maNamHoc: string;

  @ApiProperty({ description: 'Học kỳ', example: 1 })
  @IsNotEmpty()
  @IsInt()
  hocKy: number;
}

export class SinhVienCanHocLaiDto {
  @ApiProperty({ description: 'ID sinh viên' })
  id: number;

  @ApiProperty({ description: 'Mã sinh viên' })
  maSinhVien: string;

  @ApiProperty({ description: 'Họ tên' })
  hoTen: string;

  @ApiProperty({ description: 'ID ngành' })
  nganhId: number;

  @ApiProperty({ description: 'Mã ngành' })
  maNganh: string;

  @ApiProperty({ description: 'ID niên khóa' })
  nienKhoaId: number;

  @ApiProperty({ description: 'Mã niên khóa' })
  maNienKhoa: string;

  @ApiProperty({ description: 'Năm bắt đầu niên khóa' })
  namBatDau: number;
}

export class LopHocPhanDeXuatCanTaoDto {
  @ApiProperty({ description: 'Mã lớp học phần đề xuất' })
  maLopHocPhan: string;

  @ApiProperty({ description: 'ID môn học' })
  monHocId: number;

  @ApiProperty({ description: 'Mã môn học' })
  maMonHoc: string;

  @ApiProperty({ description: 'Tên môn học' })
  tenMonHoc: string;

  @ApiProperty({ description: 'Số tín chỉ' })
  soTinChi: number;

  @ApiProperty({ description: 'ID ngành' })
  nganhId: number;

  @ApiProperty({ description: 'Mã ngành' })
  maNganh: string;

  @ApiProperty({ description: 'Tên ngành' })
  tenNganh: string;

  @ApiProperty({ description: 'ID niên khóa' })
  nienKhoaId: number;

  @ApiProperty({ description: 'Mã niên khóa' })
  maNienKhoa: string;

  @ApiProperty({ description: 'Tên niên khóa' })
  tenNienKhoa: string;

  @ApiProperty({ description: 'ID năm học được gán cho lớp học phần' })
  namHocId: number;

  @ApiProperty({ description: 'Mã năm học được gán cho lớp học phần' })
  maNamHoc: string;

  @ApiProperty({ description: 'Tên năm học được gán cho lớp học phần' })
  tenNamHoc: string;

  @ApiProperty({ description: 'ID học kỳ được gán cho lớp học phần' })
  hocKyId: number;

  @ApiProperty({ description: 'Học kỳ được gán cho lớp học phần' })
  hocKy: number;

  @ApiProperty({ description: 'ID giảng viên (nếu có)' })
  giangVienId?: number | null;

  @ApiProperty({ description: 'Mã giảng viên (nếu có)' })
  maGiangVien?: string | null;

  @ApiProperty({ description: 'Họ tên giảng viên (nếu có)' })
  hoTenGiangVien?: string | null;

  @ApiProperty({ description: 'Số sinh viên cần học lại' })
  soSinhVienCanHocLai: number;

  @ApiProperty({ description: 'Danh sách sinh viên cần học lại', type: [SinhVienCanHocLaiDto] })
  danhSachSinhVien: SinhVienCanHocLaiDto[];
}

export class GetDeXuatLopHocPhanChoHocLaiResponseDto {
  @ApiProperty({ description: 'Mã năm học xét các lớp học phần cho sinh viên học lại' })
  maNamHocXet: string;

  @ApiProperty({ description: 'Tên năm học xét các lớp học phần cho sinh viên học lại' })
  tenNamHocXet: string;

  @ApiProperty({ description: 'Học kỳ xét các lớp học phần cho sinh viên học lại' })
  hocKyXet: number;

  @ApiProperty({ description: 'Mã năm học dự kiến của các lớp học phần' })
  maNamHocDuKien: string;

  @ApiProperty({ description: 'Tên năm học dự kiến của các lớp học phần' })
  tenNamHocDuKien: string;

  @ApiProperty({ description: 'Học kỳ dự kiến của các lớp học phần' })
  hocKyDuKien: number;

  @ApiProperty({ description: 'Danh sách lớp học phần đề xuất cần tạo', type: [LopHocPhanDeXuatCanTaoDto] })
  danhSachLopHocPhanDeXuat: LopHocPhanDeXuatCanTaoDto[];

  @ApiProperty({ description: 'Tổng số lớp học phần cần tạo' })
  tongSoLop: number;

  @ApiProperty({ description: 'Tổng số sinh viên cần học lại' })
  tongSoSinhVien: number;
}

export class TaoLopHocPhanChoHocLaiDto {
  @ApiProperty({ description: 'Mã lớp học phần' })
  @IsNotEmpty()
  @IsString()
  maLopHocPhan: string;

  @ApiProperty({ description: 'ID môn học' })
  @IsNotEmpty()
  @IsInt()
  monHocId: number;

  @ApiProperty({ description: 'ID ngành' })
  @IsNotEmpty()
  @IsInt()
  nganhId: number;

  @ApiProperty({ description: 'ID niên khóa' })
  @IsNotEmpty()
  @IsInt()
  nienKhoaId: number;

  @ApiProperty({ description: 'ID học kỳ' })
  @IsNotEmpty()
  @IsInt()
  hocKyId: number;

  @ApiProperty({ description: 'ID giảng viên (tùy chọn)' })
  @IsOptional()
  @IsInt()
  giangVienId?: number;

  @ApiProperty({ description: 'Ghi chú (tùy chọn)' })
  @IsOptional()
  @IsString()
  ghiChu?: string;
}
