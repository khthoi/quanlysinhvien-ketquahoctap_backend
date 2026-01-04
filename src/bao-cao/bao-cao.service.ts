import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { LopHocPhan } from 'src/giang-day/entity/lop-hoc-phan.entity';
import { SinhVien } from 'src/sinh-vien/entity/sinh-vien.entity';
import { KetQuaHocTap } from 'src/ket-qua/entity/ket-qua-hoc-tap.entity';
import { GiangVien } from 'src/danh-muc/entity/giang-vien.entity';
import { FilterHocLaiDto, FilterThongKeNganhDto, FilterThongKeLopHocPhanDto, FilterDanhSachSinhVienDto, LoaiDanhSachEnum } from './dtos/query-bao-cao.dto';
import { LoaiHinhThamGiaLopHocPhanEnum } from 'src/giang-day/enums/loai-hinh-tham-gia-lop-hoc-phan.enum';

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
        worksheet.getCell('A3').value = `Học kỳ: ${lhp.hocKy.tenHocKy} (${ngayBD} - ${ngayKT}) - ${lhp.hocKy.namHoc.tenNamHoc}`;

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
                sv.lop?.tenLop || '',
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
        worksheet.getCell('E4').value = `Lớp: ${sv.lop.tenLop}`;
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
                `${kq.lopHocPhan.hocKy.tenHocKy} (${ngayBD} - ${ngayKT}) - ${kq.lopHocPhan.hocKy.namHoc.tenNamHoc}`,
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
                return a.hocKy.tenHocKy.localeCompare(b.hocKy.tenHocKy);
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
                    `${lhp.hocKy.tenHocKy} (${ngayBD} - ${ngayKT}) - ${lhp.hocKy.namHoc.tenNamHoc}`,
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

    private async taoSheetHocLai(worksheet: ExcelJS.Worksheet, filter: FilterHocLaiDto, loai: LoaiHinhThamGiaLopHocPhanEnum) {
        worksheet.mergeCells('A1:J1');
        worksheet.getCell('A1').value = loai === LoaiHinhThamGiaLopHocPhanEnum.HOC_LAI ? 'DANH SÁCH SINH VIÊN HỌC LẠI' : 'DANH SÁCH SINH VIÊN HỌC CẢI THIỆN';
        worksheet.getCell('A1').font = { size: 14, bold: true };
        worksheet.getCell('A1').alignment = { horizontal: 'center' };

        const headerRow = worksheet.getRow(3);
        headerRow.values = ['STT', 'MSSV', 'Họ tên', 'Ngành', 'Niên khóa', 'Môn học', 'Lớp HP cũ', 'Điểm cũ', 'Học kỳ rớt', 'Số lần học lại'];
        headerRow.font = { bold: true };

        // Query data
        const query = this.ketQuaRepo.createQueryBuilder('kq')
            .leftJoinAndSelect('kq.sinhVien', 'sv')
            .leftJoinAndSelect('sv.lop', 'lop')
            .leftJoinAndSelect('lop.nganh', 'nganh')
            .leftJoinAndSelect('lop.nienKhoa', 'nk')
            .leftJoinAndSelect('kq.lopHocPhan', 'lhp')
            .leftJoinAndSelect('lhp.monHoc', 'mh')
            .leftJoinAndSelect('lhp.hocKy', 'hk')
            .leftJoinAndSelect('hk.namHoc', 'nh')
            .where('1=1');

        if (loai === LoaiHinhThamGiaLopHocPhanEnum.HOC_LAI) {
            query.andWhere(`(kq.diemQuaTrinh * 0.1 + kq.diemThanhPhan * 0.3 + kq.diemThi * 0.6) < 4.0`);
        } else {
            query.andWhere(`(kq.diemQuaTrinh * 0.1 + kq.diemThanhPhan * 0.3 + kq.diemThi * 0.6) >= 5.0`);
            query.andWhere(`(kq.diemQuaTrinh * 0.1 + kq.diemThanhPhan * 0.3 + kq.diemThi * 0.6) < 8.0`);
        }

        if (filter.hocKyId) query.andWhere('lhp.hocKyId = :hocKyId', { hocKyId: filter.hocKyId });
        if (filter.nganhId) query.andWhere('nganh.id = :nganhId', { nganhId: filter.nganhId });

        const results = await query.getMany();

        let rowIndex = 4;
        results.forEach((kq, idx) => {
            const tbchp = this.tinhDiemTBCHP(kq.diemQuaTrinh, kq.diemThanhPhan, kq.diemThi);
            const diemSo = Math.round(tbchp * 10) / 10;

            const row = worksheet.getRow(rowIndex++);
            row.values = [
                idx + 1,
                kq.sinhVien.maSinhVien,
                kq.sinhVien.hoTen,
                kq.sinhVien.lop.nganh.tenNganh,
                kq.sinhVien.lop.nienKhoa.tenNienKhoa,
                kq.lopHocPhan.monHoc.tenMonHoc,
                kq.lopHocPhan.maLopHocPhan,
                diemSo.toFixed(1),
                `${kq.lopHocPhan.hocKy.tenHocKy} - ${kq.lopHocPhan.hocKy.namHoc.tenNamHoc}`,
                1, // Cần tính từ history
            ];
        });

        worksheet.columns = [
            { width: 5 }, { width: 12 }, { width: 25 }, { width: 20 },
            { width: 12 }, { width: 30 }, { width: 15 }, { width: 10 },
            { width: 15 }, { width: 12 },
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

    // 7. Danh sách sinh viên tổng hợp
    async xuatDanhSachSinhVien(filter: FilterDanhSachSinhVienDto): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Danh sách sinh viên');

        let title = 'DANH SÁCH SINH VIÊN';
        let additionalColumns: string[] = [];

        switch (filter.loaiDanhSach) {
            case LoaiDanhSachEnum.LOP_HANH_CHINH:
                title += ' THEO LỚP HÀNH CHÍNH';
                break;
            case LoaiDanhSachEnum.NGANH_NIEN_KHOA:
                title += ' THEO NGÀNH - NIÊN KHÓA';
                break;
            case LoaiDanhSachEnum.LOP_HOC_PHAN:
                title += ' THEO LỚP HỌC PHẦN';
                break;
            case LoaiDanhSachEnum.ROT_2_MON_TRO_LEN:
                title += ' RỚT ≥ 2 HỌC PHẦN';
                additionalColumns = ['Số môn rớt', 'Danh sách môn rớt'];
                break;
            case LoaiDanhSachEnum.CANH_BAO_GPA:
                title += ` CẢNH BÁO GPA < ${filter.nguongGPA || 2.0}`;
                additionalColumns = ['GPA hiện tại', 'Số TC tích lũy'];
                break;
            case LoaiDanhSachEnum.KHEN_THUONG:
                title += ' KHEN THƯỞNG';
                additionalColumns = ['Xếp loại', 'GPA'];
                break;
        }

        // Merge cells cho title
        const totalCols = 7 + additionalColumns.length;
        const lastCol = String.fromCharCode(64 + totalCols); // A=65, B=66, ...
        worksheet.mergeCells(`A1:${lastCol}1`);
        worksheet.getCell('A1').value = title;
        worksheet.getCell('A1').font = { size: 14, bold: true };
        worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

        // Header row
        const headerRow = worksheet.getRow(3);
        const baseHeaders = ['STT', 'MSSV', 'Họ tên', 'Lớp', 'Ngành', 'Niên khóa', 'Tình trạng'];
        headerRow.values = [...baseHeaders, ...additionalColumns];
        headerRow.font = { bold: true };
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9E1F2' },
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        // Query data
        const query = this.sinhVienRepo
            .createQueryBuilder('sv')
            .leftJoinAndSelect('sv.lop', 'lop')
            .leftJoinAndSelect('lop.nganh', 'nganh')
            .leftJoinAndSelect('lop.nienKhoa', 'nk')
            .leftJoinAndSelect('sv.ketQuaHocTaps', 'kq')
            .leftJoinAndSelect('kq.lopHocPhan', 'lhp')
            .leftJoinAndSelect('lhp.monHoc', 'mh');

        if (filter.lopId) {
            query.andWhere('lop.id = :lopId', { lopId: filter.lopId });
        }
        if (filter.nganhId) {
            query.andWhere('nganh.id = :nganhId', { nganhId: filter.nganhId });
        }
        if (filter.nienKhoaId) {
            query.andWhere('nk.id = :nienKhoaId', { nienKhoaId: filter.nienKhoaId });
        }

        // Nếu lọc theo lớp học phần
        if (filter.lopHocPhanId && filter.loaiDanhSach === LoaiDanhSachEnum.LOP_HOC_PHAN) {
            query.andWhere('lhp.id = :lopHocPhanId', { lopHocPhanId: filter.lopHocPhanId });
        }

        const sinhViens = await query.getMany();

        // Filter based on loaiDanhSach
        let filteredSV = sinhViens;

        if (filter.loaiDanhSach === LoaiDanhSachEnum.ROT_2_MON_TRO_LEN) {
            filteredSV = sinhViens.filter((sv) => {
                const monRot = sv.ketQuaHocTaps.filter((kq) => {
                    const tbchp = this.tinhDiemTBCHP(kq.diemQuaTrinh, kq.diemThanhPhan, kq.diemThi);
                    return tbchp < 4.0;
                });
                return monRot.length >= 2;
            });
        } else if (filter.loaiDanhSach === LoaiDanhSachEnum.CANH_BAO_GPA) {
            const nguongGPA = filter.nguongGPA || 2.0;
            filteredSV = sinhViens.filter((sv) => {
                const gpa = this.tinhGPA(sv.ketQuaHocTaps);
                return gpa < nguongGPA;
            });
        } else if (filter.loaiDanhSach === LoaiDanhSachEnum.KHEN_THUONG) {
            filteredSV = sinhViens.filter((sv) => {
                const gpa = this.tinhGPA(sv.ketQuaHocTaps);
                const xepLoai = this.xepLoaiHocLuc(gpa);

                if (filter.xepLoai) {
                    return xepLoai === filter.xepLoai;
                }
                // Mặc định lấy sinh viên Giỏi và Xuất sắc
                return xepLoai === 'XUAT_SAC' || xepLoai === 'GIOI';
            });
        }

        // Populate data
        let rowIndex = 4;
        filteredSV.forEach((sv, idx) => {
            const row = worksheet.getRow(rowIndex++);
            const baseValues: any[] = [
                idx + 1,
                sv.maSinhVien,
                sv.hoTen,
                sv.lop.tenLop,
                sv.lop.nganh.tenNganh,
                sv.lop.nienKhoa.tenNienKhoa,
                sv.tinhTrang,
            ];

            // Add additional columns based on report type
            const additionalValues: any[] = [];

            if (filter.loaiDanhSach === LoaiDanhSachEnum.ROT_2_MON_TRO_LEN) {
                const monRot = sv.ketQuaHocTaps.filter((kq) => {
                    const tbchp = this.tinhDiemTBCHP(kq.diemQuaTrinh, kq.diemThanhPhan, kq.diemThi);
                    return tbchp < 4.0;
                });
                const danhSachMonRot = monRot.map((kq) => kq.lopHocPhan.monHoc.tenMonHoc).join(', ');
                additionalValues.push(monRot.length, danhSachMonRot);
            } else if (filter.loaiDanhSach === LoaiDanhSachEnum.CANH_BAO_GPA) {
                const gpa = this.tinhGPA(sv.ketQuaHocTaps);
                const tongTC = this.tinhTongTinChi(sv.ketQuaHocTaps);
                additionalValues.push(gpa.toFixed(2), tongTC);
            } else if (filter.loaiDanhSach === LoaiDanhSachEnum.KHEN_THUONG) {
                const gpa = this.tinhGPA(sv.ketQuaHocTaps);
                const xepLoai = this.xepLoaiHocLuc(gpa);
                additionalValues.push(this.formatXepLoai(xepLoai), gpa.toFixed(2));
            }

            row.values = [...baseValues, ...additionalValues];

            // Add borders
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
            });
        });

        // Column widths
        const baseWidths = [5, 12, 25, 15, 20, 15, 15];
        const additionalWidths = additionalColumns.map(() => 20);
        worksheet.columns = [...baseWidths, ...additionalWidths].map((width) => ({ width }));

        // Footer - Tổng số sinh viên
        const footerRow = worksheet.getRow(rowIndex + 1);
        footerRow.getCell(1).value = `Tổng số: ${filteredSV.length} sinh viên`;
        footerRow.getCell(1).font = { bold: true, italic: true };
        worksheet.mergeCells(rowIndex + 1, 1, rowIndex + 1, 3);

        return await workbook.xlsx.writeBuffer() as unknown as Buffer;
    }

    // Helper functions
    private tinhGPA(ketQuaHocTaps: KetQuaHocTap[]): number {
        if (ketQuaHocTaps.length === 0) return 0;

        let tongDiemNhan = 0;
        let tongTinChi = 0;

        ketQuaHocTaps.forEach((kq) => {
            const tbchp = this.tinhDiemTBCHP(kq.diemQuaTrinh, kq.diemThanhPhan, kq.diemThi);
            const diemSo = Math.round(tbchp * 10) / 10;
            const soTinChi = kq.lopHocPhan.monHoc.soTinChi;

            // Chỉ tính các môn đạt (>= 4.0) vào GPA
            if (diemSo >= 4.0) {
                tongDiemNhan += diemSo * soTinChi;
                tongTinChi += soTinChi;
            }
        });

        return tongTinChi > 0 ? tongDiemNhan / tongTinChi : 0;
    }

    private tinhTongTinChi(ketQuaHocTaps: KetQuaHocTap[]): number {
        return ketQuaHocTaps.reduce((sum, kq) => {
            const tbchp = this.tinhDiemTBCHP(kq.diemQuaTrinh, kq.diemThanhPhan, kq.diemThi);
            // Chỉ tính tín chỉ của các môn đạt
            if (tbchp >= 4.0) {
                return sum + kq.lopHocPhan.monHoc.soTinChi;
            }
            return sum;
        }, 0);
    }

    private xepLoaiHocLuc(gpa: number): string {
        if (gpa >= 3.6) return 'XUAT_SAC';
        if (gpa >= 3.2) return 'GIOI';
        if (gpa >= 2.5) return 'KHA';
        if (gpa >= 2.0) return 'TRUNG_BINH';
        return 'YEU';
    }

    private formatXepLoai(xepLoai: string): string {
        const map: { [key: string]: string } = {
            XUAT_SAC: 'Xuất sắc',
            GIOI: 'Giỏi',
            KHA: 'Khá',
            TRUNG_BINH: 'Trung bình',
            YEU: 'Yếu',
        };
        return map[xepLoai] || xepLoai;
    }
}