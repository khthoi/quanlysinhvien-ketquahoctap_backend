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

class ThongKeSinhVienDto {
    @ApiProperty({ example: 10811 })
    tongSinhVien: number;

    @ApiProperty({ type: SinhVienTheoTinhTrangDto })
    theoTinhTrang: SinhVienTheoTinhTrangDto;
}

// ===== GPA THEO NIÊN KHÓA / NGÀNH / LỚP NIÊN CHẾ =====

class ThongKeGpaBucketDto {
    @ApiProperty({ example: 100 })
    tongSinhVien: number;

    // GPA buckets
    @ApiProperty({ example: 20 })
    trungBinh: number;

    @ApiProperty({ example: 35 })
    kha: number;

    @ApiProperty({ example: 30 })
    gioi: number;

    @ApiProperty({ example: 15 })
    xuatSac: number;

    // Số lượng sinh viên theo tình trạng học tập trong phạm vi tương ứng
    // (đang học / bảo lưu / thôi học) - tính theo niên khóa / ngành / lớp niên chế
    @ApiProperty({ example: 80 })
    dangHoc: number;

    @ApiProperty({ example: 10 })
    baoLuu: number;

    @ApiProperty({ example: 5 })
    thoiHoc: number;
}

class ThongKeGpaTheoLopDto extends ThongKeGpaBucketDto {
    @ApiProperty()
    lopId: number;

    @ApiProperty()
    maLop: string;

    @ApiProperty()
    tenLop: string;
}

class ThongKeGpaTheoNganhDto extends ThongKeGpaBucketDto {
    @ApiProperty()
    nganhId: number;

    @ApiProperty()
    maNganh: string;

    @ApiProperty()
    tenNganh: string;

    @ApiProperty({ type: [ThongKeGpaTheoLopDto] })
    theoLop: ThongKeGpaTheoLopDto[];
}

class ThongKeGpaTheoNienKhoaDto extends ThongKeGpaBucketDto {
    @ApiProperty()
    nienKhoaId: number;

    @ApiProperty()
    maNienKhoa: string;

    @ApiProperty()
    tenNienKhoa: string;

    @ApiProperty({ type: [ThongKeGpaTheoNganhDto] })
    theoNganh: ThongKeGpaTheoNganhDto[];
}

// ===== CHƯƠNG TRÌNH ĐÀO TẠO THEO NGÀNH =====

class ThongKeChuongTrinhTheoNganhDto {
    @ApiProperty()
    nganhId: number;

    @ApiProperty()
    maNganh: string;

    @ApiProperty()
    tenNganh: string;

    @ApiProperty({ example: 5 })
    soChuongTrinh: number;
}

// ===== LỚP HỌC PHẦN ĐÃ/CHƯA KHÓA ĐIỂM THEO NĂM HỌC - HỌC KỲ =====

class ThongKeLopHocPhanTheoHocKyDto {
    @ApiProperty()
    hocKyId: number;

    @ApiProperty({ example: 1, description: 'Số thứ tự học kỳ (1, 2, 3...)' })
    hocKy: number;

    @ApiProperty({ example: 25, description: 'Số lớp học phần đã khóa điểm' })
    soLopDaKhoaDiem: number;

    @ApiProperty({ example: 10, description: 'Số lớp học phần chưa khóa điểm' })
    soLopChuaKhoaDiem: number;
}

class ThongKeLopHocPhanTheoNamHocDto {
    @ApiProperty()
    namHocId: number;

    @ApiProperty()
    maNamHoc: string;

    @ApiProperty()
    tenNamHoc: string;

    @ApiProperty({ type: [ThongKeLopHocPhanTheoHocKyDto], description: 'Theo từng học kỳ của năm học' })
    theoHocKy: ThongKeLopHocPhanTheoHocKyDto[];
}

// ===== MÔN HỌC THEO LOẠI MÔN =====

class ThongKeMonHocTheoLoaiDto {
    @ApiProperty({ example: 120 })
    daiCuong: number;

    @ApiProperty({ example: 80 })
    chuyenNganh: number;

    @ApiProperty({ example: 45 })
    tuChon: number;
}

export class ThongKeTongQuanResponseDto {
    @ApiProperty()
    sinhVien: ThongKeSinhVienDto;

    @ApiProperty({ example: 156 })
    tongGiangVien: number;

    @ApiProperty({ example: 28 })
    tongNganh: number;

    @ApiProperty({ example: 12 })
    tongKhoa: number;

    @ApiProperty({ example: 245 })
    tongMonHoc: number;

    @ApiProperty({ example: 320 })
    tongLop: number;

    @ApiProperty({ example: 1850 })
    tongLopHocPhan: number;

    @ApiProperty({ example: 1200})
    tongNienKhoa: number;

    @ApiProperty({ example: 45 })
    tongChuongTrinhDaoTao: number;

    // Lớp học phần theo trạng thái khóa điểm
    @ApiProperty({ example: 120 })
    tongLopHocPhanDaKhoaDiem: number;

    @ApiProperty({ example: 170 })
    tongLopHocPhanChuaKhoaDiem: number;

    // Lớp học phần đã/chưa khóa điểm theo từng học kỳ của từng năm học
    @ApiProperty({ type: [ThongKeLopHocPhanTheoNamHocDto] })
    lopHocPhanTheoNamHoc: ThongKeLopHocPhanTheoNamHocDto[];

    // Chương trình đào tạo theo ngành
    @ApiProperty({ type: [ThongKeChuongTrinhTheoNganhDto] })
    chuongTrinhDaoTaoTheoNganh: ThongKeChuongTrinhTheoNganhDto[];

    // Môn học theo loại (đại cương / chuyên ngành / tự chọn)
    @ApiProperty({ type: ThongKeMonHocTheoLoaiDto })
    monHocTheoLoai: ThongKeMonHocTheoLoaiDto;

    // Phân bổ GPA của sinh viên đã tốt nghiệp theo niên khóa, ngành, lớp niên chế
    @ApiProperty({ type: [ThongKeGpaTheoNienKhoaDto] })
    gpaTheoNienKhoa: ThongKeGpaTheoNienKhoaDto[];
}