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

    // Lấy danh sách tất cả các khoa
    async getAllKhoa(): Promise<Khoa[]> {
        return await this.khoaRepository.find({
            order: { tenKhoa: 'ASC' },
        });
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

    // Lấy danh sách ngành, có thể lọc theo khoaId (query param ?khoaId=...)
    async getAllNganh(khoaId?: number): Promise<Nganh[]> {
        const query = this.nganhRepository.createQueryBuilder('nganh')
            .leftJoinAndSelect('nganh.khoa', 'khoa');

        if (khoaId) {
            query.where('nganh.khoa_id = :khoaId', { khoaId });
        }

        return await query.orderBy('nganh.tenNganh', 'ASC').getMany();
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

    // Lấy danh sách lớp, hỗ trợ lọc theo nganhId và/hoặc nienKhoaId
    async getAllLop(nganhId?: number, nienKhoaId?: number): Promise<Lop[]> {
        const query = this.lopRepository.createQueryBuilder('lop')
            .leftJoinAndSelect('lop.nganh', 'nganh')
            .leftJoinAndSelect('nganh.khoa', 'khoa') // optional: load thêm khoa
            .leftJoinAndSelect('lop.nienKhoa', 'nienKhoa');

        if (nganhId) {
            query.andWhere('lop.nganh_id = :nganhId', { nganhId });
        }
        if (nienKhoaId) {
            query.andWhere('lop.nien_khoa_id = :nienKhoaId', { nienKhoaId });
        }

        return await query.orderBy('lop.tenLop', 'ASC').getMany();
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

    // Lấy danh sách tất cả giảng viên
    async getAllGiangVien(): Promise<GiangVien[]> {
        return await this.giangVienRepository.find({
            order: { hoTen: 'ASC' },
        });
    }

    // Lấy chi tiết một giảng viên
    async getGiangVienById(id: number): Promise<GiangVien> {
        const giangVien = await this.giangVienRepository.findOneBy({ id });

        if (!giangVien) {
            throw new NotFoundException(`Giảng viên với id ${id} không tồn tại`);
        }

        return giangVien;
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
    async xoaPhanCongMonHoc(dto: XoaPhanCongMonHocDto): Promise<void> {
        const phanCong = await this.giangVienMonHocRepository.findOne({
            where: { giangVien: { id: dto.giangVienId }, monHoc: { id: dto.monHocId } },
            relations: ['giangVien', 'monHoc'],
        });

        if (!phanCong) {
            throw new NotFoundException('Phân công môn học không tồn tại');
        }

        await this.giangVienMonHocRepository.remove(phanCong);
    }

    // Lấy danh sách môn học mà giảng viên có thể dạy (đã được phân công)
    async getMonHocByGiangVien(giangVienId: number): Promise<MonHoc[]> {
        const phanCongs = await this.giangVienMonHocRepository.find({
            where: { giangVien: { id: giangVienId } },
            relations: ['monHoc'],
            order: { monHoc: { tenMonHoc: 'ASC' } },
        });

        return phanCongs.map(pc => pc.monHoc);
    }
}