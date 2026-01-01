import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Khoa } from './entity/khoa.entity';
import { CreateKhoaDto } from './dtos/tao-khoa.dto';
import { UpdateKhoaDto } from './dtos/cap-nhat-khoa.dto';
import { Nganh } from './entity/nganh.entity';
import { CreateNganhDto } from './dtos/tao-nganh.dto';
import { UpdateNganhDto } from './dtos/cap-nhat-nganh.dto';
import { UpdateLopDto } from './dtos/cap-nhat-lop-nien-che.dto';
import { CreateLopDto } from './dtos/tao-lop-nien-che.dto';
import { Lop } from './entity/lop.entity';
import { NienKhoa } from './entity/nien-khoa.entity';
import { UpdateMonHocDto } from './dtos/cap-nhat-mon-hoc.dto';
import { CreateMonHocDto } from './dtos/tao-mon-hoc.dto';
import { MonHoc } from './entity/mon-hoc.entity';
import { NguoiDung } from 'src/auth/entity/nguoi-dung.entity';
import { VaiTroNguoiDungEnum } from 'src/auth/enums/vai-tro-nguoi-dung.enum';
import { UpdateGiangVienDto } from './dtos/cap-nhat-thong-tin-giang-vien.dto';
import { CreateGiangVienDto } from './dtos/them-giang-vien.dto';
import { GiangVien } from './entity/giang-vien.entity';
import { PhanCongMonHocDto } from './dtos/phan-cong-mon-hoc.dto';
import { XoaPhanCongMonHocDto } from './dtos/xoa-phan-cong-mon-hoc.dto';
import { GiangVienMonHoc } from './entity/giangvien-monhoc.entity';
import { CreateNienKhoaDto } from './dtos/them-nien-khoa.dto';
import { UpdateNienKhoaDto } from './dtos/cap-nhat-nien-khoa.dto';
import { PaginationQueryDto, GetNganhQueryDto, GetGiangVienQueryDto, GetLopQueryDto } from './dtos/pagination.dto';
import { GioiTinh } from './enums/gioi-tinh.enum';
import { PhanCongMonHocResponseDto } from './dtos/phan-cong-mon-hoc-response.dto';

@Injectable()
export class DanhMucService {
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
            qb.andWhere('LOWER(khoa.tenKhoa) LIKE LOWER(:search)', { search: `%${search}%` });
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
        const khoa = this.khoaRepository.create(createKhoaDto);
        return await this.khoaRepository.save(khoa);
    }

    // Cập nhật khoa
    async updateKhoa(id: number, updateKhoaDto: UpdateKhoaDto): Promise<Khoa> {
        const khoa = await this.getKhoaById(id); // sẽ throw NotFound nếu không tồn tại

        Object.assign(khoa, updateKhoaDto);

        return await this.khoaRepository.save(khoa);
    }

    async deleteKhoa(id: number): Promise<void> {
        const khoa = await this.getKhoaById(id);
        await this.khoaRepository.remove(khoa);
    }

    //getAllNganh() - load khoa + phân trang + lọc khoa + search
    // Lưu ý: danh sách khoa để làm filter sẽ được load riêng (xem controller)
    async getAllNganh(query: PaginationQueryDto & GetNganhQueryDto) {
        const { page = 1, limit = 10, search, khoaId } = query;

        // Lấy tất cả khoa (không phân trang - dùng làm filter)
        const allKhoa = await this.khoaRepository.find({
            select: ['id', 'tenKhoa'],
            order: { tenKhoa: 'ASC' },
        });

        const qb = this.nganhRepository.createQueryBuilder('nganh')
            .leftJoinAndSelect('nganh.khoa', 'khoa');

        if (khoaId) {
            qb.andWhere('nganh.khoa_id = :khoaId', { khoaId });
        }

        if (search) {
            qb.andWhere('LOWER(nganh.tenNganh) LIKE LOWER(:search)', { search: `%${search}%` });
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

    // Thêm ngành mới
    async createNganh(createNganhDto: CreateNganhDto): Promise<Nganh> {
        const khoa = await this.khoaRepository.findOne({
            where: { id: createNganhDto.khoaId },
        });

        if (!khoa) {
            throw new BadRequestException(`Khoa với id ${createNganhDto.khoaId} không tồn tại`);
        }

        const nganh = this.nganhRepository.create({
            tenNganh: createNganhDto.tenNganh,
            moTa: createNganhDto.moTa,
            khoa,
        });

        return await this.nganhRepository.save(nganh);
    }

    // Cập nhật ngành
    async updateNganh(id: number, updateNganhDto: UpdateNganhDto): Promise<Nganh> {
        const nganh = await this.getNganhById(id);

        if (updateNganhDto.khoaId) {
            const khoa = await this.khoaRepository.findOne({
                where: { id: updateNganhDto.khoaId },
            });
            if (!khoa) {
                throw new BadRequestException(`Khoa với id ${updateNganhDto.khoaId} không tồn tại`);
            }
            nganh.khoa = khoa;
        }

        Object.assign(nganh, {
            tenNganh: updateNganhDto.tenNganh,
            moTa: updateNganhDto.moTa,
        });

        return await this.nganhRepository.save(nganh);
    }

    // Xóa ngành
    async deleteNganh(id: number): Promise<void> {
        const nganh = await this.getNganhById(id);
        await this.nganhRepository.remove(nganh);
    }

    // getAllNienKhoa() - phân trang + search theo tên
    async getAllNienKhoa(query: PaginationQueryDto) {
        const { page = 1, limit = 10, search } = query;

        const qb = this.nienKhoaRepository.createQueryBuilder('nienKhoa');

        if (search) {
            qb.andWhere('LOWER(nienKhoa.tenNienKhoa) LIKE LOWER(:search)', { search: `%${search}%` });
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
        // Kiểm tra trùng tên niên khóa (do có @Unique(['tenNienKhoa']))
        const existing = await this.nienKhoaRepository.findOneBy({ tenNienKhoa: createNienKhoaDto.tenNienKhoa });
        if (existing) {
            throw new BadRequestException('Tên niên khóa đã tồn tại');
        }

        const nienKhoa = this.nienKhoaRepository.create(createNienKhoaDto);
        return await this.nienKhoaRepository.save(nienKhoa);
    }

    // Cập nhật niên khóa (chỉ cán bộ ĐT)
    async updateNienKhoa(id: number, updateNienKhoaDto: UpdateNienKhoaDto): Promise<NienKhoa> {
        const nienKhoa = await this.getNienKhoaById(id);

        // Nếu sửa tên, kiểm tra trùng
        if (updateNienKhoaDto.tenNienKhoa && updateNienKhoaDto.tenNienKhoa !== nienKhoa.tenNienKhoa) {
            const existing = await this.nienKhoaRepository.findOneBy({ tenNienKhoa: updateNienKhoaDto.tenNienKhoa });
            if (existing) {
                throw new BadRequestException('Tên niên khóa đã tồn tại');
            }
        }

        Object.assign(nienKhoa, updateNienKhoaDto);
        return await this.nienKhoaRepository.save(nienKhoa);
    }

    // Xóa niên khóa (chỉ cán bộ ĐT)
    async deleteNienKhoa(id: number): Promise<void> {
        const nienKhoa = await this.getNienKhoaById(id);
        await this.nienKhoaRepository.remove(nienKhoa);
    }

    // getAllLop() - load khoa/ngành/niên khóa + phân trang + filter
    async getAllLop(query: PaginationQueryDto & GetLopQueryDto) {
        const { page = 1, limit = 10, search, nganhId, nienKhoaId } = query;

        // Lấy các danh sách filter (không phân trang)
        const [allKhoa, allNganh, allNienKhoa] = await Promise.all([
            this.khoaRepository.find({ select: ['id', 'tenKhoa'], order: { tenKhoa: 'ASC' } }),
            this.nganhRepository.find({
                select: ['id', 'tenNganh', 'khoa'],
                relations: ['khoa'],
                order: { tenNganh: 'ASC' },
            }),
            this.nienKhoaRepository.find({ order: { namBatDau: 'DESC' } }),
        ]);

        const qb = this.lopRepository.createQueryBuilder('lop')
            .leftJoinAndSelect('lop.nganh', 'nganh')
            .leftJoinAndSelect('nganh.khoa', 'khoa')
            .leftJoinAndSelect('lop.nienKhoa', 'nienKhoa');

        if (nganhId) {
            qb.andWhere('lop.nganh_id = :nganhId', { nganhId });
        }
        if (nienKhoaId) {
            qb.andWhere('lop.nien_khoa_id = :nienKhoaId', { nienKhoaId });
        }
        if (search) {
            qb.andWhere('LOWER(lop.tenLop) LIKE LOWER(:search)', { search: `%${search}%` });
        }

        qb.orderBy('lop.tenLop', 'ASC');

        const total = await qb.getCount();
        const skip = (page - 1) * limit;
        qb.skip(skip).take(limit);

        const items = await qb.getMany();

        return {
            data: items,
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

    // Thêm lớp mới
    async createLop(createLopDto: CreateLopDto): Promise<Lop> {
        const nganh = await this.nganhRepository.findOne({
            where: { id: createLopDto.nganhId },
        });
        if (!nganh) {
            throw new BadRequestException(`Ngành với id ${createLopDto.nganhId} không tồn tại`);
        }

        const nienKhoa = await this.nienKhoaRepository.findOne({
            where: { id: createLopDto.nienKhoaId },
        });
        if (!nienKhoa) {
            throw new BadRequestException(`Niên khóa với id ${createLopDto.nienKhoaId} không tồn tại`);
        }

        const lop = this.lopRepository.create({
            tenLop: createLopDto.tenLop,
            nganh,
            nienKhoa,
        });

        return await this.lopRepository.save(lop);
    }

    // Cập nhật lớp
    async updateLop(id: number, updateLopDto: UpdateLopDto): Promise<Lop> {
        const lop = await this.getLopById(id);

        if (updateLopDto.nganhId) {
            const nganh = await this.nganhRepository.findOne({
                where: { id: updateLopDto.nganhId },
            });
            if (!nganh) {
                throw new BadRequestException(`Ngành với id ${updateLopDto.nganhId} không tồn tại`);
            }
            lop.nganh = nganh;
        }

        if (updateLopDto.nienKhoaId) {
            const nienKhoa = await this.nienKhoaRepository.findOne({
                where: { id: updateLopDto.nienKhoaId },
            });
            if (!nienKhoa) {
                throw new BadRequestException(`Niên khóa với id ${updateLopDto.nienKhoaId} không tồn tại`);
            }
            lop.nienKhoa = nienKhoa;
        }

        if (updateLopDto.tenLop) {
            lop.tenLop = updateLopDto.tenLop;
        }

        return await this.lopRepository.save(lop);
    }

    // Xóa lớp
    async deleteLop(id: number): Promise<void> {
        const lop = await this.getLopById(id);
        await this.lopRepository.remove(lop);
    }

    // Lấy danh sách tất cả môn học
    async getAllMonHoc(): Promise<MonHoc[]> {
        return await this.monHocRepository.find({
            order: {
                tenMonHoc: 'ASC',
            },
        });
    }

    // Thêm mới: version getAllMonHoc() có phân trang + search
    async getAllMonHocWithPagination(query: PaginationQueryDto) {
        const { page = 1, limit = 10, search } = query;

        const qb = this.monHocRepository.createQueryBuilder('monHoc');

        if (search) {
            qb.andWhere('LOWER(monHoc.tenMonHoc) LIKE LOWER(:search)', { search: `%${search}%` });
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

    // Thêm môn học mới
    async createMonHoc(createMonHocDto: CreateMonHocDto): Promise<MonHoc> {
        const monHoc = this.monHocRepository.create(createMonHocDto);
        return await this.monHocRepository.save(monHoc);
    }

    // Cập nhật môn học
    async updateMonHoc(id: number, updateMonHocDto: UpdateMonHocDto): Promise<MonHoc> {
        const monHoc = await this.getMonHocById(id);

        Object.assign(monHoc, updateMonHocDto);

        return await this.monHocRepository.save(monHoc);
    }

    // Xóa môn học
    async deleteMonHoc(id: number): Promise<void> {
        const monHoc = await this.getMonHocById(id);
        await this.monHocRepository.remove(monHoc);
    }

    // getAllGiangVien() - phân trang + search tên + lọc theo môn học
    async getAllGiangVien(query: PaginationQueryDto & GetGiangVienQueryDto) {
        const { page = 1, limit = 10, search, monHocId } = query;

        const qb = this.giangVienRepository
            .createQueryBuilder('giangVien')
            .leftJoinAndSelect('giangVien.monHocGiangViens', 'giangVienMonHoc')
            .leftJoinAndSelect('giangVienMonHoc.monHoc', 'monHoc');

        if (monHocId) {
            qb.andWhere('monHoc.id = :monHocId', { monHocId });
        }

        if (search) {
            qb.andWhere(
                'LOWER(giangVien.hoTen) LIKE LOWER(:search)',
                { search: `%${search}%` },
            );
        }

        qb.orderBy('giangVien.hoTen', 'ASC');

        const total = await qb.getCount();

        qb.skip((page - 1) * limit).take(limit);

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

    // Thêm giảng viên mới (admin)
    async createGiangVien(createGiangVienDto: CreateGiangVienDto): Promise<GiangVien> {
        // Kiểm tra email trùng (do có @Unique(['email']))
        const existing = await this.giangVienRepository.findOneBy({ email: createGiangVienDto.email });
        if (existing) {
            throw new BadRequestException('Email đã được sử dụng');
        }

        const giangVien = this.giangVienRepository.create(createGiangVienDto);
        return await this.giangVienRepository.save(giangVien);
    }

    // Cập nhật giảng viên (admin)
    async updateGiangVien(id: number, updateGiangVienDto: UpdateGiangVienDto): Promise<GiangVien> {
        const giangVien = await this.getGiangVienById(id);

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
        const giangVien = await this.getGiangVienById(id);
        await this.giangVienRepository.remove(giangVien);
    }

    async updateMyProfile(user: { userId: number; vaiTro: string }, updateGiangVienDto: UpdateGiangVienDto): Promise<GiangVien> {
        // Kiểm tra vai trò phải là GIANG_VIEN
        if (user.vaiTro !== VaiTroNguoiDungEnum.GIANG_VIEN) {
            throw new ForbiddenException('Chỉ giảng viên mới được phép sửa thông tin cá nhân');
        }

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
        if (updateGiangVienDto.email && updateGiangVienDto.email !== giangVien.email) {
            const existing = await this.giangVienRepository.findOneBy({ email: updateGiangVienDto.email });
            if (existing) {
                throw new BadRequestException('Email đã được sử dụng bởi giảng viên khác');
            }
        }

        Object.assign(giangVien, updateGiangVienDto);

        return await this.giangVienRepository.save(giangVien);
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