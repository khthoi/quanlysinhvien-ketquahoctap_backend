import { ApiProperty } from '@nestjs/swagger';
import { TrangThaiYeuCauHocPhanEnum, LoaiYeuCauHocPhanEnum } from 'src/giang-day/enums/yeu-cau-hoc-phan.enum';
import { MonHocInfoDto, ChuongTrinhDaoTaoInfoDto, KetQuaCuInfoDto, LopHocPhanDeXuatDto, NguoiXuLyInfoDto } from 'src/giang-day/dtos/get-danh-sach-yeu-cau-hoc-phan.dto';

export class YeuCauDangKyDto {
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

  @ApiProperty({ description: 'Thông tin môn học' })
  monHoc: MonHocInfoDto;

  @ApiProperty({ description: 'Thông tin chương trình đào tạo' })
  chuongTrinhDaoTao: ChuongTrinhDaoTaoInfoDto;

  @ApiProperty({ description: 'Thứ tự học kỳ trong CTĐT' })
  thuTuHocKy: number;

  @ApiProperty({ description: 'Thông tin kết quả cũ (nếu có)' })
  ketQuaCu?: KetQuaCuInfoDto | null;

  @ApiProperty({ description: 'Danh sách lớp học phần đề xuất (chỉ có khi trạng thái là CHO_DUYET hoặc DANG_XU_LY)' })
  lopHocPhanDeXuat?: LopHocPhanDeXuatDto[];

  @ApiProperty({ description: 'Lớp học phần được đề xuất tốt nhất (chỉ có khi trạng thái là CHO_DUYET hoặc DANG_XU_LY)' })
  lopHocPhanTotNhat?: LopHocPhanDeXuatDto | null;

  @ApiProperty({ description: 'Lớp học phần đã được duyệt (chỉ có khi trạng thái là DA_DUYET)' })
  lopHocPhanDaDuyet?: {
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

  @ApiProperty({ description: 'Thông tin người xử lý (nếu có)' })
  nguoiXuLy?: NguoiXuLyInfoDto | null;
}

/**
 * DTO dành riêng cho sinh viên xem danh sách yêu cầu đăng ký của chính mình.
 * Không bao gồm thông tin lớp học phần đề xuất và lớp học phần tốt nhất.
 */
export class YeuCauDangKyMeDto {
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

  @ApiProperty({ description: 'Thông tin môn học' })
  monHoc: MonHocInfoDto;

  @ApiProperty({ description: 'Thông tin chương trình đào tạo' })
  chuongTrinhDaoTao: ChuongTrinhDaoTaoInfoDto;

  @ApiProperty({ description: 'Thứ tự học kỳ trong CTĐT' })
  thuTuHocKy: number;

  @ApiProperty({ description: 'Thông tin kết quả cũ (nếu có)' })
  ketQuaCu?: KetQuaCuInfoDto | null;

  @ApiProperty({ description: 'Lớp học phần đã được duyệt (chỉ có khi trạng thái là DA_DUYET)' })
  lopHocPhanDaDuyet?: {
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

  @ApiProperty({ description: 'Thông tin người xử lý (nếu có)' })
  nguoiXuLy?: NguoiXuLyInfoDto | null;
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

export class GetYeuCauDangKyResponseDto {
  @ApiProperty({ description: 'Danh sách yêu cầu đăng ký', type: [YeuCauDangKyDto] })
  data: YeuCauDangKyDto[];

  @ApiProperty({ description: 'Thông tin phân trang', type: PaginationMetaDto })
  pagination: PaginationMetaDto;
}

/**
 * Response DTO dùng cho API sinh viên /sinh-vien/yeu-cau-dang-ky/me
 * Không trả về các thông tin lớp học phần đề xuất và lớp học phần tốt nhất.
 */
export class GetYeuCauDangKyMeResponseDto {
  @ApiProperty({ description: 'Danh sách yêu cầu đăng ký', type: [YeuCauDangKyMeDto] })
  data: YeuCauDangKyMeDto[];

  @ApiProperty({ description: 'Thông tin phân trang', type: PaginationMetaDto })
  pagination: PaginationMetaDto;
}
