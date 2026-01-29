import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
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
import { ApDungChuongTrinhDT } from 'src/dao-tao/entity/ap-dung-chuong-trinh-dt.entity';
import { ChiTietChuongTrinhDaoTao } from 'src/dao-tao/entity/chi-tiet-chuong-trinh-dao-tao.entity';
import { KetQuaHocTap } from 'src/ket-qua/entity/ket-qua-hoc-tap.entity';
import { NienKhoa } from 'src/danh-muc/entity/nien-khoa.entity';

// Enum kết quả xét tốt nghiệp
enum KetQuaXetTotNghiep {
    DAT = 'Đạt',
    KHONG_DAT = 'Không đạt',
    KHONG_DU_DIEU_KIEN = 'Không đủ điều kiện',
}

// Enum xếp loại tốt nghiệp
enum XepLoaiTotNghiep {
    XUAT_SAC = 'Xuất sắc',
    GIOI = 'Giỏi',
    KHA = 'Khá',
    TRUNG_BINH = 'Trung bình',
    KHONG_DAT = 'Không đạt',
    KHONG_XET = 'Không xét',
}

// Interface cho dữ liệu sinh viên xét tốt nghiệp
interface SinhVienXetTotNghiep {
    stt: number;
    maSinhVien: string;
    hoTen: string;
    ngaySinh: Date;
    gioiTinh: string;
    maNienKhoa: string;
    maNganh: string;
    tenNganh: string;
    maLop: string;
    gpa: number | null;
    ketQuaXet: KetQuaXetTotNghiep;
    xepLoaiTotNghiep: XepLoaiTotNghiep;
    ngayXet: Date;
    lyDo: string;
}

// Interface mới - tối ưu hóa, chỉ lưu thông tin cần thiết
interface KetQuaTheoMonHocOptimized {
    monHocId: number;
    tenMonHoc: string;
    diemTBCHPCaoNhatDaKhoaDiem: number | null;
    coLopChuaKhoaDiem: boolean;
}

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
        @InjectRepository(ApDungChuongTrinhDT)
        private apDungRepo: Repository<ApDungChuongTrinhDT>,
        @InjectRepository(KetQuaHocTap)
        private ketQuaRepo: Repository<KetQuaHocTap>,
        @InjectRepository(ChiTietChuongTrinhDaoTao)
        private chiTietCTDTRepo: Repository<ChiTietChuongTrinhDaoTao>,
        @InjectRepository(NienKhoa)
        private nienKhoaRepo: Repository<NienKhoa>,
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

            if (!row || row.actualCellCount === 0) continue;

            const rowNum = row.number;

            const maSinhVien = row.getCell(2).value?.toString().trim(); // Mã sinh viên
            const hoTen = row.getCell(3).value?.toString().trim(); // Họ tên
            const ngaySinh = row.getCell(4).value?.toString(); // Ngày sinh
            const gioiTinhStr = row.getCell(5).value?.toString(); // Giới tính
            const diaChi = row.getCell(6).value?.toString(); // Địa chỉ
            const email = this.getCellValue(row.getCell(7)).trim(); // Email
            const sdt = row.getCell(8).value?.toString(); // Số điện thoại
            const ngayNhapHoc = row.getCell(9).value?.toString(); // Ngày nhập học
            const tinhTrangStr = row.getCell(10).value?.toString(); // Tình trạng học tập
            const maLop = row.getCell(11).value?.toString().trim(); // Mã lớp

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
            .leftJoinAndSelect('lop.nienKhoa', 'nienKhoa')
            // ── THÊM QUAN HỆ VỚI TÀI KHOẢN (NguoiDung) ──
            .leftJoinAndSelect('sv.nguoiDung', 'nd');

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

        // Transform dữ liệu để chỉ trả các trường cần thiết của nguoiDung (hoặc null)
        const transformedData = items.map(sv => ({
            ...sv,
            nguoiDung: sv.nguoiDung
                ? {
                    id: sv.nguoiDung.id,
                    tenDangNhap: sv.nguoiDung.tenDangNhap,
                    vaiTro: sv.nguoiDung.vaiTro,
                    ngayTao: sv.nguoiDung.ngayTao,
                    // Có thể thêm các trường khác nếu cần, nhưng tránh lộ thông tin nhạy cảm
                    // ví dụ: email: sv.nguoiDung.email (nếu bạn muốn thêm)
                }
                : null,
        }));

        return {
            data: transformedData,
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

        const existMa = await this.sinhVienRepo.findOne({
            where: { maSinhVien: dto.maSinhVien, id: Not(id) },
        });
        if (existMa) throw new BadRequestException('Mã sinh viên đã tồn tại');

        const existEmail = await this.sinhVienRepo.findOne({
            where: { email: dto.email, id: Not(id) },
        });
        if (existEmail) throw new BadRequestException('Email đã được sử dụng');

        const existSdt = await this.sinhVienRepo.findOne({
            where: { sdt: dto.sdt, id: Not(id) },
        });
        if (existSdt) throw new BadRequestException('Số điện thoại đã được sử dụng');

        // ❌ Không cho phép cập nhật sang trạng thái ĐÃ TỐT NGHIỆP
        if (dto.tinhTrang === TinhTrangHocTapEnum.DA_TOT_NGHIEP && sv.tinhTrang !== TinhTrangHocTapEnum.DA_TOT_NGHIEP) {
            throw new BadRequestException(
                'Không được phép cập nhật tình trạng sinh viên sang ĐÃ TỐT NGHIỆP'
            );
        }

        // ❌ Không cho phép sửa sinh viên đã tốt nghiệp thành tình trạng khác
        if (sv.tinhTrang === TinhTrangHocTapEnum.DA_TOT_NGHIEP && dto.tinhTrang !== undefined && dto.tinhTrang !== TinhTrangHocTapEnum.DA_TOT_NGHIEP) {
            throw new BadRequestException(
                'Không được phép thay đổi tình trạng sinh viên đã tốt nghiệp'
            );
        }

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

        if (sv.tinhTrang === TinhTrangHocTapEnum.DA_TOT_NGHIEP && dto.tinhTrang !== TinhTrangHocTapEnum.DA_TOT_NGHIEP) {
            throw new BadRequestException(
                'Không được phép thay đổi tình trạng sinh viên đã tốt nghiệp'
            );
        }

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
        const { hocKyId } = query;

        // Tìm sinh viên từ userId
        const nguoiDung = await this.nguoiDungRepo.findOne({
            where: { id: userId },
            relations: ['sinhVien'],
        });

        if (!nguoiDung || !nguoiDung.sinhVien) {
            throw new NotFoundException('Không tìm thấy thông tin sinh viên của bạn');
        }

        const sinhVienId = nguoiDung.sinhVien.id;

        // Query builder (không phân trang)
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
            .addOrderBy('hocKy.hocKy', 'ASC')
            .addOrderBy('monHoc.tenMonHoc', 'ASC');

        // Không phân trang → lấy toàn bộ
        const items = await qb.getMany();

        // Map lại dữ liệu trả về
        const data = items.map(d => ({
            id: d.lopHocPhan.id,
            maLopHocPhan: d.lopHocPhan.maLopHocPhan,
            monHoc: d.lopHocPhan.monHoc,
            giangVien: d.lopHocPhan.giangVien
                ? { hoTen: d.lopHocPhan.giangVien.hoTen }
                : null,
            hocKy: d.lopHocPhan.hocKy,
            nienKhoa: d.lopHocPhan.nienKhoa,
            nganh: d.lopHocPhan.nganh,
            ngayDangKy: d.ngayDangKy,
            loaiThamGia: d.loaiThamGia,
        }));

        return { data };
    }


    async xetTotNghiepVaXuatExcel(nienKhoaId: number): Promise<Buffer> {
        // 1. Lấy thông tin niên khóa
        const nienKhoa = await this.nienKhoaRepo.findOne({
            where: { id: nienKhoaId },
        });

        if (!nienKhoa) {
            throw new NotFoundException(`Niên khóa ID ${nienKhoaId} không tồn tại`);
        }

        // 2. Lấy tất cả các ngành có lớp thuộc niên khóa này
        const lops = await this.lopRepo.find({
            where: {
                nienKhoa: { id: nienKhoaId },
            },
            relations: ['sinhViens', 'nganh', 'nganh.khoa', 'nienKhoa'],
        });

        if (!lops.length) {
            throw new NotFoundException(
                `Không tìm thấy lớp nào thuộc niên khóa "${nienKhoa.tenNienKhoa}"`,
            );
        }

        // Nhóm lớp theo ngành
        const lopTheoNganh = new Map<number, { nganh: any; lops: Lop[] }>();
        for (const lop of lops) {
            const nganhId = lop.nganh.id;
            if (!lopTheoNganh.has(nganhId)) {
                lopTheoNganh.set(nganhId, { nganh: lop.nganh, lops: [] });
            }
            lopTheoNganh.get(nganhId)!.lops.push(lop);
        }

        // 3. Lấy tất cả chương trình đào tạo áp dụng cho niên khóa này
        const apDungs = await this.apDungRepo.find({
            where: {
                nienKhoa: { id: nienKhoaId },
            },
            relations: ['chuongTrinh', 'nganh'],
        });

        // Map ngành -> chương trình đào tạo
        const ctdtTheoNganh = new Map<number, typeof apDungs[0]>();
        for (const apDung of apDungs) {
            ctdtTheoNganh.set(apDung.nganh.id, apDung);
        }

        // 4. Thu thập và xét tốt nghiệp cho tất cả sinh viên
        const ngayXet = new Date();
        const danhSachSinhVienXuatExcel: SinhVienXetTotNghiep[] = [];
        let stt = 0;

        // Interface cho sinh viên cần xét
        interface SinhVienCanXet {
            sinhVien: SinhVien;
            lop: Lop;
            nganh: any;
            ketQuaTheoMon: Map<number, KetQuaTheoMonHocOptimized>;
            lyDoKhongDat: string[];
        }

        for (const [nganhId, { nganh, lops: lopsOfNganh }] of lopTheoNganh) {
            const apDung = ctdtTheoNganh.get(nganhId);

            // Lấy danh sách môn bắt buộc (nếu có chương trình đào tạo)
            let requiredMonHocIds = new Set<number>();
            let requiredMonHocMap = new Map<number, string>(); // monHocId -> tenMonHoc

            if (apDung) {
                const chiTietCTDTs = await this.chiTietCTDTRepo.find({
                    where: { chuongTrinh: { id: apDung.chuongTrinh.id } },
                    relations: ['monHoc'],
                });
                for (const ct of chiTietCTDTs) {
                    requiredMonHocIds.add(ct.monHoc.id);
                    requiredMonHocMap.set(ct.monHoc.id, ct.monHoc.tenMonHoc);
                }
            }

            // Xử lý từng lớp của ngành
            for (const lop of lopsOfNganh) {
                for (const sinhVien of lop.sinhViens) {
                    // Chỉ xét sinh viên đang học
                    if (sinhVien.tinhTrang !== TinhTrangHocTapEnum.DANG_HOC) {
                        continue;
                    }

                    const lyDoKhongDat: string[] = [];

                    // Nếu không có chương trình đào tạo áp dụng
                    if (!apDung) {
                        lyDoKhongDat.push(`Không tìm thấy chương trình đào tạo áp dụng cho ngành "${nganh.tenNganh}" và niên khóa "${nienKhoa.tenNienKhoa}"`);

                        stt++;
                        danhSachSinhVienXuatExcel.push({
                            stt,
                            maSinhVien: sinhVien.maSinhVien,
                            hoTen: sinhVien.hoTen,
                            ngaySinh: sinhVien.ngaySinh,
                            gioiTinh: this.mapGioiTinh(sinhVien.gioiTinh),
                            maNienKhoa: nienKhoa.maNienKhoa,
                            maNganh: nganh.maNganh,
                            tenNganh: nganh.tenNganh,
                            maLop: lop.maLop,
                            gpa: null,
                            ketQuaXet: KetQuaXetTotNghiep.KHONG_DU_DIEU_KIEN,
                            xepLoaiTotNghiep: XepLoaiTotNghiep.KHONG_XET,
                            ngayXet,
                            lyDo: lyDoKhongDat.join('; '),
                        });
                        continue;
                    }

                    // Lấy tất cả kết quả học tập của sinh viên
                    const ketQuas = await this.ketQuaRepo.find({
                        where: { sinhVien: { id: sinhVien.id } },
                        relations: ['lopHocPhan', 'lopHocPhan.monHoc'],
                    });

                    // Nhóm kết quả theo môn học
                    const ketQuaTheoMon = new Map<number, KetQuaTheoMonHocOptimized>();

                    for (const kq of ketQuas) {
                        const monHocId = kq.lopHocPhan.monHoc.id;
                        const tenMonHoc = kq.lopHocPhan.monHoc.tenMonHoc;
                        const diemTBCHP = this.tinhDiemTBCHP(kq);
                        const khoaDiem = kq.lopHocPhan.khoaDiem;

                        if (!ketQuaTheoMon.has(monHocId)) {
                            ketQuaTheoMon.set(monHocId, {
                                monHocId,
                                tenMonHoc,
                                diemTBCHPCaoNhatDaKhoaDiem: khoaDiem ? diemTBCHP : null,
                                coLopChuaKhoaDiem: !khoaDiem,
                            });
                        } else {
                            const existing = ketQuaTheoMon.get(monHocId)!;

                            if (khoaDiem) {
                                if (
                                    existing.diemTBCHPCaoNhatDaKhoaDiem === null ||
                                    diemTBCHP > existing.diemTBCHPCaoNhatDaKhoaDiem
                                ) {
                                    existing.diemTBCHPCaoNhatDaKhoaDiem = diemTBCHP;
                                }
                            }

                            if (!khoaDiem) {
                                existing.coLopChuaKhoaDiem = true;
                            }
                        }
                    }

                    // BƯỚC 1: Kiểm tra điều kiện xét tốt nghiệp
                    let khongDuDieuKien = false;

                    for (const monHocId of requiredMonHocIds) {
                        const tenMonHoc = requiredMonHocMap.get(monHocId) || `Môn ID ${monHocId}`;
                        const ketQuaMon = ketQuaTheoMon.get(monHocId);

                        if (!ketQuaMon) {
                            lyDoKhongDat.push(`Chưa có kết quả học tập môn bắt buộc: ${tenMonHoc}`);
                            khongDuDieuKien = true;
                            continue;
                        }

                        if (ketQuaMon.coLopChuaKhoaDiem) {
                            lyDoKhongDat.push(`Môn ${tenMonHoc} còn lớp học phần chưa khóa điểm`);
                            khongDuDieuKien = true;
                            continue;
                        }

                        if (ketQuaMon.diemTBCHPCaoNhatDaKhoaDiem === null) {
                            lyDoKhongDat.push(`Môn ${tenMonHoc} chưa có điểm đã khóa`);
                            khongDuDieuKien = true;
                            continue;
                        }
                    }

                    if (khongDuDieuKien) {
                        const gpa = this.tinhGPAOptimized(ketQuaTheoMon);
                        stt++;
                        danhSachSinhVienXuatExcel.push({
                            stt,
                            maSinhVien: sinhVien.maSinhVien,
                            hoTen: sinhVien.hoTen,
                            ngaySinh: sinhVien.ngaySinh,
                            gioiTinh: this.mapGioiTinh(sinhVien.gioiTinh),
                            maNienKhoa: nienKhoa.maNienKhoa,
                            maNganh: nganh.maNganh,
                            tenNganh: nganh.tenNganh,
                            maLop: lop.maLop,
                            gpa,
                            ketQuaXet: KetQuaXetTotNghiep.KHONG_DU_DIEU_KIEN,
                            xepLoaiTotNghiep: XepLoaiTotNghiep.KHONG_XET,
                            ngayXet,
                            lyDo: lyDoKhongDat.join('; '),
                        });
                        continue;
                    }

                    // BƯỚC 2: Kiểm tra điều kiện ĐẠT hay KHÔNG ĐẠT
                    let datTotNghiep = true;

                    // Điều kiện 1: Tất cả môn bắt buộc phải đạt >= 4.0
                    for (const monHocId of requiredMonHocIds) {
                        const tenMonHoc = requiredMonHocMap.get(monHocId) || `Môn ID ${monHocId}`;
                        const ketQuaMon = ketQuaTheoMon.get(monHocId)!;

                        if (ketQuaMon.diemTBCHPCaoNhatDaKhoaDiem! < 4.0) {
                            lyDoKhongDat.push(`Môn ${tenMonHoc} có điểm TBCHP cao nhất ${ketQuaMon.diemTBCHPCaoNhatDaKhoaDiem!.toFixed(2)} < 4.0`);
                            datTotNghiep = false;
                        }
                    }

                    // Tính GPA
                    const gpa = this.tinhGPAOptimized(ketQuaTheoMon);

                    // Điều kiện 2: GPA >= 2.0
                    if (gpa === null || gpa < 2.0) {
                        lyDoKhongDat.push(`GPA ${gpa !== null ? gpa.toFixed(2) : 'N/A'} < 2.00`);
                        datTotNghiep = false;
                    }

                    if (datTotNghiep) {
                        // Cập nhật trạng thái sinh viên
                        sinhVien.tinhTrang = TinhTrangHocTapEnum.DA_TOT_NGHIEP;
                        await this.sinhVienRepo.save(sinhVien);

                        // Xếp loại tốt nghiệp
                        const xepLoai = this.xepLoaiTotNghiep(gpa!);

                        stt++;
                        danhSachSinhVienXuatExcel.push({
                            stt,
                            maSinhVien: sinhVien.maSinhVien,
                            hoTen: sinhVien.hoTen,
                            ngaySinh: sinhVien.ngaySinh,
                            gioiTinh: this.mapGioiTinh(sinhVien.gioiTinh),
                            maNienKhoa: nienKhoa.maNienKhoa,
                            maNganh: nganh.maNganh,
                            tenNganh: nganh.tenNganh,
                            maLop: lop.maLop,
                            gpa,
                            ketQuaXet: KetQuaXetTotNghiep.DAT,
                            xepLoaiTotNghiep: xepLoai,
                            ngayXet,
                            lyDo: '',
                        });
                    } else {
                        stt++;
                        danhSachSinhVienXuatExcel.push({
                            stt,
                            maSinhVien: sinhVien.maSinhVien,
                            hoTen: sinhVien.hoTen,
                            ngaySinh: sinhVien.ngaySinh,
                            gioiTinh: this.mapGioiTinh(sinhVien.gioiTinh),
                            maNienKhoa: nienKhoa.maNienKhoa,
                            maNganh: nganh.maNganh,
                            tenNganh: nganh.tenNganh,
                            maLop: lop.maLop,
                            gpa,
                            ketQuaXet: KetQuaXetTotNghiep.KHONG_DAT,
                            xepLoaiTotNghiep: XepLoaiTotNghiep.KHONG_DAT,
                            ngayXet,
                            lyDo: lyDoKhongDat.join('; '),
                        });
                    }
                }
            }
        }

        // Thống kê
        const soSinhVienDat = danhSachSinhVienXuatExcel.filter(sv => sv.ketQuaXet === KetQuaXetTotNghiep.DAT).length;
        const soSinhVienKhongDat = danhSachSinhVienXuatExcel.filter(sv => sv.ketQuaXet === KetQuaXetTotNghiep.KHONG_DAT).length;
        const soSinhVienKhongDuDieuKien = danhSachSinhVienXuatExcel.filter(sv => sv.ketQuaXet === KetQuaXetTotNghiep.KHONG_DU_DIEU_KIEN).length;
        const tongSinhVienDuocXet = danhSachSinhVienXuatExcel.length;

        // Thống kê theo xếp loại
        const soXuatSac = danhSachSinhVienXuatExcel.filter(sv => sv.xepLoaiTotNghiep === XepLoaiTotNghiep.XUAT_SAC).length;
        const soGioi = danhSachSinhVienXuatExcel.filter(sv => sv.xepLoaiTotNghiep === XepLoaiTotNghiep.GIOI).length;
        const soKha = danhSachSinhVienXuatExcel.filter(sv => sv.xepLoaiTotNghiep === XepLoaiTotNghiep.KHA).length;
        const soTrungBinh = danhSachSinhVienXuatExcel.filter(sv => sv.xepLoaiTotNghiep === XepLoaiTotNghiep.TRUNG_BINH).length;

        // Lấy danh sách ngành để hiển thị
        const danhSachNganh = Array.from(lopTheoNganh.values()).map(item => item.nganh.tenNganh).join(', ');

        // 5. Tạo file Excel
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Hệ thống quản lý đào tạo';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet('Thống kê xét tốt nghiệp', {
            pageSetup: {
                paperSize: 9,
                orientation: 'landscape',
                fitToPage: true,
            },
        });

        // ========== HEADER SECTION ==========
        worksheet.mergeCells('A1:M1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'THỐNG KÊ XÉT TỐT NGHIỆP SINH VIÊN';
        titleCell.font = { name: 'Times New Roman', size: 18, bold: true, color: { argb: '1F4E79' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(1).height = 35;

        worksheet.mergeCells('A2:M2');
        const subTitleCell = worksheet.getCell('A2');
        subTitleCell.value = `Niên khóa: ${nienKhoa.tenNienKhoa} (${nienKhoa.namBatDau} - ${nienKhoa.namKetThuc})`;
        subTitleCell.font = { name: 'Times New Roman', size: 12, italic: true };
        subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(2).height = 25;

        worksheet.mergeCells('A3:M3');
        const nganhCell = worksheet.getCell('A3');
        nganhCell.value = `Các ngành được xét: ${danhSachNganh}`;
        nganhCell.font = { name: 'Times New Roman', size: 11, italic: true };
        nganhCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(3).height = 22;

        worksheet.mergeCells('A4:M4');
        const dateCell = worksheet.getCell('A4');
        dateCell.value = `Ngày xét tốt nghiệp: ${this.formatDate(ngayXet)}`;
        dateCell.font = { name: 'Times New Roman', size: 11 };
        dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(4).height = 22;

        worksheet.getRow(5).height = 10;

        // ========== THỐNG KÊ TỔNG QUAN ==========
        worksheet.mergeCells('A6:F6');
        worksheet.getCell('A6').value = 'THỐNG KÊ TỔNG QUAN';
        worksheet.getCell('A6').font = { name: 'Times New Roman', size: 13, bold: true, color: { argb: 'FFFFFF' } };
        worksheet.getCell('A6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2E75B6' } };
        worksheet.getCell('A6').alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(6).height = 25;

        worksheet.mergeCells('G6:M6');
        worksheet.getCell('G6').value = 'THỐNG KÊ XẾP LOẠI TỐT NGHIỆP';
        worksheet.getCell('G6').font = { name: 'Times New Roman', size: 13, bold: true, color: { argb: 'FFFFFF' } };
        worksheet.getCell('G6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '548235' } };
        worksheet.getCell('G6').alignment = { horizontal: 'center', vertical: 'middle' };

        const statsData = [
            { label: 'Tổng sinh viên được xét:', value: tongSinhVienDuocXet, color: '305496' },
            { label: 'Sinh viên đạt tốt nghiệp:', value: soSinhVienDat, color: '548235' },
            { label: 'Sinh viên không đạt:', value: soSinhVienKhongDat, color: 'C65911' },
            { label: 'Sinh viên không đủ điều kiện:', value: soSinhVienKhongDuDieuKien, color: '7F7F7F' },
        ];

        const xepLoaiStats = [
            { label: 'Xuất sắc:', value: soXuatSac, color: '7030A0' },
            { label: 'Giỏi:', value: soGioi, color: '00B050' },
            { label: 'Khá:', value: soKha, color: '0070C0' },
            { label: 'Trung bình:', value: soTrungBinh, color: 'FFC000' },
        ];

        statsData.forEach((stat, index) => {
            const rowNum = 7 + index;
            worksheet.mergeCells(`A${rowNum}:E${rowNum}`);
            const labelCell = worksheet.getCell(`A${rowNum}`);
            labelCell.value = stat.label;
            labelCell.font = { name: 'Times New Roman', size: 11, bold: true };
            labelCell.alignment = { horizontal: 'left', vertical: 'middle' };

            const valueCell = worksheet.getCell(`F${rowNum}`);
            valueCell.value = stat.value;
            valueCell.font = { name: 'Times New Roman', size: 12, bold: true, color: { argb: stat.color } };
            valueCell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        xepLoaiStats.forEach((stat, index) => {
            const rowNum = 7 + index;
            worksheet.mergeCells(`G${rowNum}:L${rowNum}`);
            const labelCell = worksheet.getCell(`G${rowNum}`);
            labelCell.value = stat.label;
            labelCell.font = { name: 'Times New Roman', size: 11, bold: true };
            labelCell.alignment = { horizontal: 'left', vertical: 'middle' };

            const valueCell = worksheet.getCell(`M${rowNum}`);
            valueCell.value = stat.value;
            valueCell.font = { name: 'Times New Roman', size: 12, bold: true, color: { argb: stat.color } };
            valueCell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        worksheet.getRow(7).height = 22;
        worksheet.getRow(8).height = 22;
        worksheet.getRow(9).height = 22;
        worksheet.getRow(10).height = 22;
        worksheet.getRow(11).height = 15;

        // ========== BẢNG DỮ LIỆU ==========
        const tableStartRow = 12;

        const headers = [
            { header: 'STT', key: 'stt', width: 6 },
            { header: 'Mã sinh viên', key: 'maSinhVien', width: 15 },
            { header: 'Họ và tên', key: 'hoTen', width: 25 },
            { header: 'Ngày sinh', key: 'ngaySinh', width: 12 },
            { header: 'Giới tính', key: 'gioiTinh', width: 12 },
            { header: 'Mã niên khóa', key: 'maNienKhoa', width: 15 },
            { header: 'Mã ngành', key: 'maNganh', width: 15 },
            { header: 'Tên ngành', key: 'tenNganh', width: 20 },
            { header: 'Mã lớp', key: 'maLop', width: 22 },
            { header: 'GPA', key: 'gpa', width: 8 },
            { header: 'Kết quả xét TN', key: 'ketQuaXet', width: 25 },
            { header: 'Xếp loại TN', key: 'xepLoaiTotNghiep', width: 15 },
            { header: 'Ngày xét TN', key: 'ngayXet', width: 12 },
            { header: 'Lý do', key: 'lyDo', width: 50 },
        ];

        headers.forEach((col, index) => {
            worksheet.getColumn(index + 1).width = col.width;
        });

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

        danhSachSinhVienXuatExcel.forEach((sv, index) => {
            const rowIndex = tableStartRow + 1 + index;
            const row = worksheet.getRow(rowIndex);

            const rowData = [
                sv.stt,
                sv.maSinhVien,
                sv.hoTen,
                this.formatDate(sv.ngaySinh),
                sv.gioiTinh,
                sv.maNienKhoa,
                sv.maNganh,
                sv.tenNganh,
                sv.maLop,
                sv.gpa !== null ? sv.gpa.toFixed(2) : 'N/A',
                sv.ketQuaXet,
                sv.xepLoaiTotNghiep,
                this.formatDate(sv.ngayXet),
                sv.lyDo,
            ];

            rowData.forEach((value, colIndex) => {
                const cell = row.getCell(colIndex + 1);
                cell.value = value;
                cell.font = { name: 'Times New Roman', size: 11 };
                cell.alignment = {
                    horizontal: colIndex === 0 || (colIndex >= 3 && colIndex <= 5) || colIndex === 8 || colIndex === 9 || colIndex === 12 ? 'center' : 'left',
                    vertical: 'middle',
                    wrapText: colIndex === 13, // Wrap text cho cột lý do
                };
                cell.border = {
                    top: { style: 'thin', color: { argb: '000000' } },
                    left: { style: 'thin', color: { argb: '000000' } },
                    bottom: { style: 'thin', color: { argb: '000000' } },
                    right: { style: 'thin', color: { argb: '000000' } },
                };

                if (index % 2 === 1) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D6DCE4' } };
                }

                // Màu cho cột Kết quả xét TN
                if (colIndex === 10) {
                    cell.font = { name: 'Times New Roman', size: 11, bold: true };
                    if (sv.ketQuaXet === KetQuaXetTotNghiep.DAT) {
                        cell.font.color = { argb: '548235' };
                    } else if (sv.ketQuaXet === KetQuaXetTotNghiep.KHONG_DAT) {
                        cell.font.color = { argb: 'C65911' };
                    } else {
                        cell.font.color = { argb: '7F7F7F' };
                    }
                }

                // Màu cho cột Xếp loại TN
                if (colIndex === 11) {
                    cell.font = { name: 'Times New Roman', size: 11, bold: true };
                    switch (sv.xepLoaiTotNghiep) {
                        case XepLoaiTotNghiep.XUAT_SAC:
                            cell.font.color = { argb: '7030A0' }; // Tím
                            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2D5F1' } };
                            break;
                        case XepLoaiTotNghiep.GIOI:
                            cell.font.color = { argb: '00B050' }; // Xanh lá
                            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C6EFCE' } };
                            break;
                        case XepLoaiTotNghiep.KHA:
                            cell.font.color = { argb: '0070C0' }; // Xanh dương
                            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'BDD7EE' } };
                            break;
                        case XepLoaiTotNghiep.TRUNG_BINH:
                            cell.font.color = { argb: 'C65911' }; // Cam
                            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FCE4D6' } };
                            break;
                        case XepLoaiTotNghiep.KHONG_DAT:
                            cell.font.color = { argb: 'FF0000' }; // Đỏ
                            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC7CE' } };
                            break;
                        case XepLoaiTotNghiep.KHONG_XET:
                            cell.font.color = { argb: '7F7F7F' }; // Xám
                            break;
                    }
                }

                // Màu cho cột GPA
                if (colIndex === 9 && sv.gpa !== null) {
                    cell.font = { name: 'Times New Roman', size: 11, bold: true };
                    if (sv.gpa >= 3.6) {
                        cell.font.color = { argb: '7030A0' };
                    } else if (sv.gpa >= 3.2) {
                        cell.font.color = { argb: '00B050' };
                    } else if (sv.gpa >= 2.5) {
                        cell.font.color = { argb: '0070C0' };
                    } else if (sv.gpa >= 2.0) {
                        cell.font.color = { argb: 'C65911' };
                    } else {
                        cell.font.color = { argb: 'FF0000' };
                    }
                }
            });

            row.height = sv.lyDo ? Math.max(22, Math.ceil(sv.lyDo.length / 60) * 15) : 22;
        });

        // ========== FOOTER ==========
        const footerRow = tableStartRow + danhSachSinhVienXuatExcel.length + 2;
        worksheet.mergeCells(`A${footerRow}:N${footerRow}`);
        const footerCell = worksheet.getCell(`A${footerRow}`);
        footerCell.value = `Báo cáo được xuất tự động từ hệ thống vào lúc ${this.formatDateTime(new Date())}`;
        footerCell.font = { name: 'Times New Roman', size: 10, italic: true, color: { argb: '808080' } };
        footerCell.alignment = { horizontal: 'right', vertical: 'middle' };

        // 6. Xuất buffer
        const buffer = await workbook.xlsx.writeBuffer();
        return buffer as unknown as Buffer;
    }

    /**
     * Xếp loại tốt nghiệp dựa trên GPA
     */
    private xepLoaiTotNghiep(gpa: number): XepLoaiTotNghiep {
        if (gpa >= 3.60) return XepLoaiTotNghiep.XUAT_SAC;
        if (gpa >= 3.20) return XepLoaiTotNghiep.GIOI;
        if (gpa >= 2.50) return XepLoaiTotNghiep.KHA;
        if (gpa >= 2.00) return XepLoaiTotNghiep.TRUNG_BINH;
        return XepLoaiTotNghiep.KHONG_DAT;
    }

    // ========== HELPER METHODS ==========

    /**
     * Tính điểm TBCHP (Trung bình cộng học phần) theo hệ 10
     */
    private tinhDiemTBCHP(kq: KetQuaHocTap): number {
        return kq.diemQuaTrinh * 0.1 + kq.diemThanhPhan * 0.3 + kq.diemThi * 0.6;
    }

    /**
     * Quy đổi điểm hệ 10 sang hệ 4
     */
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

    /**
 * Tính GPA của sinh viên (phiên bản tối ưu)
 * - Sử dụng trực tiếp điểm cao nhất đã được tính sẵn trong Map
 * - GPA = Trung bình cộng các điểm hệ 4 của tất cả các môn đã khóa điểm
 */
    private tinhGPAOptimized(ketQuaTheoMon: Map<number, KetQuaTheoMonHocOptimized>): number | null {
        if (ketQuaTheoMon.size === 0) {
            return null;
        }

        let tongDiemHe4 = 0;
        let soMonDuocXet = 0;

        for (const [monHocId, data] of ketQuaTheoMon) {
            // Chỉ xét các môn có điểm đã khóa điểm
            if (data.diemTBCHPCaoNhatDaKhoaDiem === null) {
                continue;
            }

            // Quy đổi sang hệ 4
            const diemHe4 = this.diemHe10ToHe4(data.diemTBCHPCaoNhatDaKhoaDiem);

            tongDiemHe4 += diemHe4;
            soMonDuocXet++;
        }

        if (soMonDuocXet === 0) {
            return null;
        }

        return tongDiemHe4 / soMonDuocXet;
    }

    /**
     * Kiểm tra sinh viên đạt môn hay không
     * Đạt nếu có ít nhất 1 kết quả học tập của môn đó có TBCHP >= 4.0
     */
    private isDat(kq: KetQuaHocTap): boolean {
        const diemTB = this.tinhDiemTBCHP(kq);
        return diemTB >= 4.0;
    }

    private mapGioiTinh(gioiTinh: GioiTinh): string {
        const map = {
            [GioiTinh.NAM]: 'Nam',
            [GioiTinh.NU]: 'Nữ',
            [GioiTinh.KHONG_XAC_DINH]: 'Không xác định',
        };
        return map[gioiTinh] || 'Không xác định';
    }

    private formatDate(date: Date): string {
        if (!date) return '';
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
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
}