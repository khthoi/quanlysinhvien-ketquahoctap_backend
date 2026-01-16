import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

    ) { }

    // Hàm tính điểm
    private tinhDiemTBCHP(dqt: number, dtp: number, dt: number): number {
        return dqt * 0.1 + dtp * 0.3 + dt * 0.6;
    }

    private diemSoToDiemChu(diem: number): string {
        if (diem >= 8.5) return 'A';
        if (diem >= 8.0) return 'B+';
        if (diem >= 7.0) return 'B';
        if (diem >= 6.5) return 'C+';
        if (diem >= 5.5) return 'C';
        if (diem >= 5.0) return 'D+';
        if (diem >= 4.0) return 'D';
        return 'F';
    }

    // 1. Bảng điểm lớp học phần
    async xuatBangDiemLopHocPhan(lopHocPhanId: number): Promise<{ buffer: Buffer; filename: string }> {
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
                'sinhVienLopHocPhans.sinhVien.lop', // ← THÊM DÒNG NÀY
                'sinhVienLopHocPhans.sinhVien.lop.nganh', // (tùy chọn, nếu muốn tên ngành trong lớp)
                'ketQuaHocTaps',
                'ketQuaHocTaps.sinhVien',
            ],
        });

        if (!lhp) throw new NotFoundException('Không tìm thấy lớp học phần');

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Bảng điểm');

        // Header
        worksheet.mergeCells('A1:K1');
        worksheet.getCell('A1').value = `BẢNG ĐIỂM LỚP HỌC PHẦN: ${lhp.maLopHocPhan}`;
        worksheet.getCell('A1').font = { size: 16, bold: true };
        worksheet.getCell('A1').alignment = { horizontal: 'center' };

        worksheet.mergeCells('A2:K2');
        worksheet.getCell('A2').value = `Môn: ${lhp.monHoc.tenMonHoc} - Số Tín Chỉ: ${lhp.monHoc.soTinChi} | Giảng viên: ${lhp.giangVien?.hoTen || 'Chưa phân công'}`;
        const ngayBD = new Date(lhp.hocKy.ngayBatDau).toLocaleDateString('vi-VN');
        const ngayKT = new Date(lhp.hocKy.ngayKetThuc).toLocaleDateString('vi-VN');
        worksheet.mergeCells('A3:K3');
        worksheet.getCell('A3').value = `Học kỳ: ${lhp.hocKy.hocKy} (${ngayBD} - ${ngayKT}) - ${lhp.hocKy.namHoc.tenNamHoc}`;

        // Table header
        const headerRow = worksheet.getRow(5);
        headerRow.values = ['STT', 'MSSV', 'Họ tên', 'Ngày sinh', 'Lớp', 'ĐQT (10%)', 'ĐTP (30%)', 'ĐThi (60%)', 'TBCHP', 'Điểm số', 'Điểm chữ'];
        headerRow.font = { bold: true };
        headerRow.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });

        // Data
        let rowIndex = 6;
        const ketQuaMap = new Map(lhp.ketQuaHocTaps.map(kq => [kq.sinhVien.id, kq]));

        lhp.sinhVienLopHocPhans.forEach((svlhp, idx) => {
            const sv = svlhp.sinhVien;
            const kq = ketQuaMap.get(sv.id);

            let tbchp = 0, diemSo = 0, diemChu = 'F';
            if (kq) {
                tbchp = this.tinhDiemTBCHP(kq.diemQuaTrinh, kq.diemThanhPhan, kq.diemThi);
                diemSo = Math.round(tbchp * 10) / 10;
                diemChu = this.diemSoToDiemChu(diemSo);
            }

            const row = worksheet.getRow(rowIndex++);
            row.values = [
                idx + 1,
                sv.maSinhVien,
                sv.hoTen,
                sv.ngaySinh ? new Date(sv.ngaySinh).toLocaleDateString('vi-VN') : '',
                sv.lop?.maLop || '',
                kq?.diemQuaTrinh || '',
                kq?.diemThanhPhan || '',
                kq?.diemThi || '',
                kq ? tbchp.toFixed(2) : '',
                kq ? diemSo : '',
                kq ? diemChu : '',
            ];
        });

        // Styling
        worksheet.columns = [
            { width: 5 }, { width: 12 }, { width: 25 }, { width: 12 },
            { width: 20 }, { width: 15 }, { width: 15 }, { width: 15 },
            { width: 15 }, { width: 15 }, { width: 10 },
        ];

        const buffer = await workbook.xlsx.writeBuffer() as unknown as Buffer;

        const filename = `BangDiem_LHP_${lhp.maLopHocPhan}.xlsx`;

        return { buffer, filename };
    }

    // 2. Phiếu điểm cá nhân
    async xuatPhieuDiemCaNhan(sinhVienId: number): Promise<{ buffer: Buffer; filename: string }> {
        const sv = await this.sinhVienRepo.findOne({
            where: { id: sinhVienId },
            relations: ['lop', 'lop.nganh', 'lop.nienKhoa', 'ketQuaHocTaps', 'ketQuaHocTaps.lopHocPhan', 'ketQuaHocTaps.lopHocPhan.monHoc', 'ketQuaHocTaps.lopHocPhan.hocKy', 'ketQuaHocTaps.lopHocPhan.hocKy.namHoc'],
        });

        if (!sv) throw new NotFoundException('Không tìm thấy sinh viên');

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Phiếu điểm');

        // Header
        worksheet.mergeCells('A1:G1');
        worksheet.getCell('A1').value = 'PHIẾU ĐIỂM CÁ NHÂN';
        worksheet.getCell('A1').font = { size: 16, bold: true };
        worksheet.getCell('A1').alignment = { horizontal: 'center' };
        worksheet.getCell('A3').value = `Họ tên: ${sv.hoTen}`;
        worksheet.getCell('A4').value = `MSSV: ${sv.maSinhVien}`;
        worksheet.getCell('E3').value = `Ngày sinh: ${sv.ngaySinh ? new Date(sv.ngaySinh).toLocaleDateString('vi-VN') : ''}`;
        worksheet.getCell('E4').value = `Lớp: ${sv.lop.maLop}`;
        worksheet.getCell('A5').value = `Ngành: ${sv.lop.nganh.tenNganh}`;
        worksheet.getCell('E5').value = `Niên khóa: ${sv.lop.nienKhoa.tenNienKhoa}`;

        // Table
        const headerRow = worksheet.getRow(7);
        headerRow.values = ['STT', 'Mã HP', 'Tên học phần', 'Mã lớp học phần', 'Số TC', 'Học kỳ', 'TBCHP', 'Xếp loại'];
        headerRow.font = { bold: true };
        headerRow.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });

        let rowIndex = 8;
        sv.ketQuaHocTaps.forEach((kq, idx) => {
            const tbchp = this.tinhDiemTBCHP(kq.diemQuaTrinh, kq.diemThanhPhan, kq.diemThi);
            const diemSo = Math.round(tbchp * 10) / 10;
            const diemChu = this.diemSoToDiemChu(diemSo);
            const ngayBD = kq.lopHocPhan.hocKy.ngayBatDau
                ? new Date(kq.lopHocPhan.hocKy.ngayBatDau).toLocaleDateString('vi-VN')
                : '';

            const ngayKT = kq.lopHocPhan.hocKy.ngayKetThuc
                ? new Date(kq.lopHocPhan.hocKy.ngayKetThuc).toLocaleDateString('vi-VN')
                : '';
            const row = worksheet.getRow(rowIndex++);
            row.values = [
                idx + 1,
                kq.lopHocPhan.monHoc.maMonHoc,
                kq.lopHocPhan.monHoc.tenMonHoc,
                kq.lopHocPhan.maLopHocPhan,
                kq.lopHocPhan.monHoc.soTinChi,
                `${kq.lopHocPhan.hocKy.hocKy} (${ngayBD} - ${ngayKT}) - ${kq.lopHocPhan.hocKy.namHoc.tenNamHoc}`,
                diemSo.toFixed(1),
                diemChu,
            ];
        });

        worksheet.columns = [
            { width: 5 }, { width: 12 }, { width: 30 }, { width: 20 }, { width: 8 },
            { width: 55 }, { width: 10 }, { width: 10 },
        ];

        const buffer = await workbook.xlsx.writeBuffer() as unknown as Buffer;

        // ✅ Filename có dấu
        const filename = `Phiếu điểm cá nhân - ${sv.hoTen} - MSV_${sv.maSinhVien}.xlsx`;

        return { buffer, filename };
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
            where: { hocKy: { id: hocKyEntity.id } },
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

                // Sinh viên trượt nếu TBCHP <= 4.0
                if (diemTBCHP <= 4.0) {
                    const diemSo = Math.round(diemTBCHP * 10) / 10;
                    const diemChu = this.diemSoToDiemChu(diemSo);

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

        if (danhSachTruotTamThoi.length === 0) {
            throw new BadRequestException(`Không có sinh viên nào trượt trong học kỳ ${hocKy} năm học "${maNamHoc}"`);
        }

        // ✅ 5. VALIDATION MỚI: Lọc ra những sinh viên thực sự cần học lại
        // Loại bỏ sinh viên đã học lại thành công hoặc đang học lại môn đó
        const danhSachTruot: typeof danhSachTruotTamThoi = [];

        for (const item of danhSachTruotTamThoi) {
            const sv = item.sinhVien;
            const monHocId = item.lopHocPhanTruot.monHoc.id;
            const lopHocPhanTruotId = item.lopHocPhanTruot.id;

            // Tìm tất cả các lớp học phần KHÁC (cùng môn học) mà sinh viên đã/đang tham gia
            const cacLopKhacCungMon = await this.svLhpRepo.find({
                where: {
                    sinhVien: { id: sv.id },
                    lopHocPhan: {
                        monHoc: { id: monHocId },
                        id: Not(lopHocPhanTruotId), // Loại trừ lớp đã trượt
                    },
                },
                relations: ['lopHocPhan', 'lopHocPhan. monHoc', 'lopHocPhan. hocKy', 'lopHocPhan. hocKy.namHoc'],
            });

            let daHocLaiThanhCongHoacDangHoc = false;

            for (const svlhp of cacLopKhacCungMon) {
                const lopKhac = svlhp.lopHocPhan;

                // Kiểm tra kết quả học tập ở lớp khác này
                const kqLopKhac = await this.ketQuaRepo.findOne({
                    where: {
                        sinhVien: { id: sv.id },
                        lopHocPhan: { id: lopKhac.id },
                    },
                });

                if (!kqLopKhac) {
                    // Trường hợp 1: Sinh viên đang tham gia lớp khác nhưng CHƯA CÓ kết quả
                    // → Đang học lại → Không cần đề xuất thêm
                    daHocLaiThanhCongHoacDangHoc = true;
                    break;
                }

                // Trường hợp 2: Có kết quả rồi → Kiểm tra điểm
                if (kqLopKhac.diemQuaTrinh !== null && kqLopKhac.diemThanhPhan !== null && kqLopKhac.diemThi !== null) {
                    const diemTBCHPLopKhac = this.tinhDiemTBCHP(
                        kqLopKhac.diemQuaTrinh,
                        kqLopKhac.diemThanhPhan,
                        kqLopKhac.diemThi
                    );

                    if (diemTBCHPLopKhac > 4.0) {
                        // Đã học lại thành công (đậu) → Không cần đề xuất
                        daHocLaiThanhCongHoacDangHoc = true;
                        break;
                    }
                }
                // Nếu có kết quả nhưng điểm vẫn <= 4.0 → Vẫn trượt → Tiếp tục xét
            }

            // Chỉ thêm vào danh sách nếu sinh viên THỰC SỰ cần học lại
            if (!daHocLaiThanhCongHoacDangHoc) {
                danhSachTruot.push(item);
            }
        }

        if (danhSachTruot.length === 0) {
            throw new BadRequestException(
                `Tất cả sinh viên trượt trong học kỳ ${hocKy} năm học "${maNamHoc}" đã đăng ký học lại hoặc đã học lại thành công`
            );
        }

        // 6. Tìm lớp học phần đề xuất cho mỗi sinh viên trượt
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

            // Tìm các niên khóa cao hơn niên khóa của sinh viên
            const nienKhoasCaoHon = await this.nienKhoaRepo.find({
                where: { namBatDau: MoreThanOrEqual(nienKhoaSV.namBatDau + 1) },
                order: { namBatDau: 'ASC' },
            });

            // Tìm lớp học phần đề xuất: 
            // - Cùng môn học
            // - Cùng ngành
            // - Niên khóa cao hơn
            // - Chưa khóa điểm
            let lopDeXuat: LopHocPhan | null = null;

            for (const nkCaoHon of nienKhoasCaoHon) {
                const lhpDeXuat = await this.lopHocPhanRepo.findOne({
                    where: {
                        monHoc: { id: monHocId },
                        nganh: { id: nganhId },
                        nienKhoa: { id: nkCaoHon.id },
                        khoaDiem: false,
                    },
                    relations: ['monHoc', 'nganh', 'nienKhoa', 'hocKy', 'hocKy.namHoc'],
                    order: { ngayTao: 'DESC' },
                });

                if (lhpDeXuat) {
                    lopDeXuat = lhpDeXuat;
                    break;
                }
            }

            // Nếu không tìm được ở niên khóa cao hơn, tìm ở cùng niên khóa nhưng khác lớp học phần
            if (!lopDeXuat) {
                lopDeXuat = await this.lopHocPhanRepo.findOne({
                    where: {
                        monHoc: { id: monHocId },
                        nganh: { id: nganhId },
                        nienKhoa: { id: nienKhoaSV.id },
                        khoaDiem: false,
                        id: Not(lhpTruot.id), // Khác lớp đã trượt
                    },
                    relations: ['monHoc', 'nganh', 'nienKhoa', 'hocKy', 'hocKy.namHoc'],
                    order: { ngayTao: 'DESC' },
                });
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
            { key: 'maLopHocPhanTruot', width: 25 },
            { key: 'diemQuaTrinh', width: 14 },
            { key: 'diemThanhPhan', width: 14 },
            { key: 'diemThi', width: 14 },
            { key: 'diemTBCHP', width: 10 },
            { key: 'diemSo', width: 10 },
            { key: 'diemChu', width: 10 },
            { key: 'danhGia', width: 15 },
            { key: 'maLopHocPhanDeXuat', width: 30 },
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
}

