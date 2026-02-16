import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
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
import { YeuCauHocPhan } from 'src/giang-day/entity/yeu-cau-hoc-phan.entity';
import { LoaiYeuCauHocPhanEnum, TrangThaiYeuCauHocPhanEnum } from 'src/giang-day/enums/yeu-cau-hoc-phan.enum';
import { LopHocPhan } from 'src/giang-day/entity/lop-hoc-phan.entity';
import { MonHoc } from 'src/danh-muc/entity/mon-hoc.entity';
import { NamHoc } from 'src/dao-tao/entity/nam-hoc.entity';
import { HocKy } from 'src/dao-tao/entity/hoc-ky.entity';
import {
    KetQuaXetTotNghiepEnum,
    XepLoaiTotNghiepEnum,
    DuDoanXetTotNghiepResponseDto,
    XacNhanXetTotNghiepResponseDto,
    DanhSachTotNghiepResponseDto,
    SinhVienXetTotNghiepDto,
    SinhVienTotNghiepDto,
    ThongKeTongQuanDto,
    ThongKeTheoNganhDto,
} from './dtos/xet-tot-nghiep.dto';
import { GetYeuCauDangKyQueryDto } from './dtos/get-yeu-cau-dang-ky-query.dto';
import { GetYeuCauDangKyMeResponseDto, GetYeuCauDangKyResponseDto, YeuCauDangKyDto, YeuCauDangKyMeDto } from './dtos/get-yeu-cau-dang-ky-response.dto';
import { LopHocPhanDeXuatDto } from 'src/giang-day/dtos/get-danh-sach-yeu-cau-hoc-phan.dto';

// Interface cho dữ liệu sinh viên xét tốt nghiệp (internal use)
interface SinhVienXetTotNghiepInternal {
    stt: number;
    id: number;
    maSinhVien: string;
    hoTen: string;
    ngaySinh: Date;
    gioiTinh: string;
    maNienKhoa: string;
    nganhId: number;
    maNganh: string;
    tenNganh: string;
    maLop: string;
    gpa: number | null;
    ketQuaXet: KetQuaXetTotNghiepEnum;
    xepLoaiTotNghiep: XepLoaiTotNghiepEnum;
    ngayXet: Date;
    lyDo: string;
}

// Interface mới - tối ưu hóa, chỉ lưu thông tin cần thiết
interface KetQuaTheoMonHocOptimized {
    monHocId: number;
    tenMonHoc: string;
    diemTBCHPCaoNhatDaKhoaDiem: number | null;
    coLopChuaKhoaDiem: boolean;
    danhSachLopChuaKhoaDiem: string[]; // Danh sách mã lớp học phần chưa khóa điểm
}

@Injectable()
export class SinhVienService {
    private readonly logger = new Logger(SinhVienService.name);

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
        @InjectRepository(YeuCauHocPhan)
        private yeuCauHocPhanRepo: Repository<YeuCauHocPhan>,
        @InjectRepository(LopHocPhan)
        private lopHocPhanRepo: Repository<LopHocPhan>,
        @InjectRepository(MonHoc)
        private monHocRepo: Repository<MonHoc>,
        @InjectRepository(NamHoc)
        private namHocRepo: Repository<NamHoc>,
        @InjectRepository(HocKy)
        private hocKyRepo: Repository<HocKy>,
        @InjectRepository(ApDungChuongTrinhDT)
        private apDungCTDTRepo: Repository<ApDungChuongTrinhDT>,
    ) { }

    async importFromExcel(filePath: string) {
        const results = {
            success: 0,
            failed: 0,
            errors: [] as { row: number; maSinhVien: string; error: string }[],
            successRows: [] as { row: number; maSinhVien: string; hoTen: string }[],
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
                results.successRows.push({
                    row: rowNum,
                    maSinhVien,
                    hoTen,
                });
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

        // Sort: niên khóa (năm bắt đầu) DESC → mã lớp niên chế ASC (A trước B) → tên (chữ cuối) ASC
        // Dùng addSelect + orderBy alias để tránh TypeORM parse nhầm biểu thức SUBSTRING_INDEX
        qb.addSelect("SUBSTRING_INDEX(sv.ho_ten, ' ', -1)", 'tenCuoi')
            .orderBy('nienKhoa.namBatDau', 'DESC')
            .addOrderBy('lop.maLop', 'ASC')
            .addOrderBy('tenCuoi', 'ASC');

        const total = await qb.getCount();

        const items = await qb
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        // Transform dữ liệu: chỉ trả các trường cần thiết của nguoiDung, bỏ cột phụ tenCuoi (dùng để sort)
        const transformedData = items.map(sv => {
            const { tenCuoi, ...rest } = sv as typeof sv & { tenCuoi?: string };
            return {
                ...rest,
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
            };
        });

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

    async remove(id: number) {
        const sv = await this.sinhVienRepo.findOne({
            where: { id },
            relations: ['nguoiDung'],
        });

        if (!sv) {
            throw new NotFoundException('Sinh viên không tồn tại');
        }

        // Kiểm tra các quan hệ khóa ngoại quan trọng
        const reasons: string[] = [];

        // 1. Kiểm tra sinh viên có thuộc lớp học phần nào không
        const sinhVienLopHocPhanCount = await this.svLhpRepo.count({
            where: { sinhVien: { id } },
        });
        if (sinhVienLopHocPhanCount > 0) {
            const reason = `Sinh viên đang tham gia ${sinhVienLopHocPhanCount} lớp học phần. Cần xóa tất cả đăng ký lớp học phần trước khi xóa sinh viên.`;
            reasons.push(reason);
        }

        // 2. Kiểm tra sinh viên có kết quả học tập không
        const ketQuaHocTapCount = await this.ketQuaRepo.count({
            where: { sinhVien: { id } },
        });
        if (ketQuaHocTapCount > 0) {
            const reason = `Sinh viên có ${ketQuaHocTapCount} bản ghi kết quả học tập. Không thể xóa sinh viên khi còn dữ liệu kết quả học tập.`;
            reasons.push(reason);
        }

        // 3. Kiểm tra sinh viên có khen thưởng kỷ luật không
        const khenThuongKyLuatCount = await this.ktklRepo.count({
            where: { sinhVien: { id } },
        });
        if (khenThuongKyLuatCount > 0) {
            const reason = `Sinh viên có ${khenThuongKyLuatCount} bản ghi khen thưởng/kỷ luật. Không thể xóa sinh viên khi còn dữ liệu khen thưởng kỷ luật.`;
            reasons.push(reason);
        }

        // Nếu có bất kỳ lý do nào ngăn cản việc xóa, throw exception
        if (reasons.length > 0) {
            const errorMessage = `Không thể xóa sinh viên "${sv.hoTen}" (Mã SV: ${sv.maSinhVien}). Lý do:\n${reasons.map((r, idx) => `${idx + 1}. ${r}`).join('\n')}`;
            throw new BadRequestException(errorMessage);
        }

        // Xóa yêu cầu học phần của sinh viên trước
        const yeuCauHocPhanCount = await this.yeuCauHocPhanRepo.count({
            where: { sinhVien: { id } },
        });
        if (yeuCauHocPhanCount > 0) {
            await this.yeuCauHocPhanRepo
                .createQueryBuilder()
                .delete()
                .where('sinh_vien_id = :sinhVienId', { sinhVienId: id })
                .execute();
        }

        // Xóa tài khoản liên kết nếu có
        if (sv.nguoiDung) {
            await this.nguoiDungRepo.remove(sv.nguoiDung);
        }

        // Xóa sinh viên
        await this.sinhVienRepo.remove(sv);

        return { message: 'Xóa sinh viên và tài khoản thành công' };
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

    // ==================== XÉT TỐT NGHIỆP APIs ====================

    /**
     * DỰ ĐOÁN XÉT TỐT NGHIỆP
     * Lấy danh sách sinh viên chưa tốt nghiệp trong niên khóa và đánh giá họ
     * KHÔNG thay đổi trạng thái của sinh viên
     */
    async duDoanXetTotNghiep(nienKhoaId: number): Promise<DuDoanXetTotNghiepResponseDto> {
        // 1. Lấy thông tin niên khóa
        const nienKhoa = await this.nienKhoaRepo.findOne({
            where: { id: nienKhoaId },
        });

        if (!nienKhoa) {
            throw new NotFoundException(`Niên khóa ID ${nienKhoaId} không tồn tại`);
        }

        // 2. Lấy tất cả các lớp thuộc niên khóa này
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

        // 4. Thu thập và xét tốt nghiệp cho tất cả sinh viên (KHÔNG lưu)
        const ngayXet = new Date();
        const danhSachSinhVien: SinhVienXetTotNghiepInternal[] = [];
        let stt = 0;

        for (const [nganhId, { nganh, lops: lopsOfNganh }] of lopTheoNganh) {
            const apDung = ctdtTheoNganh.get(nganhId);

            // Lấy danh sách môn bắt buộc (nếu có chương trình đào tạo)
            let requiredMonHocIds = new Set<number>();
            let requiredMonHocMap = new Map<number, string>();

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
                    // Chỉ xét sinh viên CHƯA tốt nghiệp
                    if (sinhVien.tinhTrang === TinhTrangHocTapEnum.DA_TOT_NGHIEP) {
                        continue;
                    }

                    const lyDoKhongDat: string[] = [];

                    // Nếu không có chương trình đào tạo áp dụng
                    if (!apDung) {
                        lyDoKhongDat.push(`Không tìm thấy chương trình đào tạo áp dụng cho ngành "${nganh.tenNganh}" và niên khóa "${nienKhoa.tenNienKhoa}"`);

                        stt++;
                        danhSachSinhVien.push({
                            stt,
                            id: sinhVien.id,
                            maSinhVien: sinhVien.maSinhVien,
                            hoTen: sinhVien.hoTen,
                            ngaySinh: sinhVien.ngaySinh,
                            gioiTinh: this.mapGioiTinh(sinhVien.gioiTinh),
                            maNienKhoa: nienKhoa.maNienKhoa,
                            nganhId: nganh.id,
                            maNganh: nganh.maNganh,
                            tenNganh: nganh.tenNganh,
                            maLop: lop.maLop,
                            gpa: null,
                            ketQuaXet: KetQuaXetTotNghiepEnum.KHONG_DU_DIEU_KIEN,
                            xepLoaiTotNghiep: XepLoaiTotNghiepEnum.KHONG_XET,
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
                        const maLopHocPhan = kq.lopHocPhan.maLopHocPhan;
                        const diemTBCHP = this.tinhDiemTBCHP(kq);
                        const khoaDiem = kq.lopHocPhan.khoaDiem;

                        if (!ketQuaTheoMon.has(monHocId)) {
                            ketQuaTheoMon.set(monHocId, {
                                monHocId,
                                tenMonHoc,
                                diemTBCHPCaoNhatDaKhoaDiem: khoaDiem ? diemTBCHP : null,
                                coLopChuaKhoaDiem: !khoaDiem,
                                danhSachLopChuaKhoaDiem: !khoaDiem ? [maLopHocPhan] : [],
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
                                if (!existing.danhSachLopChuaKhoaDiem.includes(maLopHocPhan)) {
                                    existing.danhSachLopChuaKhoaDiem.push(maLopHocPhan);
                                }
                            }
                        }
                    }

                    // Kiểm tra điều kiện xét tốt nghiệp
                    let khongDuDieuKien = false;

                    for (const monHocId of requiredMonHocIds) {
                        const tenMonHoc = requiredMonHocMap.get(monHocId) || `Môn ID ${monHocId}`;
                        const ketQuaMon = ketQuaTheoMon.get(monHocId);

                        if (!ketQuaMon) {
                            lyDoKhongDat.push(`Chưa có kết quả học tập môn bắt buộc: "${tenMonHoc}" (sinh viên chưa đăng ký hoặc chưa có điểm)`);
                            khongDuDieuKien = true;
                            continue;
                        }

                        if (ketQuaMon.coLopChuaKhoaDiem) {
                            const danhSachLop = ketQuaMon.danhSachLopChuaKhoaDiem.join(', ');
                            lyDoKhongDat.push(`Môn "${tenMonHoc}" còn ${ketQuaMon.danhSachLopChuaKhoaDiem.length} lớp học phần chưa khóa điểm: [${danhSachLop}]`);
                            khongDuDieuKien = true;
                            continue;
                        }

                        if (ketQuaMon.diemTBCHPCaoNhatDaKhoaDiem === null) {
                            lyDoKhongDat.push(`Môn "${tenMonHoc}" chưa có lớp học phần nào được khóa điểm (tất cả các lớp đều chưa khóa)`);
                            khongDuDieuKien = true;
                            continue;
                        }
                    }

                    if (khongDuDieuKien) {
                        const gpa = this.tinhGPAOptimized(ketQuaTheoMon);
                        stt++;
                        danhSachSinhVien.push({
                            stt,
                            id: sinhVien.id,
                            maSinhVien: sinhVien.maSinhVien,
                            hoTen: sinhVien.hoTen,
                            ngaySinh: sinhVien.ngaySinh,
                            gioiTinh: this.mapGioiTinh(sinhVien.gioiTinh),
                            maNienKhoa: nienKhoa.maNienKhoa,
                            nganhId: nganh.id,
                            maNganh: nganh.maNganh,
                            tenNganh: nganh.tenNganh,
                            maLop: lop.maLop,
                            gpa,
                            ketQuaXet: KetQuaXetTotNghiepEnum.KHONG_DU_DIEU_KIEN,
                            xepLoaiTotNghiep: XepLoaiTotNghiepEnum.KHONG_XET,
                            ngayXet,
                            lyDo: lyDoKhongDat.join('; '),
                        });
                        continue;
                    }

                    // Kiểm tra điều kiện ĐẠT hay KHÔNG ĐẠT
                    let datTotNghiep = true;

                    for (const monHocId of requiredMonHocIds) {
                        const tenMonHoc = requiredMonHocMap.get(monHocId) || `Môn ID ${monHocId}`;
                        const ketQuaMon = ketQuaTheoMon.get(monHocId)!;

                        if (ketQuaMon.diemTBCHPCaoNhatDaKhoaDiem! < 4.0) {
                            lyDoKhongDat.push(`Môn "${tenMonHoc}" có điểm TBCHP cao nhất = ${ketQuaMon.diemTBCHPCaoNhatDaKhoaDiem!.toFixed(2)} (yêu cầu >= 4.00, thiếu ${(4.0 - ketQuaMon.diemTBCHPCaoNhatDaKhoaDiem!).toFixed(2)} điểm)`);
                            datTotNghiep = false;
                        }
                    }

                    // Tính GPA
                    const gpa = this.tinhGPAOptimized(ketQuaTheoMon);

                    // Điều kiện 2: GPA >= 2.0
                    if (gpa === null || gpa < 2.0) {
                        if (gpa === null) {
                            lyDoKhongDat.push(`GPA không thể tính được (không có môn học nào đã khóa điểm)`);
                        } else {
                            lyDoKhongDat.push(`GPA hiện tại = ${gpa.toFixed(2)} (yêu cầu >= 2.00, thiếu ${(2.0 - gpa).toFixed(2)} điểm)`);
                        }
                        datTotNghiep = false;
                    }

                    stt++;
                    if (datTotNghiep) {
                        const xepLoai = this.xepLoaiTotNghiep(gpa!);
                        danhSachSinhVien.push({
                            stt,
                            id: sinhVien.id,
                            maSinhVien: sinhVien.maSinhVien,
                            hoTen: sinhVien.hoTen,
                            ngaySinh: sinhVien.ngaySinh,
                            gioiTinh: this.mapGioiTinh(sinhVien.gioiTinh),
                            maNienKhoa: nienKhoa.maNienKhoa,
                            nganhId: nganh.id,
                            maNganh: nganh.maNganh,
                            tenNganh: nganh.tenNganh,
                            maLop: lop.maLop,
                            gpa,
                            ketQuaXet: KetQuaXetTotNghiepEnum.DAT,
                            xepLoaiTotNghiep: xepLoai,
                            ngayXet,
                            lyDo: '',
                        });
                    } else {
                        danhSachSinhVien.push({
                            stt,
                            id: sinhVien.id,
                            maSinhVien: sinhVien.maSinhVien,
                            hoTen: sinhVien.hoTen,
                            ngaySinh: sinhVien.ngaySinh,
                            gioiTinh: this.mapGioiTinh(sinhVien.gioiTinh),
                            maNienKhoa: nienKhoa.maNienKhoa,
                            nganhId: nganh.id,
                            maNganh: nganh.maNganh,
                            tenNganh: nganh.tenNganh,
                            maLop: lop.maLop,
                            gpa,
                            ketQuaXet: KetQuaXetTotNghiepEnum.KHONG_DAT,
                            xepLoaiTotNghiep: XepLoaiTotNghiepEnum.KHONG_DAT,
                            ngayXet,
                            lyDo: lyDoKhongDat.join('; '),
                        });
                    }
                }
            }
        }

        // 5. Tính thống kê
        const thongKeTongQuan = this.tinhThongKeTongQuan(danhSachSinhVien);
        const thongKeTheoNganh = this.tinhThongKeTheoNganh(danhSachSinhVien, lopTheoNganh);

        // 6. Map sang DTO response
        const danhSachSinhVienDto: SinhVienXetTotNghiepDto[] = danhSachSinhVien.map(sv => ({
            stt: sv.stt,
            id: sv.id,
            maSinhVien: sv.maSinhVien,
            hoTen: sv.hoTen,
            ngaySinh: sv.ngaySinh,
            gioiTinh: sv.gioiTinh,
            maNienKhoa: sv.maNienKhoa,
            maNganh: sv.maNganh,
            tenNganh: sv.tenNganh,
            maLop: sv.maLop,
            gpa: sv.gpa,
            ketQuaXet: sv.ketQuaXet,
            xepLoaiTotNghiep: sv.xepLoaiTotNghiep,
            lyDo: sv.lyDo,
        }));

        return {
            nienKhoaId: nienKhoa.id,
            maNienKhoa: nienKhoa.maNienKhoa,
            tenNienKhoa: nienKhoa.tenNienKhoa,
            namBatDau: nienKhoa.namBatDau,
            namKetThuc: nienKhoa.namKetThuc,
            ngayXet,
            thongKeTongQuan,
            thongKeTheoNganh,
            danhSachSinhVien: danhSachSinhVienDto,
        };
    }

    /**
     * XÁC NHẬN XÉT TỐT NGHIỆP
     * Xét tốt nghiệp cho tất cả sinh viên đạt điều kiện trong niên khóa
     * CẬP NHẬT trạng thái sinh viên thành DA_TOT_NGHIEP
     */
    async xacNhanXetTotNghiep(nienKhoaId: number): Promise<XacNhanXetTotNghiepResponseDto> {
        // 1. Lấy dữ liệu dự đoán
        const duDoan = await this.duDoanXetTotNghiep(nienKhoaId);

        // 2. Lọc sinh viên đạt
        const sinhVienDat = duDoan.danhSachSinhVien.filter(
            sv => sv.ketQuaXet === KetQuaXetTotNghiepEnum.DAT
        );

        // 3. Cập nhật trạng thái cho sinh viên đạt
        const sinhVienIds = sinhVienDat.map(sv => sv.id);
        if (sinhVienIds.length > 0) {
            await this.sinhVienRepo.update(
                { id: In(sinhVienIds) },
                { tinhTrang: TinhTrangHocTapEnum.DA_TOT_NGHIEP }
            );
        }

        // 4. Lấy thông tin niên khóa
        const nienKhoa = await this.nienKhoaRepo.findOne({
            where: { id: nienKhoaId },
        });

        return {
            success: true,
            message: `Xét tốt nghiệp thành công cho ${sinhVienDat.length} sinh viên`,
            nienKhoaId: duDoan.nienKhoaId,
            maNienKhoa: duDoan.maNienKhoa,
            ngayXetTotNghiep: new Date(),
            thongKe: duDoan.thongKeTongQuan,
            thongKeTheoNganh: duDoan.thongKeTheoNganh,
            danhSachSinhVienDat: sinhVienDat,
        };
    }

    /**
     * LẤY DANH SÁCH SINH VIÊN ĐÃ TỐT NGHIỆP TRONG NIÊN KHÓA
     * Trả về danh sách sinh viên có trạng thái DA_TOT_NGHIEP trong niên khóa
     */
    async getDanhSachTotNghiep(nienKhoaId: number): Promise<DanhSachTotNghiepResponseDto> {
        // 1. Lấy thông tin niên khóa
        const nienKhoa = await this.nienKhoaRepo.findOne({
            where: { id: nienKhoaId },
        });

        if (!nienKhoa) {
            throw new NotFoundException(`Niên khóa ID ${nienKhoaId} không tồn tại`);
        }

        // 2. Lấy tất cả các lớp thuộc niên khóa này
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

        // 3. Thu thập sinh viên đã tốt nghiệp
        const danhSachSinhVien: SinhVienTotNghiepDto[] = [];
        let stt = 0;

        // Map để tính thống kê theo ngành
        const thongKeNganhMap = new Map<number, {
            nganh: any;
            soSinhVien: number;
            soXuatSac: number;
            soGioi: number;
            soKha: number;
            soTrungBinh: number;
        }>();

        for (const [nganhId, { nganh, lops: lopsOfNganh }] of lopTheoNganh) {
            if (!thongKeNganhMap.has(nganhId)) {
                thongKeNganhMap.set(nganhId, {
                    nganh,
                    soSinhVien: 0,
                    soXuatSac: 0,
                    soGioi: 0,
                    soKha: 0,
                    soTrungBinh: 0,
                });
            }

            for (const lop of lopsOfNganh) {
                for (const sinhVien of lop.sinhViens) {
                    // Chỉ lấy sinh viên đã tốt nghiệp
                    if (sinhVien.tinhTrang !== TinhTrangHocTapEnum.DA_TOT_NGHIEP) {
                        continue;
                    }

                    // Tính GPA cho sinh viên
                    const ketQuas = await this.ketQuaRepo.find({
                        where: { sinhVien: { id: sinhVien.id } },
                        relations: ['lopHocPhan', 'lopHocPhan.monHoc'],
                    });

                    const ketQuaTheoMon = new Map<number, KetQuaTheoMonHocOptimized>();
                    for (const kq of ketQuas) {
                        const monHocId = kq.lopHocPhan.monHoc.id;
                        const tenMonHoc = kq.lopHocPhan.monHoc.tenMonHoc;
                        const maLopHocPhan = kq.lopHocPhan.maLopHocPhan;
                        const diemTBCHP = this.tinhDiemTBCHP(kq);
                        const khoaDiem = kq.lopHocPhan.khoaDiem;

                        if (!ketQuaTheoMon.has(monHocId)) {
                            ketQuaTheoMon.set(monHocId, {
                                monHocId,
                                tenMonHoc,
                                diemTBCHPCaoNhatDaKhoaDiem: khoaDiem ? diemTBCHP : null,
                                coLopChuaKhoaDiem: !khoaDiem,
                                danhSachLopChuaKhoaDiem: !khoaDiem ? [maLopHocPhan] : [],
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
                                if (!existing.danhSachLopChuaKhoaDiem.includes(maLopHocPhan)) {
                                    existing.danhSachLopChuaKhoaDiem.push(maLopHocPhan);
                                }
                            }
                        }
                    }

                    const gpa = this.tinhGPAOptimized(ketQuaTheoMon);
                    const xepLoai = gpa !== null ? this.xepLoaiTotNghiep(gpa) : XepLoaiTotNghiepEnum.KHONG_XET;

                    stt++;
                    danhSachSinhVien.push({
                        stt,
                        id: sinhVien.id,
                        maSinhVien: sinhVien.maSinhVien,
                        hoTen: sinhVien.hoTen,
                        ngaySinh: sinhVien.ngaySinh,
                        gioiTinh: this.mapGioiTinh(sinhVien.gioiTinh),
                        maNienKhoa: nienKhoa.maNienKhoa,
                        maNganh: nganh.maNganh,
                        tenNganh: nganh.tenNganh,
                        maLop: lop.maLop,
                        gpa,
                        xepLoaiTotNghiep: xepLoai,
                    });

                    // Cập nhật thống kê theo ngành
                    const stats = thongKeNganhMap.get(nganhId)!;
                    stats.soSinhVien++;
                    switch (xepLoai) {
                        case XepLoaiTotNghiepEnum.XUAT_SAC:
                            stats.soXuatSac++;
                            break;
                        case XepLoaiTotNghiepEnum.GIOI:
                            stats.soGioi++;
                            break;
                        case XepLoaiTotNghiepEnum.KHA:
                            stats.soKha++;
                            break;
                        case XepLoaiTotNghiepEnum.TRUNG_BINH:
                            stats.soTrungBinh++;
                            break;
                    }
                }
            }
        }

        // 4. Tạo thống kê theo ngành
        const thongKeTheoNganh: ThongKeTheoNganhDto[] = [];
        for (const [nganhId, stats] of thongKeNganhMap) {
            if (stats.soSinhVien > 0) {
                thongKeTheoNganh.push({
                    nganhId,
                    maNganh: stats.nganh.maNganh,
                    tenNganh: stats.nganh.tenNganh,
                    tongSinhVien: stats.soSinhVien,
                    soSinhVienDat: stats.soSinhVien, // Tất cả đều đạt vì đã tốt nghiệp
                    soSinhVienKhongDat: 0,
                    soSinhVienKhongDuDieuKien: 0,
                    soXuatSac: stats.soXuatSac,
                    soGioi: stats.soGioi,
                    soKha: stats.soKha,
                    soTrungBinh: stats.soTrungBinh,
                });
            }
        }

        return {
            nienKhoaId: nienKhoa.id,
            maNienKhoa: nienKhoa.maNienKhoa,
            tenNienKhoa: nienKhoa.tenNienKhoa,
            namBatDau: nienKhoa.namBatDau,
            namKetThuc: nienKhoa.namKetThuc,
            tongSinhVienTotNghiep: danhSachSinhVien.length,
            thongKeTheoNganh,
            danhSachSinhVien,
        };
    }

    /**
     * Tính thống kê tổng quan từ danh sách sinh viên
     */
    private tinhThongKeTongQuan(danhSach: SinhVienXetTotNghiepInternal[]): ThongKeTongQuanDto {
        return {
            tongSinhVienDuocXet: danhSach.length,
            soSinhVienDat: danhSach.filter(sv => sv.ketQuaXet === KetQuaXetTotNghiepEnum.DAT).length,
            soSinhVienKhongDat: danhSach.filter(sv => sv.ketQuaXet === KetQuaXetTotNghiepEnum.KHONG_DAT).length,
            soSinhVienKhongDuDieuKien: danhSach.filter(sv => sv.ketQuaXet === KetQuaXetTotNghiepEnum.KHONG_DU_DIEU_KIEN).length,
            soXuatSac: danhSach.filter(sv => sv.xepLoaiTotNghiep === XepLoaiTotNghiepEnum.XUAT_SAC).length,
            soGioi: danhSach.filter(sv => sv.xepLoaiTotNghiep === XepLoaiTotNghiepEnum.GIOI).length,
            soKha: danhSach.filter(sv => sv.xepLoaiTotNghiep === XepLoaiTotNghiepEnum.KHA).length,
            soTrungBinh: danhSach.filter(sv => sv.xepLoaiTotNghiep === XepLoaiTotNghiepEnum.TRUNG_BINH).length,
        };
    }

    /**
     * Tính thống kê theo từng ngành
     */
    private tinhThongKeTheoNganh(
        danhSach: SinhVienXetTotNghiepInternal[],
        lopTheoNganh: Map<number, { nganh: any; lops: Lop[] }>
    ): ThongKeTheoNganhDto[] {
        const result: ThongKeTheoNganhDto[] = [];

        for (const [nganhId, { nganh }] of lopTheoNganh) {
            const sinhVienNganh = danhSach.filter(sv => sv.nganhId === nganhId);

            if (sinhVienNganh.length > 0) {
                result.push({
                    nganhId,
                    maNganh: nganh.maNganh,
                    tenNganh: nganh.tenNganh,
                    tongSinhVien: sinhVienNganh.length,
                    soSinhVienDat: sinhVienNganh.filter(sv => sv.ketQuaXet === KetQuaXetTotNghiepEnum.DAT).length,
                    soSinhVienKhongDat: sinhVienNganh.filter(sv => sv.ketQuaXet === KetQuaXetTotNghiepEnum.KHONG_DAT).length,
                    soSinhVienKhongDuDieuKien: sinhVienNganh.filter(sv => sv.ketQuaXet === KetQuaXetTotNghiepEnum.KHONG_DU_DIEU_KIEN).length,
                    soXuatSac: sinhVienNganh.filter(sv => sv.xepLoaiTotNghiep === XepLoaiTotNghiepEnum.XUAT_SAC).length,
                    soGioi: sinhVienNganh.filter(sv => sv.xepLoaiTotNghiep === XepLoaiTotNghiepEnum.GIOI).length,
                    soKha: sinhVienNganh.filter(sv => sv.xepLoaiTotNghiep === XepLoaiTotNghiepEnum.KHA).length,
                    soTrungBinh: sinhVienNganh.filter(sv => sv.xepLoaiTotNghiep === XepLoaiTotNghiepEnum.TRUNG_BINH).length,
                });
            }
        }

        return result;
    }


    /**
     * XUẤT EXCEL DANH SÁCH SINH VIÊN ĐÃ TỐT NGHIỆP
     * Chỉ xuất những sinh viên đã có tình trạng DA_TOT_NGHIEP trong niên khóa
     * KHÔNG có logic xét tốt nghiệp
     */
    async xetTotNghiepVaXuatExcel(nienKhoaId: number): Promise<Buffer> {
        // 1. Lấy danh sách sinh viên đã tốt nghiệp
        const danhSachTotNghiep = await this.getDanhSachTotNghiep(nienKhoaId);

        // 2. Tạo file Excel
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Hệ thống quản lý đào tạo';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet('Danh sách sinh viên tốt nghiệp', {
            pageSetup: {
                paperSize: 9,
                orientation: 'landscape',
                fitToPage: true,
            },
        });

        // ========== HEADER SECTION ==========
        worksheet.mergeCells('A1:L1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'DANH SÁCH SINH VIÊN TỐT NGHIỆP';
        titleCell.font = { name: 'Times New Roman', size: 18, bold: true, color: { argb: '1F4E79' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(1).height = 35;

        worksheet.mergeCells('A2:L2');
        const subTitleCell = worksheet.getCell('A2');
        subTitleCell.value = `Niên khóa: ${danhSachTotNghiep.tenNienKhoa} (${danhSachTotNghiep.namBatDau} - ${danhSachTotNghiep.namKetThuc})`;
        subTitleCell.font = { name: 'Times New Roman', size: 12, italic: true };
        subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(2).height = 25;

        // Lấy danh sách ngành để hiển thị
        const danhSachNganh = danhSachTotNghiep.thongKeTheoNganh.map(tk => tk.tenNganh).join(', ');

        worksheet.mergeCells('A3:L3');
        const nganhCell = worksheet.getCell('A3');
        nganhCell.value = `Các ngành: ${danhSachNganh}`;
        nganhCell.font = { name: 'Times New Roman', size: 11, italic: true };
        nganhCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(3).height = 22;

        worksheet.mergeCells('A4:L4');
        const dateCell = worksheet.getCell('A4');
        dateCell.value = `Ngày xuất báo cáo: ${this.formatDate(new Date())}`;
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

        worksheet.mergeCells('G6:L6');
        worksheet.getCell('G6').value = 'THỐNG KÊ XẾP LOẠI TỐT NGHIỆP';
        worksheet.getCell('G6').font = { name: 'Times New Roman', size: 13, bold: true, color: { argb: 'FFFFFF' } };
        worksheet.getCell('G6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '548235' } };
        worksheet.getCell('G6').alignment = { horizontal: 'center', vertical: 'middle' };

        // Tính thống kê xếp loại
        const soXuatSac = danhSachTotNghiep.danhSachSinhVien.filter(sv => sv.xepLoaiTotNghiep === XepLoaiTotNghiepEnum.XUAT_SAC).length;
        const soGioi = danhSachTotNghiep.danhSachSinhVien.filter(sv => sv.xepLoaiTotNghiep === XepLoaiTotNghiepEnum.GIOI).length;
        const soKha = danhSachTotNghiep.danhSachSinhVien.filter(sv => sv.xepLoaiTotNghiep === XepLoaiTotNghiepEnum.KHA).length;
        const soTrungBinh = danhSachTotNghiep.danhSachSinhVien.filter(sv => sv.xepLoaiTotNghiep === XepLoaiTotNghiepEnum.TRUNG_BINH).length;

        const statsData = [
            { label: 'Tổng sinh viên tốt nghiệp:', value: danhSachTotNghiep.tongSinhVienTotNghiep, color: '305496' },
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
            worksheet.mergeCells(`G${rowNum}:K${rowNum}`);
            const labelCell = worksheet.getCell(`G${rowNum}`);
            labelCell.value = stat.label;
            labelCell.font = { name: 'Times New Roman', size: 11, bold: true };
            labelCell.alignment = { horizontal: 'left', vertical: 'middle' };

            const valueCell = worksheet.getCell(`L${rowNum}`);
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
            { header: 'Xếp loại TN', key: 'xepLoaiTotNghiep', width: 15 },
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

        danhSachTotNghiep.danhSachSinhVien.forEach((sv, index) => {
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
                sv.xepLoaiTotNghiep,
            ];

            rowData.forEach((value, colIndex) => {
                const cell = row.getCell(colIndex + 1);
                cell.value = value;
                cell.font = { name: 'Times New Roman', size: 11 };
                cell.alignment = {
                    horizontal: colIndex === 0 || (colIndex >= 3 && colIndex <= 5) || colIndex === 9 || colIndex === 10 ? 'center' : 'left',
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

                // Màu cho cột Xếp loại TN
                if (colIndex === 10) {
                    cell.font = { name: 'Times New Roman', size: 11, bold: true };
                    switch (sv.xepLoaiTotNghiep) {
                        case XepLoaiTotNghiepEnum.XUAT_SAC:
                            cell.font.color = { argb: '7030A0' };
                            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2D5F1' } };
                            break;
                        case XepLoaiTotNghiepEnum.GIOI:
                            cell.font.color = { argb: '00B050' };
                            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C6EFCE' } };
                            break;
                        case XepLoaiTotNghiepEnum.KHA:
                            cell.font.color = { argb: '0070C0' };
                            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'BDD7EE' } };
                            break;
                        case XepLoaiTotNghiepEnum.TRUNG_BINH:
                            cell.font.color = { argb: 'C65911' };
                            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FCE4D6' } };
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
                    }
                }
            });

            row.height = 22;
        });

        // ========== FOOTER ==========
        const footerRow = tableStartRow + danhSachTotNghiep.danhSachSinhVien.length + 2;
        worksheet.mergeCells(`A${footerRow}:K${footerRow}`);
        const footerCell = worksheet.getCell(`A${footerRow}`);
        footerCell.value = `Báo cáo được xuất tự động từ hệ thống vào lúc ${this.formatDateTime(new Date())}`;
        footerCell.font = { name: 'Times New Roman', size: 10, italic: true, color: { argb: '808080' } };
        footerCell.alignment = { horizontal: 'right', vertical: 'middle' };

        // 3. Xuất buffer
        const buffer = await workbook.xlsx.writeBuffer();
        return buffer as unknown as Buffer;
    }

    // ==================== YÊU CẦU ĐĂNG KÝ HỌC CẢI THIỆN / BỔ SUNG ====================

    /**
     * Helper method: Lấy sinhVienId từ userId (từ token)
     * Kiểm tra tài khoản có liên kết với sinh viên hay không
     */
    async getSinhVienIdFromUserId(userId: number): Promise<number> {
        if (!userId) {
            throw new BadRequestException('Không thể xác định người dùng từ token');
        }

        const nguoiDung = await this.nguoiDungRepo.findOne({
            where: { id: userId },
            relations: ['sinhVien', 'giangVien'],
        });

        if (!nguoiDung) {
            throw new NotFoundException('Tài khoản không tồn tại');
        }

        if (nguoiDung.giangVien) {
            throw new ForbiddenException('Tài khoản này được liên kết với giảng viên, không thể truy cập yêu cầu đăng ký của sinh viên');
        }

        if (!nguoiDung.sinhVien) {
            throw new ForbiddenException('Tài khoản này không được liên kết với sinh viên nào');
        }

        return nguoiDung.sinhVien.id;
    }

    async taoYeuCauDangKyHocPhan(
        sinhVienId: number,
        payload: { monHocId: number; loaiYeuCau: LoaiYeuCauHocPhanEnum; lyDo?: string },
    ) {
        const { monHocId, loaiYeuCau, lyDo } = payload;

        const sinhVien = await this.sinhVienRepo.findOne({
            where: { id: sinhVienId },
            relations: ['lop', 'lop.nganh', 'lop.nienKhoa'],
        });
        if (!sinhVien) {
            throw new NotFoundException('Sinh viên không tồn tại');
        }

        // Chỉ cho phép sinh viên có tình trạng DANG_HOC đăng ký
        if (sinhVien.tinhTrang !== TinhTrangHocTapEnum.DANG_HOC) {
            throw new BadRequestException(
                `Chỉ sinh viên đang học (DANG_HOC) mới được phép đăng ký học phần. Tình trạng hiện tại của bạn: ${sinhVien.tinhTrang}`,
            );
        }

        const monHoc = await this.monHocRepo.findOne({ where: { id: monHocId } });
        if (!monHoc) {
            throw new NotFoundException('Môn học không tồn tại');
        }

        // 1. Tìm chương trình đào tạo áp dụng cho ngành + niên khóa của sinh viên
        const apDung = await this.apDungCTDTRepo.findOne({
            where: {
                nganh: { id: sinhVien.lop.nganh.id },
                nienKhoa: { id: sinhVien.lop.nienKhoa.id },
            },
            relations: ['chuongTrinh'],
        });
        if (!apDung) {
            throw new BadRequestException(
                'Không tìm thấy chương trình đào tạo áp dụng cho ngành và niên khóa của sinh viên, không thể kiểm tra học phần trong CTĐT.',
            );
        }

        const chiTietCTDT = await this.chiTietCTDTRepo.findOne({
            where: {
                chuongTrinh: { id: apDung.chuongTrinh.id },
                monHoc: { id: monHoc.id },
            },
        });

        if (!chiTietCTDT) {
            throw new BadRequestException(
                'Môn học này không nằm trong chương trình đào tạo chính thức của sinh viên, vui lòng kiểm tra lại.',
            );
        }

        // 2. Kiểm tra request trùng
        const yeuCauTonTai = await this.yeuCauHocPhanRepo.findOne({
            where: {
                sinhVien: { id: sinhVien.id },
                monHoc: { id: monHoc.id },
            },
            order: { ngayTao: 'DESC' },
            relations: ['monHoc', 'sinhVien'],
        });

        if (yeuCauTonTai) {
            if (yeuCauTonTai.trangThai === TrangThaiYeuCauHocPhanEnum.CHO_DUYET) {
                const textLoai =
                    yeuCauTonTai.loaiYeuCau === LoaiYeuCauHocPhanEnum.HOC_CAI_THIEN
                        ? 'học cải thiện'
                        : 'học bổ sung';
                throw new BadRequestException(
                    `Bạn đã gửi yêu cầu ${textLoai} cho môn "${monHoc.tenMonHoc}" và đang chờ phòng Đào tạo xét duyệt. Vui lòng chờ kết quả, không gửi trùng yêu cầu.`,
                );
            }

            if (
                yeuCauTonTai.trangThai === TrangThaiYeuCauHocPhanEnum.DA_DUYET &&
                payload.loaiYeuCau === LoaiYeuCauHocPhanEnum.HOC_BO_SUNG
            ) {
                throw new BadRequestException(
                    `Môn "${monHoc.tenMonHoc}" đã được phê duyệt đăng ký trước đó, không thể gửi thêm yêu cầu học bổ sung.`,
                );
            }
        }

        // 3. Xử lý theo loại yêu cầu
        if (loaiYeuCau === LoaiYeuCauHocPhanEnum.HOC_CAI_THIEN) {
            return this.handleYeuCauHocCaiThien(sinhVien, monHoc, chiTietCTDT, lyDo);
        }

        if (loaiYeuCau === LoaiYeuCauHocPhanEnum.HOC_BO_SUNG) {
            return this.handleYeuCauHocBoSung(sinhVien, monHoc, chiTietCTDT, lyDo);
        }

        throw new BadRequestException('Loại yêu cầu không hợp lệ');
    }

    private async handleYeuCauHocCaiThien(
        sinhVien: SinhVien,
        monHoc: MonHoc,
        chiTietCTDT: ChiTietChuongTrinhDaoTao,
        lyDo?: string,
    ) {
        // Tìm các lớp học phần của môn này mà SV đã đăng ký
        const svLopHocPhans = await this.svLhpRepo.find({
            where: {
                sinhVien: { id: sinhVien.id },
                lopHocPhan: { monHoc: { id: monHoc.id } },
            },
            relations: ['lopHocPhan', 'lopHocPhan.ketQuaHocTaps'],
        });

        if (!svLopHocPhans.length) {
            throw new BadRequestException(
                `Bạn chưa từng đăng ký lớp học phần nào của môn "${monHoc.tenMonHoc}", không thể gửi yêu cầu học cải thiện.`,
            );
        }

        // Lấy kết quả học tập của các lớp học phần đó (đã khóa điểm, TBCHP >= 4.0)
        const ketQuaHopLe = await this.ketQuaRepo
            .createQueryBuilder('kq')
            .leftJoinAndSelect('kq.lopHocPhan', 'lhp')
            .leftJoin('kq.sinhVien', 'sv')
            .leftJoin('lhp.monHoc', 'mh')
            .where('sv.id = :svId', { svId: sinhVien.id })
            .andWhere('mh.id = :monHocId', { monHocId: monHoc.id })
            .andWhere('lhp.khoaDiem = :khoaDiem', { khoaDiem: true })
            .getMany();

        const ketQuaDat = ketQuaHopLe.filter(kq => this.tinhDiemTBCHP(kq) >= 4.0);

        if (!ketQuaDat.length) {
            throw new BadRequestException(
                `Bạn chưa có kết quả học tập đạt yêu cầu (TBCHP ≥ 4.0) ở bất kỳ lớp học phần nào của môn "${monHoc.tenMonHoc}", không thể đăng ký học cải thiện.`,
            );
        }

        // Chọn kết quả mới nhất (hoặc cao nhất tùy nghiệp vụ, ở đây lấy mới nhất)
        // Chọn kết quả có TBCHP cao nhất
        const ketQuaCu = ketQuaDat.sort((a, b) => this.tinhDiemTBCHP(b) - this.tinhDiemTBCHP(a))[0];

        const yeuCau = this.yeuCauHocPhanRepo.create({
            sinhVien,
            monHoc,
            chiTietCTDT,
            loaiYeuCau: LoaiYeuCauHocPhanEnum.HOC_CAI_THIEN,
            ketQuaCuId: ketQuaCu.id,
            lyDo,
            trangThai: TrangThaiYeuCauHocPhanEnum.CHO_DUYET,
        });

        return this.yeuCauHocPhanRepo.save(yeuCau);
    }

    private async handleYeuCauHocBoSung(
        sinhVien: SinhVien,
        monHoc: MonHoc,
        chiTietCTDT: ChiTietChuongTrinhDaoTao,
        lyDo?: string,
    ) {
        // Kiểm tra xem đã từng đăng ký lớp học phần của môn này chưa
        const svLopHocPhans = await this.svLhpRepo.find({
            where: {
                sinhVien: { id: sinhVien.id },
                lopHocPhan: { monHoc: { id: monHoc.id } },
            },
            relations: ['lopHocPhan'],
        });

        if (svLopHocPhans.length) {
            throw new BadRequestException(
                `Bạn đã từng đăng ký ít nhất một lớp học phần của môn "${monHoc.tenMonHoc}" trước đó, nên không được gửi yêu cầu học bổ sung.`,
            );
        }

        // Tính ra học kỳ "mục tiêu" theo thứ tự học kỳ trong CTĐT + niên khóa
        const thuTuHocKy = chiTietCTDT.thuTuHocKy;
        const nienKhoa = sinhVien.lop.nienKhoa;

        // Lấy toàn bộ năm học từ năm bắt đầu của niên khóa trở đi
        const namHocs = await this.namHocRepo.find({
            where: { namBatDau: In([nienKhoa.namBatDau, nienKhoa.namBatDau + 1, nienKhoa.namBatDau + 2, nienKhoa.namBatDau + 3, nienKhoa.namBatDau + 4]) },
            relations: ['hocKys'],
            order: { namBatDau: 'ASC' },
        });

        // Trải phẳng các học kỳ theo thứ tự thời gian
        const hocKyTheoThuTu: HocKy[] = [];
        for (const nh of namHocs) {
            const sortedHocKy = [...(nh.hocKys || [])].sort((a, b) => a.hocKy - b.hocKy);
            hocKyTheoThuTu.push(...sortedHocKy);
        }

        if (!hocKyTheoThuTu.length) {
            throw new BadRequestException(
                'Không tìm thấy thông tin học kỳ tương ứng với niên khóa của sinh viên, vui lòng liên hệ phòng Đào tạo.',
            );
        }

        const indexMucTieu = thuTuHocKy - 1;
        if (indexMucTieu < 0 || indexMucTieu >= hocKyTheoThuTu.length) {
            throw new BadRequestException(
                `Không tìm được học kỳ thứ ${thuTuHocKy} trong lộ trình đào tạo từ niên khóa ${nienKhoa.maNienKhoa}. Vui lòng kiểm tra lại cấu hình CTĐT.`,
            );
        }

        const hocKyMucTieu = hocKyTheoThuTu[indexMucTieu];

        // Tìm các lớp học phần mở cho môn này, cùng ngành, cùng niên khóa của sinh viên, đúng học kỳ mục tiêu
        const lopHocPhans = await this.lopHocPhanRepo.find({
            where: {
                monHoc: { id: monHoc.id },
                nganh: { id: sinhVien.lop.nganh.id },
                nienKhoa: { id: nienKhoa.id },
                hocKy: { id: hocKyMucTieu.id },
            },
            relations: ['nienKhoa', 'nganh', 'hocKy'],
        });

        if (!lopHocPhans.length) {
            throw new BadRequestException(
                `Hiện tại không tìm thấy lớp học phần nào của môn "${monHoc.tenMonHoc}" mở cho ngành "${sinhVien.lop.nganh.tenNganh}" trong học kỳ phù hợp với lộ trình (học kỳ thứ ${thuTuHocKy} tính từ khi nhập học). Vui lòng liên hệ phòng Đào tạo để được hỗ trợ.`,
            );
        }

        // Kiểm tra lại SV chưa đăng ký các lớp học phần đó (phòng trường hợp dữ liệu thiếu)
        const lopHocPhanIds = lopHocPhans.map(l => l.id);
        const svLhpTonTai = await this.svLhpRepo.find({
            where: {
                sinhVien: { id: sinhVien.id },
                lopHocPhan: { id: In(lopHocPhanIds) },
            },
        });

        if (svLhpTonTai.length) {
            throw new BadRequestException(
                `Bạn đã đăng ký một trong các lớp học phần của môn "${monHoc.tenMonHoc}" được mở đúng lộ trình, không thể gửi yêu cầu học bổ sung.`,
            );
        }

        const yeuCau = this.yeuCauHocPhanRepo.create({
            sinhVien,
            monHoc,
            chiTietCTDT,
            loaiYeuCau: LoaiYeuCauHocPhanEnum.HOC_BO_SUNG,
            lyDo,
            trangThai: TrangThaiYeuCauHocPhanEnum.CHO_DUYET,
        });

        return this.yeuCauHocPhanRepo.save(yeuCau);
    }

    /**
     * Xếp loại tốt nghiệp dựa trên GPA
     */
    private xepLoaiTotNghiep(gpa: number): XepLoaiTotNghiepEnum {
        if (gpa >= 3.60) return XepLoaiTotNghiepEnum.XUAT_SAC;
        if (gpa >= 3.20) return XepLoaiTotNghiepEnum.GIOI;
        if (gpa >= 2.50) return XepLoaiTotNghiepEnum.KHA;
        if (gpa >= 2.00) return XepLoaiTotNghiepEnum.TRUNG_BINH;
        return XepLoaiTotNghiepEnum.KHONG_DAT;
    }

    // ========== HELPER METHODS ==========

    /**
     * Tính điểm TBCHP (Trung bình cộng học phần) theo hệ 10
     * Làm tròn đến 2 chữ số thập phân
     */
    private tinhDiemTBCHP(kq: KetQuaHocTap): number {
        const tbchp = kq.diemQuaTrinh * 0.1 + kq.diemThanhPhan * 0.3 + kq.diemThi * 0.6;
        return Math.round(tbchp * 100) / 100; // Làm tròn đến 2 chữ số thập phân
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

    /**
     * Sửa yêu cầu học phần
     * Chỉ có thể sửa yêu cầu có trạng thái CHO_DUYET
     */
    async suaYeuCauHocPhan(
        sinhVienId: number,
        yeuCauId: number,
        payload: {
            monHocId?: number;
            loaiYeuCau?: LoaiYeuCauHocPhanEnum;
            ketQuaCuId?: number;
            lyDo?: string;
        },
    ): Promise<void> {
        const { monHocId, loaiYeuCau, ketQuaCuId, lyDo } = payload;

        // Kiểm tra yêu cầu có tồn tại và thuộc về sinh viên không
        const yeuCau = await this.yeuCauHocPhanRepo.findOne({
            where: { id: yeuCauId, sinhVien: { id: sinhVienId } },
            relations: ['sinhVien', 'monHoc', 'chiTietCTDT'],
        });

        if (!yeuCau) {
            throw new NotFoundException(
                `Không tìm thấy yêu cầu học phần với ID: ${yeuCauId} hoặc yêu cầu không thuộc về sinh viên này`,
            );
        }

        // Chỉ có thể sửa yêu cầu có trạng thái CHO_DUYET
        if (yeuCau.trangThai !== TrangThaiYeuCauHocPhanEnum.CHO_DUYET) {
            throw new BadRequestException(
                `Chỉ có thể sửa yêu cầu có trạng thái CHO_DUYET. Yêu cầu hiện tại có trạng thái: ${yeuCau.trangThai}`,
            );
        }

        // Chỉ cho phép sinh viên có tình trạng DANG_HOC sửa yêu cầu
        if (yeuCau.sinhVien.tinhTrang !== TinhTrangHocTapEnum.DANG_HOC) {
            throw new BadRequestException(
                `Chỉ sinh viên đang học (DANG_HOC) mới được phép sửa yêu cầu học phần. Tình trạng hiện tại của sinh viên: ${yeuCau.sinhVien.tinhTrang}`,
            );
        }

        // Cập nhật các trường nếu có
        if (monHocId !== undefined) {
            const monHoc = await this.monHocRepo.findOne({ where: { id: monHocId } });
            if (!monHoc) {
                throw new NotFoundException(`Không tìm thấy môn học với ID: ${monHocId}`);
            }

            // Kiểm tra môn học có trong CTĐT của sinh viên không
            const sinhVien = await this.sinhVienRepo.findOne({
                where: { id: sinhVienId },
                relations: ['lop', 'lop.nganh', 'lop.nienKhoa'],
            });

            if (!sinhVien) {
                throw new NotFoundException('Sinh viên không tồn tại');
            }

            const apDung = await this.apDungCTDTRepo.findOne({
                where: {
                    nganh: { id: sinhVien.lop.nganh.id },
                    nienKhoa: { id: sinhVien.lop.nienKhoa.id },
                },
                relations: ['chuongTrinh'],
            });

            if (!apDung) {
                throw new BadRequestException(
                    'Không tìm thấy chương trình đào tạo áp dụng cho ngành và niên khóa của sinh viên',
                );
            }

            const chiTietCTDT = await this.chiTietCTDTRepo.findOne({
                where: {
                    chuongTrinh: { id: apDung.chuongTrinh.id },
                    monHoc: { id: monHoc.id },
                },
            });

            if (!chiTietCTDT) {
                throw new BadRequestException(
                    'Môn học này không nằm trong chương trình đào tạo chính thức của sinh viên',
                );
            }

            yeuCau.monHoc = monHoc;
            yeuCau.chiTietCTDT = chiTietCTDT;
        }

        if (loaiYeuCau !== undefined) {
            yeuCau.loaiYeuCau = loaiYeuCau;
        }

        if (ketQuaCuId !== undefined) {
            yeuCau.ketQuaCuId = ketQuaCuId;
        }

        if (lyDo !== undefined) {
            yeuCau.lyDo = lyDo;
        }

        await this.yeuCauHocPhanRepo.save(yeuCau);
    }

    /**
     * Xóa yêu cầu học phần (cho sinh viên)
     * Chỉ có thể xóa yêu cầu có trạng thái CHO_DUYET hoặc DA_HUY
     */
    async xoaYeuCauHocPhan(sinhVienId: number, yeuCauId: number): Promise<void> {
        // Kiểm tra yêu cầu có tồn tại và thuộc về sinh viên không
        const yeuCau = await this.yeuCauHocPhanRepo.findOne({
            where: { id: yeuCauId, sinhVien: { id: sinhVienId } },
        });

        if (!yeuCau) {
            throw new NotFoundException(
                `Không tìm thấy yêu cầu học phần với ID: ${yeuCauId} hoặc yêu cầu không thuộc về sinh viên này`,
            );
        }

        // Chỉ có thể xóa yêu cầu có trạng thái CHO_DUYET hoặc DA_HUY
        if (
            yeuCau.trangThai !== TrangThaiYeuCauHocPhanEnum.CHO_DUYET &&
            yeuCau.trangThai !== TrangThaiYeuCauHocPhanEnum.DA_HUY
        ) {
            throw new BadRequestException(
                `Chỉ có thể xóa yêu cầu có trạng thái CHO_DUYET hoặc DA_HUY. Yêu cầu hiện tại có trạng thái: ${yeuCau.trangThai}`,
            );
        }

        await this.yeuCauHocPhanRepo.remove(yeuCau);
    }

    /**
     * Hủy yêu cầu học phần (cho sinh viên)
     * Chỉ có thể hủy yêu cầu có trạng thái CHO_DUYET
     * Khi hủy, trạng thái sẽ được chuyển thành DA_HUY
     */
    async huyYeuCauHocPhan(sinhVienId: number, yeuCauId: number): Promise<void> {
        // Kiểm tra yêu cầu có tồn tại và thuộc về sinh viên không
        const yeuCau = await this.yeuCauHocPhanRepo.findOne({
            where: { id: yeuCauId, sinhVien: { id: sinhVienId } },
        });

        if (!yeuCau) {
            throw new NotFoundException(
                `Không tìm thấy yêu cầu học phần với ID: ${yeuCauId} hoặc yêu cầu không thuộc về sinh viên này`,
            );
        }

        // Chỉ có thể hủy yêu cầu có trạng thái CHO_DUYET
        if (yeuCau.trangThai !== TrangThaiYeuCauHocPhanEnum.CHO_DUYET) {
            throw new BadRequestException(
                `Chỉ có thể hủy yêu cầu có trạng thái CHO_DUYET. Yêu cầu hiện tại có trạng thái: ${yeuCau.trangThai}`,
            );
        }

        // Chuyển trạng thái thành DA_HUY
        yeuCau.trangThai = TrangThaiYeuCauHocPhanEnum.DA_HUY;
        await this.yeuCauHocPhanRepo.save(yeuCau);
    }

    /**
     * Lấy danh sách yêu cầu đăng ký của sinh viên hiện tại (từ userId trong token)
     * Kiểm tra user có liên kết với sinh viên hay không
     */
    async getYeuCauDangKyMe(
        userId: number,
        query: GetYeuCauDangKyQueryDto,
    ): Promise<GetYeuCauDangKyMeResponseDto> {
        if (!userId) {
            throw new BadRequestException('Không thể xác định người dùng từ token');
        }

        // Lấy thông tin người dùng với quan hệ sinh viên và giảng viên
        const nguoiDung = await this.nguoiDungRepo.findOne({
            where: { id: userId },
            relations: ['sinhVien', 'giangVien'],
        });

        if (!nguoiDung) {
            throw new NotFoundException('Tài khoản không tồn tại');
        }

        // Kiểm tra nếu user liên kết với giảng viên
        if (nguoiDung.giangVien) {
            throw new ForbiddenException('Tài khoản này được liên kết với giảng viên, không thể truy cập yêu cầu đăng ký của sinh viên');
        }

        // Kiểm tra nếu user không liên kết với sinh viên
        if (!nguoiDung.sinhVien) {
            throw new ForbiddenException('Tài khoản này không được liên kết với sinh viên nào');
        }

        // Lấy ID sinh viên và gọi method getYeuCauDangKy (đầy đủ thông tin)
        const sinhVienId = nguoiDung.sinhVien.id;
        const fullResult = await this.getYeuCauDangKy(sinhVienId, query);

        // Map sang DTO dành riêng cho sinh viên, KHÔNG bao gồm lớp học phần đề xuất và tốt nhất
        const data: YeuCauDangKyMeDto[] = fullResult.data.map((item) => {
            // Loại bỏ các trường lopHocPhanDeXuat và lopHocPhanTotNhat
            const { lopHocPhanDeXuat, lopHocPhanTotNhat, ...rest } = item as any;
            return rest as YeuCauDangKyMeDto;
        });

        return {
            data,
            pagination: fullResult.pagination,
        };
    }

    /**
     * Lấy danh sách yêu cầu đăng ký của sinh viên với phân trang và bộ lọc
     */
    async getYeuCauDangKy(
        sinhVienId: number,
        query: GetYeuCauDangKyQueryDto,
    ): Promise<GetYeuCauDangKyResponseDto> {
        const { page = 1, limit = 10, trangThai, loaiYeuCau } = query;

        // Kiểm tra sinh viên có tồn tại không
        const sinhVien = await this.sinhVienRepo.findOne({
            where: { id: sinhVienId },
        });
        if (!sinhVien) {
            throw new NotFoundException('Sinh viên không tồn tại');
        }

        // Xây dựng query builder
        const qb = this.yeuCauHocPhanRepo
            .createQueryBuilder('yc')
            .leftJoinAndSelect('yc.monHoc', 'monHoc')
            .leftJoinAndSelect('yc.chiTietCTDT', 'chiTietCTDT')
            .leftJoinAndSelect('chiTietCTDT.chuongTrinh', 'chuongTrinh')
            .leftJoinAndSelect('yc.lopHocPhanDaDuyet', 'lopHocPhanDaDuyet')
            .leftJoinAndSelect('lopHocPhanDaDuyet.hocKy', 'hocKy')
            .leftJoinAndSelect('hocKy.namHoc', 'namHoc')
            .leftJoinAndSelect('lopHocPhanDaDuyet.nganh', 'nganhLhp')
            .leftJoinAndSelect('lopHocPhanDaDuyet.nienKhoa', 'nienKhoaLhp')
            .leftJoinAndSelect('lopHocPhanDaDuyet.giangVien', 'giangVienLhp')
            .leftJoinAndSelect('yc.nguoiXuLy', 'nguoiXuLy')
            .leftJoinAndSelect('nguoiXuLy.giangVien', 'giangVienNguoiXuLy')
            .where('yc.sinhVien.id = :sinhVienId', { sinhVienId });

        // Áp dụng bộ lọc
        if (trangThai) {
            qb.andWhere('yc.trangThai = :trangThai', { trangThai });
        }
        if (loaiYeuCau) {
            qb.andWhere('yc.loaiYeuCau = :loaiYeuCau', { loaiYeuCau });
        }

        // Sắp xếp theo ngày tạo giảm dần
        qb.orderBy('yc.ngayTao', 'DESC');

        // Lấy tổng số trước khi phân trang
        const total = await qb.getCount();

        // Áp dụng phân trang
        const yeuCaus = await qb
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        // Lấy kết quả học tập cũ nếu có
        const ketQuaCuIds = yeuCaus
            .map(yc => yc.ketQuaCuId)
            .filter((id): id is number => id !== null && id !== undefined);

        const ketQuaCus = ketQuaCuIds.length > 0
            ? await this.ketQuaRepo.find({
                where: { id: In(ketQuaCuIds) },
                relations: ['lopHocPhan'],
            })
            : [];

        const ketQuaCuMap = new Map(ketQuaCus.map(kq => [kq.id, kq]));

        // Tính sĩ số cho các lớp học phần đề xuất (nếu có yêu cầu chờ duyệt)
        const siSoLopHocPhanMap = new Map<number, number>();
        const allLopHocPhanIds = new Set<number>();

        for (const yeuCau of yeuCaus) {
            if (
                yeuCau.trangThai === TrangThaiYeuCauHocPhanEnum.CHO_DUYET ||
                yeuCau.trangThai === TrangThaiYeuCauHocPhanEnum.DANG_XU_LY
            ) {
                const lopHocPhans = await this.timLopHocPhanDeXuat(yeuCau, sinhVienId);
                lopHocPhans.forEach(lhp => allLopHocPhanIds.add(lhp.id));
            }
        }

        // Tính sĩ số thực tế
        for (const lhpId of allLopHocPhanIds) {
            const siSo = await this.tinhSiSo(lhpId);
            siSoLopHocPhanMap.set(lhpId, siSo);
        }

        // Map sang DTO
        const data: YeuCauDangKyDto[] = await Promise.all(
            yeuCaus.map(async (yeuCau) => {
                const ketQuaCu = yeuCau.ketQuaCuId ? ketQuaCuMap.get(yeuCau.ketQuaCuId) : null;

                const dto: YeuCauDangKyDto = {
                    id: yeuCau.id,
                    loaiYeuCau: yeuCau.loaiYeuCau,
                    trangThai: yeuCau.trangThai,
                    lyDo: yeuCau.lyDo,
                    ngayTao: yeuCau.ngayTao,
                    ngayXuLy: yeuCau.ngayXuLy || undefined,
                    ghiChuPhongDaoTao: yeuCau.ghiChuPhongDaoTao || undefined,
                    monHoc: {
                        id: yeuCau.monHoc.id,
                        maMonHoc: yeuCau.monHoc.maMonHoc,
                        tenMonHoc: yeuCau.monHoc.tenMonHoc,
                    },
                    chuongTrinhDaoTao: yeuCau.chiTietCTDT
                        ? {
                            id: yeuCau.chiTietCTDT.chuongTrinh.id,
                            maChuongTrinh: yeuCau.chiTietCTDT.chuongTrinh.maChuongTrinh,
                            tenChuongTrinh: yeuCau.chiTietCTDT.chuongTrinh.tenChuongTrinh,
                        }
                        : {
                            id: 0,
                            maChuongTrinh: '',
                            tenChuongTrinh: '',
                        },
                    thuTuHocKy: yeuCau.chiTietCTDT?.thuTuHocKy || 0,
                    ketQuaCu: ketQuaCu
                        ? {
                            id: ketQuaCu.id,
                            maLopHocPhan: ketQuaCu.lopHocPhan.maLopHocPhan,
                            diemQuaTrinh: ketQuaCu.diemQuaTrinh,
                            diemThanhPhan: ketQuaCu.diemThanhPhan,
                            diemThi: ketQuaCu.diemThi,
                            diemTBCHP: this.tinhTBCHP(ketQuaCu) || 0,
                        }
                        : null,
                };

                // Nếu là yêu cầu chờ duyệt hoặc đang xử lý, thêm lớp học phần đề xuất
                if (
                    yeuCau.trangThai === TrangThaiYeuCauHocPhanEnum.CHO_DUYET ||
                    yeuCau.trangThai === TrangThaiYeuCauHocPhanEnum.DANG_XU_LY
                ) {
                    const lopHocPhans = await this.timLopHocPhanDeXuat(yeuCau, sinhVienId);
                    const sinhVienFull = await this.sinhVienRepo.findOne({
                        where: { id: sinhVienId },
                        relations: ['lop', 'lop.nganh', 'lop.nienKhoa'],
                    });

                    if (sinhVienFull) {
                        const nganh = sinhVienFull.lop.nganh;
                        const nienKhoa = sinhVienFull.lop.nienKhoa;

                        const lopHocPhanDeXuat: LopHocPhanDeXuatDto[] = lopHocPhans.map(lhp => {
                            let mucUuTien = 3;
                            if (lhp.nganh.id === nganh.id && lhp.nienKhoa.id === nienKhoa.id) {
                                mucUuTien = 1;
                            } else if (lhp.nganh.id === nganh.id && lhp.nienKhoa.namBatDau > nienKhoa.namBatDau) {
                                mucUuTien = 2;
                            }

                            const siSo = siSoLopHocPhanMap.get(lhp.id) || 0;

                            return {
                                id: lhp.id,
                                maLopHocPhan: lhp.maLopHocPhan,
                                mucUuTien,
                                siSo,
                                hocKy: {
                                    id: lhp.hocKy.id,
                                    hocKy: lhp.hocKy.hocKy,
                                    namHoc: {
                                        id: lhp.hocKy.namHoc.id,
                                        namBatDau: lhp.hocKy.namHoc.namBatDau,
                                        namKetThuc: lhp.hocKy.namHoc.namKetThuc,
                                    },
                                },
                                nganh: {
                                    id: lhp.nganh.id,
                                    maNganh: lhp.nganh.maNganh,
                                    tenNganh: lhp.nganh.tenNganh,
                                },
                                nienKhoa: {
                                    id: lhp.nienKhoa.id,
                                    maNienKhoa: lhp.nienKhoa.maNienKhoa,
                                    tenNienKhoa: lhp.nienKhoa.tenNienKhoa,
                                },
                                giangVien: lhp.giangVien
                                    ? {
                                        id: lhp.giangVien.id,
                                        maGiangVien: lhp.giangVien.maGiangVien,
                                        hoTen: lhp.giangVien.hoTen,
                                    }
                                    : null,
                            };
                        });

                        // Chọn lớp tốt nhất
                        const lopTotNhat = await this.chonLopHocPhanTotNhat(
                            lopHocPhans,
                            siSoLopHocPhanMap,
                            nganh.id,
                            nienKhoa.id,
                            nienKhoa.namBatDau
                        );

                        if (lopTotNhat) {
                            const siSoHienTai = siSoLopHocPhanMap.get(lopTotNhat.id) || 0;
                            const lopTotNhatDto = lopHocPhanDeXuat.find(l => l.id === lopTotNhat.id);
                            if (lopTotNhatDto) {
                                lopTotNhatDto.siSoSauKhiGan = siSoHienTai + 1;
                            }
                        }

                        dto.lopHocPhanDeXuat = lopHocPhanDeXuat;
                        dto.lopHocPhanTotNhat = lopTotNhat
                            ? lopHocPhanDeXuat.find(l => l.id === lopTotNhat.id) || null
                            : null;
                    }
                }

                // Nếu là yêu cầu đã duyệt, thêm lớp học phần đã duyệt
                if (yeuCau.trangThai === TrangThaiYeuCauHocPhanEnum.DA_DUYET && yeuCau.lopHocPhanDaDuyet) {
                    dto.lopHocPhanDaDuyet = {
                        id: yeuCau.lopHocPhanDaDuyet.id,
                        maLopHocPhan: yeuCau.lopHocPhanDaDuyet.maLopHocPhan,
                        hocKy: {
                            id: yeuCau.lopHocPhanDaDuyet.hocKy.id,
                            hocKy: yeuCau.lopHocPhanDaDuyet.hocKy.hocKy,
                            namHoc: {
                                id: yeuCau.lopHocPhanDaDuyet.hocKy.namHoc.id,
                                namBatDau: yeuCau.lopHocPhanDaDuyet.hocKy.namHoc.namBatDau,
                                namKetThuc: yeuCau.lopHocPhanDaDuyet.hocKy.namHoc.namKetThuc,
                            },
                        },
                        nganh: {
                            id: yeuCau.lopHocPhanDaDuyet.nganh.id,
                            maNganh: yeuCau.lopHocPhanDaDuyet.nganh.maNganh,
                            tenNganh: yeuCau.lopHocPhanDaDuyet.nganh.tenNganh,
                        },
                        nienKhoa: {
                            id: yeuCau.lopHocPhanDaDuyet.nienKhoa.id,
                            maNienKhoa: yeuCau.lopHocPhanDaDuyet.nienKhoa.maNienKhoa,
                            tenNienKhoa: yeuCau.lopHocPhanDaDuyet.nienKhoa.tenNienKhoa,
                        },
                        giangVien: yeuCau.lopHocPhanDaDuyet.giangVien
                            ? {
                                id: yeuCau.lopHocPhanDaDuyet.giangVien.id,
                                maGiangVien: yeuCau.lopHocPhanDaDuyet.giangVien.maGiangVien,
                                hoTen: yeuCau.lopHocPhanDaDuyet.giangVien.hoTen,
                            }
                            : null,
                    };
                }

                // Thêm thông tin người xử lý nếu có
                if (yeuCau.nguoiXuLy) {
                    dto.nguoiXuLy = {
                        id: yeuCau.nguoiXuLy.id,
                        tenDangNhap: yeuCau.nguoiXuLy.tenDangNhap,
                        loaiNguoiXuLy: yeuCau.nguoiXuLy.giangVien ? 'GIANG_VIEN' : 'CAN_BO_PHONG_DAO_TAO',
                        giangVien: yeuCau.nguoiXuLy.giangVien
                            ? {
                                id: yeuCau.nguoiXuLy.giangVien.id,
                                maGiangVien: yeuCau.nguoiXuLy.giangVien.maGiangVien,
                                hoTen: yeuCau.nguoiXuLy.giangVien.hoTen,
                            }
                            : null,
                    };
                }

                return dto;
            })
        );

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

    /**
     * Tính sĩ số của lớp học phần
     */
    private async tinhSiSo(lopHocPhanId: number): Promise<number> {
        const count = await this.svLhpRepo.count({
            where: { lopHocPhan: { id: lopHocPhanId } },
        });
        return count;
    }

    /**
     * Tính điểm TBCHP
     */
    private tinhTBCHP(kq: KetQuaHocTap): number | null {
        if (kq.diemQuaTrinh == null || kq.diemThanhPhan == null || kq.diemThi == null) {
            return null;
        }
        return (kq.diemQuaTrinh * 0.1 + kq.diemThanhPhan * 0.3 + kq.diemThi * 0.6);
    }

    /**
     * Tìm các lớp học phần đề xuất cho yêu cầu
     */
    private async timLopHocPhanDeXuat(yeuCau: YeuCauHocPhan, sinhVienId: number): Promise<LopHocPhan[]> {
        const sinhVien = await this.sinhVienRepo.findOne({
            where: { id: sinhVienId },
            relations: ['lop', 'lop.nganh', 'lop.nienKhoa'],
        });

        if (!sinhVien) {
            return [];
        }

        const monHoc = yeuCau.monHoc;
        const nganh = sinhVien.lop.nganh;
        const nienKhoa = sinhVien.lop.nienKhoa;

        // Tìm tất cả lớp học phần của môn này, chưa khóa điểm
        const allLopHocPhans = await this.lopHocPhanRepo.find({
            where: {
                monHoc: { id: monHoc.id },
                khoaDiem: false,
            },
            relations: ['nganh', 'nienKhoa', 'hocKy', 'hocKy.namHoc', 'giangVien'],
        });

        // Lọc theo 3 mức ưu tiên
        const uuTien1: LopHocPhan[] = [];
        const uuTien2: LopHocPhan[] = [];
        const uuTien3: LopHocPhan[] = [];

        for (const lhp of allLopHocPhans) {
            const siSo = await this.tinhSiSo(lhp.id);
            if (siSo >= 40) continue; // Đã đầy

            if (lhp.nganh.id === nganh.id && lhp.nienKhoa.id === nienKhoa.id) {
                uuTien1.push(lhp);
            } else if (lhp.nganh.id === nganh.id && lhp.nienKhoa.namBatDau > nienKhoa.namBatDau) {
                uuTien2.push(lhp);
            } else if (lhp.nganh.id !== nganh.id && lhp.nienKhoa.namBatDau > nienKhoa.namBatDau) {
                uuTien3.push(lhp);
            }
        }

        return [...uuTien1, ...uuTien2, ...uuTien3];
    }

    /**
     * Chọn lớp học phần tốt nhất từ danh sách đề xuất
     */
    private async chonLopHocPhanTotNhat(
        lopHocPhans: LopHocPhan[],
        siSoMap: Map<number, number>,
        nganhId: number,
        nienKhoaId: number,
        nienKhoaNamBatDau: number
    ): Promise<LopHocPhan | null> {
        if (lopHocPhans.length === 0) return null;

        const uuTien1 = lopHocPhans.filter(
            lhp => lhp.nganh.id === nganhId && lhp.nienKhoa.id === nienKhoaId
        );

        if (uuTien1.length > 0) {
            uuTien1.sort((a, b) => {
                const siSoA = siSoMap.get(a.id) || 0;
                const siSoB = siSoMap.get(b.id) || 0;
                return siSoA - siSoB;
            });

            const lopTotNhat = uuTien1[0];
            const siSoHienTai = siSoMap.get(lopTotNhat.id) || 0;
            const siSoSauKhiGan = siSoHienTai + 1;

            if (siSoSauKhiGan >= 40) {
                for (let i = 1; i < uuTien1.length; i++) {
                    const lhp = uuTien1[i];
                    const siSoLhp = siSoMap.get(lhp.id) || 0;
                    if (siSoLhp + 1 < 40) {
                        return lhp;
                    }
                }

                const uuTien2 = lopHocPhans.filter(
                    lhp => lhp.nganh.id === nganhId && lhp.nienKhoa.id !== nienKhoaId && lhp.nienKhoa.namBatDau > nienKhoaNamBatDau
                );
                if (uuTien2.length > 0) {
                    uuTien2.sort((a, b) => {
                        const siSoA = siSoMap.get(a.id) || 0;
                        const siSoB = siSoMap.get(b.id) || 0;
                        return siSoA - siSoB;
                    });
                    return uuTien2[0];
                }
            }

            return lopTotNhat;
        }

        lopHocPhans.sort((a, b) => {
            const siSoA = siSoMap.get(a.id) || 0;
            const siSoB = siSoMap.get(b.id) || 0;
            return siSoA - siSoB;
        });

        return lopHocPhans[0];
    }
}