import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, IsOptional } from 'class-validator';

export class SinhVienCanHocBoSungCaiThienDto {
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

  @ApiProperty({ description: 'Tên ngành' })
  tenNganh: string;

  @ApiProperty({ description: 'ID niên khóa' })
  nienKhoaId: number;

  @ApiProperty({ description: 'Mã niên khóa' })
  maNienKhoa: string;

  @ApiProperty({ description: 'Tên niên khóa' })
  tenNienKhoa: string;

  @ApiProperty({ description: 'Năm bắt đầu niên khóa' })
  namBatDau: number;

  @ApiProperty({ description: 'ID yêu cầu học phần' })
  yeuCauHocPhanId: number;

  @ApiProperty({ description: 'Loại yêu cầu' })
  loaiYeuCau: string;
}

export class LopHocPhanDeXuatCanTaoChoHocBoSungCaiThienDto {
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

  @ApiProperty({ description: 'ID giảng viên (nếu có)' })
  giangVienId?: number | null;

  @ApiProperty({ description: 'Mã giảng viên (nếu có)' })
  maGiangVien?: string | null;

  @ApiProperty({ description: 'Họ tên giảng viên (nếu có)' })
  hoTenGiangVien?: string | null;

  @ApiProperty({ description: 'Số sinh viên cần học bổ sung/cải thiện' })
  soSinhVienCanHoc: number;

  @ApiProperty({ description: 'Danh sách sinh viên cần học bổ sung/cải thiện', type: [SinhVienCanHocBoSungCaiThienDto] })
  danhSachSinhVien: SinhVienCanHocBoSungCaiThienDto[];
}

export class GetDeXuatLopHocPhanChoHocBoSungCaiThienResponseDto {
  @ApiProperty({ description: 'Danh sách lớp học phần đề xuất cần tạo', type: [LopHocPhanDeXuatCanTaoChoHocBoSungCaiThienDto] })
  danhSachLopHocPhanDeXuat: LopHocPhanDeXuatCanTaoChoHocBoSungCaiThienDto[];

  @ApiProperty({ description: 'Tổng số lớp học phần cần tạo' })
  tongSoLop: number;

  @ApiProperty({ description: 'Tổng số sinh viên cần học bổ sung/cải thiện' })
  tongSoSinhVien: number;
}

export class TaoLopHocPhanChoHocBoSungCaiThienDto {
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
