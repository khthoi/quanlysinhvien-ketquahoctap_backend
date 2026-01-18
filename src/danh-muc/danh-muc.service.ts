import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Khoa } from './entity/khoa.entity';
import { CreateKhoaDto } from './dtos/tao-khoa.dto';
import { UpdateKhoaDto } from './dtos/cap-nhat-khoa.dto';
import { Nganh } from './entity/nganh.entity';
import { CreateNganhDto } from './dtos/tao-nganh.dto';
import { UpdateNganhDto } from './dtos/cap-nhat-nganh.dto';
import { UpdateLopDto } from './dtos/cap-nhat-lop-nien-che.dto';
import { CreateLopDto } from './dtos/tao-lop-nien-che.dto';
import { Lop, LopWithTongSinhVien } from './entity/lop.entity';
import { NienKhoa } from './entity/nien-khoa.entity';
import { UpdateMonHocDto } from './dtos/cap-nhat-mon-hoc.dto';
import { CreateMonHocDto } from './dtos/tao-mon-hoc.dto';
import { MonHoc } from './entity/mon-hoc.entity';
import { NguoiDung } from 'src/auth/entity/nguoi-dung.entity';
import { VaiTroNguoiDungEnum } from 'src/auth/enums/vai-tro-nguoi-dung.enum';
import { CapNhatThongTinCaNhanGiangVienDto, UpdateGiangVienDto } from './dtos/cap-nhat-thong-tin-giang-vien.dto';
import { CreateGiangVienDto } from './dtos/them-giang-vien.dto';
import { GiangVien } from './entity/giang-vien.entity';
import { PhanCongMonHocDto } from './dtos/phan-cong-mon-hoc.dto';
import { XoaPhanCongMonHocDto } from './dtos/xoa-phan-cong-mon-hoc.dto';
import { GiangVienMonHoc } from './entity/giangvien-monhoc.entity';
import { CreateNienKhoaDto } from './dtos/them-nien-khoa.dto';
import { UpdateNienKhoaDto } from './dtos/cap-nhat-nien-khoa.dto';
import { PaginationQueryDto, GetNganhQueryDto, GetGiangVienQueryDto, GetLopQueryDto } from './dtos/pagination.dto';
import { GioiTinh } from './enums/gioi-tinh.enum';
import { GetAllMonHocQueryDto, PhanCongMonHocResponseDto } from './dtos/phan-cong-mon-hoc-response.dto';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs/promises';
import { LoaiMonEnum } from './enums/loai-mon.enum';

@Injectable()
export class DanhMucService {
    monHocGianygVienRepositor: any;
    constructor(
        @InjectRepository(Khoa)
        private readonly khoaRepository: Repository<Khoa>,
        @InjectRepository(Nganh)
        private readonly nganhRepository: Repository<Nganh>,
        @InjectRepository(NienKhoa)
        private readonly nienKhoaRepository: Repository<NienKhoa>,
        @InjectRepository(Lop)
        private readonly lopRepository: Repository<Lop>,
        @InjectRepository(MonHoc)
        private readonly monHocRepository: Repository<MonHoc>,
        @InjectRepository(GiangVien)
        private readonly giangVienRepository: Repository<GiangVien>,
        // Nếu dùng getCurrentGiangVien thì cần thêm
        @InjectRepository(NguoiDung)
        private readonly nguoiDungRepository: Repository<NguoiDung>,
        @InjectRepository(GiangVienMonHoc)
        private readonly giangVienMonHocRepository: Repository<GiangVienMonHoc>,
    ) { }

    // getAllKhoa() - load cả ngành + phân trang + search
    async getAllKhoa(query: PaginationQueryDto) {
        const { page = 1, limit = 10, search } = query;

        const qb = this.khoaRepository.createQueryBuilder('khoa')
            .leftJoinAndSelect('khoa.nganhs', 'nganh'); // load ngành thuộc khoa

        if (search) {
            qb.andWhere('LOWER(khoa.tenKhoa) LIKE LOWER(:search) OR LOWER(khoa.maKhoa) LIKE LOWER(:search)', { search: `%${search}%` });
        }

        qb.orderBy('khoa.tenKhoa', 'ASC');

        const total = await qb.getCount();
        const skip = (page - 1) * limit;
        qb.skip(skip).take(limit);

        const items = await qb.getMany();

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

    // Lấy chi tiết một khoa theo id
    async getKhoaById(id: number): Promise<Khoa> {
        const khoa = await this.khoaRepository.findOne({
            where: { id },
        });

        if (!khoa) {
            throw new NotFoundException(`Khoa với id ${id} không tồn tại`);
        }

        return khoa;
    }

    // Thêm khoa mới
    async createKhoa(createKhoaDto: CreateKhoaDto): Promise<Khoa> {
        // Kiểm tra mã khoa đã tồn tại chưa
        const existingKhoa = await this.khoaRepository.findOneBy({
            maKhoa: createKhoaDto.maKhoa,
        });

        if (existingKhoa) {
            throw new BadRequestException('Mã khoa đã tồn tại trong hệ thống');
        }

        // Nếu không trùng thì tạo mới
        const khoa = this.khoaRepository.create(createKhoaDto);
        return await this.khoaRepository.save(khoa);
    }

    // Cập nhật khoa
    async updateKhoa(id: number, updateKhoaDto: UpdateKhoaDto): Promise<Khoa> {
        const khoa = await this.getKhoaById(id); // sẽ throw NotFound nếu không tồn tại

        // ***KIỂM TRA TRÙNG MÃ KHOA KHI CẬP NHẬT***
        if (updateKhoaDto.maKhoa && updateKhoaDto.maKhoa !== khoa.maKhoa) {
            // Chỉ kiểm tra khi có thay đổi mã khoa
            const existingKhoa = await this.khoaRepository.findOneBy({
                maKhoa: updateKhoaDto.maKhoa,
                id: Not(id), // Loại trừ chính bản ghi đang cập nhật
            });

            if (existingKhoa) {
                throw new BadRequestException('Mã khoa này đã được sử dụng bởi khoa khác');
            }
        }

        // Cập nhật các trường khác (bao gồm cả maKhoa nếu hợp lệ)
        Object.assign(khoa, updateKhoaDto);

        return await this.khoaRepository.save(khoa);
    }

    async deleteKhoa(id: number): Promise<void> {
        const khoa = await this.khoaRepository.findOne({
            where: { id },
            relations: ['nganhs'],
        });

        if (!khoa) {
            throw new NotFoundException(`Khoa với id ${id} không tồn tại`);
        }

        // Kiểm tra xem khoa có ngành nào không
        if (khoa.nganhs && khoa.nganhs.length > 0) {
            throw new BadRequestException('Không thể xóa khoa này vì còn ngành thuộc về khoa');
        }

        await this.khoaRepository.remove(khoa);
    }

    //getAllNganh() - load khoa + phân trang + lọc khoa + search
    // Lưu ý: danh sách khoa để làm filter sẽ được load riêng (xem controller)
    async getAllNganh(query: PaginationQueryDto & GetNganhQueryDto) {
        const { page = 1, limit = 10, search, khoaId } = query;

        // Lấy tất cả khoa (không phân trang - dùng làm filter)
        const allKhoa = await this.khoaRepository.find({
            select: ['id', 'tenKhoa', 'maKhoa'],
            order: { tenKhoa: 'ASC' },
        });

        const qb = this.nganhRepository.createQueryBuilder('nganh')
            .leftJoinAndSelect('nganh.khoa', 'khoa');

        if (khoaId) {
            qb.andWhere('nganh.khoa_id = :khoaId', { khoaId });
        }

        if (search) {
            qb.andWhere('LOWER(nganh.tenNganh) LIKE LOWER(:search) OR LOWER(nganh.maNganh) LIKE LOWER(:search)', { search: `%${search}%` });
        }

        qb.orderBy('nganh.tenNganh', 'ASC');

        const total = await qb.getCount();
        const skip = (page - 1) * limit;
        qb.skip(skip).take(limit);

        const items = await qb.getMany();

        return {
            data: items,
            filters: { khoa: allKhoa },
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // Lấy chi tiết một ngành (có load quan hệ khoa)
    async getNganhById(id: number): Promise<Nganh> {
        const nganh = await this.nganhRepository.findOne({
            where: { id },
            relations: ['khoa'],
        });

        if (!nganh) {
            throw new NotFoundException(`Ngành với id ${id} không tồn tại`);
        }

        return nganh;
    }

    async importNganhFromExcel(filePath: string): Promise<{
        message: string;
        totalRows: number;
        success: number;
        failed: number;
        errors: { row: number; maNganh: string; error: string }[];
    }> {
        const results = {
            totalRows: 0,
            success: 0,
            failed: 0,
            errors: [] as { row: number; maNganh: string; error: string }[],
        };

        try {
            // 1. Đọc file Excel
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(filePath);
            const worksheet = workbook.getWorksheet(1);

            if (!worksheet) {
                throw new BadRequestException('File Excel không có sheet dữ liệu');
            }

            const rows = worksheet.getRows(2, worksheet.rowCount - 1) || [];
            if (rows.length === 0) {
                throw new BadRequestException('File Excel không có dữ liệu từ dòng 2 trở đi');
            }

            results.totalRows = rows.length;

            // 2. Duyệt từng dòng
            for (const row of rows) {

                if (!row || row.actualCellCount === 0) continue;

                const rowNum = row.number;

                const maNganh = row.getCell(2).value?.toString().trim() || '';
                const tenNganh = row.getCell(3).value?.toString().trim() || '';
                const moTa = row.getCell(4).value?.toString().trim() || undefined;
                const maKhoa = row.getCell(5).value?.toString().trim() || '';

                // Validate cơ bản (thiếu trường bắt buộc)
                if (!maNganh || !tenNganh || !maKhoa) {
                    results.failed++;
                    results.errors.push({
                        row: rowNum,
                        maNganh: maNganh || 'N/A',
                        error: 'Thiếu một hoặc nhiều trường bắt buộc (Mã ngành, Tên ngành, Mã khoa)',
                    });
                    continue;
                }

                try {
                    // 3. Tra cứu khoa theo mã (maKhoa – nghiệp vụ)
                    const khoa = await this.khoaRepository.findOne({
                        where: { maKhoa },
                    });

                    if (!khoa) {
                        throw new BadRequestException(`Mã khoa ${maKhoa} không tồn tại`);
                    }

                    // 4. Tạo DTO và gọi lại hàm createNganh hiện có
                    const createDto: CreateNganhDto = {
                        maNganh,
                        tenNganh,
                        moTa,
                        khoaId: khoa.id, // Chuyển từ maKhoa sang khoaId
                    };

                    await this.createNganh(createDto);

                    results.success++;
                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        row: rowNum,
                        maNganh,
                        error: error.message || 'Lỗi không xác định khi tạo ngành',
                    });
                }
            }

            return {
                message: `Đã xử lý ${results.totalRows} dòng từ file Excel`,
                totalRows: results.totalRows,
                success: results.success,
                failed: results.failed,
                errors: results.errors.length > 0 ? results.errors : [],
            };
        } finally {
            // Xóa file tạm
            await fs.unlink(filePath).catch(() => { });
        }
    }

    // Thêm ngành mới
    async createNganh(createNganhDto: CreateNganhDto): Promise<Nganh> {
        // Kiểm tra mã ngành đã tồn tại chưa
        const existingNganh = await this.nganhRepository.findOneBy({
            maNganh: createNganhDto.maNganh,
        });

        if (existingNganh) {
            throw new BadRequestException('Mã ngành này đã tồn tại trong hệ thống');
        }

        // Kiểm tra khoa tồn tại
        const khoa = await this.khoaRepository.findOne({
            where: { id: createNganhDto.khoaId },
        });

        if (!khoa) {
            throw new BadRequestException(`Khoa với id ${createNganhDto.khoaId} không tồn tại`);
        }

        // Tạo ngành mới
        const nganh = this.nganhRepository.create({
            maNganh: createNganhDto.maNganh,
            tenNganh: createNganhDto.tenNganh,
            moTa: createNganhDto.moTa,
            khoa,
        });

        return await this.nganhRepository.save(nganh);
    }

    // Cập nhật ngành
    async updateNganh(id: number, updateNganhDto: UpdateNganhDto): Promise<Nganh> {
        const nganh = await this.getNganhById(id); // throw NotFound nếu không tồn tại

        // Kiểm tra nếu có thay đổi mã ngành
        if (updateNganhDto.maNganh && updateNganhDto.maNganh !== nganh.maNganh) {
            const existingNganh = await this.nganhRepository.findOneBy({
                maNganh: updateNganhDto.maNganh,
            });

            if (existingNganh) {
                throw new BadRequestException('Mã ngành này đã được sử dụng bởi ngành khác');
            }
        }

        // Cập nhật khoa nếu có thay đổi
        if (updateNganhDto.khoaId && updateNganhDto.khoaId !== nganh.khoa.id) {
            const khoa = await this.khoaRepository.findOne({
                where: { id: updateNganhDto.khoaId },
            });

            if (!khoa) {
                throw new BadRequestException(`Khoa với id ${updateNganhDto.khoaId} không tồn tại`);
            }
            nganh.khoa = khoa;
        }

        // Cập nhật các trường khác
        Object.assign(nganh, {
            maNganh: updateNganhDto.maNganh,
            tenNganh: updateNganhDto.tenNganh,
            moTa: updateNganhDto.moTa,
        });

        return await this.nganhRepository.save(nganh);
    }

    // Xóa ngành
    async deleteNganh(id: number): Promise<void> {
        const nganh = await this.nganhRepository.findOne({
            where: { id },
            relations: ['lops', 'apDungChuongTrinhs', 'chuongTrinhs', 'lopHocPhans'],
        });

        if (!nganh) {
            throw new NotFoundException(`Ngành với id ${id} không tồn tại`);
        }

        // Kiểm tra xem ngành có lớp nào không
        if (nganh.lops && nganh.lops.length > 0) {
            throw new BadRequestException('Không thể xóa ngành này vì còn lớp thuộc về ngành');
        }

        // Kiểm tra xem ngành có áp dụng chương trình đào tạo nào không
        if (nganh.apDungChuongTrinhs && nganh.apDungChuongTrinhs.length > 0) {
            throw new BadRequestException('Không thể xóa ngành này vì còn ngành được áp dụng chương trình đào tạo');
        }

        // Kiểm tra xem ngành có chương trình đào tạo nào không
        if (nganh.chuongTrinhs && nganh.chuongTrinhs.length > 0) {
            throw new BadRequestException('Không thể xóa ngành này vì còn chương trình đào tạo của ngành đó');
        }

        // Kiểm tra xem ngành có lớp học phần nào không
        if (nganh.lopHocPhans && nganh.lopHocPhans.length > 0) {
            throw new BadRequestException('Không thể xóa ngành này vì còn lớp học phần của ngành này');
        }

        await this.nganhRepository.remove(nganh);
    }

    // getAllNienKhoa() - phân trang + search theo tên
    async getAllNienKhoa(query: PaginationQueryDto) {
        const { page = 1, limit = 10, search } = query;

        const qb = this.nienKhoaRepository.createQueryBuilder('nienKhoa');

        if (search) {
            qb.andWhere('LOWER(nienKhoa.maNienKhoa) LIKE LOWER(:search) OR LOWER(nienKhoa.tenNienKhoa) LIKE LOWER(:search)', { search: `%${search}%` });
        }

        qb.orderBy('nienKhoa.namBatDau', 'DESC');

        const total = await qb.getCount();
        const skip = (page - 1) * limit;
        qb.skip(skip).take(limit);

        const items = await qb.getMany();

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

    // Lấy chi tiết một niên khóa
    async getNienKhoaById(id: number): Promise<NienKhoa> {
        const nienKhoa = await this.nienKhoaRepository.findOneBy({ id });

        if (!nienKhoa) {
            throw new NotFoundException(`Niên khóa với id ${id} không tồn tại`);
        }

        return nienKhoa;
    }

    // Thêm niên khóa mới (chỉ cán bộ ĐT)
    async createNienKhoa(createNienKhoaDto: CreateNienKhoaDto): Promise<NienKhoa> {

        if (createNienKhoaDto.namKetThuc <= createNienKhoaDto.namBatDau) {
            throw new BadRequestException('Năm kết thúc phải lớn hơn năm bắt đầu');
        }

        // Kiểm tra trùng mã niên khóa (ví dụ: "K2022")
        const existing = await this.nienKhoaRepository.findOneBy({
            maNienKhoa: createNienKhoaDto.maNienKhoa,
        });

        if (existing) {
            throw new BadRequestException('Mã niên khóa này đã tồn tại trong hệ thống');
        }

        // Tạo mới niên khóa
        const nienKhoa = this.nienKhoaRepository.create(createNienKhoaDto);
        return await this.nienKhoaRepository.save(nienKhoa);
    }

    // Cập nhật niên khóa (chỉ cán bộ ĐT)
    async updateNienKhoa(id: number, updateNienKhoaDto: UpdateNienKhoaDto): Promise<NienKhoa> {
        const nienKhoa = await this.getNienKhoaById(id); // throw NotFoundException nếu không tồn tại

        const trungmaNienKhoa = await this.nienKhoaRepository.findOneBy({
            maNienKhoa: updateNienKhoaDto.maNienKhoa,
            id: Not(id),
        });

        if (trungmaNienKhoa) {
            throw new BadRequestException('Mã niên khóa này đã được sử dụng bởi niên khóa khác');
        }

        if (updateNienKhoaDto.namKetThuc && updateNienKhoaDto.namBatDau && updateNienKhoaDto.namKetThuc <= updateNienKhoaDto.namBatDau) {
            throw new BadRequestException('Năm kết thúc phải lớn hơn năm bắt đầu');
        }

        // Chỉ kiểm tra trùng tên nếu người dùng thay đổi tên niên khóa
        if (
            updateNienKhoaDto.tenNienKhoa &&
            updateNienKhoaDto.tenNienKhoa !== nienKhoa.tenNienKhoa
        ) {
            const existing = await this.nienKhoaRepository.findOneBy({
                tenNienKhoa: updateNienKhoaDto.tenNienKhoa,
            });

            if (existing) {
                throw new BadRequestException('Tên niên khóa này đã được sử dụng bởi niên khóa khác');
            }
        }

        // Cập nhật các trường (bao gồm tenNienKhoa nếu hợp lệ)
        Object.assign(nienKhoa, updateNienKhoaDto);

        return await this.nienKhoaRepository.save(nienKhoa);
    }

    // Xóa niên khóa (chỉ cán bộ ĐT)
    async deleteNienKhoa(id: number): Promise<void> {
        const nienKhoa = await this.nienKhoaRepository.findOne({
            where: { id },
            relations: ['lops,', 'apDungChuongTrinhs', 'lopHocPhans'],
        });

        if (!nienKhoa) {
            throw new NotFoundException(`Niên khóa với id ${id} không tồn tại`);
        }

        // Kiểm tra xem niên khóa có lớp nào không
        if (nienKhoa.lops && nienKhoa.lops.length > 0) {
            throw new BadRequestException('Không thể xóa niên khóa này vì còn lớp thuộc về niên khóa');
        }

        // Kiểm tra xem niên khóa có áp dụng chương trình đào tạo nào không
        if (nienKhoa.apDungChuongTrinhs && nienKhoa.apDungChuongTrinhs.length > 0) {
            throw new BadRequestException('Không thể xóa niên khóa này vì còn niên khóa được áp dụng chương trình đào tạo');
        }

        // Kiểm tra xem niên khóa có lớp học phần nào không
        if (nienKhoa.lopHocPhans && nienKhoa.lopHocPhans.length > 0) {
            throw new BadRequestException('Không thể xóa niên khóa này vì còn lớp học phần của niên khóa này');
        }

        await this.nienKhoaRepository.remove(nienKhoa);
    }

    // getAllLop() - load khoa/ngành/niên khóa + phân trang + filter + tổng số sinh viên
    async getAllLop(query: PaginationQueryDto & GetLopQueryDto): Promise<{
        data: LopWithTongSinhVien[];
        filters: {
            khoa: Khoa[];
            nganh: Nganh[];
            nienKhoa: NienKhoa[];
        };
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }> {
        const { page = 1, limit = 10, search, nganhId, nienKhoaId } = query;

        // Lấy các danh sách filter (không phân trang)
        const [allKhoa, allNganh, allNienKhoa] = await Promise.all([
            this.khoaRepository.find({ select: ['id', 'tenKhoa', 'maKhoa'], order: { tenKhoa: 'ASC' } }),
            this.nganhRepository.find({
                select: ['id', 'tenNganh', 'khoa', 'maNganh'],
                relations: ['khoa'],
                order: { tenNganh: 'ASC' },
            }),
            this.nienKhoaRepository.find({ order: { namBatDau: 'DESC' } }),
        ]);

        const qb = this.lopRepository.createQueryBuilder('lop')
            .leftJoinAndSelect('lop.nganh', 'nganh')
            .leftJoinAndSelect('nganh.khoa', 'khoa')
            .leftJoinAndSelect('lop.nienKhoa', 'nienKhoa')
            // Tính tổng số sinh viên trong lớp (field động)
            .loadRelationCountAndMap('lop.tongSinhVien', 'lop.sinhViens', 'sv');

        if (nganhId) {
            qb.andWhere('lop.nganh_id = :nganhId', { nganhId });
        }
        if (nienKhoaId) {
            qb.andWhere('lop.nien_khoa_id = :nienKhoaId', { nienKhoaId });
        }
        if (search) {
            qb.andWhere('LOWER(lop.tenLop) LIKE LOWER(:search) OR LOWER(lop.maLop) LIKE LOWER(:search)', { search: `%${search}%` });
        }

        qb.orderBy('lop.tenLop', 'ASC');

        const total = await qb.getCount();
        const skip = (page - 1) * limit;
        qb.skip(skip).take(limit);

        const items = await qb.getMany();

        return {
            data: items as LopWithTongSinhVien[], // Ép kiểu để TypeScript nhận diện tongSinhVien
            filters: {
                khoa: allKhoa,
                nganh: allNganh,
                nienKhoa: allNienKhoa,
            },
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    // Lấy chi tiết một lớp
    async getLopById(id: number): Promise<Lop> {
        const lop = await this.lopRepository.findOne({
            where: { id },
            relations: ['nganh', 'nganh.khoa', 'nienKhoa'],
        });

        if (!lop) {
            throw new NotFoundException(`Lớp với id ${id} không tồn tại`);
        }

        return lop;
    }

    async importLopFromExcel(filePath: string): Promise<{
        message: string;
        totalRows: number;
        success: number;
        failed: number;
        errors: { row: number; maLop: string; error: string }[];
    }> {
        const results = {
            totalRows: 0,
            success: 0,
            failed: 0,
            errors: [] as { row: number; maLop: string; error: string }[],
        };

        try {
            // 1. Đọc file Excel
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(filePath);
            const worksheet = workbook.getWorksheet(1);

            if (!worksheet) {
                throw new BadRequestException('File Excel không có sheet dữ liệu');
            }

            const rows = worksheet.getRows(2, worksheet.rowCount - 1) || [];
            if (rows.length === 0) {
                throw new BadRequestException('File Excel không có dữ liệu từ dòng 2 trở đi');
            }

            results.totalRows = rows.length;

            // 2. Duyệt từng dòng
            for (const row of rows) {

                if (!row || row.actualCellCount === 0) continue;

                const rowNum = row.number;

                const maLop = row.getCell(2).value?.toString().trim() || '';
                const tenLop = row.getCell(3).value?.toString().trim() || '';
                const maNganh = row.getCell(4).value?.toString().trim() || '';
                const maNienKhoa = row.getCell(5).value?.toString().trim() || '';

                // Validate cơ bản
                if (!maLop || !tenLop || !maNganh || !maNienKhoa) {
                    results.failed++;
                    results.errors.push({
                        row: rowNum,
                        maLop: maLop || 'N/A',
                        error: 'Thiếu một hoặc nhiều trường bắt buộc (Mã lớp, Tên lớp, Mã ngành, Mã niên khóa)',
                    });
                    continue;
                }

                try {
                    // 3. Tra cứu Ngành theo mã
                    const nganh = await this.nganhRepository.findOne({ where: { maNganh } });
                    if (!nganh) {
                        throw new BadRequestException(`Mã ngành ${maNganh} không tồn tại`);
                    }

                    // 4. Tra cứu Niên khóa theo mã
                    const nienKhoa = await this.nienKhoaRepository.findOne({ where: { maNienKhoa } });
                    if (!nienKhoa) {
                        throw new BadRequestException(`Mã niên khóa ${maNienKhoa} không tồn tại`);
                    }

                    // 5. Tạo DTO và gọi lại hàm createLop hiện có
                    const createLopDto = {
                        maLop,
                        tenLop,
                        nganhId: nganh.id,
                        nienKhoaId: nienKhoa.id,
                    };

                    await this.createLop(createLopDto);

                    results.success++;
                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        row: rowNum,
                        maLop,
                        error: error.message || 'Lỗi không xác định khi tạo lớp',
                    });
                }
            }

            return {
                message: `Đã xử lý ${results.totalRows} dòng từ file Excel`,
                totalRows: results.totalRows,
                success: results.success,
                failed: results.failed,
                errors: results.errors.length > 0 ? results.errors : [],
            };
        } finally {
            // Xóa file tạm sau khi xử lý
            await fs.unlink(filePath).catch(() => { });
        }
    }

    // Thêm lớp mới
    async createLop(createLopDto: CreateLopDto): Promise<Lop> {
        // Kiểm tra mã lớp đã tồn tại chưa
        const existingLop = await this.lopRepository.findOneBy({
            maLop: createLopDto.maLop,
        });

        if (existingLop) {
            throw new BadRequestException('Mã lớp này đã tồn tại trong hệ thống');
        }

        // Kiểm tra ngành tồn tại
        const nganh = await this.nganhRepository.findOne({
            where: { id: createLopDto.nganhId },
        });
        if (!nganh) {
            throw new BadRequestException(`Ngành với id ${createLopDto.nganhId} không tồn tại`);
        }

        // Kiểm tra niên khóa tồn tại
        const nienKhoa = await this.nienKhoaRepository.findOne({
            where: { id: createLopDto.nienKhoaId },
        });
        if (!nienKhoa) {
            throw new BadRequestException(`Niên khóa với id ${createLopDto.nienKhoaId} không tồn tại`);
        }

        // Tạo lớp mới
        const lop = this.lopRepository.create({
            maLop: createLopDto.maLop,
            tenLop: createLopDto.tenLop,
            nganh,
            nienKhoa,
        });

        return await this.lopRepository.save(lop);
    }

    // Cập nhật lớp
    async updateLop(id: number, updateLopDto: UpdateLopDto): Promise<Lop> {
        const lop = await this.getLopById(id); // throw NotFoundException nếu không tồn tại

        // Kiểm tra nếu thay đổi mã lớp
        if (updateLopDto.maLop && updateLopDto.maLop !== lop.maLop) {
            const existingLop = await this.lopRepository.findOneBy({
                maLop: updateLopDto.maLop,
            });

            if (existingLop) {
                throw new BadRequestException('Mã lớp này đã được sử dụng bởi lớp khác');
            }
        }

        // Cập nhật ngành nếu có thay đổi
        if (updateLopDto.nganhId && updateLopDto.nganhId !== lop.nganh.id) {
            const nganh = await this.nganhRepository.findOne({
                where: { id: updateLopDto.nganhId },
            });
            if (!nganh) {
                throw new BadRequestException(`Ngành với id ${updateLopDto.nganhId} không tồn tại`);
            }
            lop.nganh = nganh;
        }

        // Cập nhật niên khóa nếu có thay đổi
        if (updateLopDto.nienKhoaId && updateLopDto.nienKhoaId !== lop.nienKhoa.id) {
            const nienKhoa = await this.nienKhoaRepository.findOne({
                where: { id: updateLopDto.nienKhoaId },
            });
            if (!nienKhoa) {
                throw new BadRequestException(`Niên khóa với id ${updateLopDto.nienKhoaId} không tồn tại`);
            }
            lop.nienKhoa = nienKhoa;
        }

        // Cập nhật tên lớp và mã lớp (nếu hợp lệ)
        if (updateLopDto.tenLop) {
            lop.tenLop = updateLopDto.tenLop;
        }
        if (updateLopDto.maLop) {
            lop.maLop = updateLopDto.maLop;
        }

        return await this.lopRepository.save(lop);
    }

    // Xóa lớp
    async deleteLop(id: number): Promise<void> {
        const lop = await this.lopRepository.findOne({
            where: { id },
            relations: ['sinhViens'],
        });

        if (!lop) {
            throw new NotFoundException(`Lớp với id ${id} không tồn tại`);
        }

        // Kiểm tra xem lớp có sinh viên nào không
        if (lop.sinhViens && lop.sinhViens.length > 0) {
            throw new BadRequestException('Không thể xóa lớp này vì còn sinh viên thuộc về lớp');
        }

        await this.lopRepository.remove(lop);
    }

    // Lấy danh sách tất cả môn học
    async getAllMonHoc(query: GetAllMonHocQueryDto) {
        const { search } = query;
        const qb = this.monHocRepository.createQueryBuilder('monHoc');
        if (search) {
            qb.andWhere('LOWER(monHoc.tenMonHoc) LIKE LOWER(:search) OR LOWER(monHoc.maMonHoc) LIKE LOWER(:search)', { search: `%${search}%` });
        }
        qb.orderBy('monHoc.tenMonHoc', 'ASC');

        const items = await qb.getMany();
        return items;
    }

    // Thêm mới: version getAllMonHoc() có phân trang + search
    async getAllMonHocWithPagination(query: PaginationQueryDto) {
        const { page = 1, limit = 10, search, loaiMon } = query;

        const qb = this.monHocRepository.createQueryBuilder('monHoc');

        if (search) {
            qb.andWhere('LOWER(monHoc.tenMonHoc) LIKE LOWER(:search) OR LOWER(monHoc.maMonHoc) LIKE LOWER(:search)', { search: `%${search}%` });
        }

        if (loaiMon) {
            qb.andWhere('monHoc.loaiMon = :loaiMon', { loaiMon });
        }

        qb.orderBy('monHoc.tenMonHoc', 'ASC');

        const total = await qb.getCount();
        const skip = (page - 1) * limit;
        qb.skip(skip).take(limit);

        const items = await qb.getMany();

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

    // Lấy chi tiết một môn học
    async getMonHocById(id: number): Promise<MonHoc> {
        const monHoc = await this.monHocRepository.findOneBy({ id });

        if (!monHoc) {
            throw new NotFoundException(`Môn học với id ${id} không tồn tại`);
        }

        return monHoc;
    }

    async importMonHocFromExcel(filePath: string): Promise<{
        message: string;
        totalRows: number;
        success: number;
        failed: number;
        errors: { row: number; maMonHoc: string; error: string }[];
    }> {
        const results = {
            totalRows: 0,
            success: 0,
            failed: 0,
            errors: [] as { row: number; maMonHoc: string; error: string }[],
        };

        try {
            // 1. Đọc file Excel
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(filePath);
            const worksheet = workbook.getWorksheet(1);

            if (!worksheet) {
                throw new BadRequestException('File Excel không có sheet dữ liệu');
            }

            const rows = worksheet.getRows(2, worksheet.rowCount - 1) || [];
            if (rows.length === 0) {
                throw new BadRequestException('File Excel không có dữ liệu từ dòng 2 trở đi');
            }

            results.totalRows = rows.length;

            // 2. Duyệt từng dòng
            for (const row of rows) {

                if (!row || row.actualCellCount === 0) continue;

                const rowNum = row.number;

                const maMonHoc = row.getCell(2).value?.toString().trim() || '';
                const tenMonHoc = row.getCell(3).value?.toString().trim() || '';
                const loaiMonStr = row.getCell(4).value?.toString().trim() || '';
                const soTinChiStr = row.getCell(5).value?.toString().trim() || '';
                const moTa = row.getCell(6).value?.toString().trim() || undefined;
                const maGiangVien = row.getCell(7).value?.toString().trim() || ''; // Cột 7 - tùy chọn

                // Validate cơ bản (thiếu trường bắt buộc)
                if (!maMonHoc || !tenMonHoc || !loaiMonStr || !soTinChiStr) {
                    results.failed++;
                    results.errors.push({
                        row: rowNum,
                        maMonHoc: maMonHoc || 'N/A',
                        error: 'Thiếu một hoặc nhiều trường bắt buộc (Mã môn, Tên môn, Loại môn, Tín chỉ)',
                    });
                    continue;
                }

                // Validate loại môn
                const loaiMon = LoaiMonEnum[loaiMonStr as keyof typeof LoaiMonEnum];
                if (!loaiMon) {
                    results.failed++;
                    results.errors.push({
                        row: rowNum,
                        maMonHoc,
                        error: `Loại môn "${loaiMonStr}" không hợp lệ. Giá trị cho phép: ${Object.values(LoaiMonEnum).join(', ')}`,
                    });
                    continue;
                }

                // Validate số tín chỉ
                const soTinChi = parseInt(soTinChiStr, 10);
                if (isNaN(soTinChi) || soTinChi < 1) {
                    results.failed++;
                    results.errors.push({
                        row: rowNum,
                        maMonHoc,
                        error: 'Số tín chỉ phải là số nguyên lớn hơn hoặc bằng 1',
                    });
                    continue;
                }

                try {
                    // 3. Tạo môn học trước
                    const createDto: CreateMonHocDto = {
                        maMonHoc,
                        tenMonHoc,
                        loaiMon,
                        soTinChi,
                        moTa,
                    };

                    const monHocMoi = await this.createMonHoc(createDto);

                    // 4. Nếu có mã giảng viên ở cột 7 → phân công
                    if (!maGiangVien) {
                        results.failed++;
                        results.errors.push({
                            row: rowNum,
                            maMonHoc,
                            error: 'Thiếu mã giảng viên để phân công giảng viên cho môn học',
                        });
                    } else {
                        // Tìm giảng viên theo mã
                        const giangVien = await this.giangVienRepository.findOne({
                            where: { maGiangVien },
                        });

                        if (!giangVien) {
                            throw new BadRequestException(`Mã giảng viên ${maGiangVien} không tồn tại`);
                        }

                        // Gọi hàm phân công hiện có
                        const phanCongDto = {
                            giangVienId: giangVien.id,
                            monHocId: monHocMoi.id,
                        };

                        await this.phanCongMonHoc(phanCongDto);
                    }

                    results.success++;
                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        row: rowNum,
                        maMonHoc,
                        error: error.message || 'Lỗi không xác định khi tạo môn học hoặc phân công giảng viên',
                    });
                }
            }

            return {
                message: `Đã xử lý ${results.totalRows} dòng từ file Excel`,
                totalRows: results.totalRows,
                success: results.success,
                failed: results.failed,
                errors: results.errors.length > 0 ? results.errors : [],
            };
        } finally {
            // Xóa file tạm
            await fs.unlink(filePath).catch(() => { });
        }
    }

    // Thêm môn học mới
    async createMonHoc(createMonHocDto: CreateMonHocDto): Promise<MonHoc> {
        // Kiểm tra mã môn học đã tồn tại chưa
        const existingMonHoc = await this.monHocRepository.findOneBy({
            maMonHoc: createMonHocDto.maMonHoc,
        });

        if (existingMonHoc) {
            throw new BadRequestException('Mã môn học này đã tồn tại trong hệ thống');
        }

        // Tạo môn học mới
        const monHoc = this.monHocRepository.create(createMonHocDto);
        return await this.monHocRepository.save(monHoc);
    }

    // Cập nhật môn học
    async updateMonHoc(id: number, updateMonHocDto: UpdateMonHocDto): Promise<MonHoc> {
        const monHoc = await this.getMonHocById(id); // throw NotFoundException nếu không tồn tại

        // Kiểm tra nếu thay đổi mã môn học
        if (updateMonHocDto.maMonHoc && updateMonHocDto.maMonHoc !== monHoc.maMonHoc) {
            const existingMonHoc = await this.monHocRepository.findOneBy({
                maMonHoc: updateMonHocDto.maMonHoc,
            });

            if (existingMonHoc) {
                throw new BadRequestException('Mã môn học này đã được sử dụng bởi môn học khác');
            }
        }

        // Cập nhật các trường (bao gồm maMonHoc nếu hợp lệ)
        Object.assign(monHoc, updateMonHocDto);

        return await this.monHocRepository.save(monHoc);
    }

    // Xóa môn học
    async deleteMonHoc(id: number): Promise<void> {
        const monHoc = await this.monHocRepository.findOne({
            where: { id },
            relations: ['lopHocPhans', 'chiTietChuongTrinhDaoTaos', 'giangVienMonHocs'],
        });

        if (!monHoc) {
            throw new NotFoundException(`Môn học với id ${id} không tồn tại`);
        }

        // Kiểm tra xem môn học có lớp học phần nào không
        if (monHoc.lopHocPhans && monHoc.lopHocPhans.length > 0) {
            throw new BadRequestException('Không thể xóa môn học này vì còn lớp học phần liên quan');
        }

        // Kiểm tra xem môn học có trong chi tiết chương trình đào tạo nào không
        if (monHoc.chiTietChuongTrinhDaoTaos && monHoc.chiTietChuongTrinhDaoTaos.length > 0) {
            throw new BadRequestException('Không thể xóa môn học này vì còn trong chương trình đào tạo');
        }

        // Kiểm tra xem môn học có được phân công cho giảng viên nào không
        if (monHoc.giangVienMonHocs && monHoc.giangVienMonHocs.length > 0) {
            throw new BadRequestException('Không thể xóa môn học này vì còn giảng viên được phân công');
        }

        await this.monHocRepository.remove(monHoc);
    }

    async getAllGiangVien(query: PaginationQueryDto & GetGiangVienQueryDto) {
        const { page = 1, limit = 10, search, monHocId } = query;

        const qb = this.giangVienRepository
            .createQueryBuilder('gv')
            .leftJoinAndSelect('gv.monHocGiangViens', 'gvmh')
            .leftJoinAndSelect('gvmh.monHoc', 'mh')
            // ── THÊM QUAN HỆ VỚI TÀI KHOẢN (NguoiDung) ──
            .leftJoinAndSelect('gv.nguoiDung', 'nd'); // Quan hệ OneToOne đã định nghĩa trong entity GiangVien

        // ----- PHẦN FILTER CHUẨN -----
        if (monHocId) {
            qb.innerJoin('gv.monHocGiangViens', 'gvmh_filter')
                .innerJoin('gvmh_filter.monHoc', 'mh_filter')
                .andWhere('mh_filter.id = :monHocId', { monHocId });
        }

        // ----- PHẦN SEARCH -----
        if (search) {
            qb.andWhere(
                '(LOWER(gv.hoTen) LIKE LOWER(:search) OR LOWER(gv.maGiangVien) LIKE LOWER(:search))',
                { search: `%${search}%` },
            );
        }

        qb.orderBy('gv.hoTen', 'ASC');

        // ---- Xử lý phân trang ----
        let normalizedPage = Number(page) || 1;
        let normalizedLimit = Number(limit) || 10;
        if (normalizedPage < 1) normalizedPage = 1;
        if (normalizedLimit < 1) normalizedLimit = 10;

        const total = await qb.getCount();

        qb.skip((normalizedPage - 1) * normalizedLimit).take(normalizedLimit);

        const items = await qb.getMany();

        // Transform data: thêm trường nguoiDung (hoặc null) vào mỗi giảng viên
        const transformedData = items.map(gv => ({
            ...gv,
            nguoiDung: gv.nguoiDung
                ? {
                    id: gv.nguoiDung.id,
                    tenDangNhap: gv.nguoiDung.tenDangNhap,
                    vaiTro: gv.nguoiDung.vaiTro,
                    ngayTao: gv.nguoiDung.ngayTao,
                    // Thêm các trường khác nếu cần, nhưng tránh lộ thông tin nhạy cảm như matKhau
                }
                : null,
        }));

        return {
            data: transformedData,
            pagination: {
                total,
                page: normalizedPage,
                limit: normalizedLimit,
                totalPages: Math.ceil(total / normalizedLimit),
            },
        };
    }


    // Lấy giảng viên hiện tại từ user đang đăng nhập (dùng cho /me)
    async getCurrentGiangVien(userId: number): Promise<GiangVien> {
        // Giả sử bạn có NguoiDung entity và đã inject repository
        const nguoiDung = await this.nguoiDungRepository.findOne({
            where: { id: userId, vaiTro: VaiTroNguoiDungEnum.GIANG_VIEN },
            relations: ['giangVien'],
        });

        if (!nguoiDung || !nguoiDung.giangVien) {
            throw new ForbiddenException('Bạn không phải là giảng viên hoặc không có hồ sơ giảng viên');
        }

        return nguoiDung.giangVien;
    }

    // Lấy chi tiết một giảng viên
    async getGiangVienById(id: number): Promise<GiangVien> {
        const giangVien = await this.giangVienRepository.findOneBy({ id });

        if (!giangVien) {
            throw new NotFoundException(`Giảng viên với id ${id} không tồn tại`);
        }

        return giangVien;
    }

    async importGiangVienFromExcel(filePath: string): Promise<{
        message: string;
        totalRows: number;
        success: number;
        failed: number;
        errors: { row: number; maGiangVien: string; error: string }[];
    }> {
        const results = {
            totalRows: 0,
            success: 0,
            failed: 0,
            errors: [] as { row: number; maGiangVien: string; error: string }[],
        };

        try {
            // 1. Đọc file Excel
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(filePath);
            const worksheet = workbook.getWorksheet(1);

            if (!worksheet) {
                throw new BadRequestException('File Excel không có sheet dữ liệu');
            }

            const rows = worksheet.getRows(2, worksheet.rowCount - 1) || [];
            if (rows.length === 0) {
                throw new BadRequestException('File Excel không có dữ liệu từ dòng 2 trở đi');
            }

            results.totalRows = rows.length;

            // 2. Duyệt từng dòng
            for (const row of rows) {

                if (!row || row.actualCellCount === 0) continue;

                const rowNum = row.number;

                const maGiangVien = row.getCell(2).value?.toString().trim() || '';
                const hoTen = row.getCell(3).value?.toString().trim() || '';
                const ngaySinhStr = row.getCell(4).value?.toString().trim() || undefined;
                const email = row.getCell(5).value?.toString().trim() || '';
                const sdt = row.getCell(6).value?.toString().trim() || undefined;
                const gioiTinhStr = row.getCell(7).value?.toString().trim() || undefined;
                const diaChi = row.getCell(8).value?.toString().trim() || undefined;

                // Validate bắt buộc
                if (!maGiangVien || !hoTen || !email) {
                    results.failed++;
                    results.errors.push({
                        row: rowNum,
                        maGiangVien: maGiangVien || 'N/A',
                        error: 'Thiếu trường bắt buộc: Mã giảng viên, Họ tên, Email',
                    });
                    continue;
                }

                // Validate email cơ bản (class-validator sẽ kiểm tra thêm khi tạo DTO)
                if (!email.includes('@')) {
                    results.failed++;
                    results.errors.push({
                        row: rowNum,
                        maGiangVien,
                        error: 'Email không hợp lệ',
                    });
                    continue;
                }

                // Validate giới tính (nếu có)
                let gioiTinh: GioiTinh | undefined;
                if (gioiTinhStr) {
                    gioiTinh = GioiTinh[gioiTinhStr as keyof typeof GioiTinh];
                    if (!gioiTinh) {
                        results.failed++;
                        results.errors.push({
                            row: rowNum,
                            maGiangVien,
                            error: `Giới tính "${gioiTinhStr}" không hợp lệ. Giá trị cho phép: NAM, NU, KHONG_XAC_DINH`,
                        });
                        continue;
                    }
                }

                // Validate ngày sinh (nếu có)
                let ngaySinh: string | undefined;
                if (ngaySinhStr) {
                    // Kiểm tra định dạng YYYY-MM-DD đơn giản
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(ngaySinhStr)) {
                        results.failed++;
                        results.errors.push({
                            row: rowNum,
                            maGiangVien,
                            error: 'Ngày sinh phải có định dạng YYYY-MM-DD',
                        });
                        continue;
                    }
                    ngaySinh = ngaySinhStr;
                }

                try {
                    // 3. Tạo DTO và gọi hàm createGiangVien hiện có
                    const createDto: CreateGiangVienDto = {
                        maGiangVien,
                        hoTen,
                        ngaySinh,
                        email,
                        sdt,
                        gioiTinh,
                        diaChi,
                    };

                    await this.createGiangVien(createDto);

                    results.success++;
                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        row: rowNum,
                        maGiangVien,
                        error: error.message || 'Lỗi không xác định khi tạo giảng viên',
                    });
                }
            }

            return {
                message: `Đã xử lý ${results.totalRows} dòng từ file Excel`,
                totalRows: results.totalRows,
                success: results.success,
                failed: results.failed,
                errors: results.errors.length > 0 ? results.errors : [],
            };
        } finally {
            // Xóa file tạm
            await fs.unlink(filePath).catch(() => { });
        }
    }

    // Thêm giảng viên mới (admin)
    async createGiangVien(createGiangVienDto: CreateGiangVienDto): Promise<GiangVien> {
        // Kiểm tra email trùng (do có @Unique(['email']))
        const existing = await this.giangVienRepository.findOneBy({ email: createGiangVienDto.email });
        if (existing) {
            throw new BadRequestException('Email đã được sử dụng');
        }

        const existingMGV = await this.giangVienRepository.findOneBy({ maGiangVien: createGiangVienDto.maGiangVien });
        if (existingMGV) {
            throw new BadRequestException('Mã giảng viên đã được sử dụng');
        }

        const giangVien = this.giangVienRepository.create(createGiangVienDto);
        return await this.giangVienRepository.save(giangVien);
    }

    // Cập nhật giảng viên (admin)
    async updateGiangVien(id: number, updateGiangVienDto: UpdateGiangVienDto): Promise<GiangVien> {
        const giangVien = await this.getGiangVienById(id);

        // Nếu cập nhật mã giảng viên, kiểm tra trùng
        if (updateGiangVienDto.maGiangVien && updateGiangVienDto.maGiangVien !== giangVien.maGiangVien) {
            const existingMGV = await this.giangVienRepository.findOneBy({ maGiangVien: updateGiangVienDto.maGiangVien });
            if (existingMGV) {
                throw new BadRequestException('Mã giảng viên đã được sử dụng');
            }
        }

        // Nếu cập nhật email, kiểm tra trùng
        if (updateGiangVienDto.email && updateGiangVienDto.email !== giangVien.email) {
            const existing = await this.giangVienRepository.findOneBy({ email: updateGiangVienDto.email });
            if (existing) {
                throw new BadRequestException('Email đã được sử dụng');
            }
        }

        Object.assign(giangVien, updateGiangVienDto);
        return await this.giangVienRepository.save(giangVien);
    }

    // Xóa giảng viên (admin)
    async deleteGiangVien(id: number): Promise<void> {
        const giangVien = await this.giangVienRepository.findOne({
            where: { id },
            relations: ['lopHocPhans', 'monHocGiangViens', 'nguoiDung'],
        });

        if (!giangVien) {
            throw new NotFoundException(`Giảng viên với id ${id} không tồn tại`);
        }

        // Kiểm tra xem giảng viên có được phân công vào lớp học phần nào không
        if (giangVien.lopHocPhans && giangVien.lopHocPhans.length > 0) {
            throw new BadRequestException('Không thể xóa giảng viên này vì còn được phân công vào lớp học phần');
        }

        // 1) Xóa các phân công môn học
        if (giangVien.monHocGiangViens && giangVien.monHocGiangViens.length > 0) {
            await this.giangVienMonHocRepository.remove(giangVien.monHocGiangViens);
        }

        // 2) Xóa tài khoản người dùng liên kết
        if (giangVien.nguoiDung) {
            await this.nguoiDungRepository.remove(giangVien.nguoiDung);
        }

        // 3) Xóa giảng viên
        await this.giangVienRepository.remove(giangVien);
    }

    async updateMyProfile(user: { userId: number; vaiTro: string }, capNhatThongTinCaNhanGiangVienDto: CapNhatThongTinCaNhanGiangVienDto): Promise<GiangVien> {
        // Tìm giảng viên liên kết với userId (qua bảng NguoiDung)
        const nguoiDung = await this.nguoiDungRepository.findOne({
            where: { id: user.userId },
            relations: ['giangVien'],
        });

        if (!nguoiDung || !nguoiDung.giangVien) {
            throw new NotFoundException('Không tìm thấy hồ sơ giảng viên của bạn');
        }

        const giangVien = nguoiDung.giangVien;

        // Kiểm tra email trùng nếu có thay đổi
        if (capNhatThongTinCaNhanGiangVienDto.email && capNhatThongTinCaNhanGiangVienDto.email !== giangVien.email) {
            const existing = await this.giangVienRepository.findOneBy({ email: capNhatThongTinCaNhanGiangVienDto.email });
            if (existing) {
                throw new BadRequestException('Email đã được sử dụng bởi giảng viên khác');
            }
        }

        Object.assign(giangVien, capNhatThongTinCaNhanGiangVienDto);

        return await this.giangVienRepository.save(giangVien);
    }

    async getMyProfile(user: { userId: number; vaiTro: string }): Promise<GiangVien> {
        // Tìm giảng viên liên kết với userId (qua bảng NguoiDung)
        const nguoiDung = await this.nguoiDungRepository.findOne({
            where: { id: user.userId },
            relations: ['giangVien'],
        });
        if (!nguoiDung || !nguoiDung.giangVien) {
            throw new NotFoundException('Không tìm thấy hồ sơ giảng viên của bạn');
        }
        return nguoiDung.giangVien;
    }

    // Phân công môn học cho giảng viên
    async phanCongMonHoc(dto: PhanCongMonHocDto): Promise<GiangVienMonHoc> {
        const giangVien = await this.giangVienRepository.findOneBy({ id: dto.giangVienId });
        if (!giangVien) {
            throw new BadRequestException(`Giảng viên với id ${dto.giangVienId} không tồn tại`);
        }

        const monHoc = await this.monHocRepository.findOneBy({ id: dto.monHocId });
        if (!monHoc) {
            throw new BadRequestException(`Môn học với id ${dto.monHocId} không tồn tại`);
        }

        // Kiểm tra đã phân công chưa (do có @Unique(['giangVien', 'monHoc']))
        const existing = await this.giangVienMonHocRepository.findOne({
            where: { giangVien: { id: dto.giangVienId }, monHoc: { id: dto.monHocId } },
        });

        if (existing) {
            throw new BadRequestException('Giảng viên đã được phân công môn học này');
        }

        const phanCong = this.giangVienMonHocRepository.create({
            giangVien,
            monHoc,
        });

        return await this.giangVienMonHocRepository.save(phanCong);
    }

    // Xóa phân công môn học
    async xoaPhanCongMonHoc(params: { giangVienId: number; monHocId: number }): Promise<void> {
        const phanCong = await this.giangVienMonHocRepository.findOne({
            where: {
                giangVien: { id: params.giangVienId },
                monHoc: { id: params.monHocId },
            },
            relations: ['giangVien', 'monHoc'],
        });

        if (!phanCong) {
            throw new NotFoundException('Phân công môn học không tồn tại');
        }

        await this.giangVienMonHocRepository.remove(phanCong);
    }

    // Lấy danh sách môn học mà giảng viên được phân công (giữ nguyên)
    // Lấy thông tin giảng viên và danh sách môn học được phân công
    // Lấy thông tin giảng viên kèm danh sách môn học được phân công
    async getMonHocByGiangVien(giangVienId: number): Promise<PhanCongMonHocResponseDto> {
        // Tìm giảng viên kèm theo các phân công môn học
        const giangVien = await this.giangVienRepository.findOne({
            where: { id: giangVienId },
            relations: ['monHocGiangViens', 'monHocGiangViens.monHoc'],
            select: {
                id: true,
                hoTen: true,
                email: true,
                sdt: true,
                ngaySinh: true,
                gioiTinh: true,
                diaChi: true,
            },
        });

        if (!giangVien) {
            throw new NotFoundException(`Giảng viên với id ${giangVienId} không tồn tại`);
        }

        // Lấy danh sách môn học từ các phân công, sắp xếp theo tên môn học
        const monHocs = (giangVien.monHocGiangViens || [])
            .map(gvmh => gvmh.monHoc)
            .sort((a, b) => a.tenMonHoc.localeCompare(b.tenMonHoc));

        // Trả về object sạch: thông tin giảng viên + danh sách môn học
        return {
            giangVien: {
                id: giangVien.id,
                maGiangVien: giangVien.maGiangVien,
                hoTen: giangVien.hoTen,
                email: giangVien.email,
                sdt: giangVien.sdt,
                ngaySinh: giangVien.ngaySinh,
                gioiTinh: giangVien.gioiTinh,
                diaChi: giangVien.diaChi,
            },
            monHocs,
        };
    }
}