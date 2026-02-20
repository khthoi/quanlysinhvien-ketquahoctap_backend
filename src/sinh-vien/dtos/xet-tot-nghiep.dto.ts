import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';


// Enum kết quả xét tốt nghiệp
export enum KetQuaXetTotNghiepEnum {
  DAT = 'Đạt',
  KHONG_DAT = 'Không đạt',
  KHONG_DU_DIEU_KIEN = 'Không đủ ĐK',
}

// Enum xếp loại tốt nghiệp
export enum XepLoaiTotNghiepEnum {
  XUAT_SAC = 'Xuất sắc',
  GIOI = 'Giỏi',
  KHA = 'Khá',
  TRUNG_BINH = 'Trung bình',
  KHONG_DAT = 'Không đạt',
  KHONG_XET = 'Không xét',
}


// ==================== REQUEST DTOs ====================

export class XetTotNghiepDto {
  @ApiProperty({
    description: 'ID của niên khóa cần xét tốt nghiệp',
    example: 1,
  })
  @IsNotEmpty({ message: 'Niên khóa không được để trống' })
  @IsNumber({}, { message: 'Niên khóa phải là số' })
  nienKhoaId: number;

  @ApiPropertyOptional({
    enum: KetQuaXetTotNghiepEnum,
    description: 'Lọc theo kết quả xét tốt nghiệp của sinh viên',
  })
  @IsOptional()
  @IsEnum(KetQuaXetTotNghiepEnum, {
    message: 'ketQua phải là một trong các giá trị hợp lệ của KetQuaXetTotNghiepEnum',
  })
  ketQua?: KetQuaXetTotNghiepEnum;

  @ApiPropertyOptional({
    enum: XepLoaiTotNghiepEnum,
    description: 'Lọc theo xếp loại tốt nghiệp của sinh viên',
  })
  @IsOptional()
  @IsEnum(XepLoaiTotNghiepEnum, {
    message: 'xepLoai phải là một trong các giá trị hợp lệ của XepLoaiTotNghiepEnum',
  })
  xepLoai?: XepLoaiTotNghiepEnum;

  @ApiPropertyOptional({
    description: 'Lọc theo mã lớp của sinh viên (ví dụ: CNTT22A)',
    example: 'CNTT22A',
  })
  @IsOptional()
  @IsString({ message: 'maLop phải là chuỗi' })
  maLop?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo mã ngành của sinh viên (ví dụ: CNTT)',
    example: 'CNTT',
  })
  @IsOptional()
  @IsString({ message: 'maNganh phải là chuỗi' })
  maNganh?: string;

  @ApiPropertyOptional({
    description: 'Trang hiện tại (bắt đầu từ 1)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1, { message: 'page phải >= 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Số bản ghi trên mỗi trang',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1, { message: 'limit phải >= 1' })
  @Max(1000, { message: 'limit tối đa là 1000' })
  limit?: number = 10;
}

// ==================== RESPONSE DTOs ====================

// Thông tin chi tiết sinh viên trong kết quả xét tốt nghiệp
export class SinhVienXetTotNghiepDto {
  @ApiProperty({ example: 1, description: 'Số thứ tự' })
  stt: number;

  @ApiProperty({ example: 1, description: 'ID sinh viên' })
  id: number;

  @ApiProperty({ example: 'SV001', description: 'Mã sinh viên' })
  maSinhVien: string;

  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ và tên' })
  hoTen: string;

  @ApiProperty({ example: '2000-01-15', description: 'Ngày sinh' })
  ngaySinh: Date;

  @ApiProperty({ example: 'Nam', description: 'Giới tính' })
  gioiTinh: string;

  @ApiProperty({ example: 'NK2022', description: 'Mã niên khóa' })
  maNienKhoa: string;

  @ApiProperty({ example: 'CNTT', description: 'Mã ngành' })
  maNganh: string;

  @ApiProperty({ example: 'Công nghệ thông tin', description: 'Tên ngành' })
  tenNganh: string;

  @ApiProperty({ example: 'CNTT22A', description: 'Mã lớp' })
  maLop: string;

  @ApiPropertyOptional({ example: 3.25, description: 'Điểm GPA (hệ 4)', nullable: true })
  gpa: number | null;

  @ApiProperty({
    enum: KetQuaXetTotNghiepEnum,
    example: KetQuaXetTotNghiepEnum.DAT,
    description: 'Kết quả xét tốt nghiệp',
  })
  ketQuaXet: KetQuaXetTotNghiepEnum;

  @ApiProperty({
    enum: XepLoaiTotNghiepEnum,
    example: XepLoaiTotNghiepEnum.KHA,
    description: 'Xếp loại tốt nghiệp',
  })
  xepLoaiTotNghiep: XepLoaiTotNghiepEnum;

  @ApiPropertyOptional({ example: '', description: 'Lý do không đạt (nếu có)' })
  lyDo: string;
}

// Thống kê theo ngành
export class ThongKeTheoNganhDto {
  @ApiProperty({ example: 1, description: 'ID ngành' })
  nganhId: number;

  @ApiProperty({ example: 'CNTT', description: 'Mã ngành' })
  maNganh: string;

  @ApiProperty({ example: 'Công nghệ thông tin', description: 'Tên ngành' })
  tenNganh: string;

  @ApiProperty({ example: 100, description: 'Tổng sinh viên được xét' })
  tongSinhVien: number;

  @ApiProperty({ example: 80, description: 'Số sinh viên đạt tốt nghiệp' })
  soSinhVienDat: number;

  @ApiProperty({ example: 10, description: 'Số sinh viên không đạt' })
  soSinhVienKhongDat: number;

  @ApiProperty({ example: 10, description: 'Số sinh viên không đủ điều kiện' })
  soSinhVienKhongDuDieuKien: number;

  @ApiProperty({ example: 5, description: 'Số sinh viên tốt nghiệp loại Xuất sắc' })
  soXuatSac: number;

  @ApiProperty({ example: 20, description: 'Số sinh viên tốt nghiệp loại Giỏi' })
  soGioi: number;

  @ApiProperty({ example: 35, description: 'Số sinh viên tốt nghiệp loại Khá' })
  soKha: number;

  @ApiProperty({ example: 20, description: 'Số sinh viên tốt nghiệp loại Trung bình' })
  soTrungBinh: number;
}

// Thống kê tổng quan
export class ThongKeTongQuanDto {
  @ApiProperty({ example: 500, description: 'Tổng số sinh viên được xét' })
  tongSinhVienDuocXet: number;

  @ApiProperty({ example: 400, description: 'Số sinh viên đạt tốt nghiệp' })
  soSinhVienDat: number;

  @ApiProperty({ example: 60, description: 'Số sinh viên không đạt' })
  soSinhVienKhongDat: number;

  @ApiProperty({ example: 40, description: 'Số sinh viên không đủ điều kiện' })
  soSinhVienKhongDuDieuKien: number;

  @ApiProperty({ example: 30, description: 'Số sinh viên tốt nghiệp loại Xuất sắc' })
  soXuatSac: number;

  @ApiProperty({ example: 80, description: 'Số sinh viên tốt nghiệp loại Giỏi' })
  soGioi: number;

  @ApiProperty({ example: 150, description: 'Số sinh viên tốt nghiệp loại Khá' })
  soKha: number;

  @ApiProperty({ example: 140, description: 'Số sinh viên tốt nghiệp loại Trung bình' })
  soTrungBinh: number;
}

// Response cho API dự đoán xét tốt nghiệp
export class DuDoanXetTotNghiepResponseDto {
  @ApiProperty({ example: 1, description: 'ID niên khóa' })
  nienKhoaId: number;

  @ApiProperty({ example: 'NK2022', description: 'Mã niên khóa' })
  maNienKhoa: string;

  @ApiProperty({ example: 'Niên khóa 2022-2026', description: 'Tên niên khóa' })
  tenNienKhoa: string;

  @ApiProperty({ example: 2022, description: 'Năm bắt đầu' })
  namBatDau: number;

  @ApiProperty({ example: 2026, description: 'Năm kết thúc' })
  namKetThuc: number;

  @ApiProperty({ example: '2026-02-02', description: 'Ngày xét (dự kiến)' })
  ngayXet: Date;

  @ApiProperty({ type: ThongKeTongQuanDto, description: 'Thống kê tổng quan' })
  thongKeTongQuan: ThongKeTongQuanDto;

  @ApiProperty({ type: [ThongKeTheoNganhDto], description: 'Thống kê theo từng ngành' })
  thongKeTheoNganh: ThongKeTheoNganhDto[];

  @ApiPropertyOptional({
    example: 1,
    description: 'Trang hiện tại (sau khi áp dụng bộ lọc). Chỉ có giá trị khi gọi qua API có phân trang',
  })
  page?: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'Số bản ghi trên mỗi trang. Chỉ có giá trị khi gọi qua API có phân trang',
  })
  limit?: number;

  @ApiPropertyOptional({
    example: 120,
    description: 'Tổng số bản ghi sau khi áp dụng bộ lọc. Chỉ có giá trị khi gọi qua API có phân trang',
  })
  totalItems?: number;

  @ApiPropertyOptional({
    example: 6,
    description: 'Tổng số trang sau khi áp dụng bộ lọc. Chỉ có giá trị khi gọi qua API có phân trang',
  })
  totalPages?: number;

  @ApiProperty({ type: [SinhVienXetTotNghiepDto], description: 'Danh sách sinh viên được xét' })
  danhSachSinhVien: SinhVienXetTotNghiepDto[];
}

// Response cho API xác nhận xét tốt nghiệp
export class XacNhanXetTotNghiepResponseDto {
  @ApiProperty({ example: true, description: 'Trạng thái thành công' })
  success: boolean;

  @ApiProperty({ example: 'Xét tốt nghiệp thành công cho 400 sinh viên', description: 'Thông báo' })
  message: string;

  @ApiProperty({ example: 1, description: 'ID niên khóa' })
  nienKhoaId: number;

  @ApiProperty({ example: 'NK2022', description: 'Mã niên khóa' })
  maNienKhoa: string;

  @ApiProperty({ example: '2026-02-02', description: 'Ngày xét tốt nghiệp' })
  ngayXetTotNghiep: Date;

  @ApiProperty({ type: ThongKeTongQuanDto, description: 'Thống kê kết quả xét' })
  thongKe: ThongKeTongQuanDto;

  @ApiProperty({ type: [ThongKeTheoNganhDto], description: 'Thống kê theo từng ngành' })
  thongKeTheoNganh: ThongKeTheoNganhDto[];

  @ApiProperty({
    type: [SinhVienXetTotNghiepDto],
    description: 'Danh sách sinh viên đã được cập nhật tình trạng tốt nghiệp',
  })
  danhSachSinhVienDat: SinhVienXetTotNghiepDto[];
}

// Thông tin sinh viên đã tốt nghiệp (cho API lấy danh sách sinh viên tốt nghiệp)
export class SinhVienTotNghiepDto {
  @ApiProperty({ example: 1, description: 'Số thứ tự' })
  stt: number;

  @ApiProperty({ example: 1, description: 'ID sinh viên' })
  id: number;

  @ApiProperty({ example: 'SV001', description: 'Mã sinh viên' })
  maSinhVien: string;

  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ và tên' })
  hoTen: string;

  @ApiProperty({ example: '2000-01-15', description: 'Ngày sinh' })
  ngaySinh: Date;

  @ApiProperty({ example: 'Nam', description: 'Giới tính' })
  gioiTinh: string;

  @ApiProperty({ example: 'NK2022', description: 'Mã niên khóa' })
  maNienKhoa: string;

  @ApiProperty({ example: 'CNTT', description: 'Mã ngành' })
  maNganh: string;

  @ApiProperty({ example: 'Công nghệ thông tin', description: 'Tên ngành' })
  tenNganh: string;

  @ApiProperty({ example: 'CNTT22A', description: 'Mã lớp' })
  maLop: string;

  @ApiPropertyOptional({ example: 3.25, description: 'Điểm GPA (hệ 4)', nullable: true })
  gpa: number | null;

  @ApiProperty({
    enum: XepLoaiTotNghiepEnum,
    example: XepLoaiTotNghiepEnum.KHA,
    description: 'Xếp loại tốt nghiệp',
  })
  xepLoaiTotNghiep: XepLoaiTotNghiepEnum;
}

// Response cho API lấy danh sách sinh viên tốt nghiệp
export class DanhSachTotNghiepResponseDto {
  @ApiProperty({ example: 1, description: 'ID niên khóa' })
  nienKhoaId: number;

  @ApiProperty({ example: 'NK2022', description: 'Mã niên khóa' })
  maNienKhoa: string;

  @ApiProperty({ example: 'Niên khóa 2022-2026', description: 'Tên niên khóa' })
  tenNienKhoa: string;

  @ApiProperty({ example: 2022, description: 'Năm bắt đầu' })
  namBatDau: number;

  @ApiProperty({ example: 2026, description: 'Năm kết thúc' })
  namKetThuc: number;

  @ApiProperty({ example: 400, description: 'Tổng số sinh viên tốt nghiệp' })
  tongSinhVienTotNghiep: number;

  @ApiProperty({ type: [ThongKeTheoNganhDto], description: 'Thống kê theo từng ngành' })
  thongKeTheoNganh: ThongKeTheoNganhDto[];

  @ApiPropertyOptional({
    example: 1,
    description: 'Trang hiện tại (sau khi áp dụng bộ lọc). Chỉ có giá trị khi gọi qua API có phân trang',
  })
  page?: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'Số bản ghi trên mỗi trang. Chỉ có giá trị khi gọi qua API có phân trang',
  })
  limit?: number;

  @ApiPropertyOptional({
    example: 120,
    description: 'Tổng số bản ghi sau khi áp dụng bộ lọc. Chỉ có giá trị khi gọi qua API có phân trang',
  })
  totalItems?: number;

  @ApiPropertyOptional({
    example: 6,
    description: 'Tổng số trang sau khi áp dụng bộ lọc. Chỉ có giá trị khi gọi qua API có phân trang',
  })
  totalPages?: number;

  @ApiProperty({ type: [SinhVienTotNghiepDto], description: 'Danh sách sinh viên đã tốt nghiệp (sau phân trang nếu có)' })
  danhSachSinhVien: SinhVienTotNghiepDto[];
}