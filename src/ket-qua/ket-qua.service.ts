import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KetQuaHocTap } from './entity/ket-qua-hoc-tap.entity';
import { LopHocPhan } from 'src/giang-day/entity/lop-hoc-phan.entity';
import { SinhVienLopHocPhan } from 'src/giang-day/entity/sinhvien-lophocphan.entity';
import { NhapDiemDto } from './dtos/nhap-diem.dto';
import { GetKetQuaLopQueryDto } from './dtos/get-ket-qua-lop-query.dto';
import { NguoiDung } from 'src/auth/entity/nguoi-dung.entity';
import { VaiTroNguoiDungEnum } from 'src/auth/enums/vai-tro-nguoi-dung.enum';
import { SinhVien } from 'src/sinh-vien/entity/sinh-vien.entity';

@Injectable()
export class KetQuaService {
  constructor(
    @InjectRepository(KetQuaHocTap)
    private ketQuaRepo: Repository<KetQuaHocTap>,
    @InjectRepository(LopHocPhan)
    private lopHocPhanRepo: Repository<LopHocPhan>,
    @InjectRepository(SinhVienLopHocPhan)
    private svLhpRepo: Repository<SinhVienLopHocPhan>,
    @InjectRepository(NguoiDung)
    private nguoiDungRepo: Repository<NguoiDung>,
  ) { }

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

  // Nhập điểm (POST)
  async nhapDiem(userId: number, dto: NhapDiemDto) {
    // 1. Load lớp học phần + giảng viên phụ trách
    const lhp = await this.lopHocPhanRepo.findOne({
      where: { id: dto.lopHocPhanId },
      relations: ['giangVien'],
    });
    if (!lhp) throw new NotFoundException('Lớp học phần không tồn tại');

    // 2. Kiểm tra lớp đã khóa điểm chưa
    if (lhp.khoaDiem) {
      throw new ForbiddenException('Lớp học phần đã khóa điểm, không thể nhập/sửa điểm');
    }

    // 3. Kiểm tra sinh viên có đăng ký lớp này không
    const dangKy = await this.svLhpRepo.findOneBy({
      lopHocPhan: { id: dto.lopHocPhanId },
      sinhVien: { id: dto.sinhVienId },
    });
    if (!dangKy) {
      throw new BadRequestException('Sinh viên không đăng ký lớp học phần này');
    }

    // 4. Kiểm tra quyền của người nhập điểm
    const nguoiDung = await this.nguoiDungRepo.findOne({
      where: { id: userId },
      relations: ['giangVien'],
    });

    if (!nguoiDung) {
      throw new ForbiddenException('Không tìm thấy thông tin tài khoản');
    }

    if (!nguoiDung.giangVien) {
      throw new ForbiddenException('Tài khoản giảng viên chưa liên kết với hồ sơ giảng viên');
    }

    if (
      (!lhp.giangVien || lhp.giangVien.id !== nguoiDung.giangVien.id) &&
      nguoiDung.vaiTro !== VaiTroNguoiDungEnum.CAN_BO_PHONG_DAO_TAO
    ) {
      throw new ForbiddenException('Bạn không được phép nhập điểm cho lớp học phần này');
    }

    // 5. Kiểm tra đã tồn tại kết quả chưa → Không cho phép nhập lại
    const ketQuaTonTai = await this.ketQuaRepo.findOneBy({
      lopHocPhan: { id: dto.lopHocPhanId },
      sinhVien: { id: dto.sinhVienId },
    });

    if (ketQuaTonTai) {
      throw new BadRequestException('Sinh viên đã có kết quả ở lớp học phần này');
    }

    // 6. Validate điểm hợp lệ (tùy chọn)
    this.validateDiem(dto);

    // 7. Tạo mới kết quả
    const ketQua = this.ketQuaRepo.create({
      lopHocPhan: lhp,
      sinhVien: { id: dto.sinhVienId } as SinhVien,
      diemQuaTrinh: dto.diemQuaTrinh,
      diemThanhPhan: dto.diemThanhPhan,
      diemThi: dto.diemThi,
    });

    const saved = await this.ketQuaRepo.save(ketQua);

    const tbchp = this.tinhTBCHP(saved);

    return {
      id: saved.id,
      diemQuaTrinh: saved.diemQuaTrinh,
      diemThanhPhan: saved.diemThanhPhan,
      diemThi: saved.diemThi,
      TBCHP: tbchp,
      DiemSo: this.tinhDiemSo(tbchp),
      DiemChu: tbchp !== null ? this.tinhDiemChu(tbchp) : null,
    };
  }

  // Hàm validate điểm (có thể tách ra riêng)
  private validateDiem(dto: NhapDiemDto) {
    const errors: string[] = [];

    if (dto.diemQuaTrinh !== null && (dto.diemQuaTrinh < 0 || dto.diemQuaTrinh > 10)) {
      errors.push('Điểm quá trình phải từ 0 đến 10');
    }
    if (dto.diemThanhPhan !== null && (dto.diemThanhPhan < 0 || dto.diemThanhPhan > 10)) {
      errors.push('Điểm thành phần phải từ 0 đến 10');
    }
    if (dto.diemThi !== null && (dto.diemThi < 0 || dto.diemThi > 10)) {
      errors.push('Điểm thi phải từ 0 đến 10');
    }

    if (errors.length > 0) {
      throw new BadRequestException(errors.join('; '));
    }
  }

  // Sửa điểm (PUT)
  async suaDiem(id: number, dto: NhapDiemDto) {
    const ketQua = await this.ketQuaRepo.findOne({
      where: { id },
      relations: ['lopHocPhan'],
    });
    if (!ketQua) throw new NotFoundException('Kết quả học tập không tồn tại');

    if (ketQua.lopHocPhan.khoaDiem) {
      throw new ForbiddenException('Lớp học phần đã khóa điểm, không thể sửa');
    }

    ketQua.diemQuaTrinh = dto.diemQuaTrinh;
    ketQua.diemThanhPhan = dto.diemThanhPhan;
    ketQua.diemThi = dto.diemThi;

    const saved = await this.ketQuaRepo.save(ketQua);

    const tbchp = this.tinhTBCHP(saved);
    return {
      id: saved.id,
      diemQuaTrinh: saved.diemQuaTrinh,
      diemThanhPhan: saved.diemThanhPhan,
      diemThi: saved.diemThi,
      TBCHP: tbchp,
      DiemSo: this.tinhDiemSo(tbchp),
      DiemChu: tbchp !== null ? this.tinhDiemChu(tbchp) : null,
    };
  }

  // DS điểm của lớp học phần
  async getDanhSachDiemLop(lopHocPhanId: number, query: GetKetQuaLopQueryDto) {
    const { page = 1, limit = 10, search } = query;

    const lhp = await this.lopHocPhanRepo.findOne({
      where: { id: lopHocPhanId },
      relations: ['monHoc', 'giangVien', 'hocKy', 'hocKy.namHoc', 'nienKhoa', 'nganh', 'nganh.khoa'],
    });
    if (!lhp) throw new NotFoundException('Lớp học phần không tồn tại');

    const qb = this.ketQuaRepo
      .createQueryBuilder('kq')
      .leftJoinAndSelect('kq.sinhVien', 'sv')
      .leftJoinAndSelect('sv.lop', 'lop')
      .leftJoinAndSelect('lop.nganh', 'nganh')
      .leftJoinAndSelect('lop.nienKhoa', 'nienKhoa')
      .where('kq.lop_hoc_phan_id = :lopHocPhanId', { lopHocPhanId });

    if (search) {
      qb.andWhere(
        '(LOWER(sv.hoTen) LIKE LOWER(:search) OR LOWER(sv.maSinhVien) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    qb.orderBy('sv.hoTen', 'ASC');

    const total = await qb.getCount();
    const items = await qb.skip((page - 1) * limit).take(limit).getMany();

    const data = items.map(kq => {
      const tbchp = this.tinhTBCHP(kq);
      return {
        id: kq.id,
        sinhVien: {
          id: kq.sinhVien.id,
          maSinhVien: kq.sinhVien.maSinhVien,
          hoTen: kq.sinhVien.hoTen,
          lop: {
            tenLop: kq.sinhVien.lop.tenLop,
            nganh: kq.sinhVien.lop.nganh,
            nienKhoa: kq.sinhVien.lop.nienKhoa,
          },
        },
        diemQuaTrinh: kq.diemQuaTrinh,
        diemThanhPhan: kq.diemThanhPhan,
        diemThi: kq.diemThi,
        TBCHP: tbchp,
        DiemSo: this.tinhDiemSo(tbchp),
        DiemChu: tbchp !== null ? this.tinhDiemChu(tbchp) : null,
      };
    });

    return {
      lopHocPhan: {
        id: lhp.id,
        maLopHocPhan: lhp.maLopHocPhan,
        monHoc: lhp.monHoc,
        giangVien: lhp.giangVien ? {
          id: lhp.giangVien.id,
          hoTen: lhp.giangVien.hoTen,
        } : null,
        hocKy: lhp.hocKy,
        namHoc: lhp.hocKy.namHoc,
        nienKhoa: lhp.nienKhoa,
        nganh: lhp.nganh,
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

  // Sinh viên xem kết quả của mình
  async getKetQuaCuaToi(userId: number) {
    const nguoiDung = await this.nguoiDungRepo.findOne({
      where: { id: userId },
      relations: ['sinhVien'],
    });
    if (!nguoiDung || !nguoiDung.sinhVien) {
      throw new NotFoundException('Không tìm thấy thông tin sinh viên');
    }

    const ketQua = await this.ketQuaRepo.find({
      where: { sinhVien: { id: nguoiDung.sinhVien.id } },
      relations: [
        'lopHocPhan',
        'lopHocPhan.monHoc',
        'lopHocPhan.giangVien',
        'lopHocPhan.hocKy',
        'lopHocPhan.hocKy.namHoc',
        'lopHocPhan.nienKhoa',
        'lopHocPhan.nganh',
        'lopHocPhan.nganh.khoa',
      ],
      order: { lopHocPhan: { hocKy: { namHoc: { namBatDau: 'DESC' } } } },
    });

    return ketQua.map(kq => {
      const tbchp = this.tinhTBCHP(kq);
      return {
        id: kq.id,
        lopHocPhan: {
          id: kq.lopHocPhan.id,
          maLopHocPhan: kq.lopHocPhan.maLopHocPhan,
          monHoc: kq.lopHocPhan.monHoc,
          giangVien: kq.lopHocPhan.giangVien ? {
            id: kq.lopHocPhan.giangVien.id,
            hoTen: kq.lopHocPhan.giangVien.hoTen,
          } : null,
          hocKy: kq.lopHocPhan.hocKy,
          namHoc: kq.lopHocPhan.hocKy.namHoc,
          nienKhoa: kq.lopHocPhan.nienKhoa,
          nganh: kq.lopHocPhan.nganh,
        },
        diemQuaTrinh: kq.diemQuaTrinh,
        diemThanhPhan: kq.diemThanhPhan,
        diemThi: kq.diemThi,
        TBCHP: tbchp,
        DiemSo: this.tinhDiemSo(tbchp),
        DiemChu: tbchp !== null ? this.tinhDiemChu(tbchp) : null,
      };
    });
  }
}