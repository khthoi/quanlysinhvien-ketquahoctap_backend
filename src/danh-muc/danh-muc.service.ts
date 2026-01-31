import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Any, Not, Repository } from 'typeorm';
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

                // Validate từng trường bắt buộc, log mỗi lỗi riêng biệt (một dòng một lỗi)
                let hasValidationError = false;
                if (!maNganh) {
                    results.errors.push({
                        row: rowNum,
                        maNganh: 'N/A',
                        error: 'Thiếu trường bắt buộc: Mã ngành',
                    });
                    hasValidationError = true;
                }
                if (!tenNganh) {
                    results.errors.push({
                        row: rowNum,
                        maNganh: maNganh || 'N/A',
                        error: 'Thiếu trường bắt buộc: Tên ngành',
                    });
                    hasValidationError = true;
                }
                if (!maKhoa) {
                    results.errors.push({
                        row: rowNum,
                        maNganh: maNganh || 'N/A',
                        error: 'Thiếu trường bắt buộc: Mã khoa',
                    });
                    hasValidationError = true;
                }
                if (hasValidationError) {
                    results.failed++;
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

        // Kiểm tra khoảng cách đúng 4 năm
        if (createNienKhoaDto.namKetThuc !== createNienKhoaDto.namBatDau + 4) {
            throw new BadRequestException('Khoảng thời gian niên khóa phải đúng 4 năm (năm kết thúc = năm bắt đầu + 4)');
        }

        if (createNienKhoaDto.namKetThuc <= createNienKhoaDto.namBatDau) {
            throw new BadRequestException('Năm kết thúc phải lớn hơn năm bắt đầu');
        }

        // Kiểm tra trùng mã niên khóa
        const existingByMa = await this.nienKhoaRepository.findOneBy({
            maNienKhoa: createNienKhoaDto.maNienKhoa,
        });

        if (existingByMa) {
            throw new BadRequestException('Mã niên khóa này đã tồn tại trong hệ thống');
        }

        // Kiểm tra trùng khoảng thời gian (cùng năm bắt đầu VÀ năm kết thúc)
        const existingByTime = await this.nienKhoaRepository.findOne({
            where: {
                namBatDau: createNienKhoaDto.namBatDau,
                namKetThuc: createNienKhoaDto.namKetThuc,
            },
        });

        if (existingByTime) {
            throw new BadRequestException(
                `Đã tồn tại niên khóa với khoảng thời gian ${createNienKhoaDto.namBatDau} - ${createNienKhoaDto.namKetThuc}. ` +
                'Không được tạo niên khóa trùng năm bắt đầu và năm kết thúc.'
            );
        }

        // Tạo mới
        const nienKhoa = this.nienKhoaRepository.create(createNienKhoaDto);
        return await this.nienKhoaRepository.save(nienKhoa);
    }

    // Cập nhật niên khóa (chỉ cán bộ ĐT)
    async updateNienKhoa(id: number, updateNienKhoaDto: UpdateNienKhoaDto): Promise<NienKhoa> {
        const nienKhoa = await this.getNienKhoaById(id); // throw NotFoundException nếu không tồn tại

        // Kiểm tra trùng mã niên khóa (khác với chính nó)
        if (updateNienKhoaDto.maNienKhoa) {
            const trungMa = await this.nienKhoaRepository.findOne({
                where: {
                    maNienKhoa: updateNienKhoaDto.maNienKhoa,
                    id: Not(id),
                },
            });

            if (trungMa) {
                throw new BadRequestException('Mã niên khóa này đã được sử dụng bởi niên khóa khác');
            }
        }

        // Xác định giá trị năm mới (dùng giá trị từ DTO nếu có, nếu không thì giữ nguyên)
        const namBatDauMoi = updateNienKhoaDto.namBatDau ?? nienKhoa.namBatDau;
        const namKetThucMoi = updateNienKhoaDto.namKetThuc ?? nienKhoa.namKetThuc;

        // Kiểm tra khoảng cách đúng 4 năm
        if (namKetThucMoi !== namBatDauMoi + 4) {
            throw new BadRequestException('Khoảng thời gian niên khóa phải đúng 4 năm (năm kết thúc = năm bắt đầu + 4)');
        }

        // Kiểm tra trùng khoảng thời gian với niên khóa KHÁC (không tính chính nó)
        if (updateNienKhoaDto.namBatDau || updateNienKhoaDto.namKetThuc) {
            const existingByTime = await this.nienKhoaRepository.findOne({
                where: {
                    namBatDau: namBatDauMoi,
                    namKetThuc: namKetThucMoi,
                    id: Not(id),
                },
            });

            if (existingByTime) {
                throw new BadRequestException(
                    `Đã tồn tại niên khóa khác với khoảng thời gian ${namBatDauMoi} - ${namKetThucMoi}. ` +
                    'Không được cập nhật trùng năm bắt đầu và năm kết thúc.'
                );
            }
        }

        // Cập nhật các trường
        Object.assign(nienKhoa, updateNienKhoaDto);

        return await this.nienKhoaRepository.save(nienKhoa);
    }

    // Xóa niên khóa (chỉ cán bộ ĐT)
    async deleteNienKhoa(id: number): Promise<void> {
        const nienKhoa = await this.nienKhoaRepository.findOne({
            where: { id },
            relations: ['lops', 'apDungChuongTrinhs', 'lopHocPhans'],
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
                const missingFields: string[] = [];

                if (!maLop) missingFields.push('Mã lớp');
                if (!tenLop) missingFields.push('Tên lớp');
                if (!maNganh) missingFields.push('Mã ngành');
                if (!maNienKhoa) missingFields.push('Mã niên khóa');

                if (missingFields.length > 0) {
                    results.failed++;
                    results.errors.push({
                        row: rowNum,
                        maLop: maLop || 'N/A',
                        error: `Thiếu dữ liệu: ${missingFields.join(', ')}`,
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

    async exportMonHocToExcel(query: GetAllMonHocQueryDto): Promise<Buffer> {
        const monHocs = await this.getAllMonHoc(query);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Danh sách môn học');

        // ===== STYLE =====
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

        // ===== HEADER =====
        worksheet.mergeCells('A1:G1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'BÁO CÁO DANH SÁCH MÔN HỌC';
        titleCell.font = {
            name: 'Times New Roman',
            size: 18,
            bold: true,
            color: { argb: 'FF1F4E79' },
        };
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getRow(1).height = 30;

        worksheet.mergeCells('A2:G2');
        const subtitleCell = worksheet.getCell('A2');
        subtitleCell.value = `Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')}`;
        subtitleCell.font = { name: 'Times New Roman', size: 11, italic: true };
        subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getRow(2).height = 20;

        worksheet.getRow(3).height = 10;

        // ===== HEADER TABLE =====
        const headerRow = worksheet.getRow(4);
        const headers = [
            { header: 'STT', width: 8 },
            { header: 'Mã môn học', width: 25 },
            { header: 'Tên môn học', width: 35 },
            { header: 'Số tín chỉ', width: 12 },
            { header: 'Loại môn', width: 22 },
            { header: 'Mô tả', width: 50 },
            { header: 'GV phụ trách', width: 35 }, // combobox
        ];

        headers.forEach((col, i) => {
            worksheet.getColumn(i + 1).width = col.width;
            const cell = headerRow.getCell(i + 1);
            cell.value = col.header;
            cell.font = headerFontStyle;
            cell.fill = blueFill;
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            cell.border = borderStyle;
        });
        headerRow.height = 28;

        // ===== DATA =====
        let currentRow = 5;

        for (let i = 0; i < monHocs.length; i++) {
            const monHoc = monHocs[i];

            // Lấy TẤT CẢ giảng viên của môn
            const gvMonHocs = await this.giangVienMonHocRepository.find({
                where: { monHoc: { id: monHoc.id } },
                relations: ['giangVien'],
            });

            // Build list cho combobox
            const gvList = gvMonHocs.map(gv =>
                `${gv.giangVien.maGiangVien} - ${gv.giangVien.hoTen}`
            );

            const row = worksheet.getRow(currentRow);

            const rowData = [
                i + 1,
                monHoc.maMonHoc,
                monHoc.tenMonHoc,
                monHoc.soTinChi,
                this.formatLoaiMon(monHoc.loaiMon),
                monHoc.moTa || '',
                '', // cell combobox
            ];

            rowData.forEach((value, index) => {
                const cell = row.getCell(index + 1);
                cell.value = value;
                cell.font = fontStyle;
                cell.border = borderStyle;
                cell.alignment = {
                    vertical: 'middle',
                    horizontal: index === 0 || index === 3 ? 'center' : 'left',
                    wrapText: true,
                };

                if (i % 2 === 1) {
                    cell.fill = lightBlueFill;
                }
            });

            // ===== COMBOBOX GV =====
            const gvCell = row.getCell(7);

            if (gvList.length > 0) {
                gvCell.dataValidation = {
                    type: 'list',
                    allowBlank: true,
                    showInputMessage: true,
                    promptTitle: 'Chọn giảng viên',
                    prompt: 'Chọn giảng viên phụ trách môn học',
                    showErrorMessage: true,
                    errorTitle: 'Giá trị không hợp lệ',
                    error: 'Vui lòng chọn giảng viên trong danh sách',
                    formulae: [`"${gvList.join(',')}"`], // Excel dropdown
                };
            } else {
                gvCell.value = 'Chưa phân công';
                gvCell.font = { ...fontStyle, italic: true, color: { argb: 'FF999999' } };
            }

            row.height = 22;
            currentRow++;
        }

        // ===== FOOTER =====
        currentRow++;
        worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
        const footerCell = worksheet.getCell(`A${currentRow}`);
        footerCell.value = `Tổng số môn học: ${monHocs.length}`;
        footerCell.font = {
            name: 'Times New Roman',
            size: 12,
            bold: true,
            italic: true,
        };
        footerCell.alignment = { vertical: 'middle', horizontal: 'right' };

        return await workbook.xlsx.writeBuffer() as unknown as Buffer;
    }

    private formatLoaiMon(loaiMon: LoaiMonEnum): string {
        const mapping = {
            [LoaiMonEnum.DAI_CUONG]: 'Đại cương',
            [LoaiMonEnum.CHUYEN_NGANH]: 'Chuyên ngành',
            [LoaiMonEnum.TU_CHON]: 'Tự chọn',
        };
        return mapping[loaiMon] || loaiMon;
    }

    // Thêm mới: version getAllMonHoc() có phân trang + search (môn học + mã/tên giảng viên), trả về thông tin giảng viên phụ trách
    async getAllMonHocWithPagination(query: PaginationQueryDto) {
        const { page = 1, limit = 10, search, loaiMon } = query;
        const searchParam = search ? `%${search}%` : null;

        const qb = this.monHocRepository
            .createQueryBuilder('monHoc')
            .leftJoinAndSelect('monHoc.giangVienMonHocs', 'gvmh')
            .leftJoinAndSelect('gvmh.giangVien', 'gv');

        if (searchParam) {
            qb.andWhere(
                '(LOWER(monHoc.tenMonHoc) LIKE LOWER(:search) OR LOWER(monHoc.maMonHoc) LIKE LOWER(:search) OR LOWER(gv.maGiangVien) LIKE LOWER(:search) OR LOWER(gv.hoTen) LIKE LOWER(:search))',
                { search: searchParam },
            );
        }

        if (loaiMon) {
            qb.andWhere('monHoc.loaiMon = :loaiMon', { loaiMon });
        }

        qb.orderBy('monHoc.tenMonHoc', 'ASC');

        // Đếm số môn học phân biệt (tránh trùng khi join nhiều giảng viên)
        const totalQb = this.monHocRepository
            .createQueryBuilder('monHoc')
            .leftJoin('monHoc.giangVienMonHocs', 'gvmh')
            .leftJoin('gvmh.giangVien', 'gv');

        if (searchParam) {
            totalQb.andWhere(
                '(LOWER(monHoc.tenMonHoc) LIKE LOWER(:search) OR LOWER(monHoc.maMonHoc) LIKE LOWER(:search) OR LOWER(gv.maGiangVien) LIKE LOWER(:search) OR LOWER(gv.hoTen) LIKE LOWER(:search))',
                { search: searchParam },
            );
        }
        if (loaiMon) {
            totalQb.andWhere('monHoc.loaiMon = :loaiMon', { loaiMon });
        }
        const countResult = await totalQb.select('COUNT(DISTINCT monHoc.id)', 'cnt').getRawOne<{ cnt: string }>();
        const total = countResult?.cnt != null ? parseInt(countResult.cnt, 10) : 0;

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

    async exportGiangVienToExcel(query: PaginationQueryDto & GetGiangVienQueryDto): Promise<Buffer> {
        // Lấy tất cả giảng viên (không phân trang cho export)
        const queryWithoutPagination = { ...query, page: 1, limit: 999999 };
        const result = await this.getAllGiangVien(queryWithoutPagination);
        const giangViens = result.data;

        // Lấy tất cả môn học để tạo dropdown
        const allMonHocs = await this.monHocRepository.find({
            select: ['id', 'maMonHoc', 'tenMonHoc'],
            order: { maMonHoc: 'ASC' },
        });

        // Tạo workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Danh sách giảng viên');

        // Định nghĩa các cột
        worksheet.columns = [
            { header: 'STT', key: 'stt', width: 10 },
            { header: 'Mã giảng viên', key: 'maGiangVien', width: 20 },
            { header: 'Tên giảng viên', key: 'hoTen', width: 30 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'SĐT', key: 'sdt', width: 15 },
            { header: 'Ngày sinh', key: 'ngaySinh', width: 15 },
            { header: 'Giới tính', key: 'gioiTinh', width: 15 },
            { header: 'Địa chỉ', key: 'diaChi', width: 40 },
            { header: 'Môn học phụ trách', key: 'monHocPhuTrach', width: 25 },
        ];

        // Style cho header
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9D9D9' },
        };

        // Thêm dữ liệu
        for (let i = 0; i < giangViens.length; i++) {
            const gv = giangViens[i];

            // Lấy danh sách mã môn học mà giảng viên phụ trách
            const monHocIds = gv.monHocGiangViens?.map(gvmh => gvmh.monHoc?.maMonHoc).filter(Boolean) || [];

            const row = worksheet.addRow({
                stt: i + 1,
                maGiangVien: gv.maGiangVien,
                hoTen: gv.hoTen,
                email: gv.email,
                sdt: gv.sdt || '',
                ngaySinh: gv.ngaySinh ? this.formatDate(new Date(gv.ngaySinh)) : '',
                gioiTinh: this.formatGioiTinh(gv.gioiTinh),
                diaChi: gv.diaChi || '',
                monHocPhuTrach: monHocIds.join(', '),
            });
        }

        // Tạo dropdown cho cột "Môn học phụ trách"
        const monHocList = allMonHocs.map(mh => mh.maMonHoc).join(',');

        // Áp dụng data validation cho cột môn học (cột I - index 9)
        for (let i = 2; i <= giangViens.length + 1; i++) {
            worksheet.getCell(`I${i}`).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: [`"${monHocList}"`],
                showErrorMessage: true,
                errorTitle: 'Giá trị không hợp lệ',
                error: 'Vui lòng chọn mã môn học từ danh sách',
            };
        }

        // Border cho tất cả các cell có dữ liệu
        worksheet.eachRow((row, rowNumber) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
            });
        });

        // Xuất ra buffer
        return await workbook.xlsx.writeBuffer() as unknown as Buffer;
    }

    private formatGioiTinh(gioiTinh: GioiTinh): string {
        const mapping = {
            [GioiTinh.NAM]: 'Nam',
            [GioiTinh.NU]: 'Nữ',
            [GioiTinh.KHONG_XAC_DINH]: 'Không rõ',
        };
        return mapping[gioiTinh] || 'Không rõ';
    }

    private formatDate(date: Date): string {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
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

                // Validate cơ bản (thiếu trường bắt buộc)
                const missingFields: string[] = [];

                if (!maMonHoc) missingFields.push('Mã môn');
                if (!tenMonHoc) missingFields.push('Tên môn');
                if (!loaiMonStr) missingFields.push('Loại môn');
                if (!soTinChiStr) missingFields.push('Tín chỉ');

                if (missingFields.length > 0) {
                    results.failed++;
                    results.errors.push({
                        row: rowNum,
                        maMonHoc: maMonHoc || 'N/A',
                        error: `Thiếu dữ liệu: ${missingFields.join(', ')}`,
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
                    // 3. Tạo môn học
                    const createDto: CreateMonHocDto = {
                        maMonHoc,
                        tenMonHoc,
                        loaiMon,
                        soTinChi,
                        moTa,
                    };

                    await this.createMonHoc(createDto);

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

    async exportMauNhapGiangVienExcel(): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();

        // =========================
        // Lấy danh sách môn học
        // =========================
        const monHocs = await this.monHocRepository.find({
            order: { tenMonHoc: 'ASC' },
        });

        // Sheet 1: Giảng viên
        const wsGiangVien = workbook.addWorksheet('Giảng viên');
        const gvColumns = [
            { header: 'STT', key: 'stt', width: 8 },
            { header: 'Mã giảng viên', key: 'maGiangVien', width: 18 },
            { header: 'Họ tên', key: 'hoTen', width: 25 },
            { header: 'Ngày sinh', key: 'ngaySinh', width: 16 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Số điện thoại', key: 'soDienThoai', width: 18 },
            { header: 'Giới tính', key: 'gioiTinh', width: 14 },
            { header: 'Địa chỉ', key: 'diaChi', width: 35 },
        ];
        wsGiangVien.columns = gvColumns;

        // Style Header cho Sheet Giảng viên
        const gvHeaderRow = wsGiangVien.getRow(1);
        gvHeaderRow.height = 35;
        gvHeaderRow.eachCell(cell => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF1F4E78' }, // xanh đậm
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
        });

        // Freeze header
        wsGiangVien.views = [{ state: 'frozen', ySplit: 1 }];

        // Data mẫu Sheet 1
        wsGiangVien.addRow({
            stt: 1,
            maGiangVien: 'GV001',
            hoTen: 'Nguyễn Văn A',
            ngaySinh: '1985-05-12',
            email: 'nguyenvana@university.edu.vn',
            soDienThoai: '0987654321',
            gioiTinh: 'NAM',
            diaChi: 'Hà Nội',
        });
        wsGiangVien.addRow({
            stt: 2,
            maGiangVien: 'GV002',
            hoTen: 'Trần Thị B',
            ngaySinh: '1990-08-20',
            email: 'tranthib@university.edu.vn',
            soDienThoai: '0912345678',
            gioiTinh: 'NU',
            diaChi: 'TP. Hồ Chí Minh',
        });

        // Format body cho Sheet Giảng viên
        wsGiangVien.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                row.height = 28;
                row.eachCell(cell => {
                    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' },
                    };
                });
            }
        });

        // Dropdown giới tính cho Sheet 1 (cột G từ row 2 đến 500)
        for (let i = 2; i <= 500; i++) {
            wsGiangVien.getCell(`G${i}`).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: ['"NAM,NU"'],
                showErrorMessage: true,
                errorStyle: 'error',
                errorTitle: 'Giá trị không hợp lệ',
                error: 'Chỉ được chọn NAM hoặc NU',
            };
        }

        // Ghi chú hướng dẫn cho Sheet 1
        wsGiangVien.getCell('G1').note = `
Chỉ chọn 1 trong 2:
NAM
NU
`;

        // Sheet 2: Phân công môn học
        const wsPhanCong = workbook.addWorksheet('Phân công môn học');
        const pcColumns = [
            { header: 'Mã giảng viên', key: 'maGiangVien', width: 18 },
            { header: 'Mã môn học', key: 'maMonHoc', width: 20 },
        ];
        wsPhanCong.columns = pcColumns;

        // Style Header cho Sheet Phân công
        const pcHeaderRow = wsPhanCong.getRow(1);
        pcHeaderRow.height = 35;
        pcHeaderRow.eachCell(cell => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF1F4E78' }, // xanh đậm
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
        });

        // Freeze header
        wsPhanCong.views = [{ state: 'frozen', ySplit: 1 }];

        // Data mẫu Sheet 2
        wsPhanCong.addRow({ maGiangVien: 'GV001', maMonHoc: monHocs[0]?.maMonHoc || '' });
        wsPhanCong.addRow({ maGiangVien: 'GV001', maMonHoc: monHocs[1]?.maMonHoc || '' });
        wsPhanCong.addRow({ maGiangVien: 'GV002', maMonHoc: monHocs[0]?.maMonHoc || '' });

        // Format body cho Sheet Phân công
        wsPhanCong.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                row.height = 28;
                row.eachCell(cell => {
                    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' },
                    };
                });
            }
        });

        // Sheet ẩn: DM_MON_HOC
        const hiddenSheet = workbook.addWorksheet('DM_MON_HOC', { state: 'hidden' });
        hiddenSheet.columns = [
            { header: 'Mã môn', key: 'ma', width: 20 },
            { header: 'Tên môn', key: 'ten', width: 40 },
        ];
        monHocs.forEach(m => {
            hiddenSheet.addRow({
                ma: m.maMonHoc,
                ten: m.tenMonHoc,
            });
        });
        const lastRow = monHocs.length + 1;

        // Dropdown cho cột B (Mã môn học) ở Sheet Phân công (từ row 2 đến 1000)
        for (let i = 2; i <= 1000; i++) {
            wsPhanCong.getCell(`B${i}`).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: [`=DM_MON_HOC!$A$2:$A$${lastRow}`], // mã môn
                showErrorMessage: true,
                errorStyle: 'error',
                errorTitle: 'Giá trị không hợp lệ',
                error: 'Chọn mã môn trong danh sách',
            };
        }

        // Ghi chú hướng dẫn cho Sheet Phân công
        wsPhanCong.getCell('A1').note = `
Copy mã giảng viên từ Sheet "Giảng viên".
Mỗi dòng là một phân công (một môn cho một giảng viên).
Có thể có nhiều dòng cho cùng một giảng viên nếu dạy nhiều môn.
`;

        wsPhanCong.getCell('B1').note = `
Chọn mã môn từ danh sách dropdown.
`;

        // Xuất file
        const arrayBuffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(arrayBuffer);
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
        totalRowsSheet1: number;
        successSheet1: number;
        failedSheet1: number;
        totalRowsSheet2: number;
        successSheet2: number;
        failedSheet2: number;
        errors: { sheet: string; row: number; maGiangVien?: string; error: string }[];
        success: { sheet: string; row: number; maGiangVien?: string; maMonHoc?: string; message: string }[];
    }> {
        const results = {
            totalRowsSheet1: 0,
            successSheet1: 0,
            failedSheet1: 0,
            totalRowsSheet2: 0,
            successSheet2: 0,
            failedSheet2: 0,
            errors: [] as { sheet: string; row: number; maGiangVien?: string; maMonhoc?: string ;error: string }[],
            success: [] as { sheet: string; row: number; maGiangVien?: string; maMonHoc?: string; message: string }[],
        };

        function getCellText(cellValue: any): string {
            if (!cellValue) return '';

            if (typeof cellValue === 'string') return cellValue.trim();
            if (typeof cellValue === 'number') return cellValue.toString();
            if (cellValue instanceof Date) return cellValue.toISOString();

            if (typeof cellValue === 'object') {
                if (cellValue.text) return cellValue.text.toString().trim();
                if (cellValue.hyperlink) return cellValue.hyperlink.replace(/^mailto:/i, '').trim();
                if (cellValue.richText) return cellValue.richText.map((r: any) => r.text).join('').trim();
                if (cellValue.result) return cellValue.result.toString().trim();
            }

            return cellValue.toString().trim();
        }


        try {
            // 1. Đọc file Excel
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(filePath);

            // Lấy hai sheet
            const wsGiangVien = workbook.getWorksheet('Giảng viên');
            const wsPhanCong = workbook.getWorksheet('Phân công môn học');

            if (!wsGiangVien) {
                throw new BadRequestException('Không tìm thấy sheet "Giảng viên"');
            }

            // ────────────────────────────────────────────────
            // XỬ LÝ SHEET 1: Giảng viên (tạo giảng viên trước)
            // ────────────────────────────────────────────────
            const rowsSheet1 = wsGiangVien.getRows(2, wsGiangVien.rowCount - 1) || [];
            results.totalRowsSheet1 = rowsSheet1.length;

            const createdGiangVienMap = new Map<string, GiangVien>(); // Lưu tạm các giảng viên vừa tạo để dùng ở sheet 2

            for (const row of rowsSheet1) {
                if (!row || row.actualCellCount === 0) continue;

                const rowNum = row.number;

                // Lấy giá trị (cột bắt đầu từ 1: STT, 2: Mã GV, 3: Họ tên, ...)
                const maGiangVien = (row.getCell(2).value?.toString() || '').trim();
                const hoTen = (row.getCell(3).value?.toString() || '').trim();
                const ngaySinhStr = row.getCell(4).value;
                const email = getCellText(row.getCell(5).value);
                const sdt = row.getCell(6).value?.toString().trim() || undefined;
                const gioiTinhStr = (row.getCell(7).value?.toString() || '').trim();
                const diaChi = row.getCell(8).value?.toString().trim() || undefined;

                // Validate bắt buộc
                const missing: string[] = [];
                if (!maGiangVien) missing.push('Mã giảng viên');
                if (!hoTen) missing.push('Họ tên');
                if (!email) missing.push('Email');

                if (missing.length > 0) {
                    results.failedSheet1++;
                    results.errors.push({
                        sheet: 'Giảng viên',
                        row: rowNum,
                        maGiangVien: maGiangVien || 'N/A',
                        error: `Thiếu trường bắt buộc: ${missing.join(', ')}`,
                    });
                    continue;
                }

                // Validate email cơ bản
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    results.failedSheet1++;
                    results.errors.push({
                        sheet: 'Giảng viên',
                        row: rowNum,
                        maGiangVien,
                        error: 'Email không hợp lệ',
                    });
                    continue;
                }

                // Xử lý giới tính
                let gioiTinh: GioiTinh | undefined;
                if (gioiTinhStr) {
                    const upper = gioiTinhStr.toUpperCase();
                    if (['NAM', 'NU', 'KHONG_XAC_DINH'].includes(upper)) {
                        gioiTinh = GioiTinh[upper as keyof typeof GioiTinh];
                    } else {
                        results.failedSheet1++;
                        results.errors.push({
                            sheet: 'Giảng viên',
                            row: rowNum,
                            maGiangVien,
                            error: `Giới tính không hợp lệ: "${gioiTinhStr}". Chỉ chấp nhận: NAM, NU, KHONG_XAC_DINH`,
                        });
                        continue;
                    }
                }

                // =========================
                // Xử lý ngày sinh (BẮT BUỘC)
                // =========================
                let ngaySinh: string | undefined;

                // ❌ Không có data → lỗi
                if (!ngaySinhStr || (typeof ngaySinhStr === 'string' && !ngaySinhStr.trim())) {
                    results.failedSheet1++;
                    results.errors.push({
                        sheet: 'Giảng viên',
                        row: rowNum,
                        maGiangVien,
                        error: 'Thiếu dữ liệu: Ngày sinh',
                    });
                    continue;
                }

                let parsed: Date | null = null;

                // Excel date object
                if (ngaySinhStr instanceof Date && !isNaN(ngaySinhStr.getTime())) {
                    parsed = ngaySinhStr;
                }
                // String
                else if (typeof ngaySinhStr === 'string') {
                    const str = ngaySinhStr.trim();

                    // YYYY-MM-DD
                    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
                        parsed = new Date(str);
                    }
                    // DD-MM-YYYY hoặc DD/MM/YYYY
                    else if (/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.test(str)) {
                        const [, d, m, y] = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/)!;
                        parsed = new Date(+y, +m - 1, +d);
                    }
                    // MM/DD/YYYY
                    else if (/^(\d{1,2})[/](\d{1,2})[/](\d{4})$/.test(str)) {
                        const [, m, d, y] = str.match(/^(\d{1,2})[/](\d{1,2})[/](\d{4})$/)!;
                        parsed = new Date(+y, +m - 1, +d);
                    }
                }

                // ❌ Sai format hoặc parse lỗi
                if (!parsed || isNaN(parsed.getTime())) {
                    results.failedSheet1++;
                    results.errors.push({
                        sheet: 'Giảng viên',
                        row: rowNum,
                        maGiangVien,
                        error: 'Ngày sinh không hợp lệ. Định dạng hỗ trợ: YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY',
                    });
                    continue;
                }

                // ✅ OK
                ngaySinh = parsed.toISOString().split('T')[0]; // YYYY-MM-DD


                try {
                    const dto: CreateGiangVienDto = {
                        maGiangVien,
                        hoTen,
                        ngaySinh,
                        email,
                        sdt,
                        gioiTinh,
                        diaChi,
                    };

                    // Tạo hoặc cập nhật (tùy logic business của bạn, ở đây giả sử upsert theo maGiangVien)
                    let giangVien: GiangVien;

                    const existing = await this.giangVienRepository.findOne({ where: { maGiangVien } });
                    if (existing) {
                        // Cập nhật nếu đã tồn tại (hoặc bạn có thể throw error nếu không cho phép update)
                        giangVien = await this.giangVienRepository.save({ ...existing, ...dto });
                    } else {
                        giangVien = await this.createGiangVien(dto);
                    }

                    createdGiangVienMap.set(maGiangVien, giangVien);
                    results.successSheet1++;

                    // ✅ LOG SUCCESS
                    results.success.push({
                        sheet: 'Giảng viên',
                        row: rowNum,
                        maGiangVien,
                        message: `Tạo giảng viên thành công: ${maGiangVien}`,
                    });
                } catch (err: any) {
                    results.failedSheet1++;
                    results.errors.push({
                        sheet: 'Giảng viên',
                        row: rowNum,
                        maGiangVien,
                        error: err.message || 'Lỗi khi tạo giảng viên',
                    });
                }
            }

            // ────────────────────────────────────────────────
            // XỬ LÝ SHEET 2: Phân công môn học (chỉ khi có giảng viên)
            // ────────────────────────────────────────────────
            if (wsPhanCong) {
                const rowsSheet2 = wsPhanCong.getRows(2, wsPhanCong.rowCount - 1) || [];
                results.totalRowsSheet2 = rowsSheet2.length;

                for (const row of rowsSheet2) {
                    if (!row || row.actualCellCount === 0) continue;

                    const rowNum = row.number;
                    const maGiangVien = (row.getCell(1).value?.toString() || '').trim();
                    const maMonHoc = (row.getCell(2).value?.toString() || '').trim();

                    const missingFields: string[] = [];

                    if (!maGiangVien) missingFields.push('Mã giảng viên');
                    if (!maMonHoc) missingFields.push('Mã môn học');

                    if (missingFields.length > 0) {
                        results.failedSheet2++;
                        results.errors.push({
                            sheet: 'Phân công môn học',
                            row: rowNum,
                            maGiangVien: maGiangVien || 'N/A',
                            maMonhoc: maMonHoc || 'N/A',
                            error: `Thiếu ${missingFields.join(' và ')}`
                        });
                        continue;
                    }


                    // Kiểm tra giảng viên có tồn tại không (ưu tiên từ map vừa tạo, sau đó query DB)
                    let giangVien: GiangVien | null = createdGiangVienMap.get(maGiangVien) || null;
                    if (!giangVien) {
                        giangVien = await this.giangVienRepository.findOne({
                            where: { maGiangVien },
                            relations: ['monHocs'], // nếu cần check trùng lặp
                        });
                    }

                    if (!giangVien) {
                        results.failedSheet2++;
                        results.errors.push({
                            sheet: 'Phân công môn học',
                            row: rowNum,
                            maGiangVien,
                            error: `Mã giảng viên "${maGiangVien}" không tồn tại trong hệ thống`,
                        });
                        continue;
                    }

                    // Tìm môn học
                    const monHoc = await this.monHocRepository.findOne({ where: { maMonHoc } });
                    if (!monHoc) {
                        results.failedSheet2++;
                        results.errors.push({
                            sheet: 'Phân công môn học',
                            row: rowNum,
                            maGiangVien,
                            error: `Mã môn học "${maMonHoc}" không tồn tại`,
                        });
                        continue;
                    }

                    // Kiểm tra đã phân công chưa
                    const alreadyAssigned = await this.giangVienMonHocRepository.findOne({
                        where: {
                            giangVien: { id: giangVien.id },
                            monHoc: { id: monHoc.id },
                        },
                    });

                    if (alreadyAssigned) {
                        results.failedSheet2++;
                        results.errors.push({
                            sheet: 'Phân công môn học',
                            row: rowNum,
                            maGiangVien,
                            error: `Môn học "${maMonHoc}" đã được phân công cho giảng viên này`,
                        });
                        continue;
                    }

                    try {
                        const dto: PhanCongMonHocDto = {
                            giangVienId: giangVien.id,
                            monHocId: monHoc.id,
                        };
                        await this.phanCongMonHoc(dto);
                        results.successSheet2++;

                        // ✅ LOG SUCCESS
                        results.success.push({
                            sheet: 'Phân công môn học',
                            row: rowNum,
                            maGiangVien,
                            maMonHoc,
                            message: `Phân công thành công môn "${maMonHoc}" cho giảng viên "${maGiangVien}"`,
                        });
                    } catch (err: any) {
                        results.failedSheet2++;
                        results.errors.push({
                            sheet: 'Phân công môn học',
                            row: rowNum,
                            maGiangVien,
                            error: err.message || 'Lỗi khi phân công môn học',
                        });
                    }
                }
            }

            const totalSuccess = results.successSheet1 + results.successSheet2;
            const totalFailed = results.failedSheet1 + results.failedSheet2;
            const totalRows = results.totalRowsSheet1 + results.totalRowsSheet2;

            return {
                message: `Import hoàn tất. Thành công: ${totalSuccess}/${totalRows} dòng | Lỗi: ${totalFailed} dòng`,
                totalRowsSheet1: results.totalRowsSheet1,
                successSheet1: results.successSheet1,
                failedSheet1: results.failedSheet1,
                totalRowsSheet2: results.totalRowsSheet2,
                successSheet2: results.successSheet2,
                failedSheet2: results.failedSheet2,
                errors: results.errors.length > 0 ? results.errors : [],
                success: results.success.length > 0 ? results.success : [],
            };
        } catch (err: any) {
            throw new BadRequestException(`Lỗi khi đọc file Excel: ${err.message}`);
        } finally {
            // Xóa file tạm
            await fs.unlink(filePath).catch(() => { });
        }
    }

    // Thêm giảng viên mới 
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

    // Cập nhật giảng viên
    async updateGiangVien(id: number, updateGiangVienDto: UpdateGiangVienDto): Promise<GiangVien> {
        const giangVien = await this.getGiangVienById(id);

        // Nếu cập nhật mã giảng viên, kiểm tra trùng và đồng bộ tên đăng nhập
        if (updateGiangVienDto.maGiangVien && updateGiangVienDto.maGiangVien !== giangVien.maGiangVien) {
            const existingMGV = await this.giangVienRepository.findOneBy({ maGiangVien: updateGiangVienDto.maGiangVien });
            if (existingMGV) {
                throw new BadRequestException('Mã giảng viên đã được sử dụng');
            }
            // Đổi tên đăng nhập của tài khoản tương ứng sang mã giảng viên mới
            const nguoiDung = await this.nguoiDungRepository.findOne({
                where: { giangVien: { id } },
            });
            if (nguoiDung) {
                const existingTenDangNhap = await this.nguoiDungRepository.findOne({
                    where: { tenDangNhap: updateGiangVienDto.maGiangVien },
                });
                if (existingTenDangNhap && existingTenDangNhap.id !== nguoiDung.id) {
                    throw new BadRequestException('Tên đăng nhập tương ứng với mã giảng viên mới đã được sử dụng');
                }
                nguoiDung.tenDangNhap = updateGiangVienDto.maGiangVien;
                await this.nguoiDungRepository.save(nguoiDung);
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

    // Xóa giảng viên
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