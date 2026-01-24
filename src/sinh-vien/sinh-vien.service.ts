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

// Interface cho dữ liệu sinh viên xét tốt nghiệp
interface SinhVienXetTotNghiep {
    stt: number;
    maSinhVien: string;
    hoTen: string;
    ngaySinh: Date;
    gioiTinh: string;
    maNienKhoa: string;
    maNganh: string;
    maLop: string;
    gpa: number | null;
    ketQuaXet: KetQuaXetTotNghiep;
    ngayXet: Date;
}

// Interface mới - tối ưu hóa, chỉ lưu thông tin cần thiết
interface KetQuaTheoMonHocOptimized {
    monHocId: number;
    diemTBCHPCaoNhatDaKhoaDiem: number | null; // Điểm cao nhất trong các LHP đã khóa điểm
    coLopChuaKhoaDiem: boolean; // Có lớp nào chưa khóa điểm không
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


    async xetTotNghiepVaXuatExcel(nienKhoaId: number, nganhId: number): Promise<Buffer> {
        // 1. Lấy thông tin niên khóa
        const nienKhoa = await this.nienKhoaRepo.findOne({
            where: { id: nienKhoaId },
        });

        if (!nienKhoa) {
            throw new NotFoundException(`Niên khóa ID ${nienKhoaId} không tồn tại`);
        }

        // 2. Lấy thông tin ngành
        const nganh = await this.lopRepo.manager.getRepository('Nganh').findOne({
            where: { id: nganhId },
            relations: ['khoa'],
        }) as any;

        if (!nganh) {
            throw new NotFoundException(`Ngành ID ${nganhId} không tồn tại`);
        }

        // 3. Lấy tất cả lớp thuộc niên khóa VÀ ngành
        const lops = await this.lopRepo.find({
            where: {
                nienKhoa: { id: nienKhoaId },
                nganh: { id: nganhId },
            },
            relations: ['sinhViens', 'nganh', 'nienKhoa'],
        });

        if (!lops.length) {
            throw new NotFoundException(
                `Không tìm thấy lớp nào thuộc niên khóa "${nienKhoa.tenNienKhoa}" và ngành "${nganh.tenNganh}"`,
            );
        }

        // 4. Tìm chương trình đào tạo áp dụng
        const apDung = await this.apDungRepo.findOne({
            where: {
                nganh: { id: nganhId },
                nienKhoa: { id: nienKhoaId },
            },
            relations: ['chuongTrinh'],
        });

        if (!apDung) {
            throw new NotFoundException(
                `Không tìm thấy chương trình đào tạo áp dụng cho ngành "${nganh.tenNganh}" và niên khóa "${nienKhoa.tenNienKhoa}"`,
            );
        }

        // 5. Danh sách môn bắt buộc
        const chiTietCTDTs = await this.chiTietCTDTRepo.find({
            where: { chuongTrinh: { id: apDung.chuongTrinh.id } },
            relations: ['monHoc'],
        });

        const requiredMonHocIds = new Set(chiTietCTDTs.map(ct => ct.monHoc.id));

        // 6. Thu thập tất cả sinh viên đang học
        const ngayXet = new Date();
        let tongSinhVien = 0;

        // Danh sách sinh viên cần xét (sử dụng interface tối ưu)
        interface SinhVienCanXet {
            sinhVien: SinhVien;
            lop: Lop;
            ketQuaTheoMon: Map<number, KetQuaTheoMonHocOptimized>;
        }

        const danhSachSinhVienCanXet: SinhVienCanXet[] = [];

        for (const lop of lops) {
            tongSinhVien += lop.sinhViens.length;

            // Chỉ xét sinh viên đang học
            const sinhViensDangHoc = lop.sinhViens.filter(
                sv => sv.tinhTrang === TinhTrangHocTapEnum.DANG_HOC,
            );

            for (const sinhVien of sinhViensDangHoc) {
                // Lấy tất cả kết quả học tập của sinh viên
                const ketQuas = await this.ketQuaRepo.find({
                    where: { sinhVien: { id: sinhVien.id } },
                    relations: ['lopHocPhan', 'lopHocPhan.monHoc'],
                });

                // ===== TỐI ƯU: Nhóm kết quả theo môn học, chỉ lưu điểm cao nhất đã khóa điểm =====
                const ketQuaTheoMon = new Map<number, KetQuaTheoMonHocOptimized>();

                for (const kq of ketQuas) {
                    const monHocId = kq.lopHocPhan.monHoc.id;
                    const diemTBCHP = this.tinhDiemTBCHP(kq);
                    const khoaDiem = kq.lopHocPhan.khoaDiem;

                    if (!ketQuaTheoMon.has(monHocId)) {
                        // Khởi tạo với kết quả đầu tiên
                        ketQuaTheoMon.set(monHocId, {
                            monHocId,
                            diemTBCHPCaoNhatDaKhoaDiem: khoaDiem ? diemTBCHP : null,
                            coLopChuaKhoaDiem: !khoaDiem,
                        });
                    } else {
                        const existing = ketQuaTheoMon.get(monHocId)!;

                        // Cập nhật điểm cao nhất (chỉ xét lớp đã khóa điểm)
                        if (khoaDiem) {
                            if (
                                existing.diemTBCHPCaoNhatDaKhoaDiem === null ||
                                diemTBCHP > existing.diemTBCHPCaoNhatDaKhoaDiem
                            ) {
                                existing.diemTBCHPCaoNhatDaKhoaDiem = diemTBCHP;
                            }
                        }

                        // Cập nhật flag có lớp chưa khóa điểm
                        if (!khoaDiem) {
                            existing.coLopChuaKhoaDiem = true;
                        }
                    }
                }

                danhSachSinhVienCanXet.push({
                    sinhVien,
                    lop,
                    ketQuaTheoMon,
                });
            }
        }

        // 7. BƯỚC 1: Xét sinh viên KHÔNG ĐỦ ĐIỀU KIỆN trước
        const danhSachKhongDuDieuKien: SinhVienCanXet[] = [];
        const danhSachDuDieuKienXet: SinhVienCanXet[] = [];

        for (const item of danhSachSinhVienCanXet) {
            const { ketQuaTheoMon } = item;
            let khongDuDieuKien = false;

            for (const monHocId of requiredMonHocIds) {
                const ketQuaMon = ketQuaTheoMon.get(monHocId);

                // Điều kiện 1: Chưa có kết quả học tập của môn bắt buộc
                if (!ketQuaMon) {
                    khongDuDieuKien = true;
                    break;
                }

                // Điều kiện 2: Còn tồn tại ít nhất một lớp học phần của môn bắt buộc chưa khóa điểm
                if (ketQuaMon.coLopChuaKhoaDiem) {
                    khongDuDieuKien = true;
                    break;
                }

                // Điều kiện 3: Chưa có điểm nào đã khóa điểm cho môn này
                if (ketQuaMon.diemTBCHPCaoNhatDaKhoaDiem === null) {
                    khongDuDieuKien = true;
                    break;
                }
            }

            if (khongDuDieuKien) {
                danhSachKhongDuDieuKien.push(item);
            } else {
                danhSachDuDieuKienXet.push(item);
            }
        }

        // 8. BƯỚC 2: Xét sinh viên ĐẠT hoặc KHÔNG ĐẠT (chỉ xét những sinh viên đủ điều kiện)
        const danhSachDat: SinhVienCanXet[] = [];
        const danhSachKhongDat: SinhVienCanXet[] = [];

        for (const item of danhSachDuDieuKienXet) {
            const { ketQuaTheoMon } = item;
            let datTotNghiep = true;

            for (const monHocId of requiredMonHocIds) {
                const ketQuaMon = ketQuaTheoMon.get(monHocId)!;

                // Kiểm tra điểm cao nhất đã khóa điểm có đạt >= 4.0 không
                if (ketQuaMon.diemTBCHPCaoNhatDaKhoaDiem! < 4.0) {
                    // Điểm cao nhất vẫn < 4.0 → Trượt môn này
                    datTotNghiep = false;
                    break;
                }
            }

            if (datTotNghiep) {
                danhSachDat.push(item);
            } else {
                danhSachKhongDat.push(item);
            }
        }

        // 9. Cập nhật trạng thái sinh viên đạt tốt nghiệp
        for (const item of danhSachDat) {
            item.sinhVien.tinhTrang = TinhTrangHocTapEnum.DA_TOT_NGHIEP;
            await this.sinhVienRepo.save(item.sinhVien);
        }

        // 10. Tạo danh sách kết quả để xuất Excel
        const danhSachSinhVienXuatExcel: SinhVienXetTotNghiep[] = [];
        let stt = 0;

        // Thêm sinh viên KHÔNG ĐỦ ĐIỀU KIỆN
        for (const item of danhSachKhongDuDieuKien) {
            stt++;
            const gpa = this.tinhGPAOptimized(item.ketQuaTheoMon);
            danhSachSinhVienXuatExcel.push({
                stt,
                maSinhVien: item.sinhVien.maSinhVien,
                hoTen: item.sinhVien.hoTen,
                ngaySinh: item.sinhVien.ngaySinh,
                gioiTinh: this.mapGioiTinh(item.sinhVien.gioiTinh),
                maNienKhoa: nienKhoa.maNienKhoa,
                maNganh: nganh.maNganh,
                maLop: item.lop.maLop,
                gpa,
                ketQuaXet: KetQuaXetTotNghiep.KHONG_DU_DIEU_KIEN,
                ngayXet,
            });
        }

        // Thêm sinh viên KHÔNG ĐẠT
        for (const item of danhSachKhongDat) {
            stt++;
            const gpa = this.tinhGPAOptimized(item.ketQuaTheoMon);
            danhSachSinhVienXuatExcel.push({
                stt,
                maSinhVien: item.sinhVien.maSinhVien,
                hoTen: item.sinhVien.hoTen,
                ngaySinh: item.sinhVien.ngaySinh,
                gioiTinh: this.mapGioiTinh(item.sinhVien.gioiTinh),
                maNienKhoa: nienKhoa.maNienKhoa,
                maNganh: nganh.maNganh,
                maLop: item.lop.maLop,
                gpa,
                ketQuaXet: KetQuaXetTotNghiep.KHONG_DAT,
                ngayXet,
            });
        }

        // Thêm sinh viên ĐẠT
        for (const item of danhSachDat) {
            stt++;
            const gpa = this.tinhGPAOptimized(item.ketQuaTheoMon);
            danhSachSinhVienXuatExcel.push({
                stt,
                maSinhVien: item.sinhVien.maSinhVien,
                hoTen: item.sinhVien.hoTen,
                ngaySinh: item.sinhVien.ngaySinh,
                gioiTinh: this.mapGioiTinh(item.sinhVien.gioiTinh),
                maNienKhoa: nienKhoa.maNienKhoa,
                maNganh: nganh.maNganh,
                maLop: item.lop.maLop,
                gpa,
                ketQuaXet: KetQuaXetTotNghiep.DAT,
                ngayXet,
            });
        }

        // Thống kê
        const soSinhVienDat = danhSachDat.length;
        const soSinhVienKhongDat = danhSachKhongDat.length;
        const soSinhVienKhongDuDieuKien = danhSachKhongDuDieuKien.length;
        const tongSinhVienDuocXet = danhSachSinhVienCanXet.length;

        // 11. Tạo file Excel (giữ nguyên phần này như code cũ)
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
        worksheet.mergeCells('A1:K1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'THỐNG KÊ XÉT TỐT NGHIỆP SINH VIÊN';
        titleCell.font = { name: 'Times New Roman', size: 18, bold: true, color: { argb: '1F4E79' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(1).height = 35;

        worksheet.mergeCells('A2:K2');
        const subTitleCell = worksheet.getCell('A2');
        subTitleCell.value = `Niên khóa: ${nienKhoa.tenNienKhoa} (${nienKhoa.namBatDau} - ${nienKhoa.namKetThuc})  |  Ngành: ${nganh.tenNganh}  |  Khoa: ${nganh.khoa?.tenKhoa || 'N/A'}`;
        subTitleCell.font = { name: 'Times New Roman', size: 12, italic: true };
        subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(2).height = 25;

        worksheet.mergeCells('A3:K3');
        const ctdtCell = worksheet.getCell('A3');
        ctdtCell.value = `Chương trình đào tạo: ${apDung.chuongTrinh.tenChuongTrinh} (${apDung.chuongTrinh.maChuongTrinh})  |  Số môn bắt buộc: ${requiredMonHocIds.size}`;
        ctdtCell.font = { name: 'Times New Roman', size: 11, italic: true };
        ctdtCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(3).height = 22;

        worksheet.mergeCells('A4:K4');
        const dateCell = worksheet.getCell('A4');
        dateCell.value = `Ngày xét tốt nghiệp: ${this.formatDate(ngayXet)}`;
        dateCell.font = { name: 'Times New Roman', size: 11 };
        dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(4).height = 22;

        worksheet.getRow(5).height = 10;

        // ========== THỐNG KÊ TỔNG QUAN ==========
        worksheet.mergeCells('A6:E6');
        worksheet.getCell('A6').value = 'THỐNG KÊ TỔNG QUAN';
        worksheet.getCell('A6').font = { name: 'Times New Roman', size: 13, bold: true, color: { argb: 'FFFFFF' } };
        worksheet.getCell('A6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2E75B6' } };
        worksheet.getCell('A6').alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(6).height = 25;

        const statsData = [
            { label: 'Tổng sinh viên được xét:', value: tongSinhVienDuocXet, color: '305496' },
            { label: 'Sinh viên đạt tốt nghiệp:', value: soSinhVienDat, color: '548235' },
            { label: 'Sinh viên không đạt:', value: soSinhVienKhongDat, color: 'C65911' },
            { label: 'Sinh viên không đủ điều kiện:', value: soSinhVienKhongDuDieuKien, color: '7F7F7F' },
        ];

        statsData.forEach((stat, index) => {
            const labelCol = index % 2 === 0 ? 'A' : 'G';
            const valueCol = index % 2 === 0 ? 'E' : 'K';
            const rowNum = 7 + Math.floor(index / 2);

            worksheet.mergeCells(`${labelCol}${rowNum}:${String.fromCharCode(labelCol.charCodeAt(0) + 3)}${rowNum}`);
            const labelCell = worksheet.getCell(`${labelCol}${rowNum}`);
            labelCell.value = stat.label;
            labelCell.font = { name: 'Times New Roman', size: 11, bold: true };
            labelCell.alignment = { horizontal: 'left', vertical: 'middle' };

            const valueCell = worksheet.getCell(`${valueCol}${rowNum}`);
            valueCell.value = stat.value;
            valueCell.font = { name: 'Times New Roman', size: 12, bold: true, color: { argb: stat.color } };
            valueCell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        worksheet.getRow(7).height = 22;
        worksheet.getRow(8).height = 22;
        worksheet.getRow(9).height = 15;

        // ========== BẢNG DỮ LIỆU ==========
        const tableStartRow = 10;

        const headers = [
            { header: 'STT', key: 'stt', width: 6 },
            { header: 'Mã sinh viên', key: 'maSinhVien', width: 19 },
            { header: 'Họ và tên', key: 'hoTen', width: 25 },
            { header: 'Ngày sinh', key: 'ngaySinh', width: 19 },
            { header: 'Giới tính', key: 'gioiTinh', width: 19 },
            { header: 'Mã niên khóa', key: 'maNienKhoa', width: 19 },
            { header: 'Mã ngành', key: 'maNganh', width: 19 },
            { header: 'Mã lớp', key: 'maLop', width: 25 },
            { header: 'GPA', key: 'gpa', width: 12 },
            { header: 'Kết quả xét TN', key: 'ketQuaXet', width: 25 },
            { header: 'Ngày xét TN', key: 'ngayXet', width: 19 },
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
                sv.maLop,
                sv.gpa !== null ? sv.gpa.toFixed(2) : 'N/A',
                sv.ketQuaXet,
                this.formatDate(sv.ngayXet),
            ];

            rowData.forEach((value, colIndex) => {
                const cell = row.getCell(colIndex + 1);
                cell.value = value;
                cell.font = { name: 'Times New Roman', size: 11 };
                cell.alignment = {
                    horizontal: colIndex === 0 || colIndex >= 3 ? 'center' : 'left',
                    vertical: 'middle',
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

                if (colIndex === 9) {
                    cell.font = { name: 'Times New Roman', size: 11, bold: true };
                    if (sv.ketQuaXet === KetQuaXetTotNghiep.DAT) {
                        cell.font.color = { argb: '548235' };
                    } else if (sv.ketQuaXet === KetQuaXetTotNghiep.KHONG_DAT) {
                        cell.font.color = { argb: 'C65911' };
                    } else {
                        cell.font.color = { argb: '7F7F7F' };
                    }
                }

                if (colIndex === 8 && sv.gpa !== null) {
                    cell.font = { name: 'Times New Roman', size: 11, bold: true };
                    if (sv.gpa >= 3.5) {
                        cell.font.color = { argb: '548235' };
                    } else if (sv.gpa >= 2.5) {
                        cell.font.color = { argb: '2E75B6' };
                    } else if (sv.gpa >= 2.0) {
                        cell.font.color = { argb: 'C65911' };
                    } else {
                        cell.font.color = { argb: 'FF0000' };
                    }
                }
            });

            row.height = 22;
        });

        // ========== FOOTER ==========
        const footerRow = tableStartRow + danhSachSinhVienXuatExcel.length + 2;
        worksheet.mergeCells(`A${footerRow}:K${footerRow}`);
        const footerCell = worksheet.getCell(`A${footerRow}`);
        footerCell.value = `Báo cáo được xuất tự động từ hệ thống vào lúc ${this.formatDateTime(new Date())}`;
        footerCell.font = { name: 'Times New Roman', size: 10, italic: true, color: { argb: '808080' } };
        footerCell.alignment = { horizontal: 'right', vertical: 'middle' };

        // 12. Xuất buffer
        const buffer = await workbook.xlsx.writeBuffer();
        return buffer as unknown as Buffer;
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