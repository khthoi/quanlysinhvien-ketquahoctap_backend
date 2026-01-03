import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { LopHocPhan } from './entity/lop-hoc-phan.entity';
import { SinhVienLopHocPhan } from './entity/sinhvien-lophocphan.entity';
import { CreateLopHocPhanDto } from './dtos/create-lop-hoc-phan.dto';
import { UpdateLopHocPhanDto } from './dtos/update-lop-hoc-phan.dto';
import { GetLopHocPhanQueryDto } from './dtos/get-lop-hoc-phan-query.dto';
import { GetSinhVienTrongLopQueryDto } from './dtos/get-sinh-vien-trong-lop-query.dto';
import { GiangVien } from 'src/danh-muc/entity/giang-vien.entity';
import { GiangVienMonHoc } from 'src/danh-muc/entity/giangvien-monhoc.entity';
import { MonHoc } from 'src/danh-muc/entity/mon-hoc.entity';
import { Nganh } from 'src/danh-muc/entity/nganh.entity';
import { NienKhoa } from 'src/danh-muc/entity/nien-khoa.entity';
import { HocKy } from 'src/dao-tao/entity/hoc-ky.entity';
import { SinhVien } from 'src/sinh-vien/entity/sinh-vien.entity';
import { LoaiHinhThamGiaLopHocPhanEnum } from './enums/loai-hinh-tham-gia-lop-hoc-phan.enum';
import { TinhTrangHocTapEnum } from 'src/sinh-vien/enums/tinh-trang-hoc-tap.enum';
import { KetQuaHocTap } from 'src/ket-qua/entity/ket-qua-hoc-tap.entity';
import { NguoiDung } from 'src/auth/entity/nguoi-dung.entity';
import { GetPhanCongQueryDto } from './dtos/get-phan-cong-query.dto';
import { PaginationQueryDto } from './dtos/pagination-query.dto';
import { GetMyLopHocPhanQueryDto } from './dtos/get-my-lop-hoc-phan-query.dto';

@Injectable()
export class GiangDayService {
    constructor(
        @InjectRepository(LopHocPhan)
        private lopHocPhanRepo: Repository<LopHocPhan>,
        @InjectRepository(SinhVienLopHocPhan)
        private svLhpRepo: Repository<SinhVienLopHocPhan>,
        @InjectRepository(GiangVienMonHoc)
        private giangVienMonHocRepo: Repository<GiangVienMonHoc>,
        @InjectRepository(MonHoc)
        private monHocRepo: Repository<MonHoc>,
        @InjectRepository(HocKy)
        private hocKyRepo: Repository<HocKy>,
        @InjectRepository(NienKhoa)
        private nienKhoaRepo: Repository<NienKhoa>,
        @InjectRepository(Nganh)
        private nganhRepo: Repository<Nganh>,
        @InjectRepository(SinhVien)
        private sinhVienRepo: Repository<SinhVien>,
        @InjectRepository(KetQuaHocTap)
        private ketQuaHocTapRepo: Repository<KetQuaHocTap>,
        @InjectRepository(NguoiDung)
        private nguoiDungRepo: Repository<NguoiDung>,
        @InjectRepository(GiangVien)
        private giangVienRepo: Repository<GiangVien>,
    ) { }

    // Tính sĩ số của lớp học phần bằng cách đếm số sinh viên đăng ký
    private async tinhSiSo(lopHocPhanId: number): Promise<number> {
        const count = await this.svLhpRepo.count({
            where: { lopHocPhan: { id: lopHocPhanId } },
        });
        return count;
    }

    async create(dto: CreateLopHocPhanDto) {
        // 1. Kiểm tra mã lớp học phần trùng
        const existMa = await this.lopHocPhanRepo.findOneBy({ maLopHocPhan: dto.maLopHocPhan });
        if (existMa) {
            throw new BadRequestException('Mã lớp học phần đã tồn tại');
        }

        // 2. Kiểm tra giảng viên có được phân công dạy môn này không
        const phanCong = await this.giangVienMonHocRepo.findOne({
            where: {
                giangVien: { id: dto.giangVienId },
                monHoc: { id: dto.monHocId },
            },
        });

        if (!phanCong) {
            throw new BadRequestException(
                'Giảng viên này chưa được phân công dạy môn học này. Vui lòng phân công trước khi tạo lớp học phần.',
            );
        }

        // 3. Lấy thông tin môn học để biết số tín chỉ của lớp mới này
        const monHoc = await this.monHocRepo.findOneBy({ id: dto.monHocId });
        if (!monHoc) {
            throw new BadRequestException('Môn học không tồn tại');
        }
        const tinChiMoi = monHoc.soTinChi;

        // 4. Tính tổng tín chỉ giảng viên đã dạy trong học kỳ này (từ các lớp học phần hiện có)
        const tongTinChiHienTai = await this.lopHocPhanRepo
            .createQueryBuilder('lhp')
            .innerJoin('lhp.monHoc', 'monHoc')
            .where('lhp.giang_vien_id = :giangVienId', { giangVienId: dto.giangVienId })
            .andWhere('lhp.hoc_ky_id = :hocKyId', { hocKyId: dto.hocKyId })
            .select('SUM(monHoc.so_tin_chi)', 'total')
            .getRawOne();

        const tinChiHienTai = Number(tongTinChiHienTai?.total || 0);

        // 5. Kiểm tra giới hạn 12 tín chỉ
        if (tinChiHienTai + tinChiMoi > 12) {
            throw new BadRequestException(
                `Giảng viên này đã dạy ${tinChiHienTai} tín chỉ trong học kỳ này. ` +
                `Thêm lớp học phần này (${tinChiMoi} tín chỉ) sẽ vượt quá giới hạn 12 tín chỉ trong một học kỳ.`,
            );
        }

        // 6. Tạo và lưu lớp học phần
        const lhp = this.lopHocPhanRepo.create({
            maLopHocPhan: dto.maLopHocPhan,
            ghiChu: dto.ghiChu,
            giangVien: { id: dto.giangVienId } as GiangVien,
            monHoc: { id: dto.monHocId } as MonHoc,
            hocKy: { id: dto.hocKyId } as HocKy,
            nienKhoa: { id: dto.nienKhoaId } as NienKhoa,
            nganh: { id: dto.nganhId } as Nganh,
        });

        return await this.lopHocPhanRepo.save(lhp);
    }


    async findAll(query: GetLopHocPhanQueryDto) {
        const { page = 1, limit = 10, search, monHocId, giangVienId, hocKyId, nienKhoaId, nganhId } = query;

        const qb = this.lopHocPhanRepo
            .createQueryBuilder('lhp')
            .leftJoinAndSelect('lhp.giangVien', 'giangVien')
            .leftJoinAndSelect('lhp.monHoc', 'monHoc')
            .leftJoinAndSelect('lhp.hocKy', 'hocKy')
            .leftJoinAndSelect('hocKy.namHoc', 'namHoc')
            .leftJoinAndSelect('lhp.nienKhoa', 'nienKhoa')
            .leftJoinAndSelect('lhp.nganh', 'nganh')
            .leftJoinAndSelect('nganh.khoa', 'khoa');

        if (monHocId) qb.andWhere('monHoc.id = :monHocId', { monHocId });
        if (giangVienId) qb.andWhere('giangVien.id = :giangVienId', { giangVienId });
        if (hocKyId) qb.andWhere('hocKy.id = :hocKyId', { hocKyId });
        if (nienKhoaId) qb.andWhere('nienKhoa.id = :nienKhoaId', { nienKhoaId });
        if (nganhId) qb.andWhere('nganh.id = :nganhId', { nganhId });
        if (search) {
            qb.andWhere('LOWER(lhp.maLopHocPhan) LIKE LOWER(:search)', { search: `%${search}%` });
        }

        qb.orderBy('lhp.maLopHocPhan', 'ASC');

        const total = await qb.getCount();
        const items = await qb.skip((page - 1) * limit).take(limit).getMany();
        // Tính sĩ số cho từng lớp
        const dataWithSiSo = await Promise.all(
            items.map(async (lhp) => {
                const siSo = await this.tinhSiSo(lhp.id);
                return { ...lhp, siSo };
            }),
        );
        return {
            data: dataWithSiSo,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: number) {
        const lhp = await this.lopHocPhanRepo.findOne({
            where: { id },
            relations: [
                'giangVien',
                'monHoc',
                'hocKy',
                'hocKy.namHoc',
                'nienKhoa',
                'nganh',
                'nganh.khoa',
            ],
        });
        if (!lhp) throw new NotFoundException('Lớp học phần không tồn tại');
        const siSo = await this.tinhSiSo(id);
        return { ...lhp, siSo };
    }

    async update(id: number, dto: UpdateLopHocPhanDto) {
        const lhp = await this.findOne(id); // Đảm bảo load entity đầy đủ

        // 1. Cập nhật các field scalar
        if (dto.maLopHocPhan !== undefined && dto.maLopHocPhan !== lhp.maLopHocPhan) {
            const exist = await this.lopHocPhanRepo.findOneBy({ maLopHocPhan: dto.maLopHocPhan });
            if (exist) throw new BadRequestException('Mã lớp học phần đã tồn tại');
            lhp.maLopHocPhan = dto.maLopHocPhan;
        }

        if (dto.ghiChu !== undefined) {
            lhp.ghiChu = dto.ghiChu;
        }

        // 2. Cập nhật các relation nếu có thay đổi
        if (dto.giangVienId !== undefined && dto.giangVienId !== lhp.giangVien?.id) {
            // Kiểm tra quyền dạy môn (tùy chọn, nếu muốn nghiêm ngặt)
            const phanCong = await this.giangVienMonHocRepo.findOne({
                where: {
                    giangVien: { id: dto.giangVienId },
                    monHoc: { id: lhp.monHoc.id }, // giữ nguyên môn cũ hoặc dto.monHocId nếu có
                },
            });
            if (!phanCong) {
                throw new BadRequestException('Giảng viên mới không được phân công dạy môn này');
            }
            lhp.giangVien = { id: dto.giangVienId } as GiangVien;
        }

        if (dto.monHocId !== undefined && dto.monHocId !== lhp.monHoc?.id) {
            const monHoc = await this.monHocRepo.findOneBy({ id: dto.monHocId });
            if (!monHoc) throw new BadRequestException('Môn học không tồn tại');
            lhp.monHoc = monHoc;

            // Kiểm tra lại phân công GV nếu đổi môn
            if (!lhp.giangVien) {
                throw new BadRequestException('Lớp học phần này chưa có giảng viên phụ trách');
            }
            const phanCong = await this.giangVienMonHocRepo.findOne({
                where: {
                    giangVien: { id: lhp.giangVien.id },
                    monHoc: { id: dto.monHocId },
                },
            });
            if (!phanCong) {
                throw new BadRequestException('Giảng viên không được phân công dạy môn học mới này');
            }
        }

        if (dto.hocKyId !== undefined && dto.hocKyId !== lhp.hocKy?.id) {
            const hocKy = await this.hocKyRepo.findOneBy({ id: dto.hocKyId });
            if (!hocKy) throw new BadRequestException('Học kỳ không tồn tại');
            lhp.hocKy = hocKy;

            // Kiểm tra lại giới hạn tín chỉ khi đổi học kỳ
            if (!lhp.giangVien) {
                throw new BadRequestException('Lớp học phần này chưa có giảng viên phụ trách');
            }
            const tinChiMoi = lhp.monHoc.soTinChi;
            const tongTinChiHienTai = await this.lopHocPhanRepo
                .createQueryBuilder('lhp2')
                .innerJoin('lhp2.monHoc', 'monHoc')
                .where('lhp2.giang_vien_id = :giangVienId', { giangVienId: lhp.giangVien.id })
                .andWhere('lhp2.hoc_ky_id = :hocKyId', { hocKyId: dto.hocKyId })
                .andWhere('lhp2.id != :currentId', { currentId: id }) // loại trừ lớp hiện tại
                .select('SUM(monHoc.so_tin_chi)', 'total')
                .getRawOne();

            const tinChiKhac = Number(tongTinChiHienTai?.total || 0);
            if (tinChiKhac + tinChiMoi > 12) {
                throw new BadRequestException(`Đổi sang học kỳ này sẽ vượt quá 12 tín chỉ (hiện tại: ${tinChiKhac} + ${tinChiMoi} = ${tinChiKhac + tinChiMoi})`);
            }
        }

        if (dto.nienKhoaId !== undefined && dto.nienKhoaId !== lhp.nienKhoa?.id) {
            const nienKhoa = await this.nienKhoaRepo.findOneBy({ id: dto.nienKhoaId });
            if (!nienKhoa) throw new BadRequestException('Niên khóa không tồn tại');
            lhp.nienKhoa = nienKhoa;
        }

        if (dto.nganhId !== undefined && dto.nganhId !== lhp.nganh?.id) {
            const nganh = await this.nganhRepo.findOneBy({ id: dto.nganhId });
            if (!nganh) throw new BadRequestException('Ngành không tồn tại');
            lhp.nganh = nganh;
        }

        // 3. Lưu thay đổi
        return await this.lopHocPhanRepo.save(lhp);
    }

    async delete(id: number): Promise<void> {
        const lhp = await this.lopHocPhanRepo.findOne({
            where: { id },
            relations: ['sinhVienLopHocPhans'],
        });
        if (!lhp) throw new NotFoundException('Lớp học phần không tồn tại');

        if (lhp.sinhVienLopHocPhans?.length > 0) {
            throw new BadRequestException('Không thể xóa lớp học phần đang có sinh viên đăng ký');
        }

        await this.lopHocPhanRepo.remove(lhp);
    }

    async dangKySinhVien(lopHocPhanId: number, sinhVienId: number) {
        // Load lớp học phần với relation bắt buộc
        const lhp = await this.lopHocPhanRepo.findOne({
            where: { id: lopHocPhanId },
            relations: ['monHoc', 'nienKhoa', 'hocKy', 'giangVien', 'nganh'],
        });

        if (!lhp) throw new NotFoundException('Lớp học phần không tồn tại');

        // Kiểm tra các relation bắt buộc
        if (!lhp.monHoc) throw new BadRequestException('Lớp học phần không có môn học');
        if (!lhp.nienKhoa) throw new BadRequestException('Lớp học phần không có niên khóa');
        if (!lhp.hocKy) throw new BadRequestException('Lớp học phần không có học kỳ');
        if (!lhp.nganh) throw new BadRequestException('Lớp học phần không có ngành');
        if (!lhp.giangVien) throw new BadRequestException('Lớp học phần không có giảng viên');

        // Load sinh viên
        const sinhVien = await this.sinhVienRepo.findOne({
            where: { id: sinhVienId },
            relations: ['lop', 'lop.nienKhoa'],
        });

        if (!sinhVien) throw new NotFoundException('Sinh viên không tồn tại');
        if (!sinhVien.lop || !sinhVien.lop.nienKhoa) {
            throw new BadRequestException('Sinh viên không có lớp niên chế hoặc niên khóa');
        }

        // Kiểm tra tình trạng
        if (
            sinhVien.tinhTrang === TinhTrangHocTapEnum.THOI_HOC ||
            sinhVien.tinhTrang === TinhTrangHocTapEnum.BAO_LUU
        ) {
            throw new BadRequestException('Sinh viên đang nghỉ học hoặc bảo lưu không được đăng ký');
        }

        // Kiểm tra trùng đăng ký
        const exist = await this.svLhpRepo.findOneBy({
            lopHocPhan: { id: lopHocPhanId },
            sinhVien: { id: sinhVienId },
        });
        if (exist) throw new BadRequestException('Sinh viên đã đăng ký lớp học phần này');

        // Lấy niên khóa
        const nienKhoaLopHocPhan = lhp.nienKhoa.namBatDau;
        const nienKhoaSinhVien = sinhVien.lop.nienKhoa.namBatDau;

        // Kiểm tra đã học môn này chưa
        const dangKyCu = await this.svLhpRepo.findOne({
            where: {
                sinhVien: { id: sinhVienId },
                lopHocPhan: { monHoc: { id: lhp.monHoc.id } },
            },
            relations: ['lopHocPhan'],
        });

        let loaiThamGia = LoaiHinhThamGiaLopHocPhanEnum.CHINH_QUY;

        if (dangKyCu) {
            const ketQua = await this.ketQuaHocTapRepo.findOne({
                where: {
                    sinhVien: { id: sinhVienId },
                    lopHocPhan: { id: dangKyCu.lopHocPhan.id },
                },
            });

            if (!ketQua) {
                throw new BadRequestException('Sinh viên đã học môn này nhưng chưa có kết quả → không được đăng ký lại');
            }

            const diemTong =
                (ketQua.diemQuaTrinh || 0) * 0.1 +
                (ketQua.diemThanhPhan || 0) * 0.3 +
                (ketQua.diemThi || 0) * 0.6;

            if (diemTong <= 4.0) {
                loaiThamGia = LoaiHinhThamGiaLopHocPhanEnum.HOC_LAI;
            } else {
                loaiThamGia = LoaiHinhThamGiaLopHocPhanEnum.HOC_CAI_THIEN;
            }
        } else {
            if (nienKhoaLopHocPhan > nienKhoaSinhVien) {
                loaiThamGia = LoaiHinhThamGiaLopHocPhanEnum.HOC_BO_SUNG;
            }
        }

        // Tạo đăng ký
        const registration = this.svLhpRepo.create({
            lopHocPhan: lhp,
            sinhVien: sinhVien,
            ngayDangKy: new Date(),
            loaiThamGia,
        });

        await this.svLhpRepo.save(registration);

        const siSoMoi = await this.tinhSiSo(lopHocPhanId);

        return {
            message: 'Đăng ký thành công',
            data: {
                lopHocPhanId: lhp.id,
                maLopHocPhan: lhp.maLopHocPhan,
                monHoc: lhp.monHoc,
                giangVien: lhp.giangVien,
                hocKy: lhp.hocKy,
                nienKhoa: lhp.nienKhoa,
                nganh: lhp.nganh,
                siSoHienTai: siSoMoi,
                sinhVienId,
                loaiThamGia,
                ngayDangKy: registration.ngayDangKy,
            },
        };
    }

    async xoaSinhVienKhoiLop(lopHocPhanId: number, sinhVienId: number): Promise<void> {
        const registration = await this.svLhpRepo.findOne({
            where: {
                lopHocPhan: { id: lopHocPhanId },
                sinhVien: { id: sinhVienId },
            },
            relations: ['lopHocPhan'],
        });
        if (!registration) throw new NotFoundException('Sinh viên không tồn tại trong lớp học phần');

        await this.svLhpRepo.remove(registration);

        // Cập nhật sĩ số
        const lhp = registration.lopHocPhan;
        await this.lopHocPhanRepo.save(lhp);
    }

    async getDanhSachSinhVien(lopHocPhanId: number, query: GetSinhVienTrongLopQueryDto) {
        const { page = 1, limit = 10, search } = query;

        const qb = this.svLhpRepo
            .createQueryBuilder('svlhp')
            .leftJoinAndSelect('svlhp.sinhVien', 'sinhVien')
            .leftJoinAndSelect('sinhVien.lop', 'lop')
            .leftJoinAndSelect('lop.nganh', 'nganh')
            .where('svlhp.lop_hoc_phan_id = :lopHocPhanId', { lopHocPhanId });

        if (search) {
            qb.andWhere(
                '(LOWER(sinhVien.maSinhVien) LIKE LOWER(:search) OR LOWER(sinhVien.hoTen) LIKE LOWER(:search))',
                { search: `%${search}%` },
            );
        }

        qb.orderBy('sinhVien.hoTen', 'ASC');

        const total = await qb.getCount();
        const items = await qb.skip((page - 1) * limit).take(limit).getMany();

        return {
            data: items.map(i => ({
                ...i.sinhVien,
                loaiThamGia: i.loaiThamGia,
                ngayDangKy: i.ngayDangKy,
            })),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getLopHocPhanCuaGiangVien(
        userId: number,
        query: GetMyLopHocPhanQueryDto,
    ) {
        const {
            page = 1,
            limit = 10,
            hocKyId,
            monHocId,
            nganhId,
            nienKhoaId,
        } = query;

        // Tìm giảng viên từ userId
        const nguoiDung = await this.nguoiDungRepo.findOne({
            where: { id: userId },
            relations: ['giangVien'],
        });

        if (!nguoiDung || !nguoiDung.giangVien) {
            throw new NotFoundException('Không tìm thấy giảng viên liên kết với tài khoản này');
        }

        const giangVienId = nguoiDung.giangVien.id;

        // Query builder với lọc và phân trang
        const qb = this.lopHocPhanRepo
            .createQueryBuilder('lhp')
            .leftJoinAndSelect('lhp.monHoc', 'monHoc')
            .leftJoinAndSelect('lhp.hocKy', 'hocKy')
            .leftJoinAndSelect('hocKy.namHoc', 'namHoc')
            .leftJoinAndSelect('lhp.nienKhoa', 'nienKhoa')
            .leftJoinAndSelect('lhp.nganh', 'nganh')
            .leftJoinAndSelect('nganh.khoa', 'khoa')
            .where('lhp.giang_vien_id = :giangVienId', { giangVienId });

        if (hocKyId) qb.andWhere('lhp.hoc_ky_id = :hocKyId', { hocKyId });
        if (monHocId) qb.andWhere('lhp.mon_hoc_id = :monHocId', { monHocId });
        if (nganhId) qb.andWhere('lhp.nganh_id = :nganhId', { nganhId });
        if (nienKhoaId) qb.andWhere('lhp.nien_khoa_id = :nienKhoaId', { nienKhoaId });

        qb.orderBy('namHoc.namBatDau', 'DESC')
            .addOrderBy('hocKy.tenHocKy', 'ASC')
            .addOrderBy('monHoc.tenMonHoc', 'ASC');

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

    async phanCongGiangVien(lopHocPhanId: number, giangVienId: number) {
        const lhp = await this.lopHocPhanRepo.findOne({
            where: { id: lopHocPhanId },
            relations: ['monHoc', 'hocKy', 'nienKhoa'],
        });
        if (!lhp) throw new NotFoundException('Lớp học phần không tồn tại');

        const giangVien = await this.giangVienRepo.findOneBy({ id: giangVienId });
        if (!giangVien) throw new NotFoundException('Giảng viên không tồn tại');

        // Kiểm tra giảng viên có được phân công dạy môn này không
        const phanCongMon = await this.giangVienMonHocRepo.findOne({
            where: {
                giangVien: { id: giangVienId },
                monHoc: { id: lhp.monHoc.id },
            },
        });
        if (!phanCongMon) {
            throw new BadRequestException('Giảng viên chưa được phân công dạy môn này');
        }

        // Kiểm tra giới hạn tín chỉ trong học kỳ
        const tinChiMon = lhp.monHoc.soTinChi;
        const tongTinChiHienTai = await this.lopHocPhanRepo
            .createQueryBuilder('lhp2')
            .innerJoin('lhp2.monHoc', 'monHoc')
            .where('lhp2.giang_vien_id = :giangVienId', { giangVienId })
            .andWhere('lhp2.hoc_ky_id = :hocKyId', { hocKyId: lhp.hocKy.id })
            .andWhere('lhp2.id != :currentId', { currentId: lhp.id })
            .select('SUM(monHoc.so_tin_chi)', 'total')
            .getRawOne();

        const tinChiKhac = Number(tongTinChiHienTai?.total || 0);
        if (tinChiKhac + tinChiMon > 12) {
            throw new BadRequestException(`Vượt quá giới hạn 12 tín chỉ/học kỳ (hiện tại: ${tinChiKhac} + ${tinChiMon})`);
        }

        lhp.giangVien = giangVien;
        return await this.lopHocPhanRepo.save(lhp);
    }

    // Hủy phân công giảng viên
    async huyPhanCongGiangVien(lopHocPhanId: number): Promise<void> {
        const lhp = await this.lopHocPhanRepo.findOneBy({ id: lopHocPhanId });
        if (!lhp) throw new NotFoundException('Lớp học phần không tồn tại');

        lhp.giangVien = null;
        await this.lopHocPhanRepo.save(lhp);
    }

    // getDanhSachPhanCong – thêm phân trang
    async getDanhSachPhanCong(query: GetPhanCongQueryDto) {
        const { giangVienId, hocKyId, nienKhoaId, nganhId, monHocId, page = 1, limit = 10 } = query;

        const qb = this.lopHocPhanRepo
            .createQueryBuilder('lhp')
            .leftJoinAndSelect('lhp.giangVien', 'giangVien')
            .leftJoinAndSelect('lhp.monHoc', 'monHoc')
            .leftJoinAndSelect('lhp.hocKy', 'hocKy')
            .leftJoinAndSelect('hocKy.namHoc', 'namHoc')
            .leftJoinAndSelect('lhp.nienKhoa', 'nienKhoa')
            .leftJoinAndSelect('lhp.nganh', 'nganh');

        if (giangVienId) qb.andWhere('giangVien.id = :giangVienId', { giangVienId });
        if (hocKyId) qb.andWhere('hocKy.id = :hocKyId', { hocKyId });
        if (nienKhoaId) qb.andWhere('nienKhoa.id = :nienKhoaId', { nienKhoaId });
        if (nganhId) qb.andWhere('nganh.id = :nganhId', { nganhId });
        if (monHocId) qb.andWhere('monHoc.id = :monHocId', { monHocId });

        qb.orderBy('namHoc.namBatDau', 'DESC')
            .addOrderBy('hocKy.tenHocKy', 'ASC')
            .addOrderBy('monHoc.tenMonHoc', 'ASC');

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

    // Khoá điểm lớp học phần
    async khoaDiemLopHocPhan(lopHocPhanId: number): Promise<void> {
        const lhp = await this.lopHocPhanRepo.findOneBy({ id: lopHocPhanId });
        if (!lhp) throw new NotFoundException('Lớp học phần không tồn tại');
        lhp.khoaDiem = true;
        await this.lopHocPhanRepo.save(lhp);
    }
}