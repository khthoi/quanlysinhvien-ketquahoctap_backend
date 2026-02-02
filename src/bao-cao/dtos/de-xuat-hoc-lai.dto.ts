import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class DeXuatHocLaiDto {
    @ApiProperty({ description: 'Mã năm học', example: 'NH2024' })
    @IsNotEmpty()
    @IsString()
    maNamHoc: string;

    @ApiProperty({ description: 'Học kỳ', example: 1 })
    @IsNotEmpty()
    @IsNumber()
    hocKy: number;
}

export class DeXuatHocLaiLopHocPhanOptionDto {
    @ApiProperty({ description: 'ID lớp học phần' })
    lopHocPhanId: number;

    @ApiProperty({ description: 'Mã lớp học phần' })
    maLopHocPhan: string;

    @ApiProperty({ description: 'ID môn học' })
    monHocId: number;

    @ApiProperty({ description: 'Mã môn học' })
    maMonHoc: string;

    @ApiProperty({ description: 'Tên môn học' })
    tenMonHoc: string;

    @ApiProperty({ description: 'Số tín chỉ của môn học' })
    soTinChi: number;

    @ApiProperty({ description: 'ID ngành của lớp học phần' })
    nganhId: number;

    @ApiProperty({ description: 'Tên ngành của lớp học phần', required: false })
    tenNganh?: string;

    @ApiProperty({ description: 'ID niên khóa của lớp học phần' })
    nienKhoaId: number;

    @ApiProperty({ description: 'Tên niên khóa của lớp học phần' })
    tenNienKhoa: string;

    @ApiProperty({ description: 'ID học kỳ của lớp học phần' })
    hocKyId: number;

    @ApiProperty({ description: 'Số học kỳ (1, 2, ...)' })
    hocKy: number;

    @ApiProperty({ description: 'Mã năm học của học kỳ' })
    maNamHoc: string;

    @ApiProperty({ description: 'Tên năm học của học kỳ' })
    tenNamHoc: string;

    @ApiProperty({ description: 'Sĩ số hiện tại của lớp học phần (số sinh viên đã đăng ký)' })
    siSo: number;

    @ApiProperty({ description: 'Đánh dấu đây là lớp học phần đề xuất tốt nhất cho sinh viên học lại' })
    laBestChoice: boolean;
}

export class DeXuatHocLaiItemResponseDto {
    @ApiProperty({ description: 'ID sinh viên' })
    sinhVienId: number;

    @ApiProperty({ description: 'Mã sinh viên' })
    maSinhVien: string;

    @ApiProperty({ description: 'Họ tên sinh viên' })
    hoTen: string;

    @ApiProperty({ description: 'Giới tính hiển thị (Nam/Nữ/Không xác định)', required: false })
    gioiTinh?: string;

    @ApiProperty({ description: 'Số điện thoại sinh viên', required: false })
    sdt?: string;

    @ApiProperty({ description: 'Mã lớp học phần mà sinh viên đã trượt' })
    maLopHocPhanTruot: string;

    @ApiProperty({ description: 'Điểm quá trình (10%)' })
    diemQuaTrinh: number;

    @ApiProperty({ description: 'Điểm thành phần (30%)' })
    diemThanhPhan: number;

    @ApiProperty({ description: 'Điểm thi (60%)' })
    diemThi: number;

    @ApiProperty({ description: 'Điểm trung bình học phần dạng chuỗi, làm tròn 2 chữ số' })
    diemTBCHP: string;

    @ApiProperty({ description: 'Điểm hệ 4 dạng chuỗi, làm tròn 1 chữ số' })
    diemSo: string;

    @ApiProperty({ description: 'Điểm chữ (A, B+, ...)' })
    diemChu: string;

    @ApiProperty({ description: 'Đánh giá học phần (ví dụ: TRƯỢT MÔN)' })
    danhGia: string;

    @ApiProperty({
        description: 'Lớp học phần được gợi ý tốt nhất cho sinh viên học lại (nếu tìm được)',
        type: () => DeXuatHocLaiLopHocPhanOptionDto,
        nullable: true,
    })
    bestChoiceLopHocPhan: DeXuatHocLaiLopHocPhanOptionDto | null;

    @ApiProperty({
        description: 'Danh sách tất cả lớp học phần sinh viên có thể đăng ký học lại',
        type: () => [DeXuatHocLaiLopHocPhanOptionDto],
    })
    cacLopHocPhanCoTheDangKy: DeXuatHocLaiLopHocPhanOptionDto[];
}

/** Kết quả học tập tại một lớp học phần (có thể null nếu chưa chấm điểm) */
export class KetQuaHocLaiDto {
    @ApiProperty({ description: 'Điểm quá trình (10%)', nullable: true })
    diemQuaTrinh: number | null;

    @ApiProperty({ description: 'Điểm thành phần (30%)', nullable: true })
    diemThanhPhan: number | null;

    @ApiProperty({ description: 'Điểm thi (60%)', nullable: true })
    diemThi: number | null;

    @ApiProperty({ description: 'Điểm TBCHP (tính từ QT, TP, Thi); null nếu chưa đủ điểm' })
    diemTBCHP: number | null;

    @ApiProperty({ description: 'Điểm chữ (A, B+, ...); null nếu chưa có TBCHP' })
    diemChu: string | null;

    @ApiProperty({ description: 'Điểm số (hệ 4); null nếu chưa có TBCHP' })
    diemSo: number | null;

    @ApiProperty({ description: 'Lớp học phần đã khóa điểm chưa' })
    khoaDiem: boolean;
}

/** Một lần học lại: lớp học phần đăng ký + kết quả (nếu có) */
export class LanHocLaiDto {
    @ApiProperty({ description: 'ID lớp học phần học lại' })
    lopHocPhanId: number;

    @ApiProperty({ description: 'Mã lớp học phần học lại' })
    maLopHocPhan: string;

    @ApiProperty({ description: 'Học kỳ của lớp học phần' })
    hocKy: number;

    @ApiProperty({ description: 'Mã năm học của lớp học phần' })
    maNamHoc: string;

    @ApiProperty({ description: 'Tên năm học' })
    tenNamHoc: string;

    @ApiProperty({ description: 'Ngày bắt đầu học kỳ của lớp học phần (ISO date)', required: false })
    ngayBatDau?: string | null;

    @ApiProperty({ description: 'Ngày kết thúc học kỳ của lớp học phần (ISO date)', required: false })
    ngayKetThuc?: string | null;

    @ApiProperty({
        description: 'Kết quả học tập tại lớp này (null nếu chưa có điểm / chưa khóa điểm)',
        type: () => KetQuaHocLaiDto,
        nullable: true,
    })
    ketQuaHocTap: KetQuaHocLaiDto | null;
}

/** Sinh viên đã học lại / đang học lại: thông tin môn trượt + các lần học lại (LHP + kết quả) */
export class SinhVienDaHocLaiItemDto {
    @ApiProperty({ description: 'ID sinh viên' })
    sinhVienId: number;

    @ApiProperty({ description: 'Mã sinh viên' })
    maSinhVien: string;

    @ApiProperty({ description: 'Họ tên sinh viên' })
    hoTen: string;

    @ApiProperty({ description: 'Giới tính hiển thị', required: false })
    gioiTinh?: string;

    @ApiProperty({ description: 'Môn học trượt (mã)' })
    maMonHocTruot: string;

    @ApiProperty({ description: 'Môn học trượt (tên)' })
    tenMonHocTruot: string;

    @ApiProperty({ description: 'Mã lớp học phần mà sinh viên trượt' })
    maLopHocPhanTruot: string;

    @ApiProperty({ description: 'Điểm TBCHP khi trượt (học kỳ được xét)' })
    diemTBCHPTruot: string;

    @ApiProperty({
        description: 'Các lần học lại: lớp học phần đã/đang học + kết quả (nếu có); có thể nhiều lần',
        type: () => [LanHocLaiDto],
    })
    cacLanHocLai: LanHocLaiDto[];
}

export class DeXuatHocLaiResponseDto {
    @ApiProperty({ description: 'Mã năm học được thống kê' })
    maNamHoc: string;

    @ApiProperty({ description: 'Học kỳ được thống kê' })
    hocKy: number;

    @ApiProperty({ description: 'Tên năm học tương ứng với mã năm học' })
    tenNamHoc: string;

    @ApiProperty({ description: 'Tổng số sinh viên thực sự cần học lại trong kỳ này' })
    tongSinhVien: number;

    @ApiProperty({
        description: 'Danh sách sinh viên trượt và gợi ý lớp học phần học lại',
        type: () => [DeXuatHocLaiItemResponseDto],
    })
    items: DeXuatHocLaiItemResponseDto[];
}

/** Response DTO cho API lấy thông tin sinh viên trượt môn và lịch sử học lại */
export class ThongTinSinhVienTruotMonResponseDto {
    @ApiProperty({ description: 'Mã năm học được thống kê' })
    maNamHoc: string;

    @ApiProperty({ description: 'Học kỳ được thống kê' })
    hocKy: number;

    @ApiProperty({ description: 'Tên năm học tương ứng với mã năm học' })
    tenNamHoc: string;

    @ApiProperty({ description: 'Tổng số sinh viên trượt môn trong học kỳ này' })
    tongSinhVienTruot: number;

    @ApiProperty({ description: 'Số sinh viên đã/đang học lại' })
    soSinhVienDaHocLai: number;

    @ApiProperty({ description: 'Số sinh viên chưa học lại (cần đề xuất)' })
    soSinhVienChuaHocLai: number;

    @ApiProperty({
        description: 'Danh sách sinh viên trượt môn với thông tin chi tiết lớp học phần và kết quả',
        type: () => [SinhVienTruotMonItemDto],
    })
    danhSachSinhVienTruot: SinhVienTruotMonItemDto[];

    @ApiProperty({
        description: 'Danh sách sinh viên đã học lại / đang học lại (chi tiết môn trượt, LHP học lại, kết quả)',
        type: () => [SinhVienDaHocLaiItemDto],
    })
    danhSachSinhVienDaHocLai: SinhVienDaHocLaiItemDto[];
}

/** Chi tiết sinh viên trượt môn */
export class SinhVienTruotMonItemDto {
    @ApiProperty({ description: 'ID sinh viên' })
    sinhVienId: number;

    @ApiProperty({ description: 'Mã sinh viên' })
    maSinhVien: string;

    @ApiProperty({ description: 'Họ tên sinh viên' })
    hoTen: string;

    @ApiProperty({ description: 'Giới tính hiển thị', required: false })
    gioiTinh?: string;

    @ApiProperty({ description: 'Số điện thoại', required: false })
    sdt?: string;

    @ApiProperty({ description: 'Tình trạng học tập' })
    tinhTrang: string;

    @ApiProperty({ description: 'ID lớp học phần trượt' })
    lopHocPhanId: number;

    @ApiProperty({ description: 'Mã lớp học phần trượt' })
    maLopHocPhan: string;

    @ApiProperty({ description: 'ID môn học' })
    monHocId: number;

    @ApiProperty({ description: 'Mã môn học' })
    maMonHoc: string;

    @ApiProperty({ description: 'Tên môn học' })
    tenMonHoc: string;

    @ApiProperty({ description: 'Số tín chỉ' })
    soTinChi: number;

    @ApiProperty({ description: 'Điểm quá trình (10%)' })
    diemQuaTrinh: number;

    @ApiProperty({ description: 'Điểm thành phần (30%)' })
    diemThanhPhan: number;

    @ApiProperty({ description: 'Điểm thi (60%)' })
    diemThi: number;

    @ApiProperty({ description: 'Điểm TBCHP (đã làm tròn 2 chữ số)' })
    diemTBCHP: string;

    @ApiProperty({ description: 'Điểm số hệ 4' })
    diemSo: string;

    @ApiProperty({ description: 'Điểm chữ' })
    diemChu: string;

    @ApiProperty({ description: 'Đã học lại chưa' })
    daHocLai: boolean;

    @ApiProperty({ description: 'Đang học lại' })
    dangHocLai: boolean;

    @ApiProperty({ description: 'Đã đạt (học lại thành công)' })
    daDat: boolean;
}