import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, MoreThanOrEqual, Not, Repository } from 'typeorm';
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
import { ApDungChuongTrinhDT } from 'src/dao-tao/entity/ap-dung-chuong-trinh-dt.entity';
import { ChiTietChuongTrinhDaoTao } from 'src/dao-tao/entity/chi-tiet-chuong-trinh-dao-tao.entity';
import { VaiTroNguoiDungEnum } from 'src/auth/enums/vai-tro-nguoi-dung.enum';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs/promises';
import { NamHoc } from 'src/dao-tao/entity/nam-hoc.entity';
import { ChuongTrinhDaoTao } from 'src/dao-tao/entity/chuong-trinh-dao-tao.entity';
import { Lop } from 'src/danh-muc/entity/lop.entity';

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
        @InjectRepository(ApDungChuongTrinhDT)
        private apDungRepo: Repository<ApDungChuongTrinhDT>,
        @InjectRepository(ChiTietChuongTrinhDaoTao)
        private chiTietCTDTRepo: Repository<ChiTietChuongTrinhDaoTao>,
        @InjectRepository(NamHoc)
        private namHocRepo: Repository<NamHoc>,
        @InjectRepository(Lop)
        private lopRepo: Repository<Lop>,
    ) { }

    // Tính sĩ số của lớp học phần bằng cách đếm số sinh viên đăng ký
    private async tinhSiSo(lopHocPhanId: number): Promise<number> {
        const count = await this.svLhpRepo.count({
            where: { lopHocPhan: { id: lopHocPhanId } },
        });
        return count;
    }

    // Tính điểm trung bình cộng học phần (thang 10)
    private tinhTBCHP(kq: KetQuaHocTap): number | null {
        if (kq.diemQuaTrinh == null || kq.diemThanhPhan == null || kq.diemThi == null) {
            return null;
        }
        return Number(
            (
                kq.diemQuaTrinh * 0.1 +
                kq.diemThanhPhan * 0.3 +
                kq.diemThi * 0.6
            ).toFixed(2),
        );
    }

    private tinhDiemChu(diemTB: number): string {
        if (diemTB >= 9.5) return 'A+';
        if (diemTB >= 8.5) return 'A';
        if (diemTB >= 8.0) return 'B+';
        if (diemTB >= 7.0) return 'B';
        if (diemTB >= 6.5) return 'C+';
        if (diemTB >= 5.5) return 'C';
        if (diemTB >= 5.0) return 'D+';
        if (diemTB >= 4.0) return 'D';
        return 'F';
    }

    private tinhDiemSo(diemTB: number | null): number | null {
        if (diemTB === null) return null;
        return Number((diemTB / 10 * 4).toFixed(2));
    }

    // Helper: Lấy danh sách giảng viên được phân công cho môn học, sắp xếp theo ID tăng dần
    private async layGiangVienPhanCongChoMon(monHocId: number, manager: EntityManager): Promise<GiangVien[]> {
        return await manager.find(GiangVien, {
            where: {
                monHocGiangViens: {
                    monHoc: { id: monHocId },
                },
            },
            order: {
                id: 'ASC', // Gán từ GV có ID nhỏ nhất trước
            },
        });
    }

    // Helper: Tìm HocKy phù hợp với thứ tự học kỳ từ năm bắt đầu của niên khóa
    private async timHocKyTuThuTu(namBatDau: number, thuTuMongMuon: number, manager: EntityManager): Promise<HocKy | null> {
        const namHocs = await manager.find(NamHoc, {
            where: { namBatDau: MoreThanOrEqual(namBatDau) },
            order: { namBatDau: 'ASC' },
        });

        let currentThuTu = 0;
        for (const namHoc of namHocs) {
            const hocKys = await manager.find(HocKy, {
                where: { namHoc: { id: namHoc.id } },
                order: { hocKy: 'ASC' },
            });

            for (const hk of hocKys) {
                currentThuTu++;
                if (currentThuTu === thuTuMongMuon) {
                    // 🔥 Khi trả về phải load relation namHoc
                    return await manager.findOne(HocKy, {
                        where: { id: hk.id },
                        relations: ['namHoc'],   // ⬅️ Load quan hệ
                    });
                }
            }
        }
        return null;
    }

    /**
 * Tự động tạo hàng loạt lớp học phần cho chương trình đào tạo
 * @param chuongTrinhId ID chương trình đào tạo
 * @param force Nếu true, cho phép tạo thêm lớp dù đã đủ số lượng
 */
    async autoCreateLopHocPhan(chuongTrinhId: number, force = false) {
        return await this.lopHocPhanRepo.manager.transaction(async (manager) => {
            // 1. Tìm chương trình đào tạo và ngành gắn với nó
            const chuongTrinh = await manager.findOne(ChuongTrinhDaoTao, {
                where: { id: chuongTrinhId },
                relations: ['nganh'],
            });
            if (!chuongTrinh) {
                throw new NotFoundException('Chương trình đào tạo không tồn tại');
            }
            const nganhId = chuongTrinh.nganh.id;

            // 2. Tìm tất cả ApDung cho chương trình này (các niên khóa áp dụng)
            const apDungs = await manager.find(ApDungChuongTrinhDT, {
                where: { chuongTrinh: { id: chuongTrinhId } },
                relations: ['nienKhoa'],
            });
            if (apDungs.length === 0) {
                throw new BadRequestException('Chương trình đào tạo này chưa được áp dụng cho bất kỳ niên khóa nào');
            }

            const createdLopHocPhans: LopHocPhan[] = [];
            const errors: string[] = [];
            let totalCreated = 0;

            // 3. Lấy tất cả chi tiết môn trong chương trình, group theo thứ tự học kỳ
            const chiTiets = await manager.find(ChiTietChuongTrinhDaoTao, {
                where: { chuongTrinh: { id: chuongTrinhId } },
                relations: ['monHoc'],
                order: { thuTuHocKy: 'ASC' },
            });

            const monByThuTu: { [thuTu: number]: ChiTietChuongTrinhDaoTao[] } = chiTiets.reduce((acc, ct) => {
                if (!acc[ct.thuTuHocKy]) acc[ct.thuTuHocKy] = [];
                acc[ct.thuTuHocKy].push(ct);
                return acc;
            }, {});

            const maxThuTu = Math.max(...Object.keys(monByThuTu).map(Number));

            // Duyệt từng niên khóa áp dụng
            for (const apDung of apDungs) {
                const nienKhoaId = apDung.nienKhoa.id;
                const nienKhoa = apDung.nienKhoa;

                // 4. Xác định thứ tự học kỳ đích cần tạo cho niên khóa này
                let thuTuDest = 1;
                for (let thuTu = 1; thuTu <= maxThuTu; thuTu++) {
                    if (!monByThuTu[thuTu]) continue;

                    const hocKyForThuTu = await this.timHocKyTuThuTu(nienKhoa.namBatDau, thuTu, manager);
                    if (!hocKyForThuTu) {
                        errors.push(`Niên khóa ${nienKhoa.maNienKhoa}: Không đủ học kỳ cho thứ tự ${thuTu}`);
                        continue;
                    }

                    // Kiểm tra nếu tất cả môn ở thứ tự này đã có lớp học phần
                    let tatCaMonDaCoLop = true;
                    for (const ct of monByThuTu[thuTu]) {
                        const soLop = await manager.count(LopHocPhan, {
                            where: {
                                monHoc: { id: ct.monHoc.id },
                                nganh: { id: nganhId },
                                nienKhoa: { id: nienKhoaId },
                                hocKy: { id: hocKyForThuTu.id },
                            },
                        });
                        if (soLop === 0) {
                            tatCaMonDaCoLop = false;
                            break;
                        }
                    }

                    if (tatCaMonDaCoLop) {
                        thuTuDest = thuTu + 1;
                    } else {
                        break;
                    }
                }

                if (thuTuDest > maxThuTu) {
                    errors.push(`Niên khóa ${nienKhoa.maNienKhoa}: Đã tạo đầy đủ lớp học phần cho tất cả thứ tự học kỳ`);
                    continue;
                }

                // 5. Xác định HocKy đích cho thứ tự đích
                const hocKyDest = await this.timHocKyTuThuTu(nienKhoa.namBatDau, thuTuDest, manager);
                if (!hocKyDest) {
                    errors.push(`Niên khóa ${nienKhoa.maNienKhoa}: Không tìm thấy học kỳ phù hợp cho thứ tự ${thuTuDest}`);
                    continue;
                }

                // 6. Tính số sinh viên đang học trong niên khóa + ngành
                const soSV = await manager.count(SinhVien, {
                    where: {
                        lop: {
                            nganh: { id: nganhId },
                            nienKhoa: { id: nienKhoaId },
                        },
                        tinhTrang: TinhTrangHocTapEnum.DANG_HOC,
                    },
                });

                if (soSV === 0) {
                    errors.push(`Niên khóa ${nienKhoa.maNienKhoa}: Không có sinh viên đang học`);
                    continue;
                }

                // 7. Đối với mỗi môn ở thứ tự đích, tạo lớp học phần
                const monHocs = monByThuTu[thuTuDest] || [];
                for (const ct of monHocs) {
                    const monHocId = ct.monHoc.id;
                    const maMonHoc = ct.monHoc.maMonHoc;
                    const soTinChi = ct.monHoc.soTinChi;

                    // Gọi helper để lấy danh sách giảng viên phân công cho môn
                    const giangViens = await this.layGiangVienPhanCongChoMon(monHocId, manager);

                    if (giangViens.length === 0) {
                        errors.push(`Môn ${maMonHoc} niên khóa ${nienKhoa.maNienKhoa}: Không có giảng viên nào được phân công dạy môn này`);
                        continue;
                    }

                    const soLopCanTao = Math.ceil(soSV / 50);

                    const soLopDaTao = await manager.count(LopHocPhan, {
                        where: {
                            monHoc: { id: monHocId },
                            nganh: { id: nganhId },
                            nienKhoa: { id: nienKhoaId },
                            hocKy: { id: hocKyDest.id },
                        },
                    });

                    if (soLopDaTao >= soLopCanTao && !force) {
                        errors.push(`Môn ${maMonHoc} niên khóa ${nienKhoa.maNienKhoa}: Đã tạo đủ ${soLopDaTao}/${soLopCanTao} lớp`);
                        continue;
                    }

                    // Gán GV cho từng lớp mới
                    let giangVienIndex = 0;
                    for (let i = 1; i <= soLopCanTao; i++) {
                        const maLopHocPhan = `${maMonHoc}_${chuongTrinh.nganh.maNganh}_${nienKhoa.maNienKhoa.split('-')[0]}_${i}`;

                        const existMa = await manager.findOne(LopHocPhan, { where: { maLopHocPhan } });
                        if (existMa) {
                            errors.push(`Mã lớp ${maLopHocPhan} đã tồn tại`);
                            continue;
                        }

                        // Tìm GV phù hợp (không vượt 12 tín chỉ)
                        let giangVienPhuHop: GiangVien | null = null;
                        while (giangVienIndex < giangViens.length) {
                            const gv = giangViens[giangVienIndex];
                            giangVienIndex++;

                            const tongTinChi = await manager.createQueryBuilder(LopHocPhan, 'lhp')
                                .innerJoin('lhp.monHoc', 'mh')
                                .where('lhp.giang_vien_id = :gvId', { gvId: gv.id })
                                .andWhere('lhp.hoc_ky_id = :hocKyId', { hocKyId: hocKyDest.id })
                                .select('SUM(mh.so_tin_chi)', 'total')
                                .getRawOne();

                            const tinChiHienTai = Number(tongTinChi?.total || 0);

                            if (tinChiHienTai + soTinChi <= 12) {
                                giangVienPhuHop = gv;
                                break;
                            }
                        }

                        if (!giangVienPhuHop) {
                            errors.push(`Môn ${maMonHoc} niên khóa ${nienKhoa.maNienKhoa}: Không tìm thấy giảng viên phù hợp (tất cả đều vượt 12 tín chỉ hoặc không đủ GV)`);
                            continue;
                        }

                        const ghiChu = `Tự động tạo - Học kỳ ${hocKyDest.hocKy} (${hocKyDest.namHoc.tenNamHoc})`;

                        // Tạo lớp với GV được gán
                        const newLhp = manager.create(LopHocPhan, {
                            maLopHocPhan,
                            ghiChu: ghiChu || '',
                            giangVien: { id: giangVienPhuHop.id },
                            monHoc: { id: monHocId },
                            hocKy: { id: hocKyDest.id },
                            nienKhoa: { id: nienKhoaId },
                            nganh: { id: nganhId },
                        });

                        const savedLhp = await manager.save(newLhp);
                        createdLopHocPhans.push(savedLhp);
                        totalCreated++;
                    }
                }
            }

            return {
                totalCreated,
                createdLopHocPhans,
                errors,
            };
        });
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

        // 3. Lấy thông tin môn học
        const monHoc = await this.monHocRepo.findOneBy({ id: dto.monHocId });
        if (!monHoc) {
            throw new BadRequestException('Môn học không tồn tại');
        }
        const tinChiMoi = monHoc.soTinChi;

        // === VALIDATION MỚI: Tự động xác định học kỳ dựa trên thứ tự trong CTĐT ===
        const apDung = await this.apDungRepo.findOne({
            where: {
                nganh: { id: dto.nganhId },
                nienKhoa: { id: dto.nienKhoaId },
            },
            relations: [
                'chuongTrinh',
                'chuongTrinh.chiTietMonHocs',
                'chuongTrinh.chiTietMonHocs.monHoc',
            ],
        });

        if (!apDung) {
            throw new BadRequestException(
                'Không có chương trình đào tạo nào được áp dụng cho ngành và niên khóa này',
            );
        }

        // Tìm thứ tự học kỳ của môn học trong CTĐT
        const chiTietMon = apDung.chuongTrinh.chiTietMonHocs.find(
            ct => ct.monHoc.id === dto.monHocId,
        );

        if (!chiTietMon) {
            throw new BadRequestException(
                'Môn học này không thuộc chương trình đào tạo được áp dụng cho ngành và niên khóa này',
            );
        }

        const thuTuMongMuon = chiTietMon.thuTuHocKy; // ví dụ: 5

        // Lấy niên khóa và năm bắt đầu
        const nienKhoa = await this.nienKhoaRepo.findOneBy({ id: dto.nienKhoaId });
        if (!nienKhoa) {
            throw new BadRequestException('Niên khóa không tồn tại');
        }
        const namBatDau = nienKhoa.namBatDau; // ví dụ: 2022

        // Tìm tất cả năm học có năm bắt đầu >= namBatDau, sắp xếp tăng dần
        const namHocs = await this.namHocRepo.find({
            where: { namBatDau: MoreThanOrEqual(namBatDau) },
            order: { namBatDau: 'ASC' },
            relations: ['hocKys'],
        });

        if (namHocs.length === 0) {
            throw new BadRequestException(
                `Không tìm thấy năm học nào bắt đầu từ năm ${namBatDau} trở đi`,
            );
        }

        let currentThuTu = 0;
        let hocKyDuocChon: HocKy | null = null;

        for (const namHoc of namHocs) {
            // Lấy học kỳ của năm học này, sắp xếp theo hocKy (1,2,3...)
            const hocKys = await this.hocKyRepo.find({
                where: { namHoc: { id: namHoc.id } },
                order: { hocKy: 'ASC' },
            });

            for (const hk of hocKys) {
                currentThuTu++;

                if (currentThuTu === thuTuMongMuon) {
                    hocKyDuocChon = hk;
                    break;
                }
            }

            if (hocKyDuocChon) break;
        }

        if (!hocKyDuocChon) {
            const tongHocKyCoSan = currentThuTu;
            throw new BadRequestException(
                `Môn học này nằm ở học kỳ thứ ${thuTuMongMuon} theo chương trình đào tạo, ` +
                `nhưng hệ thống hiện chỉ có ${tongHocKyCoSan} học kỳ từ năm ${namBatDau} trở đi. ` +
                `Không đủ học kỳ để mở lớp học phần cho môn này.`,
            );
        }

        // === VALIDATION QUAN TRỌNG: Tính tổng tín chỉ giảng viên đã dạy trong học kỳ được chọn ===
        const tongTinChiHienTai = await this.lopHocPhanRepo
            .createQueryBuilder('lhp')
            .innerJoin('lhp.monHoc', 'monHoc')
            .where('lhp.giang_vien_id = :giangVienId', { giangVienId: dto.giangVienId })
            .andWhere('lhp.hoc_ky_id = :hocKyId', { hocKyId: hocKyDuocChon.id })
            .select('SUM(monHoc.so_tin_chi)', 'total')
            .getRawOne();

        const tinChiHienTai = Number(tongTinChiHienTai?.total || 0);

        // Kiểm tra giới hạn 12 tín chỉ
        if (tinChiHienTai + tinChiMoi > 12) {
            throw new BadRequestException(
                `Giảng viên này đã dạy ${tinChiHienTai} tín chỉ trong học kỳ ${hocKyDuocChon.hocKy} (${hocKyDuocChon.namHoc.tenNamHoc}). ` +
                `Thêm lớp học phần này (${tinChiMoi} tín chỉ) sẽ vượt quá giới hạn 12 tín chỉ trong một học kỳ.`,
            );
        }

        // === VALIDATION CŨ 2: Kiểm tra số lượng lớp học phần tối đa theo số sinh viên ===
        const MAX_SV_MOT_LOP = 50;

        const tongSinhVien = await this.sinhVienRepo.count({
            where: {
                lop: {
                    nganh: { id: dto.nganhId },
                    nienKhoa: { id: dto.nienKhoaId },
                },
                tinhTrang: TinhTrangHocTapEnum.DANG_HOC,
            },
        });

        if (tongSinhVien === 0) {
            throw new BadRequestException(
                'Ngành và niên khóa này hiện chưa có sinh viên nào. Không thể mở lớp học phần.',
            );
        }

        const soLopToiDa = Math.ceil(tongSinhVien / MAX_SV_MOT_LOP);

        const soLopDaMo = await this.lopHocPhanRepo.count({
            where: {
                monHoc: { id: dto.monHocId },
                nganh: { id: dto.nganhId },
                nienKhoa: { id: dto.nienKhoaId },
                hocKy: { id: hocKyDuocChon.id }, // dùng học kỳ tự động tìm được
            },
        });

        if (soLopDaMo >= soLopToiDa) {
            throw new BadRequestException(
                `Ngành này (niên khóa ${dto.nienKhoaId}) chỉ có ${tongSinhVien} sinh viên. ` +
                `Với quy định tối đa ${MAX_SV_MOT_LOP} SV/lớp, chỉ được mở tối đa ${soLopToiDa} lớp học phần cho môn này. ` +
                `Hiện đã mở ${soLopDaMo} lớp trong học kỳ phù hợp. Không thể mở thêm.`,
            );
        }

        // 6. Tạo và lưu lớp học phần (không cần hocKyId từ DTO nữa)
        const lhp = this.lopHocPhanRepo.create({
            maLopHocPhan: dto.maLopHocPhan,
            ghiChu: dto.ghiChu,
            giangVien: { id: dto.giangVienId } as GiangVien,
            monHoc: { id: dto.monHocId } as MonHoc,
            hocKy: hocKyDuocChon, // ← học kỳ được tự động xác định
            nienKhoa: { id: dto.nienKhoaId } as NienKhoa,
            nganh: { id: dto.nganhId } as Nganh,
        });

        return await this.lopHocPhanRepo.save(lhp);
    }


    async findAll(query: GetLopHocPhanQueryDto) {
        const {
            page = 1,
            limit = 10,
            search,
            monHocId,
            giangVienId,
            hocKyId,
            nienKhoaId,
            nganhId,
            trangThai, // ← Lấy từ query
        } = query;

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

        qb.orderBy('namHoc.namBatDau', 'DESC')
            .addOrderBy('hocKy.hoc_ky', 'ASC')
            .addOrderBy('lhp.maLopHocPhan', 'ASC');

        // Lấy tổng trước khi phân trang (để tính total chính xác)
        const totalItems = await qb.getMany();

        // Ngày hiện tại (chuẩn hóa giờ về 00:00:00 để so sánh ngày chính xác)
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // Tính trạng thái + sĩ số cho từng lớp
        const itemsWithInfo = await Promise.all(
            totalItems.map(async (lhp) => {
                const siSo = await this.tinhSiSo(lhp.id);

                let trangThaiLop: 'CHUA_BAT_DAU' | 'DANG_HOC' | 'DA_KET_THUC' = 'CHUA_BAT_DAU';

                if (lhp.hocKy) {
                    const batDau = new Date(lhp.hocKy.ngayBatDau);
                    const ketThuc = new Date(lhp.hocKy.ngayKetThuc);
                    batDau.setHours(0, 0, 0, 0);
                    ketThuc.setHours(0, 0, 0, 0);

                    if (now >= batDau && now <= ketThuc) {
                        trangThaiLop = 'DANG_HOC';
                    } else if (now > ketThuc) {
                        trangThaiLop = 'DA_KET_THUC';
                    }
                }

                return {
                    ...lhp,
                    siSo,
                    trangThai: trangThaiLop,
                };
            }),
        );

        // Lọc theo trạng thái (nếu có truyền query trangThai)
        const filteredItems = trangThai
            ? itemsWithInfo.filter(item => item.trangThai === trangThai)
            : itemsWithInfo;

        // Tính tổng sau khi lọc
        const total = filteredItems.length;

        // Áp dụng phân trang lên dữ liệu đã lọc
        const paginatedItems = filteredItems.slice((page - 1) * limit, page * limit);

        return {
            data: paginatedItems,
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

        // Tính sĩ số
        const siSo = await this.tinhSiSo(id);

        // Tính trạng thái lớp học phần dựa trên ngày hiện tại
        let trangThai: 'CHUA_BAT_DAU' | 'DANG_HOC' | 'DA_KET_THUC' = 'CHUA_BAT_DAU';

        if (lhp.hocKy) {
            const now = new Date();
            const batDau = new Date(lhp.hocKy.ngayBatDau);
            const ketThuc = new Date(lhp.hocKy.ngayKetThuc);

            // Đặt giờ về 00:00:00 để so sánh chính xác theo ngày (tránh lệch múi giờ)
            now.setHours(0, 0, 0, 0);
            batDau.setHours(0, 0, 0, 0);
            ketThuc.setHours(0, 0, 0, 0);

            if (now >= batDau && now <= ketThuc) {
                trangThai = 'DANG_HOC';
            } else if (now > ketThuc) {
                trangThai = 'DA_KET_THUC';
            }
            // else: giữ nguyên 'CHUA_BAT_DAU'
        }

        return {
            ...lhp,
            siSo,
            trangThai, // ← Thêm trạng thái lớp học phần
        };
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
            // === VALIDATION MỚI: Không cho thay đổi giảng viên nếu lớp đã có kết quả học tập ===
            const daCoKetQua = await this.ketQuaHocTapRepo.count({
                where: { lopHocPhan: { id } },
            });

            if (daCoKetQua > 0) {
                throw new BadRequestException(
                    'Không thể thay đổi giảng viên vì lớp học phần này đã có kết quả học tập được nhập. ' +
                    'Việc thay đổi sẽ gây nhầm lẫn về trách nhiệm giảng viên.',
                );
            }

            // Kiểm tra phân công giảng viên mới
            const phanCong = await this.giangVienMonHocRepo.findOne({
                where: {
                    giangVien: { id: dto.giangVienId },
                    monHoc: { id: lhp.monHoc.id },
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

        // === VALIDATION 1: Kiểm tra CTĐT nếu thay đổi môn/ngành/niên khóa ===
        const finalNganhId = dto.nganhId ?? lhp.nganh.id;
        const finalNienKhoaId = dto.nienKhoaId ?? lhp.nienKhoa.id;
        const finalMonHocId = dto.monHocId ?? lhp.monHoc.id;

        if (dto.monHocId || dto.nganhId || dto.nienKhoaId) {
            const apDung = await this.apDungRepo.findOne({
                where: {
                    nganh: { id: finalNganhId },
                    nienKhoa: { id: finalNienKhoaId },
                },
                relations: ['chuongTrinh', 'chuongTrinh.chiTietMonHocs', 'chuongTrinh.chiTietMonHocs.monHoc'],
            });

            if (!apDung) {
                throw new BadRequestException(
                    'Không có chương trình đào tạo nào được áp dụng cho ngành và niên khóa mới này',
                );
            }

            const monHocTrongCT = apDung.chuongTrinh.chiTietMonHocs.some(
                ct => ct.monHoc.id === finalMonHocId,
            );

            if (!monHocTrongCT) {
                throw new BadRequestException(
                    'Môn học này không thuộc chương trình đào tạo được áp dụng cho ngành và niên khóa mới',
                );
            }
        }

        // === VALIDATION 2: Kiểm tra giới hạn số lớp học phần theo số sinh viên ===
        if (dto.monHocId || dto.nganhId || dto.nienKhoaId) {
            const MAX_SV_MOT_LOP = 50;

            const tongSinhVien = await this.sinhVienRepo.count({
                where: {
                    lop: {
                        nganh: { id: finalNganhId },
                        nienKhoa: { id: finalNienKhoaId },
                    },
                    tinhTrang: TinhTrangHocTapEnum.DANG_HOC,
                },
            });

            if (tongSinhVien === 0) {
                throw new BadRequestException(
                    'Ngành và niên khóa này hiện chưa có sinh viên nào. Không thể cập nhật lớp học phần.',
                );
            }

            const soLopToiDa = Math.ceil(tongSinhVien / MAX_SV_MOT_LOP);

            const soLopDaMo = await this.lopHocPhanRepo.count({
                where: {
                    monHoc: { id: finalMonHocId },
                    nganh: { id: finalNganhId },
                    nienKhoa: { id: finalNienKhoaId },
                    hocKy: { id: lhp.hocKy.id },
                    id: Not(id),
                },
            });

            if (soLopDaMo >= soLopToiDa) {
                throw new BadRequestException(
                    `Ngành này (niên khóa ${finalNienKhoaId}) chỉ có ${tongSinhVien} sinh viên. ` +
                    `Với quy định tối đa ${MAX_SV_MOT_LOP} SV/lớp, chỉ được mở tối đa ${soLopToiDa} lớp học phần cho môn này. ` +
                    `Hiện đã mở ${soLopDaMo} lớp khác. Không thể cập nhật để giữ môn/ngành/niên khóa này.`,
                );
            }
        }

        // === VALIDATION MỚI 3: Kiểm tra giới hạn tín chỉ giảng viên nếu thay đổi giảng viên ===
        if (dto.giangVienId !== undefined && dto.giangVienId !== lhp.giangVien?.id) {
            // Tính tổng tín chỉ của giảng viên MỚI trong học kỳ hiện tại của lớp (không bao gồm lớp này)
            const tongTinChiHienTai = await this.lopHocPhanRepo
                .createQueryBuilder('lhp2')
                .innerJoin('lhp2.monHoc', 'monHoc')
                .where('lhp2.giang_vien_id = :giangVienId', { giangVienId: dto.giangVienId })
                .andWhere('lhp2.hoc_ky_id = :hocKyId', { hocKyId: lhp.hocKy.id })
                .andWhere('lhp2.id != :currentId', { currentId: id })
                .select('SUM(monHoc.so_tin_chi)', 'total')
                .getRawOne();

            const tinChiHienTai = Number(tongTinChiHienTai?.total || 0);

            if (tinChiHienTai + lhp.monHoc.soTinChi > 12) {
                throw new BadRequestException(
                    `Giảng viên mới đã dạy ${tinChiHienTai} tín chỉ trong học kỳ này. ` +
                    `Thay đổi sang giảng viên này sẽ vượt quá giới hạn 12 tín chỉ (tổng: ${tinChiHienTai} + ${lhp.monHoc.soTinChi}).`,
                );
            }
        }

        // === VALIDATION MỚI 4: Nếu thay đổi môn / ngành / niên khóa → kiểm tra thứ tự học kỳ và tín chỉ giảng viên ===
        if (dto.monHocId || dto.nganhId || dto.nienKhoaId) {
            // Giá trị cuối cùng sau khi update
            const finalNganhId = dto.nganhId ?? lhp.nganh.id;
            const finalNienKhoaId = dto.nienKhoaId ?? lhp.nienKhoa.id;
            const finalMonHocId = dto.monHocId ?? lhp.monHoc.id;

            // 1. Lấy chương trình đào tạo áp dụng cho ngành + niên khóa mới
            const apDung = await this.apDungRepo.findOne({
                where: {
                    nganh: { id: finalNganhId },
                    nienKhoa: { id: finalNienKhoaId },
                },
                relations: [
                    'chuongTrinh',
                    'chuongTrinh.chiTietMonHocs',
                    'chuongTrinh.chiTietMonHocs.monHoc',
                ],
            });

            if (!apDung) {
                throw new BadRequestException(
                    'Không có chương trình đào tạo nào được áp dụng cho ngành và niên khóa sau khi cập nhật',
                );
            }

            // 2. Kiểm tra môn học có trong CTĐT không
            const chiTietMon = apDung.chuongTrinh.chiTietMonHocs.find(
                ct => ct.monHoc.id === finalMonHocId,
            );

            if (!chiTietMon) {
                throw new BadRequestException(
                    'Môn học sau khi cập nhật không thuộc chương trình đào tạo được áp dụng cho ngành và niên khóa này',
                );
            }

            const thuTuMongMuon = chiTietMon.thuTuHocKy;

            // 3. Lấy niên khóa mới và năm bắt đầu
            const nienKhoaMoi = await this.nienKhoaRepo.findOneBy({ id: finalNienKhoaId });
            if (!nienKhoaMoi) {
                throw new BadRequestException('Niên khóa sau khi cập nhật không tồn tại');
            }
            const namBatDau = nienKhoaMoi.namBatDau;

            // 4. Tìm tất cả năm học từ năm bắt đầu trở đi
            const namHocs = await this.namHocRepo.find({
                where: { namBatDau: MoreThanOrEqual(namBatDau) },
                order: { namBatDau: 'ASC' },
                relations: ['hocKys'],
            });

            if (namHocs.length === 0) {
                throw new BadRequestException(
                    `Không tìm thấy năm học nào bắt đầu từ năm ${namBatDau} trở đi`,
                );
            }

            let currentThuTu = 0;
            let hocKyDuocChon: HocKy | null = null;

            for (const namHoc of namHocs) {
                const hocKys = await this.hocKyRepo.find({
                    where: { namHoc: { id: namHoc.id } },
                    order: { hocKy: 'ASC' },
                });

                for (const hk of hocKys) {
                    currentThuTu++;

                    if (currentThuTu === thuTuMongMuon) {
                        hocKyDuocChon = hk;
                        break;
                    }
                }

                if (hocKyDuocChon) break;
            }

            if (!hocKyDuocChon) {
                throw new BadRequestException(
                    `Môn học sau khi cập nhật nằm ở học kỳ thứ ${thuTuMongMuon} theo chương trình đào tạo, ` +
                    `nhưng hệ thống hiện chỉ có ${currentThuTu} học kỳ từ năm ${namBatDau} trở đi. ` +
                    `Không đủ học kỳ để cập nhật lớp học phần này.`,
                );
            }

            // 5. Kiểm tra tín chỉ giảng viên trong học kỳ mới được chọn
            const tinChiMoi = (await this.monHocRepo.findOneBy({ id: finalMonHocId }))?.soTinChi || 0;

            const tongTinChiHienTai = await this.lopHocPhanRepo
                .createQueryBuilder('lhp2')
                .innerJoin('lhp2.monHoc', 'monHoc')
                .where('lhp2.giang_vien_id = :giangVienId', { giangVienId: lhp.giangVien?.id })
                .andWhere('lhp2.hoc_ky_id = :hocKyId', { hocKyId: hocKyDuocChon.id })
                .andWhere('lhp2.id != :currentId', { currentId: id })
                .select('SUM(monHoc.so_tin_chi)', 'total')
                .getRawOne();

            const tinChiHienTai = Number(tongTinChiHienTai?.total || 0);

            if (tinChiHienTai + tinChiMoi > 12) {
                throw new BadRequestException(
                    `Nếu cập nhật như vậy, giảng viên sẽ dạy ${tinChiHienTai + tinChiMoi} tín chỉ trong học kỳ ${hocKyDuocChon.hocKy} (${hocKyDuocChon.namHoc.tenNamHoc}). ` +
                    `Vượt quá giới hạn 12 tín chỉ/học kỳ.`,
                );
            }

            // Nếu qua hết validation → cập nhật học kỳ mới (nếu cần)
            // Vì học kỳ không có trong DTO → ta tự động gán lại nếu thay đổi môn/ngành/niên khóa
            lhp.hocKy = hocKyDuocChon;
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
            relations: ['lop', 'lop.nienKhoa', 'lop.nganh'],
        });

        if (!sinhVien) throw new NotFoundException('Sinh viên không tồn tại');
        if (!sinhVien.lop || !sinhVien.lop.nienKhoa || !sinhVien.lop.nganh) {
            throw new BadRequestException('Sinh viên không có thông tin lớp hành chính đầy đủ (sinh viên không có hoặc lớp của sinh viên không có ngành hoặc niên khóa)');
        }

        // Kiểm tra tình trạng
        if (
            sinhVien.tinhTrang === TinhTrangHocTapEnum.THOI_HOC ||
            sinhVien.tinhTrang === TinhTrangHocTapEnum.BAO_LUU
        ) {
            throw new BadRequestException('Sinh viên đang nghỉ học hoặc bảo lưu không được đăng ký');
        }

        // ===== VALIDATION MỚI: Môn học phải thuộc CTDT của sinh viên =====
        const apDung = await this.apDungRepo.findOne({
            where: {
                nganh: { id: sinhVien.lop.nganh.id },
                nienKhoa: { id: sinhVien.lop.nienKhoa.id },
            },
            relations: ['chuongTrinh', 'chuongTrinh.chiTietMonHocs', 'chuongTrinh.chiTietMonHocs.monHoc'],
        });

        if (!apDung) {
            throw new BadRequestException(
                'Không tìm thấy chương trình đào tạo áp dụng cho ngành và niên khóa của sinh viên này',
            );
        }

        const monHocTrongCTDT = apDung.chuongTrinh.chiTietMonHocs.some(
            ct => ct.monHoc.id === lhp.monHoc.id,
        );

        if (!monHocTrongCTDT) {
            throw new BadRequestException(
                `Môn học ${lhp.monHoc.tenMonHoc} với mã môn ${lhp.monHoc.maMonHoc} không thuộc chương trình đào tạo của sinh viên này (ngành: ${sinhVien.lop.nganh.tenNganh}, niên khóa: ${sinhVien.lop.nienKhoa.tenNienKhoa})`,
            );
        }
        // ===== Kết thúc validation mới =====

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
        // 1. Tìm đăng ký của sinh viên trong lớp học phần
        const registration = await this.svLhpRepo.findOne({
            where: {
                lopHocPhan: { id: lopHocPhanId },
                sinhVien: { id: sinhVienId },
            },
            relations: ['lopHocPhan'],
        });

        if (!registration) {
            throw new NotFoundException('Sinh viên không tồn tại trong lớp học phần này');
        }

        // 2. KIỂM TRA MỚI: Nếu sinh viên đã có điểm (KetQuaHocTap) thì không cho xóa
        const hasKetQua = await this.ketQuaHocTapRepo.count({
            where: {
                sinhVien: { id: sinhVienId },
                lopHocPhan: { id: lopHocPhanId },
            },
        });

        if (hasKetQua > 0) {
            throw new BadRequestException(
                'Không thể xóa sinh viên khỏi lớp học phần vì sinh viên đã có điểm trong lớp này. ' +
                'Vui lòng liên hệ phòng đào tạo nếu cần điều chỉnh.',
            );
        }

        // 3. Xóa đăng ký
        await this.svLhpRepo.remove(registration);

        // 4. Cập nhật sĩ số lớp học phần (nếu bạn có field siSo hoặc tính động)
        const lhp = registration.lopHocPhan;
        // Nếu có field siSo trong entity LopHocPhan, cập nhật:
        // lhp.siSo = (await this.svLhpRepo.count({ where: { lopHocPhan: { id: lopHocPhanId } } }));
        await this.lopHocPhanRepo.save(lhp);
    }

    async getDanhSachSinhVien(
        lopHocPhanId: number,
        userId: number,
        vaiTro: VaiTroNguoiDungEnum,
        query: GetSinhVienTrongLopQueryDto,
    ) {
        const { page = 1, limit = 10, search, maSinhVienSearch } = query;

        // Load lớp học phần + giảng viên phụ trách (giữ nguyên như cũ)
        const lhp = await this.lopHocPhanRepo.findOne({
            where: { id: lopHocPhanId },
            relations: [
                'giangVien',
                'monHoc',
                'hocKy',
                'hocKy.namHoc',
                'nienKhoa',
                'nganh',
            ],
        });
        if (!lhp) throw new NotFoundException('Lớp học phần không tồn tại');

        // Kiểm tra quyền (giữ nguyên như cũ)
        if (vaiTro === VaiTroNguoiDungEnum.GIANG_VIEN) {
            const nguoiDung = await this.nguoiDungRepo.findOne({
                where: { id: userId },
                relations: ['giangVien'],
            });

            if (!nguoiDung || !nguoiDung.giangVien) {
                throw new ForbiddenException('Bạn không phải giảng viên');
            }

            if (lhp.giangVien?.id !== nguoiDung.giangVien.id) {
                throw new ForbiddenException('Bạn không được phân công phụ trách lớp này');
            }
        }

        // 1) Tính sĩ số chuẩn (KHÔNG ÁP DỤNG SEARCH)
        const siSo = await this.svLhpRepo.count({
            where: { lopHocPhan: { id: lopHocPhanId } },
        });

        // Query builder
        const qb = this.svLhpRepo
            .createQueryBuilder('svlhp')
            .leftJoinAndSelect('svlhp.sinhVien', 'sinhVien')
            .leftJoinAndSelect('sinhVien.lop', 'lop')
            .leftJoinAndSelect('lop.nganh', 'nganh')
            .leftJoinAndSelect('lop.nienKhoa', 'nienKhoa')
            .leftJoinAndSelect('svlhp.lopHocPhan', 'lhp')
            .leftJoinAndSelect('lhp.ketQuaHocTaps', 'kq') // Load điểm nếu có
            .leftJoinAndSelect('kq.sinhVien', 'kq_sv')
            .where('svlhp.lop_hoc_phan_id = :lopHocPhanId', { lopHocPhanId });

        // Tìm kiếm mở rộng
        if (maSinhVienSearch) {
            // Ưu tiên tìm chính xác theo mã SV
            qb.andWhere('LOWER(sinhVien.maSinhVien) = LOWER(:maSinhVienSearch)', {
                maSinhVienSearch,
            });
        } else if (search) {
            // Tìm gần đúng theo mã SV hoặc tên SV
            qb.andWhere(
                '(LOWER(sinhVien.maSinhVien) LIKE LOWER(:search) OR LOWER(sinhVien.hoTen) LIKE LOWER(:search))',
                { search: `%${search}%` },
            );
        }

        qb.orderBy('sinhVien.hoTen', 'ASC');

        const total = await qb.getCount();
        const items = await qb.skip((page - 1) * limit).take(limit).getMany();

        // Xử lý dữ liệu trả về (giữ nguyên phần tính điểm như trước)
        const data = items.map(item => {
            const sv = item.sinhVien;

            // Fix: Kiểm tra ketQuaHocTaps tồn tại và là mảng
            const ketQuaHocTaps = item.lopHocPhan?.ketQuaHocTaps ?? [];

            const kq = ketQuaHocTaps.find(k => k.sinhVien.id === sv.id);

            let diemInfo: {
                id: number;
                diemQuaTrinh: number;
                diemThanhPhan: number;
                diemThi: number;
                TBCHP: number | null;
                DiemSo: number | null;
                DiemChu: string | null;
            } | null = null;
            if (kq) {
                const tbchp = this.tinhTBCHP(kq);
                diemInfo = {
                    id: kq.id,
                    diemQuaTrinh: kq.diemQuaTrinh,
                    diemThanhPhan: kq.diemThanhPhan,
                    diemThi: kq.diemThi,
                    TBCHP: tbchp,
                    DiemSo: this.tinhDiemSo(tbchp),
                    DiemChu: tbchp !== null ? this.tinhDiemChu(tbchp) : null,
                };
            }

            return {
                sinhVien: {
                    id: sv.id,
                    maSinhVien: sv.maSinhVien,
                    hoTen: sv.hoTen,
                    tenlop: sv.lop?.tenLop || 'N/A',
                    malop: sv.lop?.maLop || 'N/A',
                    nganh: sv.lop?.nganh?.tenNganh || 'N/A',
                    manganh: sv.lop?.nganh?.maNganh || 'N/A',
                    nienKhoa: sv.lop?.nienKhoa?.maNienKhoa || 'N/A',
                },
                loaiThamGia: item.loaiThamGia,
                ngayDangKy: item.ngayDangKy,
                diem: diemInfo,
                chuaCoDiem: !diemInfo,
            };
        });
        return {
            lopHocPhan: {
                id: lhp.id,
                maLopHocPhan: lhp.maLopHocPhan,
                monHoc: lhp.monHoc.tenMonHoc,
                mamonHoc: lhp.monHoc.maMonHoc,
                hocKy: lhp.hocKy.hocKy,
                ngayBatDau: lhp.hocKy.ngayBatDau,
                ngayKetThuc: lhp.hocKy.ngayKetThuc,
                maNienKhoa: lhp.nienKhoa.maNienKhoa,
                tenNienKhoa: lhp.nienKhoa.tenNienKhoa,
                maNganh: lhp.nganh.maNganh,
                tenNganh: lhp.nganh.tenNganh,
                namhoc: lhp.hocKy.namHoc.maNamHoc,
                giangVien: lhp.giangVien?.hoTen || 'Chưa phân công',
                maGiangVien: lhp.giangVien?.maGiangVien || 'Chưa phân công',
                siSo: siSo,
                khoaDiem: lhp.khoaDiem,
            },
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getLopHocPhanCuaGiangVien(userId: number, query: GetMyLopHocPhanQueryDto) {
        const {
            page = 1,
            limit = 10,
            hocKyId,
            monHocId,
            nganhId,
            nienKhoaId,
            trangThai,
            search, // ← Thêm tham số search
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

        // Query builder
        const qb = this.lopHocPhanRepo
            .createQueryBuilder('lhp')
            .leftJoinAndSelect('lhp.monHoc', 'monHoc')
            .leftJoinAndSelect('lhp.hocKy', 'hocKy')
            .leftJoinAndSelect('hocKy.namHoc', 'namHoc')
            .leftJoinAndSelect('lhp.nienKhoa', 'nienKhoa')
            .leftJoinAndSelect('lhp.nganh', 'nganh')
            .leftJoinAndSelect('nganh.khoa', 'khoa')
            .loadRelationCountAndMap('lhp.siSo', 'lhp.sinhVienLopHocPhans')
            .where('lhp.giang_vien_id = :giangVienId', { giangVienId });

        if (hocKyId) qb.andWhere('lhp.hoc_ky_id = :hocKyId', { hocKyId });
        if (monHocId) qb.andWhere('lhp.mon_hoc_id = :monHocId', { monHocId });
        if (nganhId) qb.andWhere('lhp.nganh_id = :nganhId', { nganhId });
        if (nienKhoaId) qb.andWhere('lhp.nien_khoa_id = :nienKhoaId', { nienKhoaId });

        // ← THÊM LOGIC TÌM KIẾM THEO MÃ LỚP HỌC PHẦN
        if (search) {
            qb.andWhere('LOWER(lhp.maLopHocPhan) LIKE LOWER(:search)', {
                search: `%${search}%`
            });
        }

        qb.orderBy('namHoc.namBatDau', 'DESC')
            .addOrderBy('hocKy.hocKy', 'ASC')
            .addOrderBy('monHoc.tenMonHoc', 'ASC');

        const total = await qb.getCount();
        const items = await qb.skip((page - 1) * limit).take(limit).getMany();

        // Ngày hiện tại
        const now = new Date();
        now.setHours(0, 0, 0, 0); // chuẩn hóa về 00:00:00 để so sánh ngày chính xác

        const dataWithTrangThai = items.map(lhp => {
            let trangThaiLop: 'CHUA_BAT_DAU' | 'DANG_HOC' | 'DA_KET_THUC' = 'CHUA_BAT_DAU';

            if (lhp.hocKy) {
                const batDau = new Date(lhp.hocKy.ngayBatDau);
                const ketThuc = new Date(lhp.hocKy.ngayKetThuc);
                batDau.setHours(0, 0, 0, 0);
                ketThuc.setHours(0, 0, 0, 0);

                if (now >= batDau && now <= ketThuc) {
                    trangThaiLop = 'DANG_HOC';
                } else if (now > ketThuc) {
                    trangThaiLop = 'DA_KET_THUC';
                }
            }

            return {
                ...lhp,
                trangThai: trangThaiLop,
            };
        });

        // Nếu có lọc theo trạng thái → lọc lại data
        const filteredData = trangThai
            ? dataWithTrangThai.filter(item => item.trangThai === trangThai)
            : dataWithTrangThai;

        const filteredTotal = filteredData.length;
        const finalData = filteredData.slice((page - 1) * limit, page * limit);

        return {
            data: finalData,
            pagination: {
                total: filteredTotal,
                page,
                limit,
                totalPages: Math.ceil(filteredTotal / limit),
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

    async getDanhSachPhanCong(query: GetPhanCongQueryDto) {
        const {
            giangVienId,
            hocKyId,
            nienKhoaId,
            nganhId,
            monHocId,
            page = 1,
            limit = 10,
            trangThai, // ← Lấy từ query
        } = query;

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
            .addOrderBy('hocKy.hoc_ky', 'ASC')
            .addOrderBy('monHoc.tenMonHoc', 'ASC');

        // Lấy toàn bộ dữ liệu trước để tính trạng thái (vì không thể filter trạng thái ở SQL)
        const allItems = await qb.getMany();

        // Ngày hiện tại (chuẩn hóa về 00:00:00 để so sánh chính xác)
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // Tính trạng thái cho từng lớp
        const itemsWithTrangThai = allItems.map(lhp => {
            let trangThaiLop: 'CHUA_BAT_DAU' | 'DANG_HOC' | 'DA_KET_THUC' = 'CHUA_BAT_DAU';

            if (lhp.hocKy) {
                const batDau = new Date(lhp.hocKy.ngayBatDau);
                const ketThuc = new Date(lhp.hocKy.ngayKetThuc);
                batDau.setHours(0, 0, 0, 0);
                ketThuc.setHours(0, 0, 0, 0);

                if (now >= batDau && now <= ketThuc) {
                    trangThaiLop = 'DANG_HOC';
                } else if (now > ketThuc) {
                    trangThaiLop = 'DA_KET_THUC';
                }
            }

            return {
                ...lhp,
                trangThai: trangThaiLop,
            };
        });

        // Lọc theo trạng thái nếu có query
        const filteredItems = trangThai
            ? itemsWithTrangThai.filter(item => item.trangThai === trangThai)
            : itemsWithTrangThai;

        const total = filteredItems.length;

        // Áp dụng phân trang lên dữ liệu đã lọc
        const paginatedItems = filteredItems.slice((page - 1) * limit, page * limit);

        return {
            data: paginatedItems,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async khoaDiemLopHocPhan(lopHocPhanId: number, userId: number): Promise<void> {
        // 1. Tìm lớp học phần
        const lhp = await this.lopHocPhanRepo.findOne({
            where: { id: lopHocPhanId },
            relations: ['giangVien'], // load luôn giảng viên phụ trách
        });

        if (!lhp) {
            throw new NotFoundException('Lớp học phần không tồn tại');
        }

        // 2. Tìm người dùng và giảng viên gắn với userId
        const nguoiDung = await this.nguoiDungRepo.findOne({
            where: { id: userId },
            relations: ['giangVien'],
        });

        if (!nguoiDung || !nguoiDung.giangVien) {
            throw new ForbiddenException('Tài khoản của bạn không phải là giảng viên hoặc không được liên kết với giảng viên nào');
        }

        const giangVien = nguoiDung.giangVien;

        // 3. Kiểm tra xem giảng viên này có phụ trách lớp học phần không
        if (!lhp.giangVien || lhp.giangVien.id !== giangVien.id) {
            throw new ForbiddenException(
                'Bạn không phải là giảng viên phụ trách lớp học phần này. Chỉ giảng viên phụ trách mới được phép khoá điểm.',
            );
        }

        // 4. Thực hiện khoá điểm
        lhp.khoaDiem = true;
        await this.lopHocPhanRepo.save(lhp);
    }

    async themSinhVienBangExcelTuFile(filePath: string) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) throw new BadRequestException('File không có sheet dữ liệu');

        const rows = worksheet.getRows(2, worksheet.rowCount - 1) || [];
        if (rows.length === 0) throw new BadRequestException('File Excel không có dữ liệu từ dòng 2 trở đi');

        // Nhóm dữ liệu theo maLopHocPhan
        const groups: { [maLopHocPhan: string]: { rowNum: number; maSinhVien: string }[] } = {};

        const overallResults = {
            totalRows: rows.length,
            success: 0,
            failed: 0,
            byClass: {} as Record<string, { success: number; failed: number; errors: { row: number; maSinhVien: string; error: string }[] }>,
            errors: [] as { row: number; maSinhVien: string; maLopHocPhan: string; error: string }[],
        };

        for (const row of rows) {

            if (!row || row.actualCellCount === 0) continue;

            const rowNum = row.number;

            const maSinhVien = row.getCell(2)?.value?.toString().trim() || '';
            const maLopHocPhan = row.getCell(7)?.value?.toString().trim() || '';

            if (!maSinhVien || !maLopHocPhan) {
                overallResults.failed++;
                overallResults.errors.push({
                    row: rowNum,
                    maSinhVien: maSinhVien || 'N/A',
                    maLopHocPhan: maLopHocPhan || 'N/A',
                    error: !maSinhVien ? 'Thiếu mã sinh viên' : 'Thiếu mã lớp học phần',
                });
                continue;
            }

            if (!groups[maLopHocPhan]) {
                groups[maLopHocPhan] = [];
            }
            groups[maLopHocPhan].push({ rowNum, maSinhVien });
        }

        // Xử lý từng lớp học phần
        for (const [maLopHocPhan, students] of Object.entries(groups)) {
            let lopHocPhan: LopHocPhan | null;

            try {
                lopHocPhan = await this.lopHocPhanRepo.findOne({
                    where: { maLopHocPhan },
                });

                if (!lopHocPhan) {
                    throw new BadRequestException(`Không tìm thấy lớp học phần với mã ${maLopHocPhan}`);
                }
            } catch (err) {
                // Lớp không tồn tại → toàn bộ sinh viên của lớp này fail
                overallResults.failed += students.length;
                students.forEach(s => {
                    overallResults.errors.push({
                        row: s.rowNum,
                        maSinhVien: s.maSinhVien,
                        maLopHocPhan,
                        error: `Không tìm thấy lớp học phần ${maLopHocPhan}`,
                    });
                });
                continue;
            }

            const classResult = {
                success: 0,
                failed: 0,
                errors: [] as { row: number; maSinhVien: string; error: string }[],
            };

            for (const { rowNum, maSinhVien } of students) {
                try {
                    const sinhVien = await this.sinhVienRepo.findOne({
                        where: { maSinhVien },
                    });

                    if (!sinhVien) {
                        throw new BadRequestException(`Mã sinh viên ${maSinhVien} không tồn tại`);
                    }

                    // Gọi hàm đăng ký hiện có (đã có validate đầy đủ)
                    await this.dangKySinhVien(lopHocPhan.id, sinhVien.id);

                    classResult.success++;
                    overallResults.success++;
                } catch (error) {
                    classResult.failed++;
                    overallResults.failed++;
                    const errMsg = error instanceof BadRequestException ? error.message : 'Lỗi không xác định';
                    classResult.errors.push({ row: rowNum, maSinhVien, error: errMsg });
                    overallResults.errors.push({ row: rowNum, maSinhVien, maLopHocPhan, error: errMsg });
                }
            }

            overallResults.byClass[maLopHocPhan] = classResult;
        }

        // Xóa file tạm
        await fs.unlink(filePath).catch(() => { });

        return {
            message: `Đã xử lý ${overallResults.totalRows} dòng từ file Excel`,
            summary: {
                success: overallResults.success,
                failed: overallResults.failed,
                total: overallResults.totalRows,
            },
            detailByClass: overallResults.byClass,
            errors: overallResults.errors.length > 0 ? overallResults.errors : undefined,
        };
    }

    async lenKeHoachTaoLhp(maNamHoc: string, hocKy: number): Promise<Buffer> {
        // 1. Tìm năm học by maNamHoc
        const namHoc = await this.namHocRepo.findOne({ where: { maNamHoc } });
        if (!namHoc) {
            throw new NotFoundException(`Năm học với mã ${maNamHoc} không tồn tại`);
        }
        const namBatDauHoc = namHoc.namBatDau;

        // 2. Lấy 4 niên khóa gần nhất
        const nienKhoas = await this.nienKhoaRepo.find({
            where: { namBatDau: In([namBatDauHoc - 3, namBatDauHoc - 2, namBatDauHoc - 1, namBatDauHoc]) },
            order: { namBatDau: 'DESC' },
        });
        if (nienKhoas.length === 0) {
            throw new BadRequestException('Không tìm thấy niên khóa nào phù hợp');
        }

        const planRows: Array<{
            stt: number;
            maLopHocPhan: string;
            ghiChu: string;
            maNganh: string;
            maNienKhoa: string;
            maMonHoc: string;
            maNamHoc: string;
            hocKy: number;
            soTinChi: number; // ✅ THÊM CỘT TÍN CHỈ
            maGiangVien: string;
            soSinhVienThamGia: number;
        }> = [];
        let stt = 1;

        // ✅ SỬA LỖI:  Map theo dõi tổng tín chỉ đã phân công cho mỗi GV theo từng học kỳ
        // Key: `${giangVienId}_${hocKyId}`, Value: tổng tín chỉ đã phân công
        const giangVienTinChiMap = new Map<string, number>();

        // ✅ Hàm helper để lấy tín chỉ hiện tại của GV (từ DB + từ planRows đang xử lý)
        const getTinChiHienTaiCuaGV = async (gvId: number, hocKyId: number): Promise<number> => {
            const key = `${gvId}_${hocKyId}`;

            // Nếu chưa có trong map, query từ DB và cache lại
            if (!giangVienTinChiMap.has(key)) {
                const tinChiTuDB = await this.tinhTinChiHienTaiCuaGV(gvId, hocKyId);
                giangVienTinChiMap.set(key, tinChiTuDB);
            }

            return giangVienTinChiMap.get(key)!;
        };

        // ✅ Hàm helper để cập nhật tín chỉ sau khi phân công
        const capNhatTinChiGV = (gvId: number, hocKyId: number, soTinChiThem: number): void => {
            const key = `${gvId}_${hocKyId}`;
            const current = giangVienTinChiMap.get(key) || 0;
            giangVienTinChiMap.set(key, current + soTinChiThem);
        };

        for (const nk of nienKhoas) {
            const namBatDauNK = nk.namBatDau;

            // Tính tổng học kỳ đã qua
            let tongHocKyDaQua = 0;
            for (let year = namBatDauNK; year < namBatDauHoc; year++) {
                const nh = await this.namHocRepo.findOne({ where: { namBatDau: year } });
                if (nh) {
                    const soHK = await this.hocKyRepo.count({ where: { namHoc: { id: nh.id } } });
                    tongHocKyDaQua += soHK;
                }
            }

            const thuTuHocKyCanXet = tongHocKyDaQua + hocKy;

            // Lấy ngành thuộc niên khóa
            const lops = await this.lopRepo.find({ where: { nienKhoa: { id: nk.id } }, relations: ['nganh'] });

            // ✅ Lấy unique ngành theo ID
            const nganhMap = new Map<number, typeof lops[0]['nganh']>();
            for (const lop of lops) {
                if (lop.nganh && !nganhMap.has(lop.nganh.id)) {
                    nganhMap.set(lop.nganh.id, lop.nganh);
                }
            }
            const nganhs = Array.from(nganhMap.values());

            for (const nganh of nganhs) {
                // Lấy CTDT áp dụng
                const apDung = await this.apDungRepo.findOne({
                    where: { nganh: { id: nganh.id }, nienKhoa: { id: nk.id } },
                    relations: ['chuongTrinh'],
                });
                if (!apDung) continue;

                // Lấy chi tiết môn
                const chiTiets = await this.chiTietCTDTRepo.find({
                    where: { chuongTrinh: { id: apDung.chuongTrinh.id }, thuTuHocKy: thuTuHocKyCanXet },
                    relations: ['monHoc'],
                });
                if (chiTiets.length === 0) continue;

                // Tìm học kỳ thực tế
                const hocKyThucTe = await this.timHocKyTuThuTu(namBatDauNK, thuTuHocKyCanXet, this.lopHocPhanRepo.manager);
                if (!hocKyThucTe) continue;

                // Load relation namHoc nếu chưa có
                if (!hocKyThucTe.namHoc) {
                    const hocKyWithNamHoc = await this.hocKyRepo.findOne({
                        where: { id: hocKyThucTe.id },
                        relations: ['namHoc']
                    });
                    if (!hocKyWithNamHoc || !hocKyWithNamHoc.namHoc) continue;
                    hocKyThucTe.namHoc = hocKyWithNamHoc.namHoc;
                }

                for (const ct of chiTiets) {
                    const monHoc = ct.monHoc;

                    // Query sinh viên CHƯA từng tham gia LHP của môn này
                    const svChuaHoc = await this.sinhVienRepo.createQueryBuilder('sv')
                        .leftJoin('sv.lop', 'lop')
                        .leftJoin('lop.nganh', 'nganh')
                        .leftJoin('lop.nienKhoa', 'nienKhoa')
                        .where('nganh.id = :nganhId', { nganhId: nganh.id })
                        .andWhere('nienKhoa.id = :nienKhoaId', { nienKhoaId: nk.id })
                        .andWhere('sv.tinhTrang = :dangHoc', { dangHoc: TinhTrangHocTapEnum.DANG_HOC })
                        .andWhere(qb => {
                            const subQuery = qb.subQuery()
                                .select('svlhp.sinh_vien_id')
                                .from('sinh_vien_lop_hoc_phan', 'svlhp')
                                .leftJoin('lop_hoc_phan', 'lhp', 'lhp.id = svlhp.lop_hoc_phan_id')
                                .where('lhp.mon_hoc_id = :monHocId')
                                .getQuery();
                            return 'sv.id NOT IN ' + subQuery;
                        })
                        .setParameter('monHocId', monHoc.id)
                        .getMany();

                    const soSVChuaHoc = svChuaHoc.length;

                    // Bỏ qua nếu không đủ mở ít nhất 1 lớp
                    if (soSVChuaHoc < 25) {
                        continue;
                    }

                    const giangViens = await this.layGiangVienPhanCongChoMon(
                        monHoc.id,
                        this.lopHocPhanRepo.manager
                    );

                    // ────────────────────────────────────────────────
                    // Logic phân bổ mới
                    // ────────────────────────────────────────────────

                    let soLop: number;
                    let danhSachSiSo: number[] = [];

                    // Trường hợp 1: Chỉ đủ mở 1 lớp (25–49 SV)
                    if (soSVChuaHoc < 50) {
                        soLop = 1;
                        danhSachSiSo = [soSVChuaHoc];
                    }
                    // Trường hợp 2: Có thể mở từ 2 lớp trở lên
                    else {
                        // Cách 1 - chia đều (khuyến nghị - đơn giản & công bằng)
                        soLop = Math.ceil(soSVChuaHoc / 50);

                        // hoặc Cách 2 - ưu tiên mở ít lớp hơn một chút nếu chia đẹp
                        // soLop = Math.max(2, Math.floor(soSVChuaHoc / 55)); // thử nghiệm nếu muốn

                        const base = Math.floor(soSVChuaHoc / soLop);
                        const du = soSVChuaHoc % soLop;

                        danhSachSiSo = new Array(soLop).fill(base);

                        // Phân bổ phần dư cho các lớp đầu tiên
                        for (let i = 0; i < du; i++) {
                            danhSachSiSo[i]++;
                        }

                        // Kiểm tra an toàn: có lớp nào < 25 không?
                        // (thường không xảy ra nếu dùng Math.ceil / 50)
                        if (danhSachSiSo.some(siso => siso < 25)) {
                            // Trường hợp hiếm: điều chỉnh về 1 lớp ít hơn (nếu cần)
                            // Nhưng với công thức trên hầu như không cần
                            console.warn(`Cảnh báo: Có lớp < 25 sau khi chia - SV=${soSVChuaHoc}, soLop=${soLop}`);
                        }
                    }

                    // Bây giờ tạo từng lớp học phần
                    for (let sttLop = 1; sttLop <= soLop; sttLop++) {
                        const soSVTrongLop = danhSachSiSo[sttLop - 1];

                        // Tạo mã lớp học phần
                        const maLopHocPhan = `${monHoc.maMonHoc}_${nk.maNienKhoa}_${nganh.maNganh}_${sttLop}`;

                        // ─── phần tìm giảng viên giữ nguyên ───
                        let maGiangVien = '';
                        if (giangViens.length > 0) {
                            for (const gv of giangViens) {
                                const tinChiHienTai = await getTinChiHienTaiCuaGV(gv.id, hocKyThucTe.id);
                                if (tinChiHienTai + monHoc.soTinChi <= 12) {
                                    maGiangVien = gv.maGiangVien;
                                    capNhatTinChiGV(gv.id, hocKyThucTe.id, monHoc.soTinChi);
                                    break;
                                }
                            }
                        }

                        const ghiChu = `Đề xuất tạo lớp ${maLopHocPhan} - ${soSVTrongLop} SV - niên khoá ${nk.maNienKhoa} - ngành ${nganh.maNganh}`;

                        planRows.push({
                            stt: stt++,
                            maLopHocPhan,
                            ghiChu: ghiChu || '',
                            maNganh: nganh.maNganh,
                            maNienKhoa: nk.maNienKhoa,
                            maMonHoc: monHoc.maMonHoc,
                            maNamHoc: hocKyThucTe.namHoc.maNamHoc,
                            hocKy: hocKyThucTe.hocKy,
                            soTinChi: monHoc.soTinChi,
                            maGiangVien,
                            soSinhVienThamGia: soSVTrongLop,
                        });
                    }
                }
            }
        }

        // Tạo file Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Kế Hoạch Tạo LHP');

        // ✅ CẬP NHẬT HEADER với cột Tín chỉ
        const headerRow = worksheet.addRow([
            'STT',
            'Mã Lớp Học Phần',
            'Ghi chú',
            'Mã Ngành',
            'Mã Niên Khóa',
            'Mã Môn Học',
            'Mã Năm học',
            'Học kỳ',
            'Số tín chỉ', // ✅ THÊM CỘT MỚI
            'Mã Giảng viên',
            'Số sinh viên sẽ tham gia'
        ]);

        headerRow.height = 25;
        headerRow.font = {
            name: 'Arial',
            size: 11,
            bold: true,
            color: { argb: 'FFFFFFFF' }
        };
        headerRow.alignment = {
            vertical: 'middle',
            horizontal: 'center',
            wrapText: true
        };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };

        headerRow.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } }
            };
        });

        planRows.forEach((row, index) => {
            const dataRow = worksheet.addRow(Object.values(row));
            dataRow.height = 20;

            dataRow.font = { name: 'Arial', size: 10 };
            dataRow.alignment = { vertical: 'middle', horizontal: 'center' };

            if (index % 2 === 0) {
                dataRow.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFE7E6E6' }
                };
            }

            dataRow.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                    left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                    bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                    right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
                };
            });
        });

        // ✅ CẬP NHẬT COLUMNS với cột Tín chỉ
        worksheet.columns = [
            { key: 'stt', width: 8 },
            { key: 'maLopHocPhan', width: 40 },
            { key: 'ghiChu', width: 55 },
            { key: 'maNganh', width: 23 },
            { key: 'maNienKhoa', width: 23 },
            { key: 'maMonHoc', width: 23 },
            { key: 'maNamHoc', width: 20 },
            { key: 'hocKy', width: 12 },
            { key: 'soTinChi', width: 12 }, // ✅ CỘT MỚI
            { key: 'maGiangVien', width: 22 },
            { key: 'soSinhVienThamGia', width: 35 },
        ];

        worksheet.views = [
            { state: 'frozen', ySplit: 1 }
        ];

        return Buffer.from(await workbook.xlsx.writeBuffer()) as Buffer;
    }
    // Helper tính tinChi hiện tại của GV trong học kỳ
    private async tinhTinChiHienTaiCuaGV(gvId: number, hocKyId: number) {
        const tong = await this.lopHocPhanRepo.createQueryBuilder('lhp')
            .innerJoin('lhp.monHoc', 'mh')
            .where('lhp.giang_vien_id = :gvId', { gvId })
            .andWhere('lhp.hoc_ky_id = :hocKyId', { hocKyId })
            .select('SUM(mh.so_tin_chi)', 'total')
            .getRawOne();

        return Number(tong?.total || 0);
    }

    async importLopHocPhanTuExcel(filePath: string): Promise<{
        message: string;
        summary: { success: number; failed: number; total: number };
        details: { row: number; maLopHocPhan: string; status: 'success' | 'failed'; message: string; soSinhVienDaDangKy?: number }[];
        errors?: { row: number; maLopHocPhan: string; error: string }[];
    }> {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) throw new BadRequestException('File không có sheet dữ liệu');

        const rows = worksheet.getRows(2, worksheet.rowCount - 1) || [];
        if (rows.length === 0) throw new BadRequestException('File Excel không có dữ liệu từ dòng 2 trở đi');

        const results = {
            success: 0,
            failed: 0,
            total: 0,
            details: [] as { row: number; maLopHocPhan: string; status: 'success' | 'failed'; message: string; soSinhVienDaDangKy?: number }[],
            errors: [] as { row: number; maLopHocPhan: string; error: string }[],
        };

        // Map theo dõi tín chỉ GV trong quá trình import (để tính cộng dồn)
        const giangVienTinChiMap = new Map<string, number>();

        const getTinChiHienTaiCuaGV = async (gvId: number, hocKyId: number): Promise<number> => {
            const key = `${gvId}_${hocKyId}`;
            if (!giangVienTinChiMap.has(key)) {
                const tinChiTuDB = await this.tinhTinChiHienTaiCuaGV(gvId, hocKyId);
                giangVienTinChiMap.set(key, tinChiTuDB);
            }
            return giangVienTinChiMap.get(key)!;
        };

        const capNhatTinChiGV = (gvId: number, hocKyId: number, soTinChiThem: number): void => {
            const key = `${gvId}_${hocKyId}`;
            const current = giangVienTinChiMap.get(key) || 0;
            giangVienTinChiMap.set(key, current + soTinChiThem);
        };

        // Map theo dõi số lớp đã tạo cho mỗi môn + ngành + niên khóa + học kỳ
        const soLopDaTaoMap = new Map<string, number>();
        // Map theo dõi tổng số SV tham gia của từng nhóm ngành + khóa + môn trong excel
        const excelSinhVienCountMap = new Map<string, number>();

        // ----- TỔNG HỢP SỐ SV THEO NGÀNH-NK-MÔN TRONG FILE EXCEL
        for (const row of rows) {
            if (!row || row.actualCellCount === 0) continue;

            const maNganh = row.getCell(4)?.value?.toString().trim() || '';
            const maNienKhoa = row.getCell(5)?.value?.toString().trim() || '';
            const maMonHoc = row.getCell(6)?.value?.toString().trim() || '';
            const svExcel = Number(row.getCell(11)?.value || 0);

            if (maNganh && maNienKhoa && maMonHoc && svExcel > 0) {
                const key = `${maNganh}__${maNienKhoa}__${maMonHoc}`;
                excelSinhVienCountMap.set(key, (excelSinhVienCountMap.get(key) || 0) + svExcel);
            }
        }

        // ----- VALIDATE VỀ SAU: ĐẾN LƯỢT XỬ LÝ DÒNG NÀO SẼ CHECK GROUP --------
        // Map lưu ý khi đã validate group nào rồi sẽ khỏi báo lại (tránh lặp)
        const checkedMap = new Map<string, boolean>();

        for (const row of rows) {
            if (!row || row.actualCellCount === 0) continue;

            const rowNum = row.number;
            results.total++;

            // Đọc dữ liệu từ file
            const maLopHocPhan = row.getCell(2)?.value?.toString().trim() || '';
            const ghiChu = row.getCell(3)?.value?.toString().trim() || '';
            const maNganh = row.getCell(4)?.value?.toString().trim() || '';
            const maNienKhoa = row.getCell(5)?.value?.toString().trim() || '';
            const maMonHoc = row.getCell(6)?.value?.toString().trim() || '';
            const maNamHoc = row.getCell(7)?.value?.toString().trim() || '';
            const hocKyValue = Number(row.getCell(8)?.value) || 0;
            // c9: số tín chỉ (bỏ qua)
            const maGiangVien = row.getCell(10)?.value?.toString().trim() || '';
            const soSinhVienSeThamGia = Number(row.getCell(11)?.value) || 0;

            // Validate dữ liệu cơ bản
            if (!maLopHocPhan || !maNganh || !maNienKhoa || !maMonHoc || !maNamHoc || !hocKyValue) {
                results.failed++;
                results.errors.push({
                    row: rowNum,
                    maLopHocPhan: maLopHocPhan || 'N/A',
                    error: 'Thiếu thông tin bắt buộc (mã lớp, mã ngành, mã niên khóa, mã môn học, mã năm học, hoặc học kỳ)',
                });
                results.details.push({
                    row: rowNum,
                    maLopHocPhan: maLopHocPhan || 'N/A',
                    status: 'failed',
                    message: 'Thiếu thông tin bắt buộc',
                });
                continue;
            }

            const groupKey = `${maNganh}__${maNienKhoa}__${maMonHoc}`;

            try {
                // ----- VALIDATE SỐ SV GROUP -----
                if (!checkedMap.has(groupKey)) {
                    // Tính tổng số SV đang DANG_HOC của ngành, niên khóa, môn này
                    const nganh = await this.nganhRepo.findOneBy({ maNganh });
                    const nienKhoa = await this.nienKhoaRepo.findOneBy({ maNienKhoa });
                    const monHoc = await this.monHocRepo.findOneBy({ maMonHoc });
                    if (!nganh || !nienKhoa || !monHoc) throw new BadRequestException('Mã ngành, niên khóa hoặc môn học không tồn tại để kiểm tra tổng SV');
                    const tongSVHeThong = await this.sinhVienRepo.count({
                        where: {
                            lop: {
                                nganh: { id: nganh.id },
                                nienKhoa: { id: nienKhoa.id },
                            },
                            tinhTrang: TinhTrangHocTapEnum.DANG_HOC,
                        },
                    });
                    const tongSVExcel = excelSinhVienCountMap.get(groupKey) || 0;
                    if (tongSVHeThong !== tongSVExcel) {
                        throw new BadRequestException(
                            `Tổng số sinh viên ngành "${maNganh}", niên khóa "${maNienKhoa}", môn "${maMonHoc}" trong hệ thống là ${tongSVHeThong} nhưng trong file Excel là ${tongSVExcel}`
                        );
                    }
                    checkedMap.set(groupKey, true);
                }
                // 1. Kiểm tra mã lớp học phần trùng
                const existMa = await this.lopHocPhanRepo.findOneBy({ maLopHocPhan });
                if (existMa) {
                    throw new BadRequestException(`Mã lớp học phần "${maLopHocPhan}" đã tồn tại trong hệ thống`);
                }

                // 2. Lấy thông tin môn học
                const monHoc = await this.monHocRepo.findOneBy({ maMonHoc });
                if (!monHoc) {
                    throw new BadRequestException(`Môn học với mã "${maMonHoc}" không tồn tại`);
                }

                // 3. Lấy thông tin ngành
                const nganh = await this.nganhRepo.findOneBy({ maNganh });
                if (!nganh) {
                    throw new BadRequestException(`Ngành với mã "${maNganh}" không tồn tại`);
                }

                // 4. Lấy thông tin niên khóa
                const nienKhoa = await this.nienKhoaRepo.findOneBy({ maNienKhoa });
                if (!nienKhoa) {
                    throw new BadRequestException(`Niên khóa với mã "${maNienKhoa}" không tồn tại`);
                }

                // 5. Lấy thông tin năm học và học kỳ
                const namHoc = await this.namHocRepo.findOneBy({ maNamHoc });
                if (!namHoc) {
                    throw new BadRequestException(`Năm học với mã "${maNamHoc}" không tồn tại`);
                }

                const hocKyEntity = await this.hocKyRepo.findOne({
                    where: { namHoc: { id: namHoc.id }, hocKy: hocKyValue },
                    relations: ['namHoc'],
                });
                if (!hocKyEntity) {
                    throw new BadRequestException(`Học kỳ ${hocKyValue} của năm học "${maNamHoc}" không tồn tại`);
                }

                // 6. Kiểm tra giảng viên (nếu có)
                let giangVien: any = null;
                if (maGiangVien) {
                    giangVien = await this.giangVienRepo.findOneBy({ maGiangVien });
                    if (!giangVien) {
                        throw new BadRequestException(`Giảng viên với mã "${maGiangVien}" không tồn tại`);
                    }

                    // Kiểm tra giảng viên có được phân công dạy môn này không
                    const phanCong = await this.giangVienMonHocRepo.findOne({
                        where: {
                            giangVien: { id: giangVien.id },
                            monHoc: { id: monHoc.id },
                        },
                    });
                    if (!phanCong) {
                        throw new BadRequestException(
                            `Giảng viên "${maGiangVien}" chưa được phân công dạy môn "${maMonHoc}"`
                        );
                    }
                }

                // 7. Lấy CTDT áp dụng và kiểm tra môn học
                const apDung = await this.apDungRepo.findOne({
                    where: {
                        nganh: { id: nganh.id },
                        nienKhoa: { id: nienKhoa.id },
                    },
                    relations: ['chuongTrinh', 'chuongTrinh.chiTietMonHocs', 'chuongTrinh.chiTietMonHocs.monHoc'],
                });

                if (!apDung) {
                    throw new BadRequestException(
                        `Không có chương trình đào tạo nào được áp dụng cho ngành "${maNganh}" và niên khóa "${maNienKhoa}"`
                    );
                }

                // 8. Tính thứ tự học kỳ và kiểm tra môn học có trong CTDT không
                const namBatDauNK = nienKhoa.namBatDau;
                const namBatDauNamHoc = namHoc.namBatDau;
                // Tính tổng học kỳ đã qua từ năm bắt đầu niên khóa đến năm học hiện tại
                let tongHocKyDaQua = 0;
                for (let year = namBatDauNK; year < namBatDauNamHoc; year++) {
                    const nh = await this.namHocRepo.findOne({ where: { namBatDau: year } });
                    if (nh) {
                        const soHK = await this.hocKyRepo.count({ where: { namHoc: { id: nh.id } } });
                        tongHocKyDaQua += soHK;
                    }
                }

                const thuTuHocKyCanXet = tongHocKyDaQua + hocKyValue;

                const chiTietMon = apDung.chuongTrinh.chiTietMonHocs.find(
                    ct => ct.monHoc.id === monHoc.id && ct.thuTuHocKy === thuTuHocKyCanXet
                );

                if (!chiTietMon) {
                    throw new BadRequestException(
                        `Môn học "${maMonHoc}" không nằm ở học kỳ thứ ${thuTuHocKyCanXet} trong chương trình đào tạo của ngành "${maNganh}" niên khóa "${maNienKhoa}"`
                    );
                }

                // 9. Kiểm tra số lượng lớp học phần tối đa theo số sinh viên
                const MAX_SV_MOT_LOP = 50;

                const tongSinhVien = await this.sinhVienRepo.count({
                    where: {
                        lop: {
                            nganh: { id: nganh.id },
                            nienKhoa: { id: nienKhoa.id },
                        },
                        tinhTrang: TinhTrangHocTapEnum.DANG_HOC,
                    },
                });

                if (tongSinhVien === 0) {
                    throw new BadRequestException(
                        `Ngành "${maNganh}" niên khóa "${maNienKhoa}" hiện chưa có sinh viên nào`
                    );
                }

                const soLopToiDa = Math.ceil(tongSinhVien / MAX_SV_MOT_LOP);

                // Lấy số lớp đã mở từ DB
                const keyLop = `${monHoc.id}_${nganh.id}_${nienKhoa.id}_${hocKyEntity.id}`;
                let soLopDaMo = soLopDaTaoMap.get(keyLop);
                if (soLopDaMo === undefined) {
                    soLopDaMo = await this.lopHocPhanRepo.count({
                        where: {
                            monHoc: { id: monHoc.id },
                            nganh: { id: nganh.id },
                            nienKhoa: { id: nienKhoa.id },
                            hocKy: { id: hocKyEntity.id },
                        },
                    });
                    soLopDaTaoMap.set(keyLop, soLopDaMo);
                }

                if (soLopDaMo >= soLopToiDa) {
                    throw new BadRequestException(
                        `Đã đạt giới hạn ${soLopToiDa} lớp cho môn "${maMonHoc}" (${tongSinhVien} SV, tối đa ${MAX_SV_MOT_LOP} SV/lớp). Hiện đã có ${soLopDaMo} lớp.`
                    );
                }

                // 10. Kiểm tra giới hạn 12 tín chỉ của giảng viên
                if (giangVien) {
                    const tinChiHienTai = await getTinChiHienTaiCuaGV(giangVien.id, hocKyEntity.id);
                    if (tinChiHienTai + monHoc.soTinChi > 12) {
                        throw new BadRequestException(
                            `Giảng viên "${maGiangVien}" đã dạy ${tinChiHienTai} tín chỉ trong học kỳ này. Thêm môn "${maMonHoc}" (${monHoc.soTinChi} TC) sẽ vượt quá 12 tín chỉ.`
                        );
                    }
                }

                // 11. Tạo lớp học phần
                const newLhp = this.lopHocPhanRepo.create({
                    maLopHocPhan,
                    ghiChu: ghiChu || '',
                    giangVien: giangVien ? { id: giangVien.id } : null,
                    monHoc: { id: monHoc.id },
                    hocKy: { id: hocKyEntity.id },
                    nienKhoa: { id: nienKhoa.id },
                    nganh: { id: nganh.id },
                });

                const savedLhp = await this.lopHocPhanRepo.save(newLhp);

                // Cập nhật Map số lớp đã tạo
                soLopDaTaoMap.set(keyLop, (soLopDaTaoMap.get(keyLop) || 0) + 1);

                // Cập nhật tín chỉ GV
                if (giangVien) {
                    capNhatTinChiGV(giangVien.id, hocKyEntity.id, monHoc.soTinChi);
                }

                // 12. Lấy đúng số sinh viên sẽ tham gia lớp để thêm (theo cột 11 trong excel)
                const svChuaHoc = await this.sinhVienRepo.createQueryBuilder('sv')
                    .leftJoin('sv.lop', 'lop')
                    .leftJoin('lop.nganh', 'nganhSV')
                    .leftJoin('lop.nienKhoa', 'nienKhoaSV')
                    .where('nganhSV.id = :nganhId', { nganhId: nganh.id })
                    .andWhere('nienKhoaSV.id = :nienKhoaId', { nienKhoaId: nienKhoa.id })
                    .andWhere('sv.tinhTrang = :dangHoc', { dangHoc: TinhTrangHocTapEnum.DANG_HOC })
                    .andWhere(qb => {
                        const subQuery = qb.subQuery()
                            .select('svlhp.sinh_vien_id')
                            .from('sinh_vien_lop_hoc_phan', 'svlhp')
                            .leftJoin('lop_hoc_phan', 'lhp', 'lhp.id = svlhp.lop_hoc_phan_id')
                            .where('lhp.mon_hoc_id = :monHocId')
                            .getQuery();
                        return 'sv.id NOT IN ' + subQuery;
                    })
                    .setParameter('monHocId', monHoc.id)
                    .orderBy('sv.maSinhVien', 'ASC')
                    .take(soSinhVienSeThamGia > 0 ? soSinhVienSeThamGia : 50)
                    .getMany();

                let soSinhVienDaDangKy = 0;

                for (const sv of svChuaHoc) {
                    try {
                        const registration = this.svLhpRepo.create({
                            lopHocPhan: { id: savedLhp.id },
                            sinhVien: { id: sv.id },
                            ngayDangKy: new Date(),
                            loaiThamGia: LoaiHinhThamGiaLopHocPhanEnum.CHINH_QUY,
                        });
                        await this.svLhpRepo.save(registration);
                        soSinhVienDaDangKy++;
                    } catch (err) {
                        // Bỏ qua lỗi khi thêm sinh viên (có thể đã tồn tại)
                        continue;
                    }
                }

                results.success++;
                results.details.push({
                    row: rowNum,
                    maLopHocPhan,
                    status: 'success',
                    message: `Tạo lớp học phần thành công. Đã thêm ${soSinhVienDaDangKy} sinh viên.`,
                    soSinhVienDaDangKy,
                });

            } catch (error) {
                results.failed++;
                const errMsg = error instanceof BadRequestException || error instanceof NotFoundException
                    ? error.message
                    : 'Lỗi không xác định';

                results.errors.push({
                    row: rowNum,
                    maLopHocPhan,
                    error: errMsg,
                });
                results.details.push({
                    row: rowNum,
                    maLopHocPhan,
                    status: 'failed',
                    message: errMsg,
                });
            }
        }

        // Xóa file tạm
        await fs.unlink(filePath).catch(() => { });

        return {
            message: `Đã xử lý ${results.total} dòng từ file Excel`,
            summary: {
                success: results.success,
                failed: results.failed,
                total: results.total,
            },
            details: results.details,
            errors: results.errors.length > 0 ? results.errors : undefined,
        };
    }
}