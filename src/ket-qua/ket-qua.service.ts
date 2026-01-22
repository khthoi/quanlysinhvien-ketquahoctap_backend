import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { KetQuaHocTap } from './entity/ket-qua-hoc-tap.entity';
import { LopHocPhan } from 'src/giang-day/entity/lop-hoc-phan.entity';
import { SinhVienLopHocPhan } from 'src/giang-day/entity/sinhvien-lophocphan.entity';
import { NhapDiemDto, SuaDiemDto } from './dtos/nhap-diem.dto';
import { GetKetQuaLopQueryDto } from './dtos/get-ket-qua-lop-query.dto';
import { NguoiDung } from 'src/auth/entity/nguoi-dung.entity';
import { VaiTroNguoiDungEnum } from 'src/auth/enums/vai-tro-nguoi-dung.enum';
import { SinhVien } from 'src/sinh-vien/entity/sinh-vien.entity';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import { KhenThuongKyLuat } from 'src/sinh-vien/entity/khenthuong-kyluat.entity';

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
    @InjectRepository(KhenThuongKyLuat)
    private khenThuongKyLuatRepo: Repository<KhenThuongKyLuat>,
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
    if (diemTB >= 9.0) return 'A+';
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

    if (diemTB >= 9.0) return 4.0;
    if (diemTB >= 8.5) return 3.7;
    if (diemTB >= 8.0) return 3.5;
    if (diemTB >= 7.0) return 3.0;
    if (diemTB >= 6.5) return 2.5;
    if (diemTB >= 5.5) return 2.0;
    if (diemTB >= 5.0) return 1.5;
    if (diemTB >= 4.0) return 1.0;
    return 0.0;
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
      (!lhp.giangVien || lhp.giangVien.id !== nguoiDung.giangVien.id)
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

  async suaDiem(id: number, dto: SuaDiemDto, userId: number) {
    // 1. Tìm bản ghi kết quả học tập
    const ketQua = await this.ketQuaRepo.findOne({
      where: { id },
      relations: ['lopHocPhan', 'lopHocPhan.giangVien'],
    });

    if (!ketQua) {
      throw new NotFoundException('Kết quả học tập không tồn tại');
    }

    // 2. Kiểm tra lớp đã khóa điểm
    if (ketQua.lopHocPhan.khoaDiem) {
      throw new ForbiddenException('Lớp học phần đã khóa điểm, không thể sửa');
    }

    // 3. KIỂM TRA QUYỀN SỬA ĐIỂM (MỚI)
    const nguoiDung = await this.nguoiDungRepo.findOne({
      where: { id: userId },
      relations: ['giangVien'],
    });

    if (!nguoiDung) {
      throw new ForbiddenException('Không tìm thấy thông tin người dùng');
    }

    // Phải là giảng viên phụ trách lớp học phần
    const giangVien = nguoiDung.giangVien;

    if (!giangVien) {
      throw new ForbiddenException('Tài khoản của bạn không liên kết với giảng viên nào');
    }

    if (!ketQua.lopHocPhan.giangVien || ketQua.lopHocPhan.giangVien.id !== giangVien.id) {
      throw new ForbiddenException(
        'Bạn không phải là giảng viên phụ trách lớp học phần này. Chỉ giảng viên phụ trách mới được phép sửa điểm.',
      );
    }
    // 4. Cập nhật điểm
    if (dto.diemQuaTrinh !== undefined) {
      ketQua.diemQuaTrinh = dto.diemQuaTrinh;
    }

    if (dto.diemThanhPhan !== undefined) {
      ketQua.diemThanhPhan = dto.diemThanhPhan;
    }

    if (dto.diemThi !== undefined) {
      ketQua.diemThi = dto.diemThi;
    }

    const saved = await this.ketQuaRepo.save(ketQua);

    // 5. Tính toán lại các giá trị tổng hợp
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
  async getDanhSachDiemLop(
    lopHocPhanId: number,
    userId: number,
    vaiTro: VaiTroNguoiDungEnum,
    query: GetKetQuaLopQueryDto,
  ) {
    const { page = 1, limit = 10, search } = query;

    // Load lớp học phần + giảng viên phụ trách
    const lhp = await this.lopHocPhanRepo.findOne({
      where: { id: lopHocPhanId },
      relations: ['monHoc', 'giangVien', 'hocKy', 'hocKy.namHoc', 'nienKhoa', 'nganh', 'nganh.khoa'],
    });

    if (!lhp) throw new NotFoundException('Lớp học phần không tồn tại');

    // Kiểm tra quyền
    if (vaiTro === VaiTroNguoiDungEnum.GIANG_VIEN) {
      // Load giảng viên từ userId
      const nguoiDung = await this.nguoiDungRepo.findOne({
        where: { id: userId },
        relations: ['giangVien'],
      });

      if (!nguoiDung || !nguoiDung.giangVien) {
        throw new ForbiddenException('Bạn không phải giảng viên, không được xem điểm lớp này');
      }

      const giangVienId = nguoiDung.giangVien.id;

      if (lhp.giangVien?.id !== giangVienId) {
        throw new ForbiddenException('Bạn không được phân công phụ trách lớp học phần này');
      }
    }

    // Nếu là cán bộ ĐT → cho qua (không kiểm tra giangVien)

    // Query danh sách điểm
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
            tenLop: kq.sinhVien.lop?.tenLop,
            nganh: kq.sinhVien.lop?.nganh,
            nienKhoa: kq.sinhVien.lop?.nienKhoa,
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

    // ===== BỔ SUNG: Sinh viên đã đăng ký nhưng chưa có điểm =====
    const sinhVienDaDangKy = await this.svLhpRepo.find({
      where: { lopHocPhan: { id: lopHocPhanId } },
      relations: ['sinhVien', 'sinhVien.lop', 'sinhVien.lop.nganh', 'sinhVien.lop.nienKhoa'],
    });

    // Lấy danh sách sinh viên đã có điểm (để loại trừ)
    const sinhVienCoDiemIds = new Set(items.map(item => item.sinhVien.id));
    const sinhVienChuaCoDiem = sinhVienDaDangKy
      .filter(reg => !sinhVienCoDiemIds.has(reg.sinhVien.id))
      .map(reg => ({
        id: reg.sinhVien.id,
        maSinhVien: reg.sinhVien.maSinhVien,
        hoTen: reg.sinhVien.hoTen,
        lop: {
          tenLop: reg.sinhVien.lop?.tenLop,
          nganh: reg.sinhVien.lop?.nganh,
          nienKhoa: reg.sinhVien.lop?.nienKhoa,
        },
      }));
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
        namHoc: lhp.hocKy?.namHoc,
        nienKhoa: lhp.nienKhoa,
        nganh: lhp.nganh,
        khoaDiem: lhp.khoaDiem,
      },
      data,
      sinhVienChuaCoDiem,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  async getKetQuaCuaToi(userId: number) {
    // Lấy sinh viên từ userId
    const nguoiDung = await this.nguoiDungRepo.findOne({
      where: { id: userId },
      relations: ['sinhVien'],
    });
    if (!nguoiDung || !nguoiDung.sinhVien) {
      throw new ForbiddenException('Tài khoản không phải sinh viên');
    }

    const sinhVienId = nguoiDung.sinhVien.id;

    // Lấy tất cả kết quả của sinh viên
    const ketQua = await this.ketQuaRepo.find({
      where: { sinhVien: { id: sinhVienId } },
      relations: [
        'lopHocPhan',
        'lopHocPhan.monHoc',
        'lopHocPhan.giangVien',
        'lopHocPhan.hocKy',
        'lopHocPhan.hocKy.namHoc',
        'lopHocPhan.nienKhoa',
        'lopHocPhan.nganh',
      ],
    });

    // ===== LỌC CHỈ LẤY KẾT QUẢ TỪ LỚP HỌC PHẦN ĐÃ KHÓA ĐIỂM =====
    const ketQuaDaKhoaDiem = ketQua.filter(kq => kq.lopHocPhan.khoaDiem === true);

    // Lấy thông tin khen thưởng kỷ luật của sinh viên
    const khenThuongKyLuats = await this.khenThuongKyLuatRepo.find({
      where: { sinhVien: { id: sinhVienId } },
    });

    // ===== NHÓM KẾT QUẢ THEO MÔN HỌC ĐỂ TÍNH GPA =====
    const ketQuaTheoMon = new Map<number, { monHocId: number; diemTBCHPList: number[] }>();

    for (const kq of ketQuaDaKhoaDiem) {
      const monHocId = kq.lopHocPhan.monHoc.id;
      const tbchp = this.tinhTBCHP(kq);

      if (!ketQuaTheoMon.has(monHocId)) {
        ketQuaTheoMon.set(monHocId, {
          monHocId,
          diemTBCHPList: [],
        });
      }

      if (tbchp !== null) {
        ketQuaTheoMon.get(monHocId)!.diemTBCHPList.push(tbchp);
      }
    }

    // ===== TÍNH GPA HỆ 4 =====
    // Lấy điểm TBCHP cao nhất của mỗi môn, quy đổi sang hệ 4, rồi tính trung bình
    let tongDiemHe4 = 0;
    let soMonDuocXet = 0;

    for (const [monHocId, data] of ketQuaTheoMon) {
      if (data.diemTBCHPList.length > 0) {
        // Lấy điểm TBCHP cao nhất của môn này
        const diemCaoNhat = Math.max(...data.diemTBCHPList);
        const diemHe4 = this.diemHe10ToHe4(diemCaoNhat);

        tongDiemHe4 += diemHe4;
        soMonDuocXet++;
      }
    }

    const gpa = soMonDuocXet > 0 ? tongDiemHe4 / soMonDuocXet : null;
    const xepLoaiHocLuc = gpa !== null ? this.xepLoaiHocLuc(gpa) : null;

    // Map kết quả học tập (chỉ lấy kết quả đã khóa điểm)
    const mappedKetQua = ketQuaDaKhoaDiem.map(kq => {
      const tbchp = this.tinhTBCHP(kq);
      return {
        id: kq.id,
        lopHocPhan: {
          maLopHocPhan: kq.lopHocPhan.maLopHocPhan,
          monHoc: kq.lopHocPhan.monHoc,
          giangVien: kq.lopHocPhan.giangVien
            ? {
              id: kq.lopHocPhan.giangVien.id,
              hoTen: kq.lopHocPhan.giangVien.hoTen,
            }
            : null,
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

    // Map khen thưởng kỷ luật (lấy các trường cần thiết)
    const mappedKhenThuongKyLuat = khenThuongKyLuats.map(ktkl => ({
      id: ktkl.id,
      loai: ktkl.loai,
      noiDung: ktkl.noiDung,
      ngayQuyetDinh: ktkl.ngayQuyetDinh,
    }));

    return {
      ketQuaHocTap: mappedKetQua,
      khenThuongKyLuat: mappedKhenThuongKyLuat,
      thongKe: {
        soMonHoanThanh: soMonDuocXet,
        soKetQuaHocTap: ketQuaDaKhoaDiem.length,
        gpa: gpa !== null ? Number(gpa.toFixed(2)) : null,
        xepLoaiHocLuc,
      },
    };
  }

  // ========== HELPER METHODS ==========

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
   * Xếp loại học lực theo GPA hệ 4
   */
  private xepLoaiHocLuc(gpa: number): string {
    if (gpa >= 3.6) return 'Xuất sắc';
    if (gpa >= 3.2) return 'Giỏi';
    if (gpa >= 2.5) return 'Khá';
    if (gpa >= 2.0) return 'Trung bình';
    if (gpa >= 1.0) return 'Yếu';
    return 'Kém';
  }

  async nhapDiemExcel(lopHocPhanId: number, userId: number, filePath: string) {
    // Load lớp học phần
    const lhp = await this.lopHocPhanRepo.findOne({
      where: { id: lopHocPhanId },
      relations: ['giangVien'],
    });
    if (!lhp) throw new NotFoundException('Lớp học phần không tồn tại');

    // Kiểm tra khóa điểm
    if (lhp.khoaDiem) {
      throw new ForbiddenException('Lớp học phần đã khóa điểm, không thể nhập');
    }

    // Kiểm tra quyền (tương tự nhapDiem)
    const nguoiDung = await this.nguoiDungRepo.findOne({
      where: { id: userId },
      relations: ['giangVien'],
    });

    if (!nguoiDung) throw new ForbiddenException('Không tìm thấy thông tin tài khoản');

    if (!nguoiDung.giangVien) {
      throw new ForbiddenException('Tài khoản chưa liên kết với hồ sơ giảng viên');
    }
    if (lhp.giangVien?.id !== nguoiDung.giangVien.id) {
      throw new ForbiddenException('Bạn không được phép nhập điểm cho lớp này');
    }


    // Load tất cả đăng ký SV trong lớp
    const dangKyMap = new Map<string, SinhVienLopHocPhan>();
    const dangKyList = await this.svLhpRepo.find({
      where: { lopHocPhan: { id: lopHocPhanId } },
      relations: ['sinhVien'],
    });
    dangKyList.forEach(dk => dangKyMap.set(dk.sinhVien.maSinhVien, dk));

    // Load kết quả điểm hiện có để kiểm tra trùng
    const existingKetQuaMap = new Map<string, KetQuaHocTap>();
    const existingKetQua = await this.ketQuaRepo.find({
      where: { lopHocPhan: { id: lopHocPhanId } },
      relations: ['sinhVien'],
    });
    existingKetQua.forEach(kq => existingKetQuaMap.set(kq.sinhVien.maSinhVien, kq));

    // Đọc file Excel
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) throw new BadRequestException('File không có sheet dữ liệu');

    const results = {
      success: 0,
      failed: 0,
      errors: [] as { row: number; maSinhVien: string; error: string }[],
    };

    const rows = worksheet.getRows(2, worksheet.rowCount - 1) || [];

    for (const row of rows) {

      if (!row || row.actualCellCount === 0) continue;

      const rowNum = row.number;

      const maSinhVien = row.getCell(2).value?.toString().trim(); // Cột 2: Mã sinh viên
      const diemQuaTrinh = parseFloat(row.getCell(5).value?.toString() || 'NaN');
      const diemThanhPhan = parseFloat(row.getCell(6).value?.toString() || 'NaN');
      const diemThi = parseFloat(row.getCell(7).value?.toString() || 'NaN');

      if (!maSinhVien) {
        results.errors.push({ row: rowNum, maSinhVien: 'N/A', error: 'Thiếu mã sinh viên' });
        results.failed++;
        continue;
      }

      try {
        // Validate SV tồn tại và đăng ký lớp
        const dangKy = dangKyMap.get(maSinhVien);
        if (!dangKy) {
          throw new BadRequestException('Sinh viên không đăng ký lớp học phần này');
        }

        // Kiểm tra đã có điểm chưa
        if (existingKetQuaMap.has(maSinhVien)) {
          throw new BadRequestException('Sinh viên đã có điểm, không thể nhập lại');
        }

        // Validate điểm (0-10, không NaN)
        if (isNaN(diemQuaTrinh) || diemQuaTrinh < 0 || diemQuaTrinh > 10) {
          throw new BadRequestException('Điểm chuyên cần không hợp lệ (0-10)');
        }
        if (isNaN(diemThanhPhan) || diemThanhPhan < 0 || diemThanhPhan > 10) {
          throw new BadRequestException('Điểm thành phần không hợp lệ (0-10)');
        }
        if (isNaN(diemThi) || diemThi < 0 || diemThi > 10) {
          throw new BadRequestException('Điểm thi không hợp lệ (0-10)');
        }

        // Tạo kết quả điểm
        const ketQua = this.ketQuaRepo.create({
          lopHocPhan: lhp,
          sinhVien: dangKy.sinhVien,
          diemQuaTrinh,
          diemThanhPhan,
          diemThi,
        });

        await this.ketQuaRepo.save(ketQua);

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

    // Xóa file tạm
    fs.unlinkSync(filePath);

    return results;
  }
}