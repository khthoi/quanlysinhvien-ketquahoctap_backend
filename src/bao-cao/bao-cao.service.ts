import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, LessThan, LessThanOrEqual, MoreThanOrEqual, Not, Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { LopHocPhan } from 'src/giang-day/entity/lop-hoc-phan.entity';
import { SinhVien } from 'src/sinh-vien/entity/sinh-vien.entity';
import { KetQuaHocTap } from 'src/ket-qua/entity/ket-qua-hoc-tap.entity';
import { GiangVien } from 'src/danh-muc/entity/giang-vien.entity';
import { FilterHocLaiDto, FilterThongKeNganhDto, FilterThongKeLopHocPhanDto, FilterDanhSachSinhVienDto, LoaiDanhSachEnum } from './dtos/query-bao-cao.dto';
import { LoaiHinhThamGiaLopHocPhanEnum } from 'src/giang-day/enums/loai-hinh-tham-gia-lop-hoc-phan.enum';
import { SinhVienLopHocPhan } from 'src/giang-day/entity/sinhvien-lophocphan.entity';
import { DanhSachSinhVienReportDto } from './dtos/danh-sach-sinh-vien.dto';
import { HocKy } from 'src/dao-tao/entity/hoc-ky.entity';
import { TinhTrangHocTapEnum } from 'src/sinh-vien/enums/tinh-trang-hoc-tap.enum';
import { NienKhoa } from 'src/danh-muc/entity/nien-khoa.entity';
import { ThongKeTongQuanResponseDto } from './dtos/thong-ke-tong-quan.dto';
import { MonHoc } from 'src/danh-muc/entity/mon-hoc.entity';
import { Lop } from 'src/danh-muc/entity/lop.entity';
import { ChuongTrinhDaoTao } from 'src/dao-tao/entity/chuong-trinh-dao-tao.entity';
import { Nganh } from 'src/danh-muc/entity/nganh.entity';
import { Khoa } from 'src/danh-muc/entity/khoa.entity';
import { NamHoc } from 'src/dao-tao/entity/nam-hoc.entity';
import { VaiTroNguoiDungEnum } from 'src/auth/enums/vai-tro-nguoi-dung.enum';
import { NguoiDung } from 'src/auth/entity/nguoi-dung.entity';
import { GioiTinh } from 'src/danh-muc/enums/gioi-tinh.enum';
import {
    DeXuatHocLaiItemResponseDto,
    DeXuatHocLaiLopHocPhanOptionDto,
    DeXuatHocLaiResponseDto,
    KetQuaHocLaiDto,
    LanHocLaiDto,
    SinhVienDaHocLaiItemDto,
    SinhVienTruotMonItemDto,
    ThongTinSinhVienTruotMonResponseDto,
} from './dtos/de-xuat-hoc-lai.dto';


// Interface cho kết quả học tập theo môn học
interface KetQuaMonHoc {
    monHocId: number;
    maMonHoc: string;
    tenMonHoc: string;
    soTinChi: number;
    ketQuas: {
        lopHocPhanId: number;
        maLopHocPhan: string;
        hocKy: string;
        diemQuaTrinh: number;
        diemThanhPhan: number;
        diemThi: number;
        diemTBCHP: number;
        khoaDiem: boolean;
    }[];
}

// Interface cho dữ liệu xuất Excel
interface KetQuaXuatExcel {
    stt: number;
    maMonHoc: string;
    tenMonHoc: string;
    maLopHocPhan: string;
    soTinChi: number;
    hocKy: string;
    diemQuaTrinh: number;
    diemThanhPhan: number;
    diemThi: number;
    diemTBCHP: number;
    diemHe4: number;
    xepLoai: string;
}

@Injectable()
export class BaoCaoService {
    constructor(
        @InjectRepository(LopHocPhan)
        private lopHocPhanRepo: Repository<LopHocPhan>,
        @InjectRepository(SinhVien)
        private sinhVienRepo: Repository<SinhVien>,
        @InjectRepository(KetQuaHocTap)
        private ketQuaRepo: Repository<KetQuaHocTap>,
        @InjectRepository(GiangVien)
        private giangVienRepo: Repository<GiangVien>,
        @InjectRepository(SinhVienLopHocPhan)
        private svLhpRepo: Repository<SinhVienLopHocPhan>,
        @InjectRepository(NienKhoa)
        private nienKhoaRepo: Repository<NienKhoa>,
        @InjectRepository(MonHoc)
        private monHocRepo: Repository<MonHoc>,
        @InjectRepository(Lop)
        private lopRepo: Repository<Lop>,
        @InjectRepository(ChuongTrinhDaoTao)
        private chuongTrinhDaoTaoRepo: Repository<ChuongTrinhDaoTao>,
        @InjectRepository(Nganh)
        private nganhRepo: Repository<Nganh>,
        @InjectRepository(Khoa)
        private khoaRepo: Repository<Khoa>,
        @InjectRepository(NguoiDung)
        private nguoiDungRepo: Repository<NguoiDung>,
    ) { }

    // Hàm tính điểm
    private tinhDiemTBCHP(dqt: number, dtp: number, dt: number): number {
        const tbchp = dqt * 0.1 + dtp * 0.3 + dt * 0.6;
        return Math.round(tbchp * 100) / 100; // Làm tròn đến 2 chữ số thập phân
    }

    private diemTBCHPToDiemChu(diem: number): string {
        if (diem >= 9.0) return 'A+';
        if (diem >= 8.5) return 'A';
        if (diem >= 8.0) return 'B+';
        if (diem >= 7.0) return 'B';
        if (diem >= 6.5) return 'C+';
        if (diem >= 5.5) return 'C';
        if (diem >= 5.0) return 'D+';
        if (diem >= 4.0) return 'D';
        return 'F';
    }


    private diemHe10ToHe4(diem: number): number {
        if (diem >= 9.0) return 4.0;
        if (diem >= 8.5) return 3.7;
        if (diem >= 8.0) return 3.5;
        if (diem >= 7.0) return 3.0;
        if (diem >= 6.5) return 2.5;
        if (diem >= 5.5) return 2.0;
        if (diem >= 5.0) return 1.5;
        if (diem >= 4.0) return 1.0;
        return 0.0;
    }

    // 1. Bảng điểm lớp học phần
    async xuatBangDiemLopHocPhan(lopHocPhanId: number, userId: number): Promise<{ buffer: Buffer; filename: string }> {
        // ===== KIỂM TRA QUYỀN USER =====
        const nguoiDung = await this.nguoiDungRepo.findOne({
            where: { id: userId },
            relations: ['sinhVien', 'giangVien'],
        });

        if (!nguoiDung) {
            throw new NotFoundException('Không tìm thấy thông tin người dùng');
        }

        // Nếu user liên kết với sinh viên mà không phải giảng viên → báo lỗi
        if (nguoiDung.sinhVien && !nguoiDung.giangVien) {
            throw new ForbiddenException('Sinh viên không có quyền xuất bảng điểm lớp học phần');
        }

        // Nếu user không liên kết với giảng viên nào và không phải CAN_BO_PHONG_DAO_TAO → báo lỗi
        if (!nguoiDung.giangVien && nguoiDung.vaiTro !== VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO) {
            throw new ForbiddenException('Tài khoản chưa được liên kết với giảng viên nào');
        }

        // ===== LẤY THÔNG TIN LỚP HỌC PHẦN =====
        const lhp = await this.lopHocPhanRepo.findOne({
            where: { id: lopHocPhanId },
            relations: [
                'monHoc',
                'hocKy',
                'hocKy.namHoc',
                'giangVien',
                'nienKhoa',
                'nganh',
                'sinhVienLopHocPhans',
                'sinhVienLopHocPhans.sinhVien',
                'sinhVienLopHocPhans.sinhVien.lop',
                'sinhVienLopHocPhans.sinhVien.lop.nganh',
                'ketQuaHocTaps',
                'ketQuaHocTaps.sinhVien',
            ],
        });

        if (!lhp) throw new NotFoundException('Không tìm thấy lớp học phần');

        // ===== KIỂM TRA QUYỀN GIẢNG VIÊN =====
        if (nguoiDung.vaiTro === VaiTroNguoiDungEnum.GIANG_VIEN) {
            if (!nguoiDung.giangVien) {
                throw new ForbiddenException('Tài khoản giảng viên chưa được liên kết với hồ sơ giảng viên');
            }

            if (!lhp.giangVien || lhp.giangVien.id !== nguoiDung.giangVien.id) {
                throw new ForbiddenException('Bạn không phải là giảng viên phụ trách lớp học phần này');
            }
        }

        // ===== XUẤT FILE EXCEL =====
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Bảng điểm');

        // ===== ĐỊNH NGHĨA STYLE =====
        const fontStyle: Partial<ExcelJS.Font> = {
            name: 'Times New Roman',
            size: 12,
        };

        const headerFontStyle: Partial<ExcelJS.Font> = {
            name: 'Times New Roman',
            size: 12,
            bold: true,
            color: { argb: 'FFFFFFFF' },
        };

        const titleFontStyle: Partial<ExcelJS.Font> = {
            name: 'Times New Roman',
            size: 18,
            bold: true,
            color: { argb: 'FF1F4E79' },
        };

        const blueFill: ExcelJS.Fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' },
        };

        const lightBlueFill: ExcelJS.Fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD6E3F8' },
        };

        const borderStyle: Partial<ExcelJS.Borders> = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } },
        };

        // ===== HEADER BÁO CÁO =====
        // Dòng 1: Tên trường/đơn vị
        worksheet.mergeCells('A1:K1');
        const schoolCell = worksheet.getCell('A1');
        schoolCell.value = 'TRƯỜNG ĐẠI HỌC THỦ ĐÔ HÀ NỘI';
        schoolCell.font = {
            name: 'Times New Roman',
            size: 13,
            bold: true,
            color: { argb: 'FF1F4E79' },
        };
        schoolCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(1).height = 22;
        // Dòng 4: Tiêu đề chính
        worksheet.mergeCells('A4:K4');
        const titleCell = worksheet.getCell('A4');
        titleCell.value = `BẢNG ĐIỂM LỚP HỌC PHẦN`;
        titleCell.font = titleFontStyle;
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(4).height = 30;

        // Dòng 5: Mã lớp học phần
        worksheet.mergeCells('A5:K5');
        const maLhpCell = worksheet.getCell('A5');
        maLhpCell.value = `Mã LHP: ${lhp.maLopHocPhan}`;
        maLhpCell.font = {
            name: 'Times New Roman',
            size: 14,
            bold: true,
            color: { argb: 'FF4472C4' },
        };
        maLhpCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(5).height = 22;

        // Dòng 6: Thông tin môn học và giảng viên
        worksheet.mergeCells('A6:K6');
        const monHocCell = worksheet.getCell('A6');
        monHocCell.value = `Môn học: ${lhp.monHoc.tenMonHoc} | Số tín chỉ: ${lhp.monHoc.soTinChi} | Giảng viên: ${lhp.giangVien?.hoTen || 'Chưa phân công'}`;
        monHocCell.font = {
            name: 'Times New Roman',
            size: 12,
        };
        monHocCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(6).height = 20;

        // Dòng 7: Thông tin học kỳ
        const ngayBD = new Date(lhp.hocKy.ngayBatDau).toLocaleDateString('vi-VN');
        const ngayKT = new Date(lhp.hocKy.ngayKetThuc).toLocaleDateString('vi-VN');
        worksheet.mergeCells('A7:K7');
        const hocKyCell = worksheet.getCell('A7');
        hocKyCell.value = `Học kỳ: ${lhp.hocKy.hocKy} (${ngayBD} - ${ngayKT}) - Năm học: ${lhp.hocKy.namHoc.tenNamHoc}`;
        hocKyCell.font = {
            name: 'Times New Roman',
            size: 12,
        };
        hocKyCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(7).height = 20;

        // Dòng 8: Trống
        worksheet.getRow(8).height = 10;

        // ===== TABLE HEADER (Dòng 9) =====
        const headerRow = worksheet.getRow(9);
        const headers = ['STT', 'MSSV', 'Họ và tên', 'Ngày sinh', 'Lớp', 'ĐQT (10%)', 'ĐTP (30%)', 'ĐThi (60%)', 'TBCHP', 'Điểm số', 'Điểm chữ'];

        headers.forEach((header, index) => {
            const cell = headerRow.getCell(index + 1);
            cell.value = header;
            cell.font = headerFontStyle;
            cell.fill = blueFill;
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = borderStyle;
        });
        headerRow.height = 28;

        // ===== DATA ROWS =====
        let rowIndex = 10;
        const ketQuaMap = new Map(lhp.ketQuaHocTaps.map(kq => [kq.sinhVien.id, kq]));

        lhp.sinhVienLopHocPhans.forEach((svlhp, idx) => {
            const sv = svlhp.sinhVien;
            const kq = ketQuaMap.get(sv.id);

            let tbchp = 0, diemSo = 0, diemChu = 'F';
            if (kq) {
                tbchp = this.tinhDiemTBCHP(kq.diemQuaTrinh, kq.diemThanhPhan, kq.diemThi);
                diemSo = this.diemHe10ToHe4(tbchp);
                diemChu = this.diemTBCHPToDiemChu(tbchp);
            }

            const row = worksheet.getRow(rowIndex);
            const rowData = [
                idx + 1,
                sv.maSinhVien,
                sv.hoTen,
                sv.ngaySinh ? new Date(sv.ngaySinh).toLocaleDateString('vi-VN') : '',
                sv.lop?.maLop || '',
                kq?.diemQuaTrinh ?? '',
                kq?.diemThanhPhan ?? '',
                kq?.diemThi ?? '',
                kq ? Number(tbchp.toFixed(2)) : '',
                kq ? diemSo : '',
                kq ? diemChu : '',
            ];

            rowData.forEach((value, colIndex) => {
                const cell = row.getCell(colIndex + 1);
                cell.value = value;
                cell.font = fontStyle;
                cell.border = borderStyle;
                cell.alignment = {
                    horizontal: [0, 3, 4, 5, 6, 7, 8, 9, 10].includes(colIndex) ? 'center' : 'left',
                    vertical: 'middle',
                };

                // Màu nền xen kẽ
                if (idx % 2 === 1) {
                    cell.fill = lightBlueFill;
                }

                // Highlight điểm đỏ nếu < 4 (không đạt)
                if (colIndex === 8 && kq && tbchp < 4) {
                    cell.font = {
                        name: 'Times New Roman',
                        size: 12,
                        color: { argb: 'FFFF0000' },
                        bold: true,
                    };
                }
            });

            row.height = 22;
            rowIndex++;
        });

        // ===== FOOTER =====
        rowIndex++; // Dòng trống

        // Thống kê
        worksheet.mergeCells(`A${rowIndex}:K${rowIndex}`);
        const statsCell = worksheet.getCell(`A${rowIndex}`);
        const tongSoSV = lhp.sinhVienLopHocPhans.length;
        const soSVDat = lhp.sinhVienLopHocPhans.filter(svlhp => {
            const kq = ketQuaMap.get(svlhp.sinhVien.id);
            if (!kq) return false;
            const tbchp = this.tinhDiemTBCHP(kq.diemQuaTrinh, kq.diemThanhPhan, kq.diemThi);
            return tbchp >= 4.0;
        }).length;
        statsCell.value = `Tổng số sinh viên: ${tongSoSV} | Đạt: ${soSVDat} | Không đạt: ${tongSoSV - soSVDat} | Tỷ lệ đạt: ${((soSVDat / tongSoSV) * 100).toFixed(1)}%`;
        statsCell.font = {
            name: 'Times New Roman',
            size: 12,
            bold: true,
            italic: true,
        };
        statsCell.alignment = { horizontal: 'right', vertical: 'middle' };
        rowIndex += 2;

        // Ngày xuất và chữ ký
        worksheet.mergeCells(`G${rowIndex}:K${rowIndex}`);
        const dateCell = worksheet.getCell(`G${rowIndex}`);
        const today = new Date();
        dateCell.value = `Ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;
        dateCell.font = {
            name: 'Times New Roman',
            size: 12,
            italic: true,
        };
        dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
        rowIndex++;

        worksheet.mergeCells(`G${rowIndex}:K${rowIndex}`);
        const signCell = worksheet.getCell(`G${rowIndex}`);
        signCell.value = 'GIẢNG VIÊN PHỤ TRÁCH';
        signCell.font = {
            name: 'Times New Roman',
            size: 12,
            bold: true,
        };
        signCell.alignment = { horizontal: 'center', vertical: 'middle' };
        rowIndex += 3;

        worksheet.mergeCells(`G${rowIndex}:K${rowIndex}`);
        const nameCell = worksheet.getCell(`G${rowIndex}`);
        nameCell.value = lhp.giangVien?.hoTen || '';
        nameCell.font = {
            name: 'Times New Roman',
            size: 12,
            bold: true,
        };
        nameCell.alignment = { horizontal: 'center', vertical: 'middle' };

        // ===== COLUMN WIDTHS =====
        worksheet.columns = [
            { width: 6 },   // STT
            { width: 18 },  // MSSV
            { width: 28 },  // Họ tên
            { width: 18 },  // Ngày sinh
            { width: 25 },  // Lớp
            { width: 18 },  // ĐQT
            { width: 18 },  // ĐTP
            { width: 18 },  // ĐThi
            { width: 10 },  // TBCHP
            { width: 10 },  // Điểm số
            { width: 10 },  // Điểm chữ
        ];

        const buffer = await workbook.xlsx.writeBuffer() as unknown as Buffer;
        const filename = `BangDiem_LHP_${lhp.maLopHocPhan}.xlsx`;

        return { buffer, filename };
    }

    // 2. Phiếu điểm cá nhân
    async xuatPhieuDiemCaNhan(sinhVienId: number): Promise<{ buffer: Buffer; filename: string }> {
        const sv = await this.sinhVienRepo.findOne({
            where: { id: sinhVienId },
            relations: [
                'lop',
                'lop.nganh',
                'lop.nganh.khoa',
                'lop.nienKhoa',
                'ketQuaHocTaps',
                'ketQuaHocTaps.lopHocPhan',
                'ketQuaHocTaps.lopHocPhan.monHoc',
                'ketQuaHocTaps.lopHocPhan.hocKy',
                'ketQuaHocTaps.lopHocPhan.hocKy.namHoc',
            ],
        });

        if (!sv) throw new NotFoundException('Không tìm thấy sinh viên');

        // ===== LỌC CHỈ LẤY KẾT QUẢ TỪ LỚP HỌC PHẦN ĐÃ KHÓA ĐIỂM =====
        const ketQuasDaKhoaDiem = sv.ketQuaHocTaps.filter(kq => kq.lopHocPhan.khoaDiem === true);

        if (ketQuasDaKhoaDiem.length === 0) {
            throw new NotFoundException('Sinh viên chưa có kết quả học tập nào được khóa điểm');
        }

        // ===== NHÓM KẾT QUẢ THEO MÔN HỌC =====
        const ketQuaTheoMon = new Map<number, KetQuaMonHoc>();

        for (const kq of ketQuasDaKhoaDiem) {
            const monHoc = kq.lopHocPhan.monHoc;
            const monHocId = monHoc.id;
            const diemTBCHP = this.tinhDiemTBCHP(kq.diemQuaTrinh, kq.diemThanhPhan, kq.diemThi);

            const ngayBD = kq.lopHocPhan.hocKy.ngayBatDau
                ? new Date(kq.lopHocPhan.hocKy.ngayBatDau).toLocaleDateString('vi-VN')
                : '';
            const ngayKT = kq.lopHocPhan.hocKy.ngayKetThuc
                ? new Date(kq.lopHocPhan.hocKy.ngayKetThuc).toLocaleDateString('vi-VN')
                : '';
            const hocKyStr = `HK${kq.lopHocPhan.hocKy.hocKy} (${ngayBD} - ${ngayKT}) - ${kq.lopHocPhan.hocKy.namHoc.tenNamHoc}`;

            if (!ketQuaTheoMon.has(monHocId)) {
                ketQuaTheoMon.set(monHocId, {
                    monHocId,
                    maMonHoc: monHoc.maMonHoc,
                    tenMonHoc: monHoc.tenMonHoc,
                    soTinChi: monHoc.soTinChi,
                    ketQuas: [],
                });
            }

            ketQuaTheoMon.get(monHocId)!.ketQuas.push({
                lopHocPhanId: kq.lopHocPhan.id,
                maLopHocPhan: kq.lopHocPhan.maLopHocPhan,
                hocKy: hocKyStr,
                diemQuaTrinh: kq.diemQuaTrinh,
                diemThanhPhan: kq.diemThanhPhan,
                diemThi: kq.diemThi,
                diemTBCHP,
                khoaDiem: kq.lopHocPhan.khoaDiem,
            });
        }

        // ===== TÍNH GPA HỆ 4 =====
        // Lấy điểm TBCHP cao nhất của mỗi môn, quy đổi sang hệ 4, rồi tính trung bình
        let tongDiemHe4 = 0;
        let soMonDuocXet = 0;

        for (const [monHocId, data] of ketQuaTheoMon) {
            // Lấy điểm TBCHP cao nhất của môn này
            const diemCaoNhat = Math.max(...data.ketQuas.map(kq => kq.diemTBCHP));
            const diemHe4 = this.diemHe10ToHe4(diemCaoNhat);

            tongDiemHe4 += diemHe4;
            soMonDuocXet++;
        }

        const gpaHe4 = soMonDuocXet > 0 ? tongDiemHe4 / soMonDuocXet : 0;

        // ===== CHUẨN BỊ DỮ LIỆU XUẤT EXCEL =====
        const danhSachKetQua: KetQuaXuatExcel[] = [];
        let stt = 0;

        for (const kq of ketQuasDaKhoaDiem) {
            stt++;
            const diemTBCHP = this.tinhDiemTBCHP(kq.diemQuaTrinh, kq.diemThanhPhan, kq.diemThi);
            const diemHe4 = this.diemHe10ToHe4(diemTBCHP);
            const xepLoai = this.diemTBCHPToDiemChu(diemTBCHP);

            const ngayBD = kq.lopHocPhan.hocKy.ngayBatDau
                ? new Date(kq.lopHocPhan.hocKy.ngayBatDau).toLocaleDateString('vi-VN')
                : '';
            const ngayKT = kq.lopHocPhan.hocKy.ngayKetThuc
                ? new Date(kq.lopHocPhan.hocKy.ngayKetThuc).toLocaleDateString('vi-VN')
                : '';

            danhSachKetQua.push({
                stt,
                maMonHoc: kq.lopHocPhan.monHoc.maMonHoc,
                tenMonHoc: kq.lopHocPhan.monHoc.tenMonHoc,
                maLopHocPhan: kq.lopHocPhan.maLopHocPhan,
                soTinChi: kq.lopHocPhan.monHoc.soTinChi,
                hocKy: `HK${kq.lopHocPhan.hocKy.hocKy} (${ngayBD} - ${ngayKT}) - ${kq.lopHocPhan.hocKy.namHoc.tenNamHoc}`,
                diemQuaTrinh: kq.diemQuaTrinh,
                diemThanhPhan: kq.diemThanhPhan,
                diemThi: kq.diemThi,
                diemTBCHP,
                diemHe4,
                xepLoai,
            });
        }

        // Tính tổng số tín chỉ
        const tongTinChi = [...ketQuaTheoMon.values()].reduce((sum, mon) => sum + mon.soTinChi, 0);

        // ===== TẠO FILE EXCEL =====
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Hệ thống quản lý đào tạo';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet('Phiếu điểm cá nhân', {
            pageSetup: {
                paperSize: 9, // A4
                orientation: 'landscape',
                fitToPage: true,
            },
        });

        // ========== HEADER SECTION ==========
        // Tiêu đề chính - Row 1
        worksheet.mergeCells('A1:L1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'PHIẾU ĐIỂM CÁ NHÂN';
        titleCell.font = { name: 'Times New Roman', size: 20, bold: true, color: { argb: '1F4E79' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(1).height = 40;

        // Dòng trống - Row 2
        worksheet.getRow(2).height = 10;

        // ========== THÔNG TIN SINH VIÊN - Row 3, 4, 5, 6 ==========
        // Row 3
        worksheet.mergeCells('A3:C3');
        const hoTenLabel = worksheet.getCell('A3');
        hoTenLabel.value = 'Họ và tên: ';
        hoTenLabel.font = { name: 'Times New Roman', size: 12, bold: true };
        hoTenLabel.alignment = { horizontal: 'left', vertical: 'middle' };

        worksheet.mergeCells('D3:F3');
        const hoTenValue = worksheet.getCell('D3');
        hoTenValue.value = sv.hoTen;
        hoTenValue.font = { name: 'Times New Roman', size: 12 };
        hoTenValue.alignment = { horizontal: 'left', vertical: 'middle' };

        worksheet.mergeCells('G3:H3');
        const mssvLabel = worksheet.getCell('G3');
        mssvLabel.value = 'MSSV:';
        mssvLabel.font = { name: 'Times New Roman', size: 12, bold: true };
        mssvLabel.alignment = { horizontal: 'left', vertical: 'middle' };

        worksheet.mergeCells('I3:L3');
        const mssvValue = worksheet.getCell('I3');
        mssvValue.value = sv.maSinhVien;
        mssvValue.font = { name: 'Times New Roman', size: 12 };
        mssvValue.alignment = { horizontal: 'left', vertical: 'middle' };

        worksheet.getRow(3).height = 22;

        // Row 4
        worksheet.mergeCells('A4:C4');
        const ngaySinhLabel = worksheet.getCell('A4');
        ngaySinhLabel.value = 'Ngày sinh:';
        ngaySinhLabel.font = { name: 'Times New Roman', size: 12, bold: true };
        ngaySinhLabel.alignment = { horizontal: 'left', vertical: 'middle' };

        worksheet.mergeCells('D4:F4');
        const ngaySinhValue = worksheet.getCell('D4');
        ngaySinhValue.value = sv.ngaySinh ? new Date(sv.ngaySinh).toLocaleDateString('vi-VN') : '';
        ngaySinhValue.font = { name: 'Times New Roman', size: 12 };
        ngaySinhValue.alignment = { horizontal: 'left', vertical: 'middle' };

        worksheet.mergeCells('G4:H4');
        const gioiTinhLabel = worksheet.getCell('G4');
        gioiTinhLabel.value = 'Giới tính: ';
        gioiTinhLabel.font = { name: 'Times New Roman', size: 12, bold: true };
        gioiTinhLabel.alignment = { horizontal: 'left', vertical: 'middle' };

        worksheet.mergeCells('I4:L4');
        const gioiTinhValue = worksheet.getCell('I4');
        gioiTinhValue.value = this.mapGioiTinh(sv.gioiTinh);
        gioiTinhValue.font = { name: 'Times New Roman', size: 12 };
        gioiTinhValue.alignment = { horizontal: 'left', vertical: 'middle' };

        worksheet.getRow(4).height = 22;

        // Row 5
        worksheet.mergeCells('A5:C5');
        const lopLabel = worksheet.getCell('A5');
        lopLabel.value = 'Lớp:';
        lopLabel.font = { name: 'Times New Roman', size: 12, bold: true };
        lopLabel.alignment = { horizontal: 'left', vertical: 'middle' };

        worksheet.mergeCells('D5:F5');
        const lopValue = worksheet.getCell('D5');
        lopValue.value = `${sv.lop.maLop} - ${sv.lop.tenLop}`;
        lopValue.font = { name: 'Times New Roman', size: 12 };
        lopValue.alignment = { horizontal: 'left', vertical: 'middle' };

        worksheet.mergeCells('G5:H5');
        const nienKhoaLabel = worksheet.getCell('G5');
        nienKhoaLabel.value = 'Niên khóa:';
        nienKhoaLabel.font = { name: 'Times New Roman', size: 12, bold: true };
        nienKhoaLabel.alignment = { horizontal: 'left', vertical: 'middle' };

        worksheet.mergeCells('I5:L5');
        const nienKhoaValue = worksheet.getCell('I5');
        nienKhoaValue.value = sv.lop.nienKhoa.tenNienKhoa;
        nienKhoaValue.font = { name: 'Times New Roman', size: 12 };
        nienKhoaValue.alignment = { horizontal: 'left', vertical: 'middle' };

        worksheet.getRow(5).height = 22;

        // Row 6
        worksheet.mergeCells('A6:C6');
        const nganhLabel = worksheet.getCell('A6');
        nganhLabel.value = 'Ngành: ';
        nganhLabel.font = { name: 'Times New Roman', size: 12, bold: true };
        nganhLabel.alignment = { horizontal: 'left', vertical: 'middle' };

        worksheet.mergeCells('D6:F6');
        const nganhValue = worksheet.getCell('D6');
        nganhValue.value = sv.lop.nganh.tenNganh;
        nganhValue.font = { name: 'Times New Roman', size: 12 };
        nganhValue.alignment = { horizontal: 'left', vertical: 'middle' };

        worksheet.mergeCells('G6:H6');
        const khoaLabel = worksheet.getCell('G6');
        khoaLabel.value = 'Khoa:';
        khoaLabel.font = { name: 'Times New Roman', size: 12, bold: true };
        khoaLabel.alignment = { horizontal: 'left', vertical: 'middle' };

        worksheet.mergeCells('I6:L6');
        const khoaValue = worksheet.getCell('I6');
        khoaValue.value = sv.lop.nganh.khoa?.tenKhoa || 'N/A';
        khoaValue.font = { name: 'Times New Roman', size: 12 };
        khoaValue.alignment = { horizontal: 'left', vertical: 'middle' };

        worksheet.getRow(6).height = 22;

        // Dòng trống - Row 7
        worksheet.getRow(7).height = 10;

        // ========== THỐNG KÊ TỔNG QUAN - Row 8, 9, 10 ==========
        worksheet.mergeCells('A8:L8');
        const statsHeaderCell = worksheet.getCell('A8');
        statsHeaderCell.value = 'THỐNG KÊ TỔNG QUAN';
        statsHeaderCell.font = { name: 'Times New Roman', size: 13, bold: true, color: { argb: 'FFFFFF' } };
        statsHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2E75B6' } };
        statsHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(8).height = 28;

        // Row 9 - Thống kê
        worksheet.mergeCells('A9:C9');
        const soMonLabel = worksheet.getCell('A9');
        soMonLabel.value = 'Số môn học đã hoàn thành:';
        soMonLabel.font = { name: 'Times New Roman', size: 11, bold: true };
        soMonLabel.alignment = { horizontal: 'left', vertical: 'middle' };

        const soMonValue = worksheet.getCell('D9');
        soMonValue.value = soMonDuocXet;
        soMonValue.font = { name: 'Times New Roman', size: 12, bold: true, color: { argb: '305496' } };
        soMonValue.alignment = { horizontal: 'center', vertical: 'middle' };

        worksheet.mergeCells('E9:G9');
        const tongTCLabel = worksheet.getCell('E9');
        tongTCLabel.value = 'Tổng số tín chỉ:';
        tongTCLabel.font = { name: 'Times New Roman', size: 11, bold: true };
        tongTCLabel.alignment = { horizontal: 'left', vertical: 'middle' };

        const tongTCValue = worksheet.getCell('H9');
        tongTCValue.value = tongTinChi;
        tongTCValue.font = { name: 'Times New Roman', size: 12, bold: true, color: { argb: '305496' } };
        tongTCValue.alignment = { horizontal: 'center', vertical: 'middle' };

        worksheet.mergeCells('I9:K9');
        const gpaLabel = worksheet.getCell('I9');
        gpaLabel.value = 'GPA (Hệ 4):';
        gpaLabel.font = { name: 'Times New Roman', size: 11, bold: true };
        gpaLabel.alignment = { horizontal: 'left', vertical: 'middle' };

        const gpaValue = worksheet.getCell('L9');
        gpaValue.value = gpaHe4.toFixed(2);
        gpaValue.font = { name: 'Times New Roman', size: 14, bold: true };
        // Màu GPA theo mức
        if (gpaHe4 >= 3.5) {
            gpaValue.font.color = { argb: '548235' }; // Xanh lá - Xuất sắc/Giỏi
        } else if (gpaHe4 >= 2.5) {
            gpaValue.font.color = { argb: '2E75B6' }; // Xanh dương - Khá
        } else if (gpaHe4 >= 2.0) {
            gpaValue.font.color = { argb: 'C65911' }; // Cam - Trung bình
        } else {
            gpaValue.font.color = { argb: 'FF0000' }; // Đỏ - Yếu
        }
        gpaValue.alignment = { horizontal: 'center', vertical: 'middle' };

        worksheet.getRow(9).height = 25;

        // Row 10 - Xếp loại GPA
        worksheet.mergeCells('A10:C10');
        const xepLoaiGPALabel = worksheet.getCell('A10');
        xepLoaiGPALabel.value = 'Xếp loại học lực:';
        xepLoaiGPALabel.font = { name: 'Times New Roman', size: 11, bold: true };
        xepLoaiGPALabel.alignment = { horizontal: 'left', vertical: 'middle' };

        worksheet.mergeCells('D10:F10');
        const xepLoaiGPAValue = worksheet.getCell('D10');
        xepLoaiGPAValue.value = this.xepLoaiHocLuc(gpaHe4);
        xepLoaiGPAValue.font = { name: 'Times New Roman', size: 12, bold: true };
        if (gpaHe4 >= 3.5) {
            xepLoaiGPAValue.font.color = { argb: '548235' };
        } else if (gpaHe4 >= 2.5) {
            xepLoaiGPAValue.font.color = { argb: '2E75B6' };
        } else if (gpaHe4 >= 2.0) {
            xepLoaiGPAValue.font.color = { argb: 'C65911' };
        } else {
            xepLoaiGPAValue.font.color = { argb: 'FF0000' };
        }
        xepLoaiGPAValue.alignment = { horizontal: 'left', vertical: 'middle' };

        worksheet.mergeCells('G10:I10');
        const soKetQuaLabel = worksheet.getCell('G10');
        soKetQuaLabel.value = 'Số kết quả học tập:';
        soKetQuaLabel.font = { name: 'Times New Roman', size: 11, bold: true };
        soKetQuaLabel.alignment = { horizontal: 'left', vertical: 'middle' };

        worksheet.mergeCells('J10:L10');
        const soKetQuaValue = worksheet.getCell('J10');
        soKetQuaValue.value = danhSachKetQua.length;
        soKetQuaValue.font = { name: 'Times New Roman', size: 12, bold: true, color: { argb: '305496' } };
        soKetQuaValue.alignment = { horizontal: 'left', vertical: 'middle' };

        worksheet.getRow(10).height = 25;

        // Dòng trống - Row 11
        worksheet.getRow(11).height = 15;

        // ========== BẢNG KẾT QUẢ HỌC TẬP - Bắt đầu từ Row 12 ==========
        const tableStartRow = 12;

        // Header của bảng
        const headers = [
            { header: 'STT', key: 'stt', width: 6 },
            { header: 'Mã HP', key: 'maMonHoc', width: 20 },
            { header: 'Tên học phần', key: 'tenMonHoc', width: 35 },
            { header: 'Mã lớp HP', key: 'maLopHocPhan', width: 35 },
            { header: 'Số TC', key: 'soTinChi', width: 8 },
            { header: 'Học kỳ', key: 'hocKy', width: 45 },
            { header: 'Điểm QT', key: 'diemQuaTrinh', width: 10 },
            { header: 'Điểm TP', key: 'diemThanhPhan', width: 10 },
            { header: 'Điểm thi', key: 'diemThi', width: 10 },
            { header: 'TBCHP', key: 'diemTBCHP', width: 10 },
            { header: 'Điểm hệ 4', key: 'diemHe4', width: 12 },
            { header: 'Xếp loại', key: 'xepLoai', width: 10 },
        ];

        // Set column widths
        headers.forEach((col, index) => {
            worksheet.getColumn(index + 1).width = col.width;
        });

        // Header row
        const headerRow = worksheet.getRow(tableStartRow);
        headers.forEach((col, index) => {
            const cell = headerRow.getCell(index + 1);
            cell.value = col.header;
            cell.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2E75B6' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = {
                top: { style: 'thin', color: { argb: '000000' } },
                left: { style: 'thin', color: { argb: '000000' } },
                bottom: { style: 'thin', color: { argb: '000000' } },
                right: { style: 'thin', color: { argb: '000000' } },
            };
        });
        headerRow.height = 30;

        // Data rows
        danhSachKetQua.forEach((kq, index) => {
            const rowIndex = tableStartRow + 1 + index;
            const row = worksheet.getRow(rowIndex);

            const rowData = [
                kq.stt,
                kq.maMonHoc,
                kq.tenMonHoc,
                kq.maLopHocPhan,
                kq.soTinChi,
                kq.hocKy,
                kq.diemQuaTrinh,
                kq.diemThanhPhan,
                kq.diemThi,
                kq.diemTBCHP.toFixed(2),
                kq.diemHe4.toFixed(1),
                kq.xepLoai,
            ];

            rowData.forEach((value, colIndex) => {
                const cell = row.getCell(colIndex + 1);
                cell.value = value;
                cell.font = { name: 'Times New Roman', size: 11 };
                cell.alignment = {
                    horizontal: colIndex === 2 || colIndex === 5 ? 'left' : 'center',
                    vertical: 'middle',
                    wrapText: colIndex === 5, // Wrap text cho cột học kỳ
                };
                cell.border = {
                    top: { style: 'thin', color: { argb: '000000' } },
                    left: { style: 'thin', color: { argb: '000000' } },
                    bottom: { style: 'thin', color: { argb: '000000' } },
                    right: { style: 'thin', color: { argb: '000000' } },
                };

                // Màu nền xen kẽ
                if (index % 2 === 1) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D6DCE4' } };
                }

                // Màu cho cột xếp loại
                if (colIndex === 11) {
                    cell.font = { name: 'Times New Roman', size: 11, bold: true };
                    if (kq.xepLoai === 'A+' || kq.xepLoai === 'A') {
                        cell.font.color = { argb: '548235' }; // Xanh lá
                    } else if (kq.xepLoai === 'B+' || kq.xepLoai === 'B') {
                        cell.font.color = { argb: '2E75B6' }; // Xanh dương
                    } else if (kq.xepLoai === 'C+' || kq.xepLoai === 'C') {
                        cell.font.color = { argb: 'C65911' }; // Cam
                    } else if (kq.xepLoai === 'D+' || kq.xepLoai === 'D') {
                        cell.font.color = { argb: 'BF8F00' }; // Vàng đậm
                    } else {
                        cell.font.color = { argb: 'FF0000' }; // Đỏ - F
                    }
                }

                // Màu cho cột TBCHP
                if (colIndex === 9) {
                    cell.font = { name: 'Times New Roman', size: 11, bold: true };
                    if (kq.diemTBCHP >= 8.0) {
                        cell.font.color = { argb: '548235' };
                    } else if (kq.diemTBCHP >= 6.5) {
                        cell.font.color = { argb: '2E75B6' };
                    } else if (kq.diemTBCHP >= 4.0) {
                        cell.font.color = { argb: 'C65911' };
                    } else {
                        cell.font.color = { argb: 'FF0000' };
                    }
                }
            });

            row.height = 25;
        });

        // ========== FOOTER ==========
        const footerRow = tableStartRow + danhSachKetQua.length + 2;
        worksheet.mergeCells(`A${footerRow}:L${footerRow}`);
        const footerCell = worksheet.getCell(`A${footerRow}`);
        footerCell.value = `Phiếu điểm được xuất tự động từ hệ thống vào lúc ${this.formatDateTime(new Date())}`;
        footerCell.font = { name: 'Times New Roman', size: 10, italic: true, color: { argb: '808080' } };
        footerCell.alignment = { horizontal: 'right', vertical: 'middle' };

        // Ghi chú
        const noteRow = footerRow + 1;
        worksheet.mergeCells(`A${noteRow}:L${noteRow}`);
        const noteCell = worksheet.getCell(`A${noteRow}`);
        noteCell.value = '* Chỉ hiển thị kết quả học tập của các lớp học phần đã được khóa điểm.  GPA được tính dựa trên điểm cao nhất của mỗi môn học. ';
        noteCell.font = { name: 'Times New Roman', size: 9, italic: true, color: { argb: '808080' } };
        noteCell.alignment = { horizontal: 'left', vertical: 'middle' };

        // Xuất buffer
        const buffer = (await workbook.xlsx.writeBuffer()) as unknown as Buffer;

        // Filename có dấu
        const filename = `Phiếu điểm cá nhân - ${sv.hoTen} - MSV_${sv.maSinhVien}.xlsx`;

        return { buffer, filename };
    }

    // ========== HELPER METHODS ==========

    /**
     * Xếp loại học lực theo GPA hệ 4
     */
    private xepLoaiHocLuc(gpa: number): string {
        if (gpa >= 3.6) return 'Xuất sắc';
        if (gpa >= 3.2) return 'Giỏi';
        if (gpa >= 2.5) return 'Khá';
        if (gpa >= 2.0) return 'Trung bình';
        if (gpa >= 1.0) return 'Yếu';
        return 'Kém';
    }

    private mapGioiTinh(gioiTinh: GioiTinh): string {
        const map = {
            [GioiTinh.NAM]: 'Nam',
            [GioiTinh.NU]: 'Nữ',
            [GioiTinh.KHONG_XAC_DINH]: 'Không xác định',
        };
        return map[gioiTinh] || 'Không xác định';
    }

    private formatDateTime(date: Date): string {
        if (!date) return '';
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    }

    async xuatBaoCaoGiangVien(giangVienId: number): Promise<{ buffer: Buffer, filename: string }> {
        // Load đầy đủ dữ liệu
        const gv = await this.giangVienRepo.findOne({
            where: { id: giangVienId },
            relations: [
                'monHocGiangViens',
                'monHocGiangViens.monHoc',
                'lopHocPhans',
                'lopHocPhans.monHoc',
                'lopHocPhans.hocKy',
                'lopHocPhans.hocKy.namHoc',
                'lopHocPhans.sinhVienLopHocPhans',
            ],
        });

        if (!gv) throw new NotFoundException('Không tìm thấy giảng viên');

        const workbook = new ExcelJS.Workbook();

        // Ngày hiện tại để tính trạng thái
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // Tính trạng thái cho từng lớp học phần
        const lopHocPhansWithStatus = gv.lopHocPhans.map(lhp => {
            let trangThai = 'Chưa bắt đầu';
            if (lhp.hocKy) {
                const batDau = new Date(lhp.hocKy.ngayBatDau);
                const ketThuc = new Date(lhp.hocKy.ngayKetThuc);
                batDau.setHours(0, 0, 0, 0);
                ketThuc.setHours(0, 0, 0, 0);

                if (now >= batDau && now <= ketThuc) {
                    trangThai = 'Đang học';
                } else if (now > ketThuc) {
                    trangThai = 'Đã kết thúc';
                }
            }
            return { ...lhp, trangThai };
        });

        // Thống kê trạng thái
        const tongLop = lopHocPhansWithStatus.length;
        const dangDay = lopHocPhansWithStatus.filter(l => l.trangThai === 'Đang học').length;
        const daDay = lopHocPhansWithStatus.filter(l => l.trangThai === 'Đã kết thúc').length;
        const chuaDay = lopHocPhansWithStatus.filter(l => l.trangThai === 'Chưa bắt đầu').length;

        // === SHEET 1: Thông tin giảng viên & Thống kê ===
        const sheetThongTin = workbook.addWorksheet('Thông tin giảng viên');

        sheetThongTin.mergeCells('A1:G1');
        sheetThongTin.getCell('A1').value = `BÁO CÁO GIẢNG DẠY - ${gv.hoTen.toUpperCase()}`;
        sheetThongTin.getCell('A1').font = { size: 18, bold: true, color: { argb: 'FF003366' } };
        sheetThongTin.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
        sheetThongTin.getRow(1).height = 40;

        // Thông tin cá nhân
        const infoData = [
            ['Họ và tên:', gv.hoTen],
            ['Ngày sinh:', gv.ngaySinh ? new Date(gv.ngaySinh).toLocaleDateString('vi-VN') : 'Chưa cập nhật'],
            ['Giới tính:', gv.gioiTinh || 'Chưa cập nhật'],
            ['Email:', gv.email],
            ['Số điện thoại:', gv.sdt || 'Chưa cập nhật'],
            ['Địa chỉ:', gv.diaChi || 'Chưa cập nhật'],
        ];

        infoData.forEach(([label, value], idx) => {
            const row = sheetThongTin.getRow(3 + idx);
            row.getCell(1).value = label;
            row.getCell(1).font = { bold: true };
            row.getCell(2).value = value;
        });

        sheetThongTin.getColumn(1).width = 30;
        sheetThongTin.getColumn(2).width = 40;

        // Thống kê giảng dạy (cập nhật thêm trạng thái)
        sheetThongTin.mergeCells(`A10:G10`);
        sheetThongTin.getCell(`A10`).value = 'THỐNG KÊ GIẢNG DẠY';
        sheetThongTin.getCell(`A10`).font = { size: 14, bold: true };
        sheetThongTin.getCell(`A10`).alignment = { horizontal: 'center' };
        sheetThongTin.getRow(10).height = 30;

        const thongKe = [
            ['Tổng số lớp học phần được phân công:', tongLop],
            ['Tổng số lớp đang dạy:', dangDay],
            ['Tổng số lớp đã dạy:', daDay],
            ['Tổng số lớp chưa dạy:', chuaDay],
            ['Tổng số sinh viên đang hướng dẫn:', gv.lopHocPhans.reduce((sum, lhp) => sum + lhp.sinhVienLopHocPhans.length, 0)],
            ['Tổng số môn học phụ trách:', new Set(gv.monHocGiangViens.map(m => m.monHoc.id)).size],
        ];

        thongKe.forEach(([label, value], idx) => {
            const row = sheetThongTin.getRow(12 + idx);
            row.getCell(1).value = label;
            row.getCell(1).font = { bold: true };
            row.getCell(2).value = value;
        });

        // === SHEET 2: Danh sách môn học phụ trách ===
        const sheetMonHoc = workbook.addWorksheet('Môn học phụ trách');

        sheetMonHoc.mergeCells('A1:D1');
        sheetMonHoc.getCell('A1').value = 'DANH SÁCH MÔN HỌC ĐƯỢC PHÂN CÔNG GIẢNG DẠY';
        sheetMonHoc.getCell('A1').font = { size: 14, bold: true };
        sheetMonHoc.getCell('A1').alignment = { horizontal: 'center' };

        const headerMonHoc = sheetMonHoc.getRow(3);
        headerMonHoc.values = ['STT', 'Mã môn học', 'Tên môn học', 'Số tín chỉ'];
        headerMonHoc.font = { bold: true };
        headerMonHoc.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });

        // Loại trùng môn học (giảng viên có thể dạy nhiều lớp cùng môn)
        const monHocSet = new Map<string, any>();
        gv.monHocGiangViens.forEach(m => {
            const mon = m.monHoc;
            if (!monHocSet.has(mon.maMonHoc)) {
                monHocSet.set(mon.maMonHoc, mon);
            }
        });

        const monHocList = Array.from(monHocSet.values());

        monHocList.forEach((mon, idx) => {
            const row = sheetMonHoc.getRow(4 + idx);
            row.values = [
                idx + 1,
                mon.maMonHoc,
                mon.tenMonHoc,
                mon.soTinChi,
            ];
        });

        sheetMonHoc.columns = [
            { width: 8 },
            { width: 20 },
            { width: 50 },
            { width: 15 },
        ];
        // === SHEET 3: Lớp học phần giảng dạy + Trạng thái ===
        const sheetLopHP = workbook.addWorksheet('Lớp học phần giảng dạy');

        sheetLopHP.mergeCells('A1:H1');
        sheetLopHP.getCell('A1').value = 'CHI TIẾT LỚP HỌC PHẦN ĐANG GIẢNG DẠY';
        sheetLopHP.getCell('A1').font = { size: 14, bold: true };
        sheetLopHP.getCell('A1').alignment = { horizontal: 'center' };

        const headerLopHP = sheetLopHP.getRow(3);
        headerLopHP.values = ['STT', 'Mã LHP', 'Môn học', 'Số TC', 'Học kỳ - Năm học', 'Sĩ số', 'Trạng thái'];
        headerLopHP.font = { bold: true };
        headerLopHP.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });

        // Sắp xếp theo năm học giảm dần, học kỳ, và thêm trạng thái
        lopHocPhansWithStatus
            .sort((a, b) => {
                const namA = a.hocKy.namHoc.namBatDau;
                const namB = b.hocKy.namHoc.namBatDau;
                if (namB !== namA) return namB - namA;
                return a.hocKy.hocKy - b.hocKy.hocKy;
            })
            .forEach((lhp, idx) => {
                const row = sheetLopHP.getRow(4 + idx);
                const ngayBD = new Date(lhp.hocKy.ngayBatDau).toLocaleDateString('vi-VN');
                const ngayKT = new Date(lhp.hocKy.ngayKetThuc).toLocaleDateString('vi-VN');

                row.values = [
                    idx + 1,
                    lhp.maLopHocPhan,
                    lhp.monHoc.tenMonHoc,
                    lhp.monHoc.soTinChi,
                    `Học kỳ ${lhp.hocKy.hocKy} (${ngayBD} - ${ngayKT}) - ${lhp.hocKy.namHoc.tenNamHoc}`,
                    lhp.sinhVienLopHocPhans.length,
                    lhp.trangThai, // ← Trạng thái tiếng Việt đẹp
                ];
            });

        sheetLopHP.columns = [
            { width: 8 },
            { width: 25 },
            { width: 40 },
            { width: 12 },
            { width: 60 },
            { width: 12 },
            { width: 18 }, // cột trạng thái
        ];

        const buffer = await workbook.xlsx.writeBuffer() as unknown as Buffer;

        // ✅ Filename có dấu
        const filename = `Báo cáo giảng viên - ${gv.hoTen} - SĐT: ${gv.sdt}.xlsx`;
        return { buffer, filename };
    }

    // 4. Danh sách học lại/cải thiện
    async xuatDanhSachHocLai(filter: FilterHocLaiDto): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();

        // Sheet 1: Học lại
        if (!filter.loaiHocLai || filter.loaiHocLai === 'HOC_LAI' || filter.loaiHocLai === 'TAT_CA') {
            const wsHocLai = workbook.addWorksheet('Học lại');
            await this.taoSheetHocLai(wsHocLai, filter, LoaiHinhThamGiaLopHocPhanEnum.HOC_LAI);
        }

        // Sheet 2: Cải thiện
        if (!filter.loaiHocLai || filter.loaiHocLai === 'HOC_CAI_THIEN' || filter.loaiHocLai === 'TAT_CA') {
            const wsCaiThien = workbook.addWorksheet('Cải thiện');
            await this.taoSheetHocLai(wsCaiThien, filter, LoaiHinhThamGiaLopHocPhanEnum.HOC_CAI_THIEN);
        }

        return await workbook.xlsx.writeBuffer() as unknown as Buffer;
    }

    private async taoSheetHocLai(
        worksheet: ExcelJS.Worksheet,
        filter: FilterHocLaiDto,
        loai: LoaiHinhThamGiaLopHocPhanEnum,
    ) {
        worksheet.mergeCells('A1:J1');
        worksheet.getCell('A1').value =
            loai === LoaiHinhThamGiaLopHocPhanEnum.HOC_LAI
                ? 'DANH SÁCH SINH VIÊN HỌC LẠI'
                : 'DANH SÁCH SINH VIÊN HỌC CẢI THIỆN';
        worksheet.getCell('A1').font = { size: 14, bold: true };
        worksheet.getCell('A1').alignment = { horizontal: 'center' };

        const headerRow = worksheet.getRow(3);
        headerRow.values = [
            'STT',
            'MSSV',
            'Họ tên',
            'Ngành',
            'Niên khóa',
            'Môn học',
            'Lớp HP gần nhất',
            'Điểm TBCHP cũ',
            'Học kỳ gần nhất',
            'Số lần ' + (loai === LoaiHinhThamGiaLopHocPhanEnum.HOC_LAI ? 'học lại' : 'học cải thiện'),
        ];
        headerRow.font = { bold: true };
        headerRow.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });

        // Lấy danh sách đăng ký có loai_tham_gia phù hợp
        const dangKyQuery = this.svLhpRepo.createQueryBuilder('svlhp')
            .leftJoinAndSelect('svlhp.sinhVien', 'sv')
            .leftJoinAndSelect('sv.lop', 'lop')
            .leftJoinAndSelect('lop.nganh', 'nganh')
            .leftJoinAndSelect('lop.nienKhoa', 'nienKhoa')
            .leftJoinAndSelect('svlhp.lopHocPhan', 'lhp')
            .leftJoinAndSelect('lhp.monHoc', 'monHoc')
            .leftJoinAndSelect('lhp.hocKy', 'hocKy')
            .leftJoinAndSelect('hocKy.namHoc', 'namHoc')
            .where('svlhp.loai_tham_gia = :loai', { loai });

        if (filter.hocKyId) {
            dangKyQuery.andWhere('lhp.hoc_ky_id = :hocKyId', { hocKyId: filter.hocKyId });
        }
        if (filter.nganhId) {
            dangKyQuery.andWhere('nganh.id = :nganhId', { nganhId: filter.nganhId });
        }
        if (filter.nienKhoaId) {
            dangKyQuery.andWhere('nienKhoa.id = :nienKhoaId', { nienKhoaId: filter.nienKhoaId });
        }

        const dangKyList = await dangKyQuery.getMany();

        if (dangKyList.length === 0) {
            worksheet.getCell('A5').value = 'Không có dữ liệu';
            return;
        }

        // Group theo sinh viên + môn học
        const groupMap = new Map<string, SinhVienLopHocPhan[]>();
        for (const dk of dangKyList) {
            const key = `${dk.sinhVien.id}-${dk.lopHocPhan.monHoc.id}`;
            if (!groupMap.has(key)) groupMap.set(key, []);
            groupMap.get(key)!.push(dk);
        }

        const rows: any[] = [];

        for (const [key, dks] of groupMap) {
            // Sắp xếp theo ngày kết thúc học kỳ giảm dần (gần nhất trước)
            dks.sort((a, b) => {
                const dateA = new Date(a.lopHocPhan.hocKy.ngayKetThuc).getTime();
                const dateB = new Date(b.lopHocPhan.hocKy.ngayKetThuc).getTime();
                return dateB - dateA;
            });

            const latestDk = dks[0]; // lớp gần nhất
            const sv = latestDk.sinhVien;
            const monHoc = latestDk.lopHocPhan.monHoc;

            // === Tính ngày bắt đầu - kết thúc của lớp GẦN NHẤT (luôn hiển thị) ===
            const ngayBD = latestDk.lopHocPhan.hocKy.ngayBatDau
                ? new Date(latestDk.lopHocPhan.hocKy.ngayBatDau).toLocaleDateString('vi-VN')
                : 'N/A';
            const ngayKT = latestDk.lopHocPhan.hocKy.ngayKetThuc
                ? new Date(latestDk.lopHocPhan.hocKy.ngayKetThuc).toLocaleDateString('vi-VN')
                : 'N/A';

            const hocKyGanNhat = `${latestDk.lopHocPhan.hocKy.hocKy} (${ngayBD} - ${ngayKT}) - Năm học: ${latestDk.lopHocPhan.hocKy.namHoc.tenNamHoc}`;

            // Tìm điểm cũ: ưu tiên lớp gần nhất có điểm → nếu không có thì tìm ngược về trước
            let oldDiem: number | null = null;
            let oldLHP: LopHocPhan | null = null;

            // Ưu tiên lớp gần nhất có điểm
            for (const dk of dks) {
                const kq = await this.ketQuaRepo.findOne({
                    where: {
                        sinhVien: { id: sv.id },
                        lopHocPhan: { id: dk.lopHocPhan.id },
                    },
                });
                if (kq && kq.diemQuaTrinh !== null && kq.diemThanhPhan !== null && kq.diemThi !== null) {
                    oldDiem = this.tinhDiemTBCHP(kq.diemQuaTrinh, kq.diemThanhPhan, kq.diemThi);
                    oldLHP = dk.lopHocPhan;
                    break;
                }
            }

            // Nếu không có điểm ở các lớp học lại/cải thiện → tìm lớp trước đó (không cần loai_tham_gia)
            if (oldDiem === null) {
                const previousKq = await this.ketQuaRepo.findOne({
                    where: {
                        sinhVien: { id: sv.id },
                        lopHocPhan: { monHoc: { id: monHoc.id } },
                    },
                    relations: ['lopHocPhan', 'lopHocPhan.hocKy', 'lopHocPhan.hocKy.namHoc'],
                    order: { lopHocPhan: { hocKy: { ngayKetThuc: 'DESC' } } },
                });

                if (previousKq && previousKq.diemQuaTrinh !== null && previousKq.diemThanhPhan !== null && previousKq.diemThi !== null) {
                    oldDiem = this.tinhDiemTBCHP(previousKq.diemQuaTrinh, previousKq.diemThanhPhan, previousKq.diemThi);
                    oldLHP = previousKq.lopHocPhan;
                }
            }

            rows.push({
                mssv: sv.maSinhVien,
                hoTen: sv.hoTen,
                nganh: sv.lop.nganh.tenNganh,
                nienKhoa: sv.lop.nienKhoa.tenNienKhoa,
                monHoc: monHoc.tenMonHoc,
                lopHPCu: oldLHP ? oldLHP.maLopHocPhan : latestDk.lopHocPhan.maLopHocPhan,
                diemCu: oldDiem !== null ? oldDiem.toFixed(1) : 'Chưa có',
                hocKyCu: hocKyGanNhat,
                soLan: dks.length,
            });
        }

        let filteredRows = rows;
        // Ghi dữ liệu vào sheet
        let rowIndex = 4;
        filteredRows.forEach((row, idx) => {
            const excelRow = worksheet.getRow(rowIndex++);
            excelRow.values = [
                idx + 1,
                row.mssv,
                row.hoTen,
                row.nganh,
                row.nienKhoa,
                row.monHoc,
                row.lopHPCu,
                row.diemCu,
                row.hocKyCu,
                row.soLan,
            ];
        });

        worksheet.columns = [
            { width: 6 },
            { width: 15 },
            { width: 25 },
            { width: 25 },
            { width: 15 },
            { width: 35 },
            { width: 30 },
            { width: 19 },
            { width: 43 },
            { width: 23 },
        ];
    }

    // 5. Thống kê ngành/học kỳ
    async xuatThongKeNganh(filter: FilterThongKeNganhDto): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Thống kê ngành');

        worksheet.mergeCells('A1:E1');
        worksheet.getCell('A1').value = 'THỐNG KÊ KẾT QUẢ THEO NGÀNH/HỌC KỲ';
        worksheet.getCell('A1').font = { size: 14, bold: true };
        worksheet.getCell('A1').alignment = { horizontal: 'center' };

        // Query thống kê
        const stats = await this.ketQuaRepo.createQueryBuilder('kq')
            .leftJoin('kq.lopHocPhan', 'lhp')
            .leftJoin('lhp.nganh', 'nganh')
            .leftJoin('lhp.hocKy', 'hk')
            .leftJoin('kq.sinhVien', 'sv')
            .where('nganh.id = :nganhId', { nganhId: filter.nganhId })
            .andWhere('hk.id = :hocKyId', { hocKyId: filter.hocKyId })
            .select([
                'COUNT(DISTINCT sv.id) as tongSV',
                'COUNT(kq.id) as tongLuotHoc',
                'SUM(CASE WHEN (kq.diemQuaTrinh * 0.1 + kq.diemThanhPhan * 0.3 + kq.diemThi * 0.6) >= 4.0 THEN 1 ELSE 0 END) as soDat',
                'AVG(kq.diemQuaTrinh * 0.1 + kq.diemThanhPhan * 0.3 + kq.diemThi * 0.6) as diemTB',
            ])
            .getRawOne();

        let rowIndex = 3;
        worksheet.getCell(`A${rowIndex}`).value = '1. QUY MÔ ĐÀO TẠO';
        worksheet.getCell(`A${rowIndex}`).font = { bold: true };
        rowIndex++;
        worksheet.getCell(`A${rowIndex}`).value = `Tổng số sinh viên: ${stats.tongSV}`;
        rowIndex++;
        worksheet.getCell(`A${rowIndex}`).value = `Tổng số lượt học: ${stats.tongLuotHoc}`;
        rowIndex += 2;

        worksheet.getCell(`A${rowIndex}`).value = '2. KẾT QUẢ HỌC TẬP';
        worksheet.getCell(`A${rowIndex}`).font = { bold: true };
        rowIndex++;
        worksheet.getCell(`A${rowIndex}`).value = `Số SV đạt: ${stats.soDat}`;
        rowIndex++;
        const tyLeDau = stats.tongLuotHoc > 0 ? (stats.soDat / stats.tongLuotHoc * 100).toFixed(2) : 0;
        worksheet.getCell(`A${rowIndex}`).value = `Tỷ lệ đậu: ${tyLeDau}%`;
        rowIndex++;
        worksheet.getCell(`A${rowIndex}`).value = `Điểm TB chung: ${parseFloat(stats.diemTB).toFixed(2)}`;

        return await workbook.xlsx.writeBuffer() as unknown as Buffer;
    }

    // 6. Thống kê lớp học phần
    async xuatThongKeLopHocPhan(filter: FilterThongKeLopHocPhanDto): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Thống kê LHP');

        worksheet.mergeCells('A1:F1');
        worksheet.getCell('A1').value = 'THỐNG KÊ KẾT QUẢ LỚP HỌC PHẦN';
        worksheet.getCell('A1').font = { size: 14, bold: true };
        worksheet.getCell('A1').alignment = { horizontal: 'center' };

        const headerRow = worksheet.getRow(3);
        headerRow.values = ['Mã LHP', 'Môn học', 'Tổng SV', 'SV đạt', 'Tỷ lệ đậu', 'ĐTB lớp'];
        headerRow.font = { bold: true };

        const query = this.lopHocPhanRepo.createQueryBuilder('lhp')
            .leftJoinAndSelect('lhp.monHoc', 'mh')
            .leftJoinAndSelect('lhp.ketQuaHocTaps', 'kq')
            .where('1=1');

        if (filter.lopHocPhanIds?.length) {
            query.andWhere('lhp.id IN (:...ids)', { ids: filter.lopHocPhanIds });
        }
        if (filter.hocKyId) query.andWhere('lhp.hocKyId = :hocKyId', { hocKyId: filter.hocKyId });
        if (filter.monHocId) query.andWhere('lhp.monHocId = :monHocId', { monHocId: filter.monHocId });

        const lhps = await query.getMany();

        let rowIndex = 4;
        lhps.forEach(lhp => {
            const tongSV = lhp.ketQuaHocTaps.length;
            let svDat = 0;
            let tongDiem = 0;

            lhp.ketQuaHocTaps.forEach(kq => {
                const tbchp = this.tinhDiemTBCHP(kq.diemQuaTrinh, kq.diemThanhPhan, kq.diemThi);
                tongDiem += tbchp;
                if (tbchp >= 4.0) svDat++;
            });

            const tyLeDau = tongSV > 0 ? (svDat / tongSV * 100).toFixed(2) : 0;
            const dtb = tongSV > 0 ? (tongDiem / tongSV).toFixed(2) : 0;

            const row = worksheet.getRow(rowIndex++);
            row.values = [
                lhp.maLopHocPhan,
                lhp.monHoc.tenMonHoc,
                tongSV,
                svDat,
                `${tyLeDau}%`,
                dtb,
            ];
        });

        worksheet.columns = [
            { width: 15 }, { width: 30 }, { width: 10 },
            { width: 10 }, { width: 12 }, { width: 12 },
        ];

        return await workbook.xlsx.writeBuffer() as unknown as Buffer;
    }

    async xuatDanhSachSinhVien(
        queryType: string,
        filter: DanhSachSinhVienReportDto,
        res: Response<any>,
    ): Promise<void> {
        const safeFilter = filter || {};

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Danh sách sinh viên');

        // Tiêu đề theo loại báo cáo
        const titles: { [key: string]: string } = {
            'lop-hanh-chinh': 'DANH SÁCH SINH VIÊN THEO LỚP HÀNH CHÍNH',
            'nganh-nien-khoa': 'DANH SÁCH SINH VIÊN THEO NGÀNH - NIÊN KHÓA',
            'lop-hoc-phan': 'DANH SÁCH SINH VIÊN THEO LỚP HỌC PHẦN',
            'tinh-trang': 'DANH SÁCH SINH VIÊN THEO TÌNH TRẠNG HỌC TẬP',
            'ket-qua': 'DANH SÁCH SINH VIÊN THEO KẾT QUẢ HỌC TẬP (GPA/XẾP LOẠI)',
            'rot-mon': 'DANH SÁCH SINH VIÊN RỚT ≥ 2 HỌC PHẦN',
            'canh-bao-gpa': 'DANH SÁCH SINH VIÊN CẢNH BÁO GPA < 2.0',
            'khen-thuong-ky-luat': 'DANH SÁCH SINH VIÊN KHEN THƯỞNG / KỶ LUẬT',
        };

        const title = titles[queryType] || 'DANH SÁCH SINH VIÊN';
        worksheet.mergeCells('A1:I1');
        worksheet.getCell('A1').value = title;
        worksheet.getCell('A1').font = { size: 16, bold: true };
        worksheet.getCell('A1').alignment = { horizontal: 'center' };

        // Header bảng
        const headerRow = worksheet.getRow(3);
        headerRow.values = [
            'STT',
            'MSSV',
            'Họ tên',
            'Ngày sinh',
            'Giới tính',
            'Lớp hành chính',
            'Ngành',
            'Niên khóa',
            'Tình trạng',
        ];
        headerRow.font = { bold: true };
        headerRow.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });

        // Query sinh viên
        const qb = this.sinhVienRepo.createQueryBuilder('sv')
            .leftJoinAndSelect('sv.lop', 'lop')
            .leftJoinAndSelect('lop.nganh', 'nganh')
            .leftJoinAndSelect('lop.nienKhoa', 'nienKhoa');

        // Áp dụng các filter từ body
        if (safeFilter.search) {
            qb.andWhere('(LOWER(sv.maSinhVien) LIKE LOWER(:search) OR LOWER(sv.hoTen) LIKE LOWER(:search))', {
                search: `%${safeFilter.search}%`,
            });
        }
        if (safeFilter.lopId) qb.andWhere('lop.id = :lopId', { lopId: safeFilter.lopId });
        if (safeFilter.nganhId) qb.andWhere('nganh.id = :nganhId', { nganhId: safeFilter.nganhId });
        if (safeFilter.nienKhoaId) qb.andWhere('nienKhoa.id = :nienKhoaId', { nienKhoaId: safeFilter.nienKhoaId });
        if (safeFilter.tinhTrang) qb.andWhere('sv.tinhTrang = :tinhTrang', { tinhTrang: safeFilter.tinhTrang });

        // Lọc theo lớp học phần (nếu có)
        if (safeFilter.lopHocPhanId) {
            qb.innerJoin('sv.sinhVienLopHocPhans', 'svlhp')
                .andWhere('svlhp.lop_hoc_phan_id = :lopHocPhanId', { lopHocPhanId: safeFilter.lopHocPhanId });
        }

        // Lọc theo GPA (nếu có)
        if (safeFilter.gpaMin || safeFilter.gpaMax || safeFilter.gpaDuoi2) {
            // Subquery tính GPA (giả sử có hàm tính GPA từ kết quả học tập)
            qb.addSelect('(' +
                'SELECT AVG((kq.diemQuaTrinh * 0.1 + kq.diemThanhPhan * 0.3 + kq.diemThi * 0.6)) ' +
                'FROM ket_qua_hoc_tap kq ' +
                'WHERE kq.sinh_vien_id = sv.id' +
                ') AS gpa');
            if (safeFilter.gpaMin) qb.andHaving('gpa >= :gpaMin', { gpaMin: safeFilter.gpaMin });
            if (safeFilter.gpaMax) qb.andHaving('gpa <= :gpaMax', { gpaMax: safeFilter.gpaMax });
            if (safeFilter.gpaDuoi2) qb.andHaving('gpa < 2.0');
        }

        // Lọc rớt ≥ 2 môn
        if (safeFilter.soMonRotMin) {
            qb.addSelect('(' +
                'SELECT COUNT(*) ' +
                'FROM ket_qua_hoc_tap kq ' +
                'WHERE kq.sinh_vien_id = sv.id ' +
                'AND (kq.diemQuaTrinh * 0.1 + kq.diemThanhPhan * 0.3 + kq.diemThi * 0.6) < 4.0' +
                ') AS soMonRot');
            qb.andHaving('soMonRot >= :soMonRotMin', { soMonRotMin: safeFilter.soMonRotMin });
        }

        // Lọc khen thưởng / kỷ luật
        if (safeFilter.coKhenThuong || safeFilter.coKyLuat) {
            qb.leftJoin('sv.khenThuongKyLuats', 'ktkl');
            if (safeFilter.coKhenThuong) qb.andWhere('ktkl.loai = :khenThuong', { khenThuong: 'KHEN_THUONG' });
            if (safeFilter.coKyLuat) qb.andWhere('ktkl.loai = :kyLuat', { kyLuat: 'KY_LUAT' });
        }

        const sinhViens = await qb.orderBy('sv.maSinhVien', 'ASC').getMany();

        // Ghi dữ liệu
        let rowIndex = 4;
        sinhViens.forEach((sv, idx) => {
            const row = worksheet.getRow(rowIndex++);
            row.values = [
                idx + 1,
                sv.maSinhVien,
                sv.hoTen,
                sv.ngaySinh ? new Date(sv.ngaySinh).toLocaleDateString('vi-VN') : '',
                sv.gioiTinh,
                sv.lop?.tenLop || '',
                sv.lop?.nganh?.tenNganh || '',
                sv.lop?.nienKhoa?.tenNienKhoa || '',
                sv.tinhTrang,
            ];
        });

        worksheet.columns = [
            { width: 6 },
            { width: 15 },
            { width: 30 },
            { width: 15 },
            { width: 15 },
            { width: 20 },
            { width: 30 },
            { width: 20 },
            { width: 20 },
        ];

        // Xuất file
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader('Content-Disposition', `attachment; filename=danh-sach-sinh-vien-${queryType}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    }
    async thongKeTongQuan(): Promise<ThongKeTongQuanResponseDto> {
        // 1. Sinh viên
        const theoTinhTrang = {
            dangHoc: await this.sinhVienRepo.count({
                where: { tinhTrang: TinhTrangHocTapEnum.DANG_HOC },
            }),
            baoLuu: await this.sinhVienRepo.count({
                where: { tinhTrang: TinhTrangHocTapEnum.BAO_LUU },
            }),
            thoiHoc: await this.sinhVienRepo.count({
                where: { tinhTrang: TinhTrangHocTapEnum.THOI_HOC },
            }),
            daTotNghiep: await this.sinhVienRepo.count({
                where: { tinhTrang: TinhTrangHocTapEnum.DA_TOT_NGHIEP },
            }),
        };

        const tongSinhVien = Object.values(theoTinhTrang).reduce((a, b) => a + b, 0);

        // 2. Các tổng cơ bản khác
        const tongGiangVien = await this.giangVienRepo.count();
        const tongNganh = await this.nganhRepo.count();
        const tongKhoa = await this.khoaRepo.count();
        const tongMonHoc = await this.monHocRepo.count();
        const tongLop = await this.lopRepo.count();
        const tongLopHocPhan = await this.lopHocPhanRepo.count();
        const tongChuongTrinhDaoTao = await this.chuongTrinhDaoTaoRepo.count();
        const tongNienKhoa = await this.nienKhoaRepo.count();

        return {
            sinhVien: {
                tongSinhVien,
                theoTinhTrang,
            },
            tongGiangVien,
            tongNienKhoa,
            tongNganh,
            tongKhoa,
            tongMonHoc,
            tongLop,
            tongLopHocPhan,
            tongChuongTrinhDaoTao,
        };
    }

    async xuatDeXuatHocLai(maNamHoc: string, hocKy: number): Promise<Buffer> {
        // 1. Validate năm học
        const namHoc = await this.lopHocPhanRepo.manager.findOne(NamHoc, {
            where: { maNamHoc },
        });
        if (!namHoc) {
            throw new NotFoundException(`Năm học với mã "${maNamHoc}" không tồn tại`);
        }

        // 2. Validate học kỳ
        const hocKyEntity = await this.lopHocPhanRepo.manager.findOne(HocKy, {
            where: { namHoc: { id: namHoc.id }, hocKy },
            relations: ['namHoc'],
        });
        if (!hocKyEntity) {
            throw new NotFoundException(`Học kỳ ${hocKy} của năm học "${maNamHoc}" không tồn tại`);
        }

        // 3. Lấy tất cả lớp học phần thuộc năm học và học kỳ đó
        const lopHocPhans = await this.lopHocPhanRepo.find({
            where: {
                hocKy: { id: hocKyEntity.id },
                khoaDiem: true, // ✅ chỉ lấy lớp đã khóa điểm
            },
            relations: [
                'monHoc',
                'nganh',
                'nienKhoa',
                'ketQuaHocTaps',
                'ketQuaHocTaps.sinhVien',
                'ketQuaHocTaps.sinhVien.lop',
                'ketQuaHocTaps.sinhVien.lop.nganh',
                'ketQuaHocTaps.sinhVien.lop.nienKhoa',
            ],
        });

        if (lopHocPhans.length === 0) {
            throw new BadRequestException(`Không có lớp học phần nào trong học kỳ ${hocKy} năm học "${maNamHoc}"`);
        }

        // 4. Lấy danh sách sinh viên trượt (TBCHP <= 4.0)
        const danhSachTruotTamThoi: Array<{
            sinhVien: SinhVien;
            lopHocPhanTruot: LopHocPhan;
            ketQua: KetQuaHocTap;
            diemTBCHP: number;
            diemSo: number;
            diemChu: string;
        }> = [];

        for (const lhp of lopHocPhans) {
            for (const kq of lhp.ketQuaHocTaps) {
                // Kiểm tra có đủ điểm không
                if (kq.diemQuaTrinh === null || kq.diemThanhPhan === null || kq.diemThi === null) {
                    continue;
                }

                const diemTBCHP = this.tinhDiemTBCHP(kq.diemQuaTrinh, kq.diemThanhPhan, kq.diemThi);

                // Sinh viên trượt nếu TBCHP <= 4.0 và chỉ xét sinh viên có tình trạng ĐANG_HỌC
                if (diemTBCHP <= 4.0 && kq.sinhVien.tinhTrang === TinhTrangHocTapEnum.DANG_HOC) {
                    const diemSo = this.diemHe10ToHe4(diemTBCHP);
                    const diemChu = this.diemTBCHPToDiemChu(diemTBCHP);

                    danhSachTruotTamThoi.push({
                        sinhVien: kq.sinhVien,
                        lopHocPhanTruot: lhp,
                        ketQua: kq,
                        diemTBCHP,
                        diemSo,
                        diemChu,
                    });
                }
            }
        }

        // ✅ 5. VALIDATION: Lọc ra những sinh viên thực sự cần học lại (dùng CẢ KetQuaHocTap + SinhVienLopHocPhan để không bỏ sót SV đã học lại và đạt)
        const danhSachTruot: typeof danhSachTruotTamThoi = [];

        for (const item of danhSachTruotTamThoi) {
            const sv = item.sinhVien;
            const monHocId = item.lopHocPhanTruot.monHoc.id;
            const lopHocPhanTruotId = item.lopHocPhanTruot.id;

            const ketQuaCacLopKhac = await this.ketQuaRepo.find({
                where: {
                    sinhVien: { id: sv.id },
                    lopHocPhan: {
                        monHoc: { id: monHocId },
                        id: Not(lopHocPhanTruotId),
                    },
                },
                relations: ['lopHocPhan', 'lopHocPhan.monHoc', 'lopHocPhan.hocKy', 'lopHocPhan.hocKy.namHoc'],
            });

            const cacLopKhacCungMonSvlhp = await this.svLhpRepo.find({
                where: {
                    sinhVien: { id: sv.id },
                    lopHocPhan: {
                        monHoc: { id: monHocId },
                        id: Not(lopHocPhanTruotId),
                    },
                },
                relations: ['lopHocPhan', 'lopHocPhan.monHoc', 'lopHocPhan.hocKy', 'lopHocPhan.hocKy.namHoc'],
            });

            const lhpIdDaThem = new Set<number>();
            const mergedOtherLhpWithKetQua: { lopHocPhan: LopHocPhan; ketQua: KetQuaHocTap | null }[] = [];

            for (const kq of ketQuaCacLopKhac) {
                const lhp = kq.lopHocPhan;
                if (lhp?.id != null && !lhpIdDaThem.has(lhp.id)) {
                    lhpIdDaThem.add(lhp.id);
                    mergedOtherLhpWithKetQua.push({ lopHocPhan: lhp, ketQua: kq });
                }
            }
            for (const svlhp of cacLopKhacCungMonSvlhp) {
                const lhp = svlhp.lopHocPhan;
                if (lhp?.id != null && !lhpIdDaThem.has(lhp.id)) {
                    lhpIdDaThem.add(lhp.id);
                    const kq = ketQuaCacLopKhac.find((x) => x.lopHocPhan?.id === lhp.id) ?? null;
                    mergedOtherLhpWithKetQua.push({ lopHocPhan: lhp, ketQua: kq });
                }
            }

            let daHocLaiThanhCongHoacDangHoc = false;
            const cacTBCHPDaKhoa: number[] = [];

            if (mergedOtherLhpWithKetQua.length > 0) {
                for (const { lopHocPhan: lopKhac, ketQua: kq } of mergedOtherLhpWithKetQua) {
                    if (!kq) {
                        daHocLaiThanhCongHoacDangHoc = true;
                        break;
                    }
                    if (!lopKhac.khoaDiem) {
                        daHocLaiThanhCongHoacDangHoc = true;
                        break;
                    }
                    if (kq.diemQuaTrinh != null && kq.diemThanhPhan != null && kq.diemThi != null) {
                        cacTBCHPDaKhoa.push(
                            this.tinhDiemTBCHP(kq.diemQuaTrinh, kq.diemThanhPhan, kq.diemThi),
                        );
                    } else {
                        daHocLaiThanhCongHoacDangHoc = true;
                        break;
                    }
                }

                if (!daHocLaiThanhCongHoacDangHoc && cacTBCHPDaKhoa.length > 0) {
                    const tbchpCaoNhat = Math.max(...cacTBCHPDaKhoa);
                    if (tbchpCaoNhat > 4.0) {
                        daHocLaiThanhCongHoacDangHoc = true;
                    }
                }
            }

            if (!daHocLaiThanhCongHoacDangHoc) {
                danhSachTruot.push(item);
            }
        }

        if (danhSachTruotTamThoi.length === 0 || danhSachTruot.length === 0) {
            throw new BadRequestException(
                danhSachTruotTamThoi.length === 0
                    ? `Không có sinh viên nào trượt trong học kỳ ${hocKy} năm học "${maNamHoc}"`
                    : `Tất cả sinh viên trượt trong học kỳ ${hocKy} năm học "${maNamHoc}" đã đăng ký học lại hoặc đã học lại thành công`
            );
        }

        // 6. Tìm lớp học phần đề xuất cho mỗi sinh viên trượt (giới hạn sĩ số tối đa 40/lớp)
        const MAX_SI_SO_LOP_HOC_PHAN = 40;
        const reservedSlotsByLopHocPhanId = new Map<number, number>();

        const ketQuaDeXuat: Array<{
            stt: number;
            maSinhVien: string;
            hoTen: string;
            gioiTinh: string;
            sdt: string;
            maLopHocPhanTruot: string;
            diemQuaTrinh: number;
            diemThanhPhan: number;
            diemThi: number;
            diemTBCHP: string;
            diemSo: string;
            diemChu: string;
            danhGia: string;
            maLopHocPhanDeXuat: string;
        }> = [];

        let stt = 1;

        const canAddToClass = (lhp: LopHocPhan): boolean => {
            const siSo = lhp.sinhVienLopHocPhans?.length ?? 0;
            const reserved = reservedSlotsByLopHocPhanId.get(lhp.id) ?? 0;
            return siSo + reserved + 1 <= MAX_SI_SO_LOP_HOC_PHAN;
        };

        for (const item of danhSachTruot) {
            const sv = item.sinhVien;
            const lhpTruot = item.lopHocPhanTruot;
            const monHocId = lhpTruot.monHoc.id;
            const nganhId = sv.lop?.nganh?.id;
            const nienKhoaSV = sv.lop?.nienKhoa;

            if (!nganhId || !nienKhoaSV) {
                // Không có thông tin ngành/niên khóa -> không đề xuất được
                ketQuaDeXuat.push({
                    stt: stt++,
                    maSinhVien: sv.maSinhVien,
                    hoTen: sv.hoTen,
                    gioiTinh: sv.gioiTinh || '',
                    sdt: sv.sdt || '',
                    maLopHocPhanTruot: lhpTruot.maLopHocPhan,
                    diemQuaTrinh: item.ketQua.diemQuaTrinh,
                    diemThanhPhan: item.ketQua.diemThanhPhan,
                    diemThi: item.ketQua.diemThi,
                    diemTBCHP: item.diemTBCHP.toFixed(2),
                    diemSo: item.diemSo.toFixed(1),
                    diemChu: item.diemChu,
                    danhGia: 'TRƯỢT MÔN',
                    maLopHocPhanDeXuat: 'Không tìm được lớp phù hợp',
                });
                continue;
            }

            const nienKhoasCaoHon = await this.nienKhoaRepo.find({
                where: {
                    namBatDau: MoreThanOrEqual(nienKhoaSV.namBatDau + 1)
                },
                order: { namBatDau: 'ASC' },
            });

            // Thu thập tất cả LHP đủ điều kiện (cùng ngành trước, khác ngành sau) để chọn lớp có ít SV được gán nhất → dàn trải đều
            const eligibleLopHocPhans: LopHocPhan[] = [];
            for (const nkCaoHon of nienKhoasCaoHon) {
                const lopCungNganh = await this.lopHocPhanRepo.find({
                    where: {
                        monHoc: { id: monHocId },
                        nganh: { id: nganhId },
                        nienKhoa: { id: nkCaoHon.id },
                        khoaDiem: false,
                        id: Not(lhpTruot.id),
                    },
                    relations: ['monHoc', 'nganh', 'nienKhoa', 'hocKy', 'hocKy.namHoc', 'sinhVienLopHocPhans'],
                    order: { ngayTao: 'DESC' },
                });
                for (const lhp of lopCungNganh) {
                    if (eligibleLopHocPhans.every((e) => e.id !== lhp.id)) eligibleLopHocPhans.push(lhp);
                }
            }
            for (const nkCaoHon of nienKhoasCaoHon) {
                const lopKhacNganh = await this.lopHocPhanRepo.find({
                    where: {
                        monHoc: { id: monHocId },
                        nganh: { id: Not(nganhId) },
                        nienKhoa: { id: nkCaoHon.id },
                        khoaDiem: false,
                        id: Not(lhpTruot.id),
                    },
                    relations: ['monHoc', 'nganh', 'nienKhoa', 'hocKy', 'hocKy.namHoc', 'sinhVienLopHocPhans'],
                    order: { ngayTao: 'DESC' },
                });
                for (const lhp of lopKhacNganh) {
                    if (eligibleLopHocPhans.every((e) => e.id !== lhp.id)) eligibleLopHocPhans.push(lhp);
                }
            }

            const withCapacity = eligibleLopHocPhans.filter((lhp) => canAddToClass(lhp));
            const lopDeXuat: LopHocPhan | null =
                withCapacity.length === 0
                    ? null
                    : withCapacity.reduce((best, lhp) => {
                          const r = reservedSlotsByLopHocPhanId.get(lhp.id) ?? 0;
                          const bestR = reservedSlotsByLopHocPhanId.get(best.id) ?? 0;
                          return r < bestR ? lhp : best;
                      });

            if (lopDeXuat) {
                reservedSlotsByLopHocPhanId.set(lopDeXuat.id, (reservedSlotsByLopHocPhanId.get(lopDeXuat.id) ?? 0) + 1);
            }

            ketQuaDeXuat.push({
                stt: stt++,
                maSinhVien: sv.maSinhVien,
                hoTen: sv.hoTen,
                gioiTinh: sv.gioiTinh || '',
                sdt: sv.sdt || '',
                maLopHocPhanTruot: lhpTruot.maLopHocPhan,
                diemQuaTrinh: item.ketQua.diemQuaTrinh,
                diemThanhPhan: item.ketQua.diemThanhPhan,
                diemThi: item.ketQua.diemThi,
                diemTBCHP: item.diemTBCHP.toFixed(2),
                diemSo: item.diemSo.toFixed(1),
                diemChu: item.diemChu,
                danhGia: 'TRƯỢT MÔN',
                maLopHocPhanDeXuat: lopDeXuat ? lopDeXuat.maLopHocPhan : 'Chưa có lớp mở',
            });
        }

        // 7. Tạo file Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Đề xuất học lại');

        // === HEADER TITLE ===
        worksheet.mergeCells('A1:N1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = `DANH SÁCH SINH VIÊN TRƯỢT VÀ ĐỀ XUẤT LỚP HỌC LẠI`;
        titleCell.font = { size: 18, bold: true, color: { argb: 'FF003366' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(1).height = 35;

        // === SUBTITLE ===
        worksheet.mergeCells('A2:N2');
        const subtitleCell = worksheet.getCell('A2');
        subtitleCell.value = `Học kỳ ${hocKy} - Năm học ${namHoc.tenNamHoc}`;
        subtitleCell.font = { size: 12, italic: true, color: { argb: 'FF666666' } };
        subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(2).height = 25;

        // === TABLE HEADER ===
        const headerRow = worksheet.getRow(4);
        headerRow.values = [
            'STT',
            'Mã sinh viên',
            'Họ và tên',
            'Giới tính',
            'Số điện thoại',
            'Mã LHP trượt',
            'Điểm QT (10%)',
            'Điểm TP (30%)',
            'Điểm thi (60%)',
            'TBCHP',
            'Điểm số',
            'Điểm chữ',
            'Đánh giá',
            'Mã LHP đề xuất học lại',
        ];
        headerRow.height = 30;
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

        headerRow.eachCell((cell, colNumber) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4472C4' },
            };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
            };
        });

        // === DATA ROWS ===
        ketQuaDeXuat.forEach((item, index) => {
            const row = worksheet.getRow(5 + index);
            row.values = [
                item.stt,
                item.maSinhVien,
                item.hoTen,
                item.gioiTinh,
                item.sdt,
                item.maLopHocPhanTruot,
                item.diemQuaTrinh,
                item.diemThanhPhan,
                item.diemThi,
                item.diemTBCHP,
                item.diemSo,
                item.diemChu,
                item.danhGia,
                item.maLopHocPhanDeXuat,
            ];

            row.height = 22;
            row.alignment = { horizontal: 'center', vertical: 'middle' };
            row.font = { size: 11 };

            // Màu nền xen kẽ
            const bgColor = index % 2 === 0 ? 'FFF2F2F2' : 'FFFFFFFF';
            row.eachCell((cell, colNumber) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: bgColor },
                };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                    left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                    bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                    right: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                };

                // Highlight cột đánh giá (TRƯỢT MÔN) màu đỏ
                if (colNumber === 13) {
                    cell.font = { bold: true, color: { argb: 'FFFF0000' } };
                }

                // Highlight cột đề xuất
                if (colNumber === 14) {
                    if (item.maLopHocPhanDeXuat === 'Chưa có lớp mở' || item.maLopHocPhanDeXuat === 'Không tìm được lớp phù hợp') {
                        cell.font = { italic: true, color: { argb: 'FF999999' } };
                    } else {
                        cell.font = { bold: true, color: { argb: 'FF008000' } };
                    }
                }

                // Căn trái cho họ tên
                if (colNumber === 3) {
                    cell.alignment = { horizontal: 'left', vertical: 'middle' };
                }
            });
        });

        // === COLUMN WIDTHS ===
        worksheet.columns = [
            { key: 'stt', width: 6 },
            { key: 'maSinhVien', width: 15 },
            { key: 'hoTen', width: 25 },
            { key: 'gioiTinh', width: 12 },
            { key: 'sdt', width: 15 },
            { key: 'maLopHocPhanTruot', width: 33 },
            { key: 'diemQuaTrinh', width: 17 },
            { key: 'diemThanhPhan', width: 17 },
            { key: 'diemThi', width: 17 },
            { key: 'diemTBCHP', width: 17 },
            { key: 'diemSo', width: 17 },
            { key: 'diemChu', width: 17 },
            { key: 'danhGia', width: 17 },
            { key: 'maLopHocPhanDeXuat', width: 33 },
        ];

        // === FOOTER SUMMARY ===
        const footerRowIndex = 5 + ketQuaDeXuat.length + 1;
        worksheet.mergeCells(`A${footerRowIndex}:N${footerRowIndex}`);
        const footerCell = worksheet.getCell(`A${footerRowIndex}`);
        footerCell.value = `Tổng số sinh viên cần học lại: ${ketQuaDeXuat.length} | Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`;
        footerCell.font = { italic: true, size: 11 };
        footerCell.alignment = { horizontal: 'right' };

        // === FREEZE HEADER ===
        worksheet.views = [{ state: 'frozen', ySplit: 4 }];

        return await workbook.xlsx.writeBuffer() as unknown as Buffer;
    }

    async getDeXuatHocLaiJson(maNamHoc: string, hocKy: number): Promise<DeXuatHocLaiResponseDto> {
        // 1. Validate năm học
        const namHoc = await this.lopHocPhanRepo.manager.findOne(NamHoc, {
            where: { maNamHoc },
        });
        if (!namHoc) {
            throw new NotFoundException(`Năm học với mã "${maNamHoc}" không tồn tại`);
        }

        // 2. Validate học kỳ
        const hocKyEntity = await this.lopHocPhanRepo.manager.findOne(HocKy, {
            where: { namHoc: { id: namHoc.id }, hocKy },
            relations: ['namHoc'],
        });
        if (!hocKyEntity) {
            throw new NotFoundException(`Học kỳ ${hocKy} của năm học "${maNamHoc}" không tồn tại`);
        }

        // 3. Lấy tất cả lớp học phần thuộc năm học và học kỳ đó (đã khóa điểm - để lấy SV trượt)
        const lopHocPhans = await this.lopHocPhanRepo.find({
            where: {
                hocKy: { id: hocKyEntity.id },
                khoaDiem: true, // chỉ lấy lớp đã khóa điểm
            },
            relations: [
                'monHoc',
                'nganh',
                'nienKhoa',
                'ketQuaHocTaps',
                'ketQuaHocTaps.sinhVien',
                'ketQuaHocTaps.sinhVien.lop',
                'ketQuaHocTaps.sinhVien.lop.nganh',
                'ketQuaHocTaps.sinhVien.lop.nienKhoa',
            ],
        });

        // 3b. Lấy TẤT CẢ lớp học phần trong học kỳ được query (bao gồm cả chưa khóa điểm) để tìm SV đang học lại
        const tatCaLopHocPhanTrongHocKy = await this.lopHocPhanRepo.find({
            where: {
                hocKy: { id: hocKyEntity.id },
            },
            relations: [
                'monHoc',
                'nganh',
                'nienKhoa',
                'hocKy',
                'hocKy.namHoc',
                'sinhVienLopHocPhans',
                'sinhVienLopHocPhans.sinhVien',
                'sinhVienLopHocPhans.sinhVien.lop',
                'sinhVienLopHocPhans.sinhVien.lop.nganh',
                'sinhVienLopHocPhans.sinhVien.lop.nienKhoa',
                'ketQuaHocTaps',
                'ketQuaHocTaps.sinhVien',
            ],
        });

        if (lopHocPhans.length === 0 && tatCaLopHocPhanTrongHocKy.length === 0) {
            throw new BadRequestException(`Không có lớp học phần nào trong học kỳ ${hocKy} năm học "${maNamHoc}"`);
        }

        // 4. Lấy danh sách sinh viên trượt (TBCHP <= 4.0)
        // Không check DANG_HOC ở đây để lấy đầy đủ thông tin sinh viên học lại
        // Check DANG_HOC sẽ được thực hiện khi đề xuất lớp học lại
        const danhSachTruotTamThoi: {
            sinhVien: SinhVien;
            lopHocPhanTruot: LopHocPhan;
            ketQua: KetQuaHocTap;
            diemTBCHP: number;
            diemSo: number;
            diemChu: string;
        }[] = [];

        for (const lhp of lopHocPhans) {
            for (const kq of lhp.ketQuaHocTaps) {
                // Kiểm tra có đủ điểm không
                if (kq.diemQuaTrinh === null || kq.diemThanhPhan === null || kq.diemThi === null) {
                    continue;
                }

                const diemTBCHP = this.tinhDiemTBCHP(kq.diemQuaTrinh, kq.diemThanhPhan, kq.diemThi);

                // Sinh viên trượt nếu TBCHP <= 4.0 (bỏ check DANG_HOC để lấy đủ thông tin học lại)
                if (diemTBCHP <= 4.0) {
                    const diemSo = this.diemHe10ToHe4(diemTBCHP);
                    const diemChu = this.diemTBCHPToDiemChu(diemTBCHP);

                    danhSachTruotTamThoi.push({
                        sinhVien: kq.sinhVien,
                        lopHocPhanTruot: lhp,
                        ketQua: kq,
                        diemTBCHP,
                        diemSo,
                        diemChu,
                    });
                }
            }
        }

        // 5. Loại bỏ sinh viên đã học lại thành công hoặc đang học lại; thu thập chi tiết sinh viên đã/đang học lại
        // Dùng CẢ KetQuaHocTap VÀ SinhVienLopHocPhan để lấy đủ lớp học phần khác cùng môn (kể cả SV đã học lại và đạt nhưng không còn bản ghi đăng ký)
        const danhSachTruot: typeof danhSachTruotTamThoi = [];
        const danhSachDaHocLaiHoacDangHoc: SinhVienDaHocLaiItemDto[] = [];

        // === OPTIMIZATION: Batch load tất cả KetQuaHocTap và SinhVienLopHocPhan cho tất cả SV trượt ===
        const allSvIds = [...new Set(danhSachTruotTamThoi.map(item => item.sinhVien.id))];
        const allMonHocIds = [...new Set(danhSachTruotTamThoi.map(item => item.lopHocPhanTruot.monHoc.id))];

        // Batch load tất cả KetQuaHocTap của các SV với các môn học liên quan
        const allKetQuaHocTap = allSvIds.length > 0 ? await this.ketQuaRepo.find({
            where: {
                sinhVien: { id: In(allSvIds) },
                lopHocPhan: { monHoc: { id: In(allMonHocIds) } },
            },
            relations: ['sinhVien', 'lopHocPhan', 'lopHocPhan.monHoc', 'lopHocPhan.hocKy', 'lopHocPhan.hocKy.namHoc'],
        }) : [];

        // Batch load tất cả SinhVienLopHocPhan của các SV với các môn học liên quan
        const allSvLhp = allSvIds.length > 0 ? await this.svLhpRepo.find({
            where: {
                sinhVien: { id: In(allSvIds) },
                lopHocPhan: { monHoc: { id: In(allMonHocIds) } },
            },
            relations: ['sinhVien', 'lopHocPhan', 'lopHocPhan.monHoc', 'lopHocPhan.hocKy', 'lopHocPhan.hocKy.namHoc'],
        }) : [];

        // Tạo Map để lookup nhanh: key = `${svId}_${monHocId}` -> KetQuaHocTap[]
        const ketQuaMapBySvMonHoc = new Map<string, KetQuaHocTap[]>();
        for (const kq of allKetQuaHocTap) {
            const key = `${kq.sinhVien.id}_${kq.lopHocPhan.monHoc.id}`;
            if (!ketQuaMapBySvMonHoc.has(key)) {
                ketQuaMapBySvMonHoc.set(key, []);
            }
            ketQuaMapBySvMonHoc.get(key)!.push(kq);
        }

        // Tạo Map để lookup nhanh: key = `${svId}_${monHocId}` -> SinhVienLopHocPhan[]
        const svLhpMapBySvMonHoc = new Map<string, SinhVienLopHocPhan[]>();
        for (const svlhp of allSvLhp) {
            const key = `${svlhp.sinhVien.id}_${svlhp.lopHocPhan.monHoc.id}`;
            if (!svLhpMapBySvMonHoc.has(key)) {
                svLhpMapBySvMonHoc.set(key, []);
            }
            svLhpMapBySvMonHoc.get(key)!.push(svlhp);
        }

        for (const item of danhSachTruotTamThoi) {
            const sv = item.sinhVien;
            const monHocId = item.lopHocPhanTruot.monHoc.id;
            const lopHocPhanTruotId = item.lopHocPhanTruot.id;

            // 5a. Lấy từ Map thay vì query - KetQuaHocTap của SV ở lớp học phần khác cùng môn
            const mapKey = `${sv.id}_${monHocId}`;
            const ketQuaCacLopKhac = (ketQuaMapBySvMonHoc.get(mapKey) || [])
                .filter(kq => kq.lopHocPhan.id !== lopHocPhanTruotId);

            // 5b. Lấy từ Map thay vì query - SinhVienLopHocPhan khác cùng môn
            const cacLopKhacCungMonSvlhp = (svLhpMapBySvMonHoc.get(mapKey) || [])
                .filter(svlhp => svlhp.lopHocPhan.id !== lopHocPhanTruotId);

            // 5c. Gộp danh sách LHP (ưu tiên từ KetQuaHocTap để có đủ kết quả đã đạt), mỗi phần tử có lopHocPhan + ketQua (nếu có)
            const lhpIdDaThem = new Set<number>();
            const mergedOtherLhpWithKetQua: { lopHocPhan: LopHocPhan; ketQua: KetQuaHocTap | null }[] = [];

            for (const kq of ketQuaCacLopKhac) {
                const lhp = kq.lopHocPhan;
                if (lhp?.id != null && !lhpIdDaThem.has(lhp.id)) {
                    lhpIdDaThem.add(lhp.id);
                    mergedOtherLhpWithKetQua.push({ lopHocPhan: lhp, ketQua: kq });
                }
            }
            for (const svlhp of cacLopKhacCungMonSvlhp) {
                const lhp = svlhp.lopHocPhan;
                if (lhp?.id != null && !lhpIdDaThem.has(lhp.id)) {
                    lhpIdDaThem.add(lhp.id);
                    const kq = ketQuaCacLopKhac.find((x) => x.lopHocPhan?.id === lhp.id) ?? null;
                    mergedOtherLhpWithKetQua.push({ lopHocPhan: lhp, ketQua: kq });
                }
            }

            let daHocLaiThanhCongHoacDangHoc = false;
            const cacTBCHPDaKhoa: number[] = [];

            if (mergedOtherLhpWithKetQua.length > 0) {
                for (const { lopHocPhan: lopKhac, ketQua: kq } of mergedOtherLhpWithKetQua) {
                    if (!kq) {
                        daHocLaiThanhCongHoacDangHoc = true;
                        break;
                    }
                    if (!lopKhac.khoaDiem) {
                        daHocLaiThanhCongHoacDangHoc = true;
                        break;
                    }
                    if (kq.diemQuaTrinh != null && kq.diemThanhPhan != null && kq.diemThi != null) {
                        cacTBCHPDaKhoa.push(
                            this.tinhDiemTBCHP(kq.diemQuaTrinh, kq.diemThanhPhan, kq.diemThi),
                        );
                    } else {
                        daHocLaiThanhCongHoacDangHoc = true;
                        break;
                    }
                }

                if (!daHocLaiThanhCongHoacDangHoc && cacTBCHPDaKhoa.length > 0) {
                    const tbchpCaoNhat = Math.max(...cacTBCHPDaKhoa);
                    if (tbchpCaoNhat > 4.0) {
                        daHocLaiThanhCongHoacDangHoc = true;
                    }
                }

                // Luôn luôn build thông tin các lần học lại nếu sinh viên có ít nhất 1 lần học lại
                const cacLanHocLai: LanHocLaiDto[] = [];
                const sortedMerged = [...mergedOtherLhpWithKetQua].sort((a, b) => {
                    const nkA = a.lopHocPhan.hocKy?.namHoc?.namBatDau ?? 0;
                    const nkB = b.lopHocPhan.hocKy?.namHoc?.namBatDau ?? 0;
                    if (nkA !== nkB) return nkA - nkB;
                    return (a.lopHocPhan.hocKy?.hocKy ?? 0) - (b.lopHocPhan.hocKy?.hocKy ?? 0);
                });
                for (const { lopHocPhan: lopKhac, ketQua: kq } of sortedMerged) {
                    let ketQuaDto: KetQuaHocLaiDto | null = null;
                    if (kq) {
                        const dqt = kq.diemQuaTrinh;
                        const dtp = kq.diemThanhPhan;
                        const dt = kq.diemThi;
                        const tbchp =
                            dqt != null && dtp != null && dt != null
                                ? this.tinhDiemTBCHP(dqt, dtp, dt)
                                : null;
                        const diemChu = tbchp != null ? this.diemTBCHPToDiemChu(tbchp) : null;
                        const diemSo = tbchp != null ? this.diemHe10ToHe4(tbchp) : null;
                        ketQuaDto = {
                            diemQuaTrinh: dqt ?? null,
                            diemThanhPhan: dtp ?? null,
                            diemThi: dt ?? null,
                            diemTBCHP: tbchp,
                            diemChu: diemChu,
                            diemSo: diemSo,
                            khoaDiem: lopKhac.khoaDiem,
                        };
                    } else {
                        ketQuaDto = {
                            diemQuaTrinh: null,
                            diemThanhPhan: null,
                            diemThi: null,
                            diemTBCHP: null,
                            diemChu: null,
                            diemSo: null,
                            khoaDiem: lopKhac.khoaDiem,
                        };
                    }
                    const hocKyEntity = lopKhac.hocKy;
                    const namHoc = hocKyEntity?.namHoc;
                    const ngayBatDau = hocKyEntity?.ngayBatDau != null
                        ? (typeof hocKyEntity.ngayBatDau === 'string' ? hocKyEntity.ngayBatDau : new Date(hocKyEntity.ngayBatDau).toISOString().split('T')[0])
                        : null;
                    const ngayKetThuc = hocKyEntity?.ngayKetThuc != null
                        ? (typeof hocKyEntity.ngayKetThuc === 'string' ? hocKyEntity.ngayKetThuc : new Date(hocKyEntity.ngayKetThuc).toISOString().split('T')[0])
                        : null;
                    cacLanHocLai.push({
                        lopHocPhanId: lopKhac.id,
                        maLopHocPhan: lopKhac.maLopHocPhan,
                        hocKy: hocKyEntity?.hocKy ?? 0,
                        maNamHoc: namHoc?.maNamHoc ?? '',
                        tenNamHoc: namHoc?.tenNamHoc ?? '',
                        ngayBatDau: ngayBatDau ?? undefined,
                        ngayKetThuc: ngayKetThuc ?? undefined,
                        ketQuaHocTap: ketQuaDto,
                    });
                }
                // Thêm vào danhSachDaHocLaiHoacDangHoc bất kể kết quả học lại ra sao
                danhSachDaHocLaiHoacDangHoc.push({
                    sinhVienId: sv.id,
                    maSinhVien: sv.maSinhVien,
                    hoTen: sv.hoTen,
                    gioiTinh: this.mapGioiTinh(sv.gioiTinh),
                    maMonHocTruot: item.lopHocPhanTruot.monHoc.maMonHoc,
                    tenMonHocTruot: item.lopHocPhanTruot.monHoc.tenMonHoc,
                    maLopHocPhanTruot: item.lopHocPhanTruot.maLopHocPhan,
                    diemTBCHPTruot: item.diemTBCHP.toFixed(2),
                    cacLanHocLai,
                });
            }

            // Nếu sinh viên chưa học lại thành công VÀ đang có tình trạng DANG_HOC, thêm vào danh sách cần đề xuất học lại
            if (!daHocLaiThanhCongHoacDangHoc && sv.tinhTrang === TinhTrangHocTapEnum.DANG_HOC) {
                danhSachTruot.push(item);
            }
        }

        // 5d. Tìm sinh viên ĐANG HỌC LẠI trong học kỳ được query (họ trượt ở học kỳ trước)
        // Những sinh viên này đăng ký lớp học phần trong học kỳ này cho một môn họ đã trượt trước đó
        // Không check tình trạng DANG_HOC ở đây vì mục đích là lấy thông tin sinh viên học lại
        const svIdDaXuLy = new Set<number>(danhSachTruotTamThoi.map(item => item.sinhVien.id));

        // === OPTIMIZATION: Thu thập tất cả SV mới từ tatCaLopHocPhanTrongHocKy và batch load KetQuaHocTap ===
        const allNewSvIds: number[] = [];
        const allNewMonHocIds: number[] = [];
        for (const lhpTrongKy of tatCaLopHocPhanTrongHocKy) {
            for (const svlhp of lhpTrongKy.sinhVienLopHocPhans || []) {
                if (svlhp.sinhVien && !svIdDaXuLy.has(svlhp.sinhVien.id)) {
                    allNewSvIds.push(svlhp.sinhVien.id);
                    allNewMonHocIds.push(lhpTrongKy.monHoc.id);
                }
            }
            for (const kq of lhpTrongKy.ketQuaHocTaps || []) {
                if (kq.sinhVien && !svIdDaXuLy.has(kq.sinhVien.id)) {
                    allNewSvIds.push(kq.sinhVien.id);
                    allNewMonHocIds.push(lhpTrongKy.monHoc.id);
                }
            }
        }
        const uniqueNewSvIds = [...new Set(allNewSvIds)];
        const uniqueNewMonHocIds = [...new Set(allNewMonHocIds)];

        // Batch load tất cả KetQuaHocTap cho các SV mới với lớp đã khóa điểm
        const allNewKetQua = uniqueNewSvIds.length > 0 ? await this.ketQuaRepo.find({
            where: {
                sinhVien: { id: In(uniqueNewSvIds) },
                lopHocPhan: {
                    monHoc: { id: In(uniqueNewMonHocIds) },
                    khoaDiem: true,
                },
            },
            relations: ['sinhVien', 'lopHocPhan', 'lopHocPhan.monHoc', 'lopHocPhan.hocKy', 'lopHocPhan.hocKy.namHoc'],
        }) : [];

        // Tạo Map: key = `${svId}_${monHocId}` -> KetQuaHocTap[]
        const newKetQuaMapBySvMonHoc = new Map<string, KetQuaHocTap[]>();
        for (const kq of allNewKetQua) {
            const key = `${kq.sinhVien.id}_${kq.lopHocPhan.monHoc.id}`;
            if (!newKetQuaMapBySvMonHoc.has(key)) {
                newKetQuaMapBySvMonHoc.set(key, []);
            }
            newKetQuaMapBySvMonHoc.get(key)!.push(kq);
        }

        for (const lhpTrongKy of tatCaLopHocPhanTrongHocKy) {
            // Lấy danh sách sinh viên đăng ký lớp học phần này (hoặc có kết quả)
            const danhSachSV: { sv: SinhVien; ketQua: KetQuaHocTap | null }[] = [];

            // Từ sinhVienLopHocPhans - bỏ check tình trạng để lấy đầy đủ thông tin sinh viên học lại
            for (const svlhp of lhpTrongKy.sinhVienLopHocPhans || []) {
                const sv = svlhp.sinhVien;
                if (sv && !svIdDaXuLy.has(sv.id)) {
                    const kq = lhpTrongKy.ketQuaHocTaps?.find(k => k.sinhVien?.id === sv.id) ?? null;
                    danhSachSV.push({ sv, ketQua: kq });
                }
            }
            // Từ ketQuaHocTaps (có thể có SV không còn trong sinhVienLopHocPhans)
            for (const kq of lhpTrongKy.ketQuaHocTaps || []) {
                const sv = kq.sinhVien;
                if (sv && !svIdDaXuLy.has(sv.id)) {
                    if (!danhSachSV.some(item => item.sv.id === sv.id)) {
                        danhSachSV.push({ sv, ketQua: kq });
                    }
                }
            }

            for (const { sv, ketQua } of danhSachSV) {
                const monHocId = lhpTrongKy.monHoc.id;

                // Tìm xem SV này có trượt môn này ở học kỳ trước không - lấy từ Map thay vì query
                const mapKey5d = `${sv.id}_${monHocId}`;
                const ketQuaTruotTruocDo = (newKetQuaMapBySvMonHoc.get(mapKey5d) || [])
                    .filter(kq => kq.lopHocPhan.id !== lhpTrongKy.id);

                // Lọc ra các lần trượt (TBCHP <= 4.0)
                const cacLanTruot = ketQuaTruotTruocDo.filter(kq => {
                    if (kq.diemQuaTrinh == null || kq.diemThanhPhan == null || kq.diemThi == null) return false;
                    const tbchp = this.tinhDiemTBCHP(kq.diemQuaTrinh, kq.diemThanhPhan, kq.diemThi);
                    return tbchp <= 4.0;
                });

                if (cacLanTruot.length > 0) {
                    // Sinh viên này đã trượt môn này trước đó và đang học lại trong học kỳ này
                    svIdDaXuLy.add(sv.id);

                    // Lấy thông tin lần trượt đầu tiên (hoặc tất cả các lần trượt)
                    const lanTruotDauTien = cacLanTruot[0];
                    const tbchpTruot = this.tinhDiemTBCHP(
                        lanTruotDauTien.diemQuaTrinh!,
                        lanTruotDauTien.diemThanhPhan!,
                        lanTruotDauTien.diemThi!,
                    );


                    // Build danh sách các lần học lại (bao gồm lần hiện tại)
                    const cacLanHocLai: LanHocLaiDto[] = [];

                    // Thêm lần học lại hiện tại (trong học kỳ được query)
                    let ketQuaDtoHienTai: KetQuaHocLaiDto;
                    if (ketQua && ketQua.diemQuaTrinh != null && ketQua.diemThanhPhan != null && ketQua.diemThi != null) {
                        const tbchpHienTai = this.tinhDiemTBCHP(ketQua.diemQuaTrinh, ketQua.diemThanhPhan, ketQua.diemThi);
                        ketQuaDtoHienTai = {
                            diemQuaTrinh: ketQua.diemQuaTrinh,
                            diemThanhPhan: ketQua.diemThanhPhan,
                            diemThi: ketQua.diemThi,
                            diemTBCHP: tbchpHienTai,
                            diemChu: this.diemTBCHPToDiemChu(tbchpHienTai),
                            diemSo: this.diemHe10ToHe4(tbchpHienTai),
                            khoaDiem: lhpTrongKy.khoaDiem,
                        };
                    } else {
                        ketQuaDtoHienTai = {
                            diemQuaTrinh: ketQua?.diemQuaTrinh ?? null,
                            diemThanhPhan: ketQua?.diemThanhPhan ?? null,
                            diemThi: ketQua?.diemThi ?? null,
                            diemTBCHP: null,
                            diemChu: null,
                            diemSo: null,
                            khoaDiem: lhpTrongKy.khoaDiem,
                        };
                    }

                    const ngayBatDauHienTai = lhpTrongKy.hocKy?.ngayBatDau != null
                        ? (typeof lhpTrongKy.hocKy.ngayBatDau === 'string' ? lhpTrongKy.hocKy.ngayBatDau : new Date(lhpTrongKy.hocKy.ngayBatDau).toISOString().split('T')[0])
                        : null;
                    const ngayKetThucHienTai = lhpTrongKy.hocKy?.ngayKetThuc != null
                        ? (typeof lhpTrongKy.hocKy.ngayKetThuc === 'string' ? lhpTrongKy.hocKy.ngayKetThuc : new Date(lhpTrongKy.hocKy.ngayKetThuc).toISOString().split('T')[0])
                        : null;

                    cacLanHocLai.push({
                        lopHocPhanId: lhpTrongKy.id,
                        maLopHocPhan: lhpTrongKy.maLopHocPhan,
                        hocKy: lhpTrongKy.hocKy?.hocKy ?? hocKy,
                        maNamHoc: lhpTrongKy.hocKy?.namHoc?.maNamHoc ?? maNamHoc,
                        tenNamHoc: lhpTrongKy.hocKy?.namHoc?.tenNamHoc ?? namHoc.tenNamHoc,
                        ngayBatDau: ngayBatDauHienTai ?? undefined,
                        ngayKetThuc: ngayKetThucHienTai ?? undefined,
                        ketQuaHocTap: ketQuaDtoHienTai,
                    });

                    danhSachDaHocLaiHoacDangHoc.push({
                        sinhVienId: sv.id,
                        maSinhVien: sv.maSinhVien,
                        hoTen: sv.hoTen,
                        gioiTinh: this.mapGioiTinh(sv.gioiTinh),
                        maMonHocTruot: lanTruotDauTien.lopHocPhan.monHoc.maMonHoc,
                        tenMonHocTruot: lanTruotDauTien.lopHocPhan.monHoc.tenMonHoc,
                        maLopHocPhanTruot: lanTruotDauTien.lopHocPhan.maLopHocPhan,
                        diemTBCHPTruot: tbchpTruot.toFixed(2),
                        cacLanHocLai,
                    });
                }
            }
        }

        // Khi không còn SV cần đề xuất học lại (tất cả đã học lại/đạt): trả về items rỗng
        if (danhSachTruot.length === 0) {
            return {
                maNamHoc,
                hocKy,
                tenNamHoc: namHoc.tenNamHoc,
                tongSinhVien: 0,
                items: [],
            };
        }

        // 6. Tìm các lớp học phần có thể đăng ký + best choice (giới hạn sĩ số tối đa 40)
        const MAX_SI_SO_LOP_HOC_PHAN = 40;
        /** Map: lopHocPhanId -> số sinh viên (từ danh sách đề xuất) đã được gán vào lớp đó để tránh vượt sĩ số */
        const reservedSlotsByLopHocPhanId = new Map<number, number>();

        const items: DeXuatHocLaiItemResponseDto[] = [];

        // 6a. Pre-load tất cả niên khóa (dùng để filter trong memory thay vì query nhiều lần)
        const allNienKhoas = await this.nienKhoaRepo.find({
            order: { namBatDau: 'ASC' },
        });

        // 6b. Lấy tất cả monHocIds cần tìm lớp học phần
        const monHocIdsCanTim = new Set<number>();
        const lopHocPhanTruotIds = new Set<number>();
        for (const item of danhSachTruot) {
            monHocIdsCanTim.add(item.lopHocPhanTruot.monHoc.id);
            lopHocPhanTruotIds.add(item.lopHocPhanTruot.id);
        }

        // 6c. Pre-load tất cả lớp học phần có thể đăng ký (khoaDiem = false) cho các môn học cần tìm
        const allLopHocPhanCoTheDangKy = await this.lopHocPhanRepo.find({
            where: {
                monHoc: { id: In([...monHocIdsCanTim]) },
                khoaDiem: false,
            },
            relations: ['monHoc', 'nganh', 'nienKhoa', 'hocKy', 'hocKy.namHoc', 'sinhVienLopHocPhans'],
            order: { ngayTao: 'DESC' },
        });

        // 6d. Tạo Map: monHocId -> lớp học phần[] (đã sort theo ngayTao DESC)
        const lopHocPhanByMonHocId = new Map<number, LopHocPhan[]>();
        for (const lhp of allLopHocPhanCoTheDangKy) {
            const monHocId = lhp.monHoc.id;
            if (!lopHocPhanByMonHocId.has(monHocId)) {
                lopHocPhanByMonHocId.set(monHocId, []);
            }
            lopHocPhanByMonHocId.get(monHocId)!.push(lhp);
        }

        for (const item of danhSachTruot) {
            const sv = item.sinhVien;
            const lhpTruot = item.lopHocPhanTruot;
            const monHocId = lhpTruot.monHoc.id;
            const nganhId = sv.lop?.nganh?.id;
            const nienKhoaSV = sv.lop?.nienKhoa;

            const lopHocPhanOptions: DeXuatHocLaiLopHocPhanOptionDto[] = [];
            const canAddToClass = (lhp: LopHocPhan): boolean => {
                const siSo = lhp.sinhVienLopHocPhans?.length ?? 0;
                const reserved = reservedSlotsByLopHocPhanId.get(lhp.id) ?? 0;
                return siSo + reserved + 1 <= MAX_SI_SO_LOP_HOC_PHAN;
            };

            const addOptionOnly = (lhp: LopHocPhan) => {
                if (lopHocPhanOptions.some((o) => o.lopHocPhanId === lhp.id)) return;
                lopHocPhanOptions.push({
                    lopHocPhanId: lhp.id,
                    maLopHocPhan: lhp.maLopHocPhan,
                    monHocId: lhp.monHoc.id,
                    maMonHoc: lhp.monHoc.maMonHoc,
                    tenMonHoc: lhp.monHoc.tenMonHoc,
                    soTinChi: lhp.monHoc.soTinChi,
                    nganhId: lhp.nganh.id,
                    tenNganh: lhp.nganh.tenNganh,
                    nienKhoaId: lhp.nienKhoa.id,
                    tenNienKhoa: lhp.nienKhoa.tenNienKhoa,
                    hocKyId: lhp.hocKy.id,
                    hocKy: lhp.hocKy.hocKy,
                    maNamHoc: lhp.hocKy.namHoc.maNamHoc,
                    tenNamHoc: lhp.hocKy.namHoc.tenNamHoc,
                    siSo: lhp.sinhVienLopHocPhans?.length ?? 0,
                    laBestChoice: false,
                });
            };

            if (nganhId && nienKhoaSV) {
                // Lọc các niên khóa cao hơn từ allNienKhoas (thay vì query)
                const nienKhoasCaoHon = allNienKhoas.filter(nk => nk.namBatDau >= nienKhoaSV.namBatDau + 1);

                // Lấy danh sách lớp học phần cho môn học này từ Map
                const allLhpForMonHoc = lopHocPhanByMonHocId.get(monHocId) || [];

                // Lọc lớp học phần cùng ngành theo niên khóa cao hơn (thay vì query)
                for (const nkCaoHon of nienKhoasCaoHon) {
                    const lopCungNganh = allLhpForMonHoc.filter(lhp =>
                        lhp.nganh.id === nganhId &&
                        lhp.nienKhoa.id === nkCaoHon.id &&
                        lhp.id !== lhpTruot.id
                    );
                    for (const lhp of lopCungNganh) addOptionOnly(lhp);
                }

                // Lọc lớp học phần khác ngành theo niên khóa cao hơn (thay vì query)
                for (const nkCaoHon of nienKhoasCaoHon) {
                    const lopKhacNganh = allLhpForMonHoc.filter(lhp =>
                        lhp.nganh.id !== nganhId &&
                        lhp.nienKhoa.id === nkCaoHon.id &&
                        lhp.id !== lhpTruot.id
                    );
                    for (const lhp of lopKhacNganh) addOptionOnly(lhp);
                }
            }

            // Best choice = lớp đủ chỗ và đang có ít SV được gán nhất → dàn trải đều (lẻ rải từng SV cho các lớp)
            const eligibleOptions = lopHocPhanOptions.filter((opt) => {
                const reserved = reservedSlotsByLopHocPhanId.get(opt.lopHocPhanId) ?? 0;
                return opt.siSo + reserved + 1 <= MAX_SI_SO_LOP_HOC_PHAN;
            });
            const bestOption =
                eligibleOptions.length === 0
                    ? null
                    : eligibleOptions.reduce((best, opt) => {
                          const r = reservedSlotsByLopHocPhanId.get(opt.lopHocPhanId) ?? 0;
                          const bestR = reservedSlotsByLopHocPhanId.get(best.lopHocPhanId) ?? 0;
                          return r < bestR ? opt : best;
                      });
            const bestChoiceLopHocPhanId = bestOption?.lopHocPhanId ?? null;
            if (bestChoiceLopHocPhanId !== null) {
                reservedSlotsByLopHocPhanId.set(
                    bestChoiceLopHocPhanId,
                    (reservedSlotsByLopHocPhanId.get(bestChoiceLopHocPhanId) ?? 0) + 1,
                );
            }

            const optionsWithBestFlag = lopHocPhanOptions.map((option) => ({
                ...option,
                laBestChoice: option.lopHocPhanId === bestChoiceLopHocPhanId,
            }));

            const bestChoice =
                optionsWithBestFlag.find((option) => option.laBestChoice) ?? null;

            items.push({
                sinhVienId: sv.id,
                maSinhVien: sv.maSinhVien,
                hoTen: sv.hoTen,
                gioiTinh: this.mapGioiTinh(sv.gioiTinh),
                sdt: sv.sdt || '',
                maLopHocPhanTruot: lhpTruot.maLopHocPhan,
                diemQuaTrinh: item.ketQua.diemQuaTrinh,
                diemThanhPhan: item.ketQua.diemThanhPhan,
                diemThi: item.ketQua.diemThi,
                diemTBCHP: item.diemTBCHP.toFixed(2),
                diemSo: item.diemSo.toFixed(1),
                diemChu: item.diemChu,
                danhGia: 'TRƯỢT MÔN',
                bestChoiceLopHocPhan: bestChoice,
                cacLopHocPhanCoTheDangKy: optionsWithBestFlag,
            });
        }

        return {
            maNamHoc,
            hocKy,
            tenNamHoc: namHoc.tenNamHoc,
            tongSinhVien: items.length,
            items,
        };
    }

    /**
     * Lấy thông tin sinh viên trượt môn và lịch sử học lại trong một học kỳ/năm học
     * Chức năng này tập trung vào thông tin thống kê, không đề xuất lớp học phần
     */
    async getThongTinSinhVienTruotMon(maNamHoc: string, hocKy: number): Promise<ThongTinSinhVienTruotMonResponseDto> {
        // 1. Validate năm học
        const namHoc = await this.lopHocPhanRepo.manager.findOne(NamHoc, {
            where: { maNamHoc },
        });
        if (!namHoc) {
            throw new NotFoundException(`Năm học với mã "${maNamHoc}" không tồn tại`);
        }

        // 2. Validate học kỳ
        const hocKyEntity = await this.lopHocPhanRepo.manager.findOne(HocKy, {
            where: { namHoc: { id: namHoc.id }, hocKy },
            relations: ['namHoc'],
        });
        if (!hocKyEntity) {
            throw new NotFoundException(`Học kỳ ${hocKy} của năm học "${maNamHoc}" không tồn tại`);
        }

        // 3. Lấy tất cả lớp học phần đã khóa điểm trong học kỳ đó
        const lopHocPhans = await this.lopHocPhanRepo.find({
            where: {
                hocKy: { id: hocKyEntity.id },
                khoaDiem: true,
            },
            relations: [
                'monHoc',
                'nganh',
                'nienKhoa',
                'ketQuaHocTaps',
                'ketQuaHocTaps.sinhVien',
                'ketQuaHocTaps.sinhVien.lop',
            ],
        });

        // 3b. Lấy tất cả lớp học phần trong học kỳ (bao gồm cả chưa khóa điểm) để tìm SV đang học lại
        const tatCaLopHocPhanTrongHocKy = await this.lopHocPhanRepo.find({
            where: {
                hocKy: { id: hocKyEntity.id },
            },
            relations: [
                'monHoc',
                'nganh',
                'nienKhoa',
                'hocKy',
                'hocKy.namHoc',
                'sinhVienLopHocPhans',
                'sinhVienLopHocPhans.sinhVien',
                'ketQuaHocTaps',
                'ketQuaHocTaps.sinhVien',
            ],
        });

        if (lopHocPhans.length === 0 && tatCaLopHocPhanTrongHocKy.length === 0) {
            throw new BadRequestException(`Không có lớp học phần nào trong học kỳ ${hocKy} năm học "${maNamHoc}"`);
        }

        // 4. Lấy danh sách sinh viên trượt (TBCHP <= 4.0)
        const danhSachSinhVienTruot: SinhVienTruotMonItemDto[] = [];
        const svMonHocTruotMap = new Map<string, { sv: SinhVien; lhp: LopHocPhan; kq: KetQuaHocTap; tbchp: number }>();

        for (const lhp of lopHocPhans) {
            for (const kq of lhp.ketQuaHocTaps) {
                if (kq.diemQuaTrinh === null || kq.diemThanhPhan === null || kq.diemThi === null) {
                    continue;
                }

                const diemTBCHP = this.tinhDiemTBCHP(kq.diemQuaTrinh, kq.diemThanhPhan, kq.diemThi);

                if (diemTBCHP <= 4.0) {
                    const key = `${kq.sinhVien.id}_${lhp.monHoc.id}`;
                    svMonHocTruotMap.set(key, { sv: kq.sinhVien, lhp, kq, tbchp: diemTBCHP });
                }
            }
        }

        // 5. Batch load kết quả học tập cho tất cả SV trượt để kiểm tra học lại
        const allSvIds = [...new Set([...svMonHocTruotMap.values()].map(item => item.sv.id))];
        const allMonHocIds = [...new Set([...svMonHocTruotMap.values()].map(item => item.lhp.monHoc.id))];

        const allKetQuaHocTap = allSvIds.length > 0 ? await this.ketQuaRepo.find({
            where: {
                sinhVien: { id: In(allSvIds) },
                lopHocPhan: { monHoc: { id: In(allMonHocIds) } },
            },
            relations: ['sinhVien', 'lopHocPhan', 'lopHocPhan.monHoc', 'lopHocPhan.hocKy', 'lopHocPhan.hocKy.namHoc'],
        }) : [];

        const allSvLhp = allSvIds.length > 0 ? await this.svLhpRepo.find({
            where: {
                sinhVien: { id: In(allSvIds) },
                lopHocPhan: { monHoc: { id: In(allMonHocIds) } },
            },
            relations: ['sinhVien', 'lopHocPhan', 'lopHocPhan.monHoc', 'lopHocPhan.hocKy', 'lopHocPhan.hocKy.namHoc'],
        }) : [];

        // Tạo Maps để lookup nhanh
        const ketQuaMapBySvMonHoc = new Map<string, KetQuaHocTap[]>();
        for (const kq of allKetQuaHocTap) {
            const key = `${kq.sinhVien.id}_${kq.lopHocPhan.monHoc.id}`;
            if (!ketQuaMapBySvMonHoc.has(key)) {
                ketQuaMapBySvMonHoc.set(key, []);
            }
            ketQuaMapBySvMonHoc.get(key)!.push(kq);
        }

        const svLhpMapBySvMonHoc = new Map<string, SinhVienLopHocPhan[]>();
        for (const svlhp of allSvLhp) {
            const key = `${svlhp.sinhVien.id}_${svlhp.lopHocPhan.monHoc.id}`;
            if (!svLhpMapBySvMonHoc.has(key)) {
                svLhpMapBySvMonHoc.set(key, []);
            }
            svLhpMapBySvMonHoc.get(key)!.push(svlhp);
        }

        // 6. Xử lý từng sinh viên trượt để xác định trạng thái học lại
        const danhSachSinhVienDaHocLai: SinhVienDaHocLaiItemDto[] = [];

        for (const [key, { sv, lhp, kq, tbchp }] of svMonHocTruotMap) {
            const monHocId = lhp.monHoc.id;
            const mapKey = `${sv.id}_${monHocId}`;

            // Lấy các lớp học phần khác cùng môn
            const ketQuaCacLopKhac = (ketQuaMapBySvMonHoc.get(mapKey) || [])
                .filter(k => k.lopHocPhan.id !== lhp.id);
            const cacLopKhacCungMonSvlhp = (svLhpMapBySvMonHoc.get(mapKey) || [])
                .filter(svlhp => svlhp.lopHocPhan.id !== lhp.id);

            // Gộp danh sách lớp học phần khác
            const lhpIdDaThem = new Set<number>();
            const mergedOtherLhp: { lopHocPhan: LopHocPhan; ketQua: KetQuaHocTap | null }[] = [];

            for (const kqKhac of ketQuaCacLopKhac) {
                const lhpKhac = kqKhac.lopHocPhan;
                if (lhpKhac?.id != null && !lhpIdDaThem.has(lhpKhac.id)) {
                    lhpIdDaThem.add(lhpKhac.id);
                    mergedOtherLhp.push({ lopHocPhan: lhpKhac, ketQua: kqKhac });
                }
            }
            for (const svlhp of cacLopKhacCungMonSvlhp) {
                const lhpKhac = svlhp.lopHocPhan;
                if (lhpKhac?.id != null && !lhpIdDaThem.has(lhpKhac.id)) {
                    lhpIdDaThem.add(lhpKhac.id);
                    const kqKhac = ketQuaCacLopKhac.find(x => x.lopHocPhan?.id === lhpKhac.id) ?? null;
                    mergedOtherLhp.push({ lopHocPhan: lhpKhac, ketQua: kqKhac });
                }
            }

            // Xác định trạng thái
            let daHocLai = false;
            let dangHocLai = false;
            let daDat = false;

            if (mergedOtherLhp.length > 0) {
                daHocLai = true;

                for (const { lopHocPhan: lopKhac, ketQua: kqKhac } of mergedOtherLhp) {
                    if (!kqKhac) {
                        dangHocLai = true;
                    } else if (!lopKhac.khoaDiem) {
                        dangHocLai = true;
                    } else if (kqKhac.diemQuaTrinh != null && kqKhac.diemThanhPhan != null && kqKhac.diemThi != null) {
                        const tbchpKhac = this.tinhDiemTBCHP(kqKhac.diemQuaTrinh, kqKhac.diemThanhPhan, kqKhac.diemThi);
                        if (tbchpKhac > 4.0) {
                            daDat = true;
                        }
                    }
                }

                // Build thông tin các lần học lại
                const cacLanHocLai: LanHocLaiDto[] = [];
                const sortedMerged = [...mergedOtherLhp].sort((a, b) => {
                    const nkA = a.lopHocPhan.hocKy?.namHoc?.namBatDau ?? 0;
                    const nkB = b.lopHocPhan.hocKy?.namHoc?.namBatDau ?? 0;
                    if (nkA !== nkB) return nkA - nkB;
                    return (a.lopHocPhan.hocKy?.hocKy ?? 0) - (b.lopHocPhan.hocKy?.hocKy ?? 0);
                });

                for (const { lopHocPhan: lopKhac, ketQua: kqKhac } of sortedMerged) {
                    let ketQuaDto: KetQuaHocLaiDto;
                    if (kqKhac) {
                        const dqt = kqKhac.diemQuaTrinh;
                        const dtp = kqKhac.diemThanhPhan;
                        const dt = kqKhac.diemThi;
                        const tbchpKhac = dqt != null && dtp != null && dt != null
                            ? this.tinhDiemTBCHP(dqt, dtp, dt)
                            : null;
                        ketQuaDto = {
                            diemQuaTrinh: dqt ?? null,
                            diemThanhPhan: dtp ?? null,
                            diemThi: dt ?? null,
                            diemTBCHP: tbchpKhac,
                            diemChu: tbchpKhac != null ? this.diemTBCHPToDiemChu(tbchpKhac) : null,
                            diemSo: tbchpKhac != null ? this.diemHe10ToHe4(tbchpKhac) : null,
                            khoaDiem: lopKhac.khoaDiem,
                        };
                    } else {
                        ketQuaDto = {
                            diemQuaTrinh: null,
                            diemThanhPhan: null,
                            diemThi: null,
                            diemTBCHP: null,
                            diemChu: null,
                            diemSo: null,
                            khoaDiem: lopKhac.khoaDiem,
                        };
                    }

                    const hocKyLhp = lopKhac.hocKy;
                    const namHocLhp = hocKyLhp?.namHoc;
                    const ngayBatDau = hocKyLhp?.ngayBatDau != null
                        ? (typeof hocKyLhp.ngayBatDau === 'string' ? hocKyLhp.ngayBatDau : new Date(hocKyLhp.ngayBatDau).toISOString().split('T')[0])
                        : null;
                    const ngayKetThuc = hocKyLhp?.ngayKetThuc != null
                        ? (typeof hocKyLhp.ngayKetThuc === 'string' ? hocKyLhp.ngayKetThuc : new Date(hocKyLhp.ngayKetThuc).toISOString().split('T')[0])
                        : null;

                    cacLanHocLai.push({
                        lopHocPhanId: lopKhac.id,
                        maLopHocPhan: lopKhac.maLopHocPhan,
                        hocKy: hocKyLhp?.hocKy ?? 0,
                        maNamHoc: namHocLhp?.maNamHoc ?? '',
                        tenNamHoc: namHocLhp?.tenNamHoc ?? '',
                        ngayBatDau: ngayBatDau ?? undefined,
                        ngayKetThuc: ngayKetThuc ?? undefined,
                        ketQuaHocTap: ketQuaDto,
                    });
                }

                danhSachSinhVienDaHocLai.push({
                    sinhVienId: sv.id,
                    maSinhVien: sv.maSinhVien,
                    hoTen: sv.hoTen,
                    gioiTinh: this.mapGioiTinh(sv.gioiTinh),
                    maMonHocTruot: lhp.monHoc.maMonHoc,
                    tenMonHocTruot: lhp.monHoc.tenMonHoc,
                    maLopHocPhanTruot: lhp.maLopHocPhan,
                    diemTBCHPTruot: tbchp.toFixed(2),
                    cacLanHocLai,
                });
            }

            // Thêm vào danh sách sinh viên trượt
            const diemSo = this.diemHe10ToHe4(tbchp);
            const diemChu = this.diemTBCHPToDiemChu(tbchp);

            danhSachSinhVienTruot.push({
                sinhVienId: sv.id,
                maSinhVien: sv.maSinhVien,
                hoTen: sv.hoTen,
                gioiTinh: this.mapGioiTinh(sv.gioiTinh),
                sdt: sv.sdt || undefined,
                tinhTrang: sv.tinhTrang || '',
                lopHocPhanId: lhp.id,
                maLopHocPhan: lhp.maLopHocPhan,
                monHocId: lhp.monHoc.id,
                maMonHoc: lhp.monHoc.maMonHoc,
                tenMonHoc: lhp.monHoc.tenMonHoc,
                soTinChi: lhp.monHoc.soTinChi,
                diemQuaTrinh: kq.diemQuaTrinh,
                diemThanhPhan: kq.diemThanhPhan,
                diemThi: kq.diemThi,
                diemTBCHP: tbchp.toFixed(2),
                diemSo: diemSo.toFixed(1),
                diemChu,
                daHocLai,
                dangHocLai,
                daDat,
            });
        }

        // 7. Tìm sinh viên đang học lại trong học kỳ này (trượt ở học kỳ trước)
        const svIdDaXuLy = new Set<number>([...svMonHocTruotMap.values()].map(item => item.sv.id));

        const allNewSvIds: number[] = [];
        const allNewMonHocIds: number[] = [];
        for (const lhpTrongKy of tatCaLopHocPhanTrongHocKy) {
            for (const svlhp of lhpTrongKy.sinhVienLopHocPhans || []) {
                if (svlhp.sinhVien && !svIdDaXuLy.has(svlhp.sinhVien.id)) {
                    allNewSvIds.push(svlhp.sinhVien.id);
                    allNewMonHocIds.push(lhpTrongKy.monHoc.id);
                }
            }
            for (const kq of lhpTrongKy.ketQuaHocTaps || []) {
                if (kq.sinhVien && !svIdDaXuLy.has(kq.sinhVien.id)) {
                    allNewSvIds.push(kq.sinhVien.id);
                    allNewMonHocIds.push(lhpTrongKy.monHoc.id);
                }
            }
        }
        const uniqueNewSvIds = [...new Set(allNewSvIds)];
        const uniqueNewMonHocIds = [...new Set(allNewMonHocIds)];

        const allNewKetQua = uniqueNewSvIds.length > 0 ? await this.ketQuaRepo.find({
            where: {
                sinhVien: { id: In(uniqueNewSvIds) },
                lopHocPhan: {
                    monHoc: { id: In(uniqueNewMonHocIds) },
                    khoaDiem: true,
                },
            },
            relations: ['sinhVien', 'lopHocPhan', 'lopHocPhan.monHoc', 'lopHocPhan.hocKy', 'lopHocPhan.hocKy.namHoc'],
        }) : [];

        const newKetQuaMapBySvMonHoc = new Map<string, KetQuaHocTap[]>();
        for (const kq of allNewKetQua) {
            const key = `${kq.sinhVien.id}_${kq.lopHocPhan.monHoc.id}`;
            if (!newKetQuaMapBySvMonHoc.has(key)) {
                newKetQuaMapBySvMonHoc.set(key, []);
            }
            newKetQuaMapBySvMonHoc.get(key)!.push(kq);
        }

        for (const lhpTrongKy of tatCaLopHocPhanTrongHocKy) {
            const danhSachSV: { sv: SinhVien; ketQua: KetQuaHocTap | null }[] = [];

            for (const svlhp of lhpTrongKy.sinhVienLopHocPhans || []) {
                const sv = svlhp.sinhVien;
                if (sv && !svIdDaXuLy.has(sv.id)) {
                    const kq = lhpTrongKy.ketQuaHocTaps?.find(k => k.sinhVien?.id === sv.id) ?? null;
                    danhSachSV.push({ sv, ketQua: kq });
                }
            }
            for (const kq of lhpTrongKy.ketQuaHocTaps || []) {
                const sv = kq.sinhVien;
                if (sv && !svIdDaXuLy.has(sv.id)) {
                    if (!danhSachSV.some(item => item.sv.id === sv.id)) {
                        danhSachSV.push({ sv, ketQua: kq });
                    }
                }
            }

            for (const { sv, ketQua } of danhSachSV) {
                const monHocId = lhpTrongKy.monHoc.id;
                const mapKey5d = `${sv.id}_${monHocId}`;
                const ketQuaTruotTruocDo = (newKetQuaMapBySvMonHoc.get(mapKey5d) || [])
                    .filter(kq => kq.lopHocPhan.id !== lhpTrongKy.id);

                const cacLanTruot = ketQuaTruotTruocDo.filter(kq => {
                    if (kq.diemQuaTrinh == null || kq.diemThanhPhan == null || kq.diemThi == null) return false;
                    const tbchp = this.tinhDiemTBCHP(kq.diemQuaTrinh, kq.diemThanhPhan, kq.diemThi);
                    return tbchp <= 4.0;
                });

                if (cacLanTruot.length > 0) {
                    svIdDaXuLy.add(sv.id);

                    const lanTruotDauTien = cacLanTruot[0];
                    const tbchpTruot = this.tinhDiemTBCHP(
                        lanTruotDauTien.diemQuaTrinh!,
                        lanTruotDauTien.diemThanhPhan!,
                        lanTruotDauTien.diemThi!,
                    );

                    const cacLanHocLai: LanHocLaiDto[] = [];

                    let ketQuaDtoHienTai: KetQuaHocLaiDto;
                    if (ketQua && ketQua.diemQuaTrinh != null && ketQua.diemThanhPhan != null && ketQua.diemThi != null) {
                        const tbchpHienTai = this.tinhDiemTBCHP(ketQua.diemQuaTrinh, ketQua.diemThanhPhan, ketQua.diemThi);
                        ketQuaDtoHienTai = {
                            diemQuaTrinh: ketQua.diemQuaTrinh,
                            diemThanhPhan: ketQua.diemThanhPhan,
                            diemThi: ketQua.diemThi,
                            diemTBCHP: tbchpHienTai,
                            diemChu: this.diemTBCHPToDiemChu(tbchpHienTai),
                            diemSo: this.diemHe10ToHe4(tbchpHienTai),
                            khoaDiem: lhpTrongKy.khoaDiem,
                        };
                    } else {
                        ketQuaDtoHienTai = {
                            diemQuaTrinh: ketQua?.diemQuaTrinh ?? null,
                            diemThanhPhan: ketQua?.diemThanhPhan ?? null,
                            diemThi: ketQua?.diemThi ?? null,
                            diemTBCHP: null,
                            diemChu: null,
                            diemSo: null,
                            khoaDiem: lhpTrongKy.khoaDiem,
                        };
                    }

                    const ngayBatDauHienTai = lhpTrongKy.hocKy?.ngayBatDau != null
                        ? (typeof lhpTrongKy.hocKy.ngayBatDau === 'string' ? lhpTrongKy.hocKy.ngayBatDau : new Date(lhpTrongKy.hocKy.ngayBatDau).toISOString().split('T')[0])
                        : null;
                    const ngayKetThucHienTai = lhpTrongKy.hocKy?.ngayKetThuc != null
                        ? (typeof lhpTrongKy.hocKy.ngayKetThuc === 'string' ? lhpTrongKy.hocKy.ngayKetThuc : new Date(lhpTrongKy.hocKy.ngayKetThuc).toISOString().split('T')[0])
                        : null;

                    cacLanHocLai.push({
                        lopHocPhanId: lhpTrongKy.id,
                        maLopHocPhan: lhpTrongKy.maLopHocPhan,
                        hocKy: lhpTrongKy.hocKy?.hocKy ?? hocKy,
                        maNamHoc: lhpTrongKy.hocKy?.namHoc?.maNamHoc ?? maNamHoc,
                        tenNamHoc: lhpTrongKy.hocKy?.namHoc?.tenNamHoc ?? namHoc.tenNamHoc,
                        ngayBatDau: ngayBatDauHienTai ?? undefined,
                        ngayKetThuc: ngayKetThucHienTai ?? undefined,
                        ketQuaHocTap: ketQuaDtoHienTai,
                    });

                    danhSachSinhVienDaHocLai.push({
                        sinhVienId: sv.id,
                        maSinhVien: sv.maSinhVien,
                        hoTen: sv.hoTen,
                        gioiTinh: this.mapGioiTinh(sv.gioiTinh),
                        maMonHocTruot: lanTruotDauTien.lopHocPhan.monHoc.maMonHoc,
                        tenMonHocTruot: lanTruotDauTien.lopHocPhan.monHoc.tenMonHoc,
                        maLopHocPhanTruot: lanTruotDauTien.lopHocPhan.maLopHocPhan,
                        diemTBCHPTruot: tbchpTruot.toFixed(2),
                        cacLanHocLai,
                    });
                }
            }
        }

        // 8. Tính thống kê
        const soSinhVienDaHocLai = danhSachSinhVienTruot.filter(sv => sv.daHocLai).length;
        const soSinhVienChuaHocLai = danhSachSinhVienTruot.filter(sv => !sv.daHocLai).length;

        return {
            maNamHoc,
            hocKy,
            tenNamHoc: namHoc.tenNamHoc,
            tongSinhVienTruot: danhSachSinhVienTruot.length,
            soSinhVienDaHocLai,
            soSinhVienChuaHocLai,
            danhSachSinhVienTruot,
            danhSachSinhVienDaHocLai,
        };
    }
}

