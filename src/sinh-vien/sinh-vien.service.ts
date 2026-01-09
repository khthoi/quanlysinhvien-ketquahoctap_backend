import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SinhVien } from './entity/sinh-vien.entity';
import { KhenThuongKyLuat } from './entity/khenthuong-kyluat.entity';
import { Lop } from 'src/danh-muc/entity/lop.entity';
import { CreateSinhVienDto } from './dtos/create-sinh-vien.dto';
import { UpdateSinhVienDto, UpdateSinhVienSelfDto } from './dtos/update-sinh-vien.dto';
import { GetSinhVienQueryDto } from './dtos/get-sinh-vien-query.dto';
import { GetKhenThuongKyLuatFilterDto, KhenThuongKyLuatDto } from './dtos/khen-thuong-ky-luat.dto';
import { PhanLopDto } from './dtos/phan-lop.dto';
import { ThayDoiTinhTrangDto } from './dtos/thay-doi-tinh-trang.dto';
import { NguoiDung } from 'src/auth/entity/nguoi-dung.entity';
import { GetLichHocMeQueryDto } from './dtos/get-lich-hoc-me-query.dto';
import { SinhVienLopHocPhan } from 'src/giang-day/entity/sinhvien-lophocphan.entity';
import { ImportSinhVienBatchDto } from './dtos/import-sinh-vien.dto';
import { TinhTrangHocTapEnum } from './enums/tinh-trang-hoc-tap.enum';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import { GioiTinh } from 'src/danh-muc/enums/gioi-tinh.enum';

@Injectable()
export class SinhVienService {
    constructor(
        @InjectRepository(SinhVien)
        private sinhVienRepo: Repository<SinhVien>,
        @InjectRepository(KhenThuongKyLuat)
        private ktklRepo: Repository<KhenThuongKyLuat>,
        @InjectRepository(Lop)
        private lopRepo: Repository<Lop>,
        @InjectRepository(NguoiDung)
        private nguoiDungRepo: Repository<NguoiDung>,
        @InjectRepository(SinhVienLopHocPhan)
        private svLhpRepo: Repository<SinhVienLopHocPhan>,
    ) { }

    async importFromExcel(filePath: string) {
        const results = {
            success: 0,
            failed: 0,
            errors: [] as { row: number; maSinhVien: string; error: string }[],
        };

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) {
            throw new BadRequestException('File Excel không có sheet dữ liệu');
        }

        // Giả định dòng 1 là header
        const rows = worksheet.getRows(2, worksheet.rowCount - 1); // bỏ header
        if (!rows || rows.length === 0) {
            throw new BadRequestException('File Excel không có dữ liệu');
        }

        // Load dữ liệu kiểm tra trùng (giữ nguyên như cũ)
        const existingSinhViens = await this.sinhVienRepo.find({
            select: ['maSinhVien', 'email', 'sdt'],
        });
        const maSinhVienSet = new Set(existingSinhViens.map(sv => sv.maSinhVien));
        const emailSet = new Set(existingSinhViens.map(sv => sv.email).filter(Boolean));
        const sdtSet = new Set(existingSinhViens.map(sv => sv.sdt).filter(Boolean));

        const allLops = await this.lopRepo.find();
        const maLopToLop = new Map<string, Lop>();
        allLops.forEach(lop => maLopToLop.set(lop.maLop, lop));

        for (const row of rows) {
            const rowNum = row.number;

            const maSinhVien = row.getCell(1).value?.toString().trim();
            const hoTen = row.getCell(2).value?.toString().trim();
            const ngaySinh = row.getCell(3).value?.toString();
            const gioiTinhStr = row.getCell(4).value?.toString();
            const diaChi = row.getCell(5).value?.toString();
            const email = this.getCellValue(row.getCell(6)).trim();
            const sdt = row.getCell(7).value?.toString();
            const ngayNhapHoc = row.getCell(8).value?.toString();
            const tinhTrangStr = row.getCell(9).value?.toString();
            const maLop = row.getCell(10).value?.toString().trim();

            if (!maSinhVien || !hoTen || !email || !ngayNhapHoc || !maLop) {
                results.failed++;
                results.errors.push({
                    row: rowNum,
                    maSinhVien: maSinhVien || 'N/A',
                    error: 'Thiếu dữ liệu bắt buộc',
                });
                continue;
            }

            try {
                // Validate trùng
                if (maSinhVienSet.has(maSinhVien)) {
                    throw new BadRequestException('Mã sinh viên đã tồn tại trong hệ thống');
                }
                if (emailSet.has(email)) {
                    throw new BadRequestException('Email đã được sử dụng');
                }
                if (sdt && sdtSet.has(sdt)) {
                    throw new BadRequestException('Số điện thoại đã được sử dụng');
                }

                const lop = maLopToLop.get(maLop);
                if (!lop) {
                    throw new BadRequestException(`Mã lớp "${maLop}" không tồn tại`);
                }

                const gioiTinh = gioiTinhStr ? (gioiTinhStr as GioiTinh) : undefined;
                const tinhTrang = tinhTrangStr ? (tinhTrangStr as TinhTrangHocTapEnum) : TinhTrangHocTapEnum.DANG_HOC;

                const sinhVien = this.sinhVienRepo.create({
                    maSinhVien,
                    hoTen,
                    ngaySinh: ngaySinh ? new Date(ngaySinh) : undefined,
                    gioiTinh,
                    diaChi: diaChi || undefined,
                    email,
                    sdt: sdt || undefined,
                    ngayNhapHoc: new Date(ngayNhapHoc),
                    tinhTrang,
                    lop,
                });

                await this.sinhVienRepo.save(sinhVien);

                // Cập nhật set
                maSinhVienSet.add(maSinhVien);
                emailSet.add(email);
                if (sdt) sdtSet.add(sdt);

                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push({
                    row: rowNum,
                    maSinhVien: maSinhVien || 'N/A',
                    error: error.message || 'Lỗi không xác định',
                });
            }
        }

        // Xóa file tạm sau khi xử lý
        fs.unlinkSync(filePath);

        return results;
    }

    private getCellValue(cell: any): string {
        if (!cell || cell.value == null) return '';

        const v = cell.value;

        if (typeof v === 'object') {
            // Nếu là hyperlink: lấy text hoặc address
            if (v.text) return v.text.toString();
            if (v.hyperlink) return v.hyperlink.toString();

            // Nếu là RichText (nhiều đoạn)
            if (Array.isArray(v.richText)) {
                return v.richText.map((p: any) => p.text).join('');
            }

            // Nếu là object khác thì stringify
            return v.toString();
        }

        return v.toString();
    }

    async create(dto: CreateSinhVienDto) {
        const lop = await this.lopRepo.findOneBy({ id: dto.lopId });
        if (!lop) throw new BadRequestException('Lớp không tồn tại');

        const existMa = await this.sinhVienRepo.findOneBy({ maSinhVien: dto.maSinhVien });
        if (existMa) throw new BadRequestException('Mã sinh viên đã tồn tại');

        const existEmail = await this.sinhVienRepo.findOneBy({ email: dto.email });
        if (existEmail) throw new BadRequestException('Email đã được sử dụng');

        const existSdt = await this.sinhVienRepo.findOneBy({ sdt: dto.sdt });
        if (existSdt) throw new BadRequestException('Số điện thoại đã được sử dụng');

        const sv = this.sinhVienRepo.create({ ...dto, lop });
        return await this.sinhVienRepo.save(sv);
    }

    async findAll(query: GetSinhVienQueryDto) {
        const { page = 1, limit = 10, search, lopId, nganhId, nienKhoaId, tinhTrang } = query;

        const qb = this.sinhVienRepo
            .createQueryBuilder('sv')
            .leftJoinAndSelect('sv.lop', 'lop')
            .leftJoinAndSelect('lop.nganh', 'nganh')
            .leftJoinAndSelect('nganh.khoa', 'khoa')
            .leftJoinAndSelect('lop.nienKhoa', 'nienKhoa');

        if (lopId) qb.andWhere('lop.id = :lopId', { lopId });
        if (nganhId) qb.andWhere('nganh.id = :nganhId', { nganhId });
        if (nienKhoaId) qb.andWhere('lop.nien_khoa_id = :nienKhoaId', { nienKhoaId });
        if (tinhTrang) qb.andWhere('sv.tinh_trang = :tinhTrang', { tinhTrang });
        if (search) {
            qb.andWhere(
                '(LOWER(sv.maSinhVien) LIKE LOWER(:search) OR LOWER(sv.hoTen) LIKE LOWER(:search))',
                { search: `%${search}%` },
            );
        }

        qb.orderBy('sv.hoTen', 'ASC');

        const total = await qb.getCount();
        const items = await qb
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        return {
            data: items,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: number) {
        const sv = await this.sinhVienRepo.findOne({
            where: { id },
            relations: [
                'lop',
                'lop.nganh',
                'lop.nganh.khoa',
                'lop.nienKhoa',
            ],
        });

        if (!sv) throw new NotFoundException('Sinh viên không tồn tại');

        const ktkl = await this.ktklRepo.find({
            where: { sinhVien: { id } },
            order: { ngayQuyetDinh: 'DESC' },
        });

        return { ...sv, khenThuongKyLuat: ktkl };
    }

    // API /sinh-vien/me - Sinh viên xem thông tin cá nhân
    async findMe(userId: number) {
        if (!userId) {
            throw new BadRequestException('Không thể xác định người dùng từ token');
        }

        const nguoiDung = await this.nguoiDungRepo.findOne({
            where: { id: userId },
            relations: [
                'sinhVien',
                'sinhVien.lop',
                'sinhVien.lop.nganh',
                'sinhVien.lop.nganh.khoa',
                'sinhVien.lop.nienKhoa',
            ],
        });

        if (!nguoiDung) {
            throw new NotFoundException('Tài khoản không tồn tại');
        }

        if (!nguoiDung.sinhVien) {
            throw new NotFoundException('Tài khoản này không được liên kết với sinh viên nào');
        }

        const sv = nguoiDung.sinhVien;

        // Load khen thưởng kỷ luật
        const ktkl = await this.ktklRepo.find({
            where: { sinhVien: { id: sv.id } },
            order: { ngayQuyetDinh: 'DESC' },
        });

        return {
            ...sv,
            khenThuongKyLuat: ktkl || [],
        };
    }

    //API /sinh-vien/me/my-profile - Sinh viên sửa thông tin cá nhân
    async updateMe(userId: number, dto: UpdateSinhVienSelfDto) {
        if (!userId) {
            throw new BadRequestException('Không thể xác định người dùng từ token');
        }
        const nguoiDung = await this.nguoiDungRepo.findOne({
            where: { id: userId },
            relations: ['sinhVien'],
        });
        if (!nguoiDung) {
            throw new NotFoundException('Tài khoản không tồn tại');
        }

        if (!nguoiDung.sinhVien) {
            throw new NotFoundException('Tài khoản này không được liên kết với sinh viên nào');
        }
        return this.update(nguoiDung.sinhVien.id, dto);
    }
    async update(id: number, dto: UpdateSinhVienDto) {
        const sv = await this.sinhVienRepo.findOneBy({ id });
        if (!sv) throw new NotFoundException('Sinh viên không tồn tại');

        if (dto.lopId) {
            const lop = await this.lopRepo.findOneBy({ id: dto.lopId });
            if (!lop) throw new BadRequestException('Lớp không tồn tại');
            sv.lop = lop;
        }

        Object.assign(sv, dto);
        return await this.sinhVienRepo.save(sv);
    }

    async phanLop(sinhVienId: number, dto: PhanLopDto) {
        const sv = await this.sinhVienRepo.findOneBy({ id: sinhVienId });
        if (!sv) throw new NotFoundException('Sinh viên không tồn tại');

        const lop = await this.lopRepo.findOneBy({ id: dto.lopId });
        if (!lop) throw new BadRequestException('Lớp không tồn tại');

        sv.lop = lop;
        return await this.sinhVienRepo.save(sv);
    }

    async thayDoiTinhTrang(sinhVienId: number, dto: ThayDoiTinhTrangDto) {
        const sv = await this.sinhVienRepo.findOneBy({ id: sinhVienId });
        if (!sv) throw new NotFoundException('Sinh viên không tồn tại');

        sv.tinhTrang = dto.tinhTrang;
        return await this.sinhVienRepo.save(sv);
    }

    async themKhenThuongKyLuat(sinhVienId: number, dto: KhenThuongKyLuatDto) {
        const sv = await this.sinhVienRepo.findOneBy({ id: sinhVienId });
        if (!sv) throw new NotFoundException('Sinh viên không tồn tại');

        const ktkl = this.ktklRepo.create({
            ...dto,
            sinhVien: sv,
        });

        return await this.ktklRepo.save(ktkl);
    }

    async xoaKhenThuongKyLuat(id: number) {
        const ktkl = await this.ktklRepo.findOneBy({ id });
        if (!ktkl) throw new NotFoundException('Quyết định không tồn tại');

        await this.ktklRepo.remove(ktkl);
        return { message: 'Xóa thành công' };
    }

    async getThanhTich(sinhVienId: number, query: GetKhenThuongKyLuatFilterDto) {
        const { loai } = query;

        // Lấy thông tin sinh viên + quan hệ
        const sv = await this.sinhVienRepo.findOne({
            where: { id: sinhVienId },
            relations: ['lop', 'lop.nganh', 'lop.nienKhoa'],
        });

        if (!sv) throw new NotFoundException('Sinh viên không tồn tại');

        // Truy vấn thành tích
        let ktkl;

        // Nếu có filter loai → lọc theo loại
        if (loai) {
            ktkl = await this.ktklRepo.find({
                where: { sinhVien: { id: sinhVienId }, loai },
                order: { ngayQuyetDinh: 'DESC' },
            });
        } else {
            // Không có filter → lấy toàn bộ
            ktkl = await this.ktklRepo.find({
                where: { sinhVien: { id: sinhVienId } },
                order: { ngayQuyetDinh: 'DESC' },
            });
        }

        // Trả kết quả
        return {
            sinhVien: {
                id: sv.id,
                maSinhVien: sv.maSinhVien,
                hoTen: sv.hoTen,
                lop: sv.lop,
                nganh: sv.lop?.nganh,
            },
            khenThuongKyLuat: ktkl,
        };
    }


    // src/sinh-vien/sinh-vien.service.ts

    async getLichHocMe(userId: number, query: GetLichHocMeQueryDto) {
        const { page = 1, limit = 10, hocKyId } = query;

        // Tìm sinh viên từ userId
        const nguoiDung = await this.nguoiDungRepo.findOne({
            where: { id: userId },
            relations: ['sinhVien'],
        });

        if (!nguoiDung || !nguoiDung.sinhVien) {
            throw new NotFoundException('Không tìm thấy thông tin sinh viên của bạn');
        }

        const sinhVienId = nguoiDung.sinhVien.id;

        // Query builder với lọc học kỳ và phân trang
        const qb = this.svLhpRepo
            .createQueryBuilder('svlhp')
            .leftJoinAndSelect('svlhp.lopHocPhan', 'lhp')
            .leftJoinAndSelect('lhp.monHoc', 'monHoc')
            .leftJoinAndSelect('lhp.giangVien', 'giangVien')
            .leftJoinAndSelect('lhp.hocKy', 'hocKy')
            .leftJoinAndSelect('hocKy.namHoc', 'namHoc')
            .leftJoinAndSelect('lhp.nienKhoa', 'nienKhoa')
            .leftJoinAndSelect('lhp.nganh', 'nganh')
            .leftJoinAndSelect('nganh.khoa', 'khoa')
            .where('svlhp.sinh_vien_id = :sinhVienId', { sinhVienId });

        if (hocKyId) {
            qb.andWhere('lhp.hoc_ky_id = :hocKyId', { hocKyId });
        }

        qb.orderBy('namHoc.namBatDau', 'DESC')
            .addOrderBy('hocKy.hoc_ky', 'ASC')
            .addOrderBy('monHoc.tenMonHoc', 'ASC');

        const total = await qb.getCount();

        const items = await qb
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        const data = items.map(d => ({
            id: d.lopHocPhan.id,
            maLopHocPhan: d.lopHocPhan.maLopHocPhan,
            monHoc: d.lopHocPhan.monHoc,
            giangVien: d.lopHocPhan.giangVien ? {
                id: d.lopHocPhan.giangVien.id,
                hoTen: d.lopHocPhan.giangVien.hoTen,
            } : null,
            hocKy: d.lopHocPhan.hocKy,
            nienKhoa: d.lopHocPhan.nienKhoa,
            nganh: d.lopHocPhan.nganh,
            ngayDangKy: d.ngayDangKy,
            loaiThamGia: d.loaiThamGia,
        }));

        return {
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}