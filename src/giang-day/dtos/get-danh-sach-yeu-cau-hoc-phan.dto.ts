import { ApiProperty } from '@nestjs/swagger';
import { TrangThaiYeuCauHocPhanEnum, LoaiYeuCauHocPhanEnum } from '../enums/yeu-cau-hoc-phan.enum';

export class SinhVienInfoDto {
  @ApiProperty({ description: 'ID sinh viên' })
  id: number;

  @ApiProperty({ description: 'Mã sinh viên' })
  maSinhVien: string;

  @ApiProperty({ description: 'Họ tên sinh viên' })
  hoTen: string;
}

export class MonHocInfoDto {
  @ApiProperty({ description: 'ID môn học' })
  id: number;

  @ApiProperty({ description: 'Mã môn học' })
  maMonHoc: string;

  @ApiProperty({ description: 'Tên môn học' })
  tenMonHoc: string;
}

export class ChuongTrinhDaoTaoInfoDto {
  @ApiProperty({ description: 'ID chương trình đào tạo' })
  id: number;

  @ApiProperty({ description: 'Mã chương trình đào tạo' })
  maChuongTrinh: string;

  @ApiProperty({ description: 'Tên chương trình đào tạo' })
  tenChuongTrinh: string;
}

export class KetQuaCuInfoDto {
  @ApiProperty({ description: 'ID kết quả học tập' })
  id: number;

  @ApiProperty({ description: 'Mã lớp học phần' })
  maLopHocPhan: string;

  @ApiProperty({ description: 'Điểm quá trình' })
  diemQuaTrinh: number;

  @ApiProperty({ description: 'Điểm thành phần' })
  diemThanhPhan: number;

  @ApiProperty({ description: 'Điểm thi' })
  diemThi: number;

  @ApiProperty({ description: 'Điểm TBCHP (tự tính)' })
  diemTBCHP: number;
}

export class LopHocPhanDeXuatDto {
  @ApiProperty({ description: 'ID lớp học phần' })
  id: number;

  @ApiProperty({ description: 'Mã lớp học phần' })
  maLopHocPhan: string;

  @ApiProperty({ description: 'Mức ưu tiên (1, 2, hoặc 3)' })
  mucUuTien: number;

  @ApiProperty({ description: 'Sĩ số hiện tại' })
  siSo: number;

  @ApiProperty({ description: 'Sĩ số sau khi gán (nếu được chọn)' })
  siSoSauKhiGan?: number;

  @ApiProperty({ description: 'Thông tin học kỳ' })
  hocKy: {
    id: number;
    hocKy: number;
    namHoc: {
      id: number;
      namBatDau: number;
      namKetThuc: number;
    };
  };

  @ApiProperty({ description: 'Thông tin ngành' })
  nganh: {
    id: number;
    maNganh: string;
    tenNganh: string;
  };

  @ApiProperty({ description: 'Thông tin niên khóa' })
  nienKhoa: {
    id: number;
    maNienKhoa: string;
    tenNienKhoa: string;
  };

  @ApiProperty({ description: 'Thông tin giảng viên (nếu có)' })
  giangVien?: {
    id: number;
    maGiangVien: string;
    hoTen: string;
  } | null;
}

export class NguoiXuLyInfoDto {
  @ApiProperty({ description: 'ID người xử lý' })
  id: number;

  @ApiProperty({ description: 'Tên đăng nhập' })
  tenDangNhap: string;

  @ApiProperty({ description: 'Loại người xử lý: GIANG_VIEN hoặc CAN_BO_PHONG_DAO_TAO' })
  loaiNguoiXuLy: 'GIANG_VIEN' | 'CAN_BO_PHONG_DAO_TAO';

  @ApiProperty({ description: 'Thông tin giảng viên (nếu là giảng viên)' })
  giangVien?: {
    id: number;
    maGiangVien: string;
    hoTen: string;
  } | null;
}

export class YeuCauHocPhanChoDuyetDto {
  @ApiProperty({ description: 'ID yêu cầu' })
  id: number;

  @ApiProperty({ description: 'Loại yêu cầu' })
  loaiYeuCau: LoaiYeuCauHocPhanEnum;

  @ApiProperty({ description: 'Trạng thái yêu cầu (CHO_DUYET)' })
  trangThai: TrangThaiYeuCauHocPhanEnum;

  @ApiProperty({ description: 'Lý do' })
  lyDo?: string;

  @ApiProperty({ description: 'Ngày tạo' })
  ngayTao: Date;

  @ApiProperty({ description: 'Thông tin sinh viên' })
  sinhVien: SinhVienInfoDto;

  @ApiProperty({ description: 'Thông tin môn học' })
  monHoc: MonHocInfoDto;

  @ApiProperty({ description: 'Thông tin chương trình đào tạo' })
  chuongTrinhDaoTao: ChuongTrinhDaoTaoInfoDto;

  @ApiProperty({ description: 'Thứ tự học kỳ trong CTĐT' })
  thuTuHocKy: number;

  @ApiProperty({ description: 'Thông tin kết quả cũ (nếu có)' })
  ketQuaCu?: KetQuaCuInfoDto | null;

  @ApiProperty({ description: 'Danh sách lớp học phần đề xuất' })
  lopHocPhanDeXuat: LopHocPhanDeXuatDto[];

  @ApiProperty({ description: 'Lớp học phần được đề xuất tốt nhất' })
  lopHocPhanTotNhat?: LopHocPhanDeXuatDto | null;
}

export class YeuCauHocPhanDaDuyetDto {
  @ApiProperty({ description: 'ID yêu cầu' })
  id: number;

  @ApiProperty({ description: 'Loại yêu cầu' })
  loaiYeuCau: LoaiYeuCauHocPhanEnum;

  @ApiProperty({ description: 'Trạng thái yêu cầu (luôn là DA_DUYET)' })
  trangThai: TrangThaiYeuCauHocPhanEnum;

  @ApiProperty({ description: 'Lý do' })
  lyDo?: string;

  @ApiProperty({ description: 'Ngày tạo' })
  ngayTao: Date;

  @ApiProperty({ description: 'Ngày xử lý' })
  ngayXuLy?: Date;

  @ApiProperty({ description: 'Ghi chú phòng Đào tạo' })
  ghiChuPhongDaoTao?: string;

  @ApiProperty({ description: 'Thông tin sinh viên' })
  sinhVien: SinhVienInfoDto;

  @ApiProperty({ description: 'Thông tin môn học' })
  monHoc: MonHocInfoDto;

  @ApiProperty({ description: 'Thông tin chương trình đào tạo' })
  chuongTrinhDaoTao: ChuongTrinhDaoTaoInfoDto;

  @ApiProperty({ description: 'Thứ tự học kỳ trong CTĐT' })
  thuTuHocKy: number;

  @ApiProperty({ description: 'Thông tin kết quả cũ (nếu có)' })
  ketQuaCu?: KetQuaCuInfoDto | null;

  @ApiProperty({ description: 'Lớp học phần đã được duyệt' })
  lopHocPhanDaDuyet: {
    id: number;
    maLopHocPhan: string;
    hocKy: {
      id: number;
      hocKy: number;
      namHoc: {
        id: number;
        namBatDau: number;
        namKetThuc: number;
      };
    };
    nganh: {
      id: number;
      maNganh: string;
      tenNganh: string;
    };
    nienKhoa: {
      id: number;
      maNienKhoa: string;
      tenNienKhoa: string;
    };
    giangVien?: {
      id: number;
      maGiangVien: string;
      hoTen: string;
    } | null;
  };

  @ApiProperty({ description: 'Thông tin người xử lý' })
  nguoiXuLy: NguoiXuLyInfoDto;
}

export class YeuCauHocPhanKhacDto {
  @ApiProperty({ description: 'ID yêu cầu' })
  id: number;

  @ApiProperty({ description: 'Loại yêu cầu' })
  loaiYeuCau: LoaiYeuCauHocPhanEnum;

  @ApiProperty({ description: 'Trạng thái' })
  trangThai: TrangThaiYeuCauHocPhanEnum;

  @ApiProperty({ description: 'Lý do' })
  lyDo?: string;

  @ApiProperty({ description: 'Ngày tạo' })
  ngayTao: Date;

  @ApiProperty({ description: 'Ngày xử lý (nếu có)' })
  ngayXuLy?: Date;

  @ApiProperty({ description: 'Ghi chú phòng Đào tạo (nếu có)' })
  ghiChuPhongDaoTao?: string;

  @ApiProperty({ description: 'Thông tin sinh viên' })
  sinhVien: SinhVienInfoDto;

  @ApiProperty({ description: 'Thông tin môn học' })
  monHoc: MonHocInfoDto;

  @ApiProperty({ description: 'Thông tin chương trình đào tạo' })
  chuongTrinhDaoTao: ChuongTrinhDaoTaoInfoDto;

  @ApiProperty({ description: 'Thứ tự học kỳ trong CTĐT' })
  thuTuHocKy: number;

  @ApiProperty({ description: 'Thông tin kết quả cũ (nếu có)' })
  ketQuaCu?: KetQuaCuInfoDto | null;

  @ApiProperty({ description: 'Thông tin người xử lý (nếu có)' })
  nguoiXuLy?: NguoiXuLyInfoDto | null;
}

export class GetDanhSachYeuCauHocPhanResponseDto {
  @ApiProperty({ description: 'Danh sách yêu cầu chờ duyệt (CHO_DUYET)' })
  choDuyet: YeuCauHocPhanChoDuyetDto[];

  @ApiProperty({ description: 'Danh sách yêu cầu đang xử lý (DANG_XU_LY)' })
  dangXuLy: YeuCauHocPhanChoDuyetDto[];

  @ApiProperty({ description: 'Danh sách yêu cầu đã duyệt (DA_DUYET)' })
  daDuyet: YeuCauHocPhanDaDuyetDto[];

  @ApiProperty({ description: 'Danh sách yêu cầu từ chối (TU_CHOI)' })
  tuChoi: YeuCauHocPhanKhacDto[];

  @ApiProperty({ description: 'Danh sách yêu cầu đã hủy (DA_HUY)' })
  daHuy: YeuCauHocPhanKhacDto[];

  @ApiProperty({ description: 'Tổng số yêu cầu' })
  tongSo: number;
}

export class PaginationMetaDto {
  @ApiProperty({ description: 'Tổng số mục' })
  total: number;

  @ApiProperty({ description: 'Trang hiện tại' })
  page: number;

  @ApiProperty({ description: 'Số mục trên trang' })
  limit: number;

  @ApiProperty({ description: 'Tổng số trang' })
  totalPages: number;
}

export class GetDanhSachYeuCauHocPhanPaginatedResponseDto {
  @ApiProperty({ description: 'Danh sách yêu cầu chờ duyệt (CHO_DUYET)' })
  choDuyet: YeuCauHocPhanChoDuyetDto[];

  @ApiProperty({ description: 'Danh sách yêu cầu đang xử lý (DANG_XU_LY)' })
  dangXuLy: YeuCauHocPhanChoDuyetDto[];

  @ApiProperty({ description: 'Danh sách yêu cầu đã duyệt (DA_DUYET)' })
  daDuyet: YeuCauHocPhanDaDuyetDto[];

  @ApiProperty({ description: 'Danh sách yêu cầu từ chối (TU_CHOI)' })
  tuChoi: YeuCauHocPhanKhacDto[];

  @ApiProperty({ description: 'Danh sách yêu cầu đã hủy (DA_HUY)' })
  daHuy: YeuCauHocPhanKhacDto[];

  @ApiProperty({ description: 'Thông tin phân trang', type: PaginationMetaDto })
  pagination: PaginationMetaDto;
}