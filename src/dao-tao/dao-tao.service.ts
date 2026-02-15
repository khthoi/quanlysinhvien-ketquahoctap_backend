import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { NamHoc } from './entity/nam-hoc.entity';
import { HocKy } from './entity/hoc-ky.entity';
import { CreateNamHocDto } from './dtos/create-nam-hoc.dto';
import { UpdateNamHocDto } from './dtos/update-nam-hoc.dto';
import { CreateHocKyDto } from './dtos/create-hoc-ky.dto';
import { UpdateHocKyDto } from './dtos/update-hoc-ky.dto';
import { GetNamHocQueryDto } from './dtos/get-nam-hoc-query.dto';
import { GetHocKyQueryDto } from './dtos/get-hoc-ky-query.dto';
import { Nganh } from 'src/danh-muc/entity/nganh.entity';
import { NienKhoa } from 'src/danh-muc/entity/nien-khoa.entity';
import { CreateApDungDto } from './dtos/create-ap-dung-dto';
import { CreateChuongTrinhDto } from './dtos/create-chuong-trinh-dto';
import { GetApDungQueryDto } from './dtos/get-ap-dung-query.dto';
import { GetChuongTrinhQueryDto } from './dtos/get-chuong-trinh-query.dto';
import { UpdateApDungDto } from './dtos/update-ap-dung-dto';
import { UpdateChuongTrinhDto } from './dtos/update-chuong-trinh-dto';
import { ApDungChuongTrinhDT } from './entity/ap-dung-chuong-trinh-dt.entity';
import { ChuongTrinhDaoTao } from './entity/chuong-trinh-dao-tao.entity';
import { MonHoc } from 'src/danh-muc/entity/mon-hoc.entity';
import { ChiTietChuongTrinhDaoTao } from './entity/chi-tiet-chuong-trinh-dao-tao.entity';
import { CreateChiTietMonHocDto } from './dtos/create-chi-tiet-mon-hoc.dto';
import { UpdateChiTietMonHocDto } from './dtos/update-chi-tiet-mon-hoc.dto';
import { LopHocPhan } from 'src/giang-day/entity/lop-hoc-phan.entity';
import { TinhTrangHocTapEnum } from 'src/sinh-vien/enums/tinh-trang-hoc-tap.enum';
import { SinhVien } from 'src/sinh-vien/entity/sinh-vien.entity';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs/promises';
import { NguoiDung } from 'src/auth/entity/nguoi-dung.entity';

@Injectable()
export class DaoTaoService {
  constructor(
    @InjectRepository(NamHoc)
    private namHocRepo: Repository<NamHoc>,
    @InjectRepository(HocKy)
    private hocKyRepo: Repository<HocKy>,
    @InjectRepository(ChuongTrinhDaoTao)
    private chuongTrinhRepo: Repository<ChuongTrinhDaoTao>,
    @InjectRepository(ApDungChuongTrinhDT)
    private apDungRepo: Repository<ApDungChuongTrinhDT>,
    @InjectRepository(Nganh)
    private nganhRepo: Repository<Nganh>,
    @InjectRepository(NienKhoa)
    private nienKhoaRepo: Repository<NienKhoa>,
    @InjectRepository(ChiTietChuongTrinhDaoTao)
    private chiTietRepo: Repository<ChiTietChuongTrinhDaoTao>,
    @InjectRepository(MonHoc)
    private monHocRepo: Repository<MonHoc>,
    @InjectRepository(LopHocPhan)
    private lopHocPhanRepo: Repository<LopHocPhan>,
    @InjectRepository(SinhVien)
    private sinhVienRepo: Repository<SinhVien>,
    @InjectRepository(NguoiDung)
    private nguoiDungRepo: Repository<NguoiDung>,
  ) { }

  // ==================== NĂM HỌC ====================

  async getAllNamHoc(query: GetNamHocQueryDto) {
    const { search, page = 1, limit = 10 } = query;

    // STEP 1: Query lấy danh sách id NamHoc (phân trang trên bảng chính)
    const idQuery = this.namHocRepo
      .createQueryBuilder('nh')
      .select('nh.id')
      .orderBy('nh.namBatDau', 'DESC');

    if (search) {
      idQuery.andWhere(
        '(LOWER(nh.tenNamHoc) LIKE :search OR LOWER(nh.maNamHoc) LIKE :search)',
        { search: `%${search.toLowerCase()}%` },
      );
    }

    // Phân trang trên danh sách ID
    const [idRows, total] = await idQuery
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const ids = idRows.map((i) => i.id);

    if (ids.length === 0) {
      return {
        data: [],
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    // STEP 2: Lấy chi tiết Năm học + HocKy theo danh sách id ở trên
    const data = await this.namHocRepo
      .createQueryBuilder('namHoc')
      .leftJoinAndSelect('namHoc.hocKys', 'hocKy')
      .whereInIds(ids)
      .orderBy('namHoc.namBatDau', 'DESC')
      .addOrderBy('hocKy.hocKy', 'ASC')
      .getMany();

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



  async createNamHoc(dto: CreateNamHocDto) {
    // Kiểm tra năm kết thúc phải = năm bắt đầu + 1
    if (dto.namKetThuc !== dto.namBatDau + 1) {
      throw new BadRequestException('Năm kết thúc phải bằng năm bắt đầu + 1');
    }

    // Kiểm tra trùng mã năm học
    const existMa = await this.namHocRepo.findOneBy({ maNamHoc: dto.maNamHoc });
    if (existMa) {
      throw new BadRequestException('Mã năm học đã tồn tại');
    }

    // Kiểm tra trùng khoảng thời gian (do có @Unique)
    const exist = await this.namHocRepo.findOneBy({
      namBatDau: dto.namBatDau,
      namKetThuc: dto.namKetThuc,
    });
    if (exist) {
      throw new BadRequestException('Năm học với khoảng thời gian này đã tồn tại');
    }

    const namHoc = this.namHocRepo.create(dto);
    return await this.namHocRepo.save(namHoc);
  }

  async updateNamHoc(id: number, dto: UpdateNamHocDto) {
    const namHoc = await this.namHocRepo.findOneBy({ id });
    if (!namHoc) throw new NotFoundException('Năm học không tồn tại');

    // Nếu cập nhật năm bắt đầu hoặc kết thúc → kiểm tra đúng khoảng 1 năm
    const finalNamBatDau = dto.namBatDau ?? namHoc.namBatDau;
    const finalNamKetThuc = dto.namKetThuc ?? namHoc.namKetThuc;

    if (finalNamKetThuc !== finalNamBatDau + 1) {
      throw new BadRequestException('Năm kết thúc phải bằng năm bắt đầu + 1');
    }

    // Kiểm tra trùng mã
    if (dto.maNamHoc && dto.maNamHoc !== namHoc.maNamHoc) {
      const existMa = await this.namHocRepo.findOneBy({ maNamHoc: dto.maNamHoc });
      if (existMa) throw new BadRequestException('Mã năm học đã tồn tại');
    }

    // Kiểm tra trùng khoảng thời gian
    const exist = await this.namHocRepo.findOneBy({
      namBatDau: finalNamBatDau,
      namKetThuc: finalNamKetThuc,
    });
    if (exist && exist.id !== id) {
      throw new BadRequestException('Khoảng thời gian năm học đã tồn tại');
    }

    Object.assign(namHoc, dto);
    return await this.namHocRepo.save(namHoc);
  }

  async deleteNamHoc(id: number) {
    const namHoc = await this.namHocRepo.findOne({
      where: { id },
      relations: ['hocKys'],
    });
    if (!namHoc) throw new NotFoundException('Năm học không tồn tại');

    if (namHoc.hocKys && namHoc.hocKys.length > 0) {
      throw new BadRequestException('Không thể xóa năm học đang có học kỳ');
    }

    await this.namHocRepo.remove(namHoc);
    return { message: 'Xóa năm học thành công' };
  }

  // ==================== HỌC KỲ ====================

  async getAllHocKy(query: GetHocKyQueryDto) {
    const { namHocId, hockythu, page = 1, limit = 10 } = query;

    const qb = this.hocKyRepo
      .createQueryBuilder('hocKy')
      .leftJoinAndSelect('hocKy.namHoc', 'namHoc')
      .orderBy('namHoc.namBatDau', 'DESC')

    if (namHocId) {
      qb.andWhere('hocKy.nam_hoc_id = :namHocId', { namHocId });
    }

    if (hockythu) {
      qb.andWhere('hocKy.hoc_ky = :hockythu', { hockythu });
    }

    qb.skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      pagination: {
        total,
        page,
        limit,
      },
    };
  }

  async createHocKy(dto: CreateHocKyDto) {
    const { hocKy, namHocId, ngayBatDau, ngayKetThuc } = dto;

    const namHoc = await this.namHocRepo.findOneBy({ id: namHocId });
    if (!namHoc) throw new BadRequestException('Năm học không tồn tại');

    if (ngayBatDau >= ngayKetThuc) {
      throw new BadRequestException('Ngày bắt đầu phải nhỏ hơn ngày kết thúc');
    }

    // Validate ngày thuộc đúng năm học
    const startOfNamBatDau = new Date(namHoc.namBatDau, 0, 1); // 01/01/namBatDau
    const endOfNamKetThuc = new Date(namHoc.namKetThuc, 11, 31); // 31/12/namKetThuc

    const bd = new Date(ngayBatDau);
    const kt = new Date(ngayKetThuc);

    if (bd < startOfNamBatDau) {
      throw new BadRequestException(`Ngày bắt đầu phải từ ngày 01/01/${namHoc.namBatDau} trở đi`);
    }
    if (kt > endOfNamKetThuc) {
      throw new BadRequestException(`Ngày kết thúc không được vượt quá 31/12/${namHoc.namKetThuc}`);
    }
    if (bd >= kt) {
      throw new BadRequestException('Ngày bắt đầu phải nhỏ hơn ngày kết thúc');
    }

    // Kiểm tra trùng thứ tự học kỳ
    const exist = await this.hocKyRepo.findOne({
      where: { hocKy, namHoc: { id: namHocId } },
    });
    if (exist) {
      throw new BadRequestException(`Năm học này đã có học kỳ thứ ${hocKy}`);
    }

    // Kiểm tra liền kề với học kỳ cao nhất hiện có
    const maxHocKy = await this.hocKyRepo.findOne({
      where: { namHoc: { id: namHocId } },
      order: { hocKy: 'DESC' },
    });

    if (maxHocKy && hocKy !== maxHocKy.hocKy + 1) {
      throw new BadRequestException(`Học kỳ mới phải là thứ ${maxHocKy.hocKy + 1} (liền kề)`);
    }
    if (!maxHocKy && hocKy !== 1) {
      throw new BadRequestException('Học kỳ đầu tiên phải là học kỳ 1');
    }

    /** ⭐ NEW VALIDATION: học kỳ lớn hơn phải có ngày bắt đầu > ngày kết thúc học kỳ nhỏ hơn */
    if (maxHocKy) {
      const maxEnd = new Date(maxHocKy.ngayKetThuc);

      if (new Date(ngayBatDau) <= maxEnd) {
        const ngayKTMax = maxEnd.toLocaleDateString('vi-VN');
        throw new BadRequestException(
          `Học kỳ ${hocKy} phải bắt đầu sau khi học kỳ ${maxHocKy.hocKy} kết thúc (${ngayKTMax})`
        );
      }
    }

    // Kiểm tra chồng thời gian với các học kỳ hiện có
    const allHocKy = await this.hocKyRepo.find({
      where: { namHoc: { id: namHocId } },
    });

    for (const hk of allHocKy) {
      const hkBd = new Date(hk.ngayBatDau);
      const hkKt = new Date(hk.ngayKetThuc);

      // Chồng nếu: bd mới nằm trong khoảng cũ hoặc kt mới nằm trong khoảng cũ
      if (!(kt <= hkBd || bd >= hkKt)) {
        const ngayBD = new Date(hk.ngayBatDau).toLocaleDateString('vi-VN');
        const ngayKT = new Date(hk.ngayKetThuc).toLocaleDateString('vi-VN');
        throw new BadRequestException(
          `Thời gian học kỳ chồng với học kỳ thứ ${hk.hocKy} (${ngayBD} - ${ngayKT})`,
        );
      }
    }

    const hocKyEntity = this.hocKyRepo.create({
      hocKy,
      ngayBatDau: bd,
      ngayKetThuc: kt,
      namHoc,
    });

    return await this.hocKyRepo.save(hocKyEntity);
  }

  /**
   * Cập nhật học kỳ: chỉ cho phép thay đổi ngày bắt đầu và/hoặc ngày kết thúc.
   * Không cho phép đổi năm học hay thứ tự học kỳ.
   */
  async updateHocKy(id: number, dto: UpdateHocKyDto) {
    if (!dto.ngayBatDau && !dto.ngayKetThuc) {
      throw new BadRequestException('Cần gửi ít nhất một trong hai: ngayBatDau hoặc ngayKetThuc');
    }

    const hocKy = await this.hocKyRepo.findOne({
      where: { id },
      relations: ['namHoc'],
    });
    if (!hocKy) throw new NotFoundException('Học kỳ không tồn tại');

    const namHoc = hocKy.namHoc;

    // Ngày sau khi áp dụng DTO (giữ giá trị cũ nếu không gửi)
    const finalBd = dto.ngayBatDau ? new Date(dto.ngayBatDau) : new Date(hocKy.ngayBatDau);
    const finalKt = dto.ngayKetThuc ? new Date(dto.ngayKetThuc) : new Date(hocKy.ngayKetThuc);

    const startOfNam = new Date(namHoc.namBatDau, 0, 1);
    const endOfNam = new Date(namHoc.namKetThuc, 11, 31);

    // Nằm trong năm học
    if (finalBd < startOfNam) {
      throw new BadRequestException(`Ngày bắt đầu phải từ 01/01/${namHoc.namBatDau} trở đi`);
    }
    if (finalKt > endOfNam) {
      throw new BadRequestException(`Ngày kết thúc không được vượt quá 31/12/${namHoc.namKetThuc}`);
    }
    if (finalBd >= finalKt) {
      throw new BadRequestException('Ngày bắt đầu phải nhỏ hơn ngày kết thúc');
    }

    const currHocKyNumber = hocKy.hocKy;
    const allHkInYear = await this.hocKyRepo.find({
      where: { namHoc: { id: namHoc.id } },
    });

    // Học kỳ liền trước: ngày bắt đầu phải sau ngày kết thúc của học kỳ trước
    const hkTruoc = allHkInYear.find(h => h.hocKy === currHocKyNumber - 1);
    if (hkTruoc) {
      const endPrev = new Date(hkTruoc.ngayKetThuc);
      if (finalBd <= endPrev) {
        const ngayKT = endPrev.toLocaleDateString('vi-VN');
        throw new BadRequestException(
          `Học kỳ ${currHocKyNumber} phải bắt đầu sau ngày kết thúc của học kỳ ${hkTruoc.hocKy} (${ngayKT})`,
        );
      }
    }

    // Học kỳ liền sau: ngày kết thúc phải trước ngày bắt đầu của học kỳ sau
    const hkSau = allHkInYear.find(h => h.hocKy === currHocKyNumber + 1);
    if (hkSau) {
      const startNext = new Date(hkSau.ngayBatDau);
      if (finalKt >= startNext) {
        const ngayBD = startNext.toLocaleDateString('vi-VN');
        throw new BadRequestException(
          `Học kỳ ${currHocKyNumber} phải kết thúc trước ngày bắt đầu của học kỳ ${hkSau.hocKy} (${ngayBD})`,
        );
      }
    }

    // Không chồng thời gian với các học kỳ khác trong cùng năm (trừ chính nó)
    for (const other of allHkInYear) {
      if (other.id === id) continue;
      const otherBd = new Date(other.ngayBatDau);
      const otherKt = new Date(other.ngayKetThuc);
      if (!(finalKt <= otherBd || finalBd >= otherKt)) {
        const otherngayBD = new Date(other.ngayBatDau).toLocaleDateString('vi-VN');
        const otherngayKT = new Date(other.ngayKetThuc).toLocaleDateString('vi-VN');
        throw new BadRequestException(
          `Thời gian chồng với học kỳ thứ ${other.hocKy} (${otherngayBD} - ${otherngayKT})`,
        );
      }
    }

    if (dto.ngayBatDau) hocKy.ngayBatDau = finalBd;
    if (dto.ngayKetThuc) hocKy.ngayKetThuc = finalKt;

    return await this.hocKyRepo.save(hocKy);
  }

  async deleteHocKy(id: number) {
    const hocKy = await this.hocKyRepo.findOne({ where: { id }, relations: ['lopHocPhans'] });
    if (!hocKy) throw new NotFoundException('Học kỳ không tồn tại');

    if (hocKy.lopHocPhans && hocKy.lopHocPhans.length > 0) {
      throw new BadRequestException('Không thể xóa học kỳ đang có lớp học phần');
    }

    await this.hocKyRepo.remove(hocKy);
    return { message: 'Xóa học kỳ thành công' };
  }

  // ==================== CHƯƠNG TRÌNH ĐÀO TẠO ====================

  async createChuongTrinh(dto: CreateChuongTrinhDto) {

    const existCTDT = await this.chuongTrinhRepo.findOneBy({
      maChuongTrinh: dto.maChuongTrinh,
    });
    if (existCTDT) {
      throw new BadRequestException('Mã chương trình đào tạo đã tồn tại');
    }


    const nganh = await this.nganhRepo.findOneBy({ id: dto.nganhId });
    if (!nganh) throw new BadRequestException('Ngành không tồn tại');


    const ct = this.chuongTrinhRepo.create({
      maChuongTrinh: dto.maChuongTrinh,
      tenChuongTrinh: dto.tenChuongTrinh,
      thoiGianDaoTao: dto.thoiGianDaoTao,
      nganh,
    });

    return await this.chuongTrinhRepo.save(ct);
  }

  async getAllChuongTrinh(query: GetChuongTrinhQueryDto) {
    const { page = 1, limit = 10, search, nganhId, nienKhoaId } = query;

    const qb = this.chuongTrinhRepo
      .createQueryBuilder('ct')
      .leftJoinAndSelect('ct.nganh', 'nganh')
      .leftJoinAndSelect('nganh.khoa', 'khoa')
      .leftJoinAndSelect('ct.apDungChuongTrinhs', 'apDung') // nếu cần load áp dụng
      .leftJoinAndSelect('apDung.nienKhoa', 'nienKhoa');

    if (nganhId) qb.andWhere('nganh.id = :nganhId', { nganhId });
    if (nienKhoaId) qb.andWhere('nienKhoa.id = :nienKhoaId', { nienKhoaId });
    if (search) {
      qb.andWhere('LOWER(ct.tenChuongTrinh) LIKE LOWER(:search) OR LOWER(ct.maChuongTrinh) LIKE LOWER(:search)', { search: `%${search}%` });
    }

    qb.orderBy('ct.tenChuongTrinh', 'ASC');

    const total = await qb.getCount();
    const items = await qb.skip((page - 1) * limit).take(limit).getMany();

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

  async getChuongTrinhById(id: number) {
    const ct = await this.chuongTrinhRepo.findOne({
      where: { id },
      relations: ['nganh', 'nganh.khoa', 'apDungChuongTrinhs', 'apDungChuongTrinhs.nienKhoa'],
    });
    if (!ct) throw new NotFoundException('Chương trình đào tạo không tồn tại');
    return ct;
  }

  async updateChuongTrinh(id: number, dto: UpdateChuongTrinhDto) {
    const ct = await this.getChuongTrinhById(id);

    const existCTDT = await this.chuongTrinhRepo.findOneBy({
      maChuongTrinh: dto.maChuongTrinh,
      id: Not(id),
    });

    if (existCTDT) {
      throw new BadRequestException('Mã chương trình đào tạo đã tồn tại');
    }

    if (dto.nganhId) {
      const nganh = await this.nganhRepo.findOneBy({ id: dto.nganhId });
      if (!nganh) throw new BadRequestException('Ngành không tồn tại');
      ct.nganh = nganh;
    }

    Object.assign(ct, dto);
    return await this.chuongTrinhRepo.save(ct);
  }

  async deleteChuongTrinh(id: number): Promise<void> {
    const ct = await this.chuongTrinhRepo.findOne({
      where: { id },
      relations: ['apDungChuongTrinhs', 'chiTietMonHocs'],
    });
    if (!ct) throw new NotFoundException('Chương trình đào tạo không tồn tại');

    if (ct.apDungChuongTrinhs?.length > 0) {
      throw new BadRequestException('Không thể xóa chương trình đang được áp dụng');
    }

    if (ct.chiTietMonHocs?.length > 0) {
      await this.chiTietRepo.remove(ct.chiTietMonHocs);
    }

    await this.chuongTrinhRepo.remove(ct);
  }

  // ==================== ÁP DỤNG CHƯƠNG TRÌNH ====================

  async createApDung(dto: CreateApDungDto) {
    const ct = await this.chuongTrinhRepo.findOne({
      where: { id: dto.chuongTrinhId },
      relations: ['nganh'],
    });
    if (!ct) throw new BadRequestException('Chương trình đào tạo không tồn tại');

    const nganh = await this.nganhRepo.findOneBy({ id: dto.nganhId });
    if (!nganh) throw new BadRequestException('Ngành không tồn tại');

    const nienKhoa = await this.nienKhoaRepo.findOneBy({ id: dto.nienKhoaId });
    if (!nienKhoa) throw new BadRequestException('Niên khóa không tồn tại');

    // Logic 1: Không cho 2 CTĐT khác nhau áp dụng cho cùng ngành + niên khóa
    const exist = await this.apDungRepo.findOneBy({
      nganh: { id: dto.nganhId },
      nienKhoa: { id: dto.nienKhoaId },
    });
    if (exist) {
      throw new BadRequestException('Đã có chương trình đào tạo được áp dụng cho ngành và niên khóa này');
    }

    // Logic 2: CTĐT của ngành A không thể áp dụng cho ngành B
    if (ct.nganh.id !== dto.nganhId) {
      throw new BadRequestException('Chương trình đào tạo chỉ có thể áp dụng cho ngành gốc của nó');
    }

    const apDung = this.apDungRepo.create({
      chuongTrinh: ct,
      nganh,
      nienKhoa,
      ngayApDung: dto.ngayApDung ? new Date(dto.ngayApDung) : new Date(),
      ghiChu: dto.ghiChu,
    });

    return await this.apDungRepo.save(apDung);
  }

  async getAllApDung(query: GetApDungQueryDto) {
    const { page = 1, limit = 10, search, nganhId, nienKhoaId, chuongTrinhId } = query;

    const qb = this.apDungRepo
      .createQueryBuilder('ap')
      .leftJoinAndSelect('ap.chuongTrinh', 'ct')
      .leftJoinAndSelect('ct.nganh', 'nganhCt')
      .leftJoinAndSelect('ap.nganh', 'nganh')
      .leftJoinAndSelect('nganh.khoa', 'khoa')
      .leftJoinAndSelect('ap.nienKhoa', 'nienKhoa');

    if (nganhId) qb.andWhere('nganh.id = :nganhId', { nganhId });
    if (nienKhoaId) qb.andWhere('nienKhoa.id = :nienKhoaId', { nienKhoaId });
    if (chuongTrinhId) qb.andWhere('ct.id = :chuongTrinhId', { chuongTrinhId });
    if (search) {
      qb.andWhere(
        '(LOWER(ct.tenChuongTrinh) LIKE LOWER(:search) OR LOWER(nganh.tenNganh) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    qb.orderBy('nienKhoa.namBatDau', 'DESC').addOrderBy('nganh.tenNganh', 'ASC');

    const total = await qb.getCount();
    const items = await qb.skip((page - 1) * limit).take(limit).getMany();

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

  async getApDungById(id: number) {
    const ap = await this.apDungRepo.findOne({
      where: { id },
      relations: ['chuongTrinh', 'chuongTrinh.nganh', 'nganh', 'nganh.khoa', 'nienKhoa'],
    });
    if (!ap) throw new NotFoundException('Bản ghi áp dụng không tồn tại');
    return ap;
  }

  async updateApDung(id: number, dto: UpdateApDungDto) {
    const ap = await this.getApDungById(id);

    if (dto.chuongTrinhId) {
      const ct = await this.chuongTrinhRepo.findOne({
        where: { id: dto.chuongTrinhId },
        relations: ['nganh'],
      });
      if (!ct) throw new BadRequestException('Chương trình đào tạo không tồn tại');
      if (ct.nganh.id !== ap.nganh.id) {
        throw new BadRequestException('Không thể áp dụng chương trình đào tạo của ngành khác');
      }
      ap.chuongTrinh = ct;
    }

    if (dto.nganhId || dto.nienKhoaId) {
      // Nếu đổi ngành hoặc niên khóa → kiểm tra trùng
      const newNganhId = dto.nganhId || ap.nganh.id;
      const newNienKhoaId = dto.nienKhoaId || ap.nienKhoa.id;

      const exist = await this.apDungRepo.findOneBy({
        nganh: { id: newNganhId },
        nienKhoa: { id: newNienKhoaId },
      });
      if (exist && exist.id !== id) {
        throw new BadRequestException('Đã có chương trình đào tạo áp dụng cho ngành và niên khóa này');
      }

      if (dto.nganhId) {
        const nganh = await this.nganhRepo.findOneBy({ id: dto.nganhId });
        if (!nganh) throw new BadRequestException('Ngành không tồn tại');
        ap.nganh = nganh;
      }
      if (dto.nienKhoaId) {
        const nienKhoa = await this.nienKhoaRepo.findOneBy({ id: dto.nienKhoaId });
        if (!nienKhoa) throw new BadRequestException('Niên khóa không tồn tại');
        ap.nienKhoa = nienKhoa;
      }
    }

    if (dto.ngayApDung) ap.ngayApDung = new Date(dto.ngayApDung);
    if (dto.ghiChu !== undefined) ap.ghiChu = dto.ghiChu;

    return await this.apDungRepo.save(ap);
  }

  async deleteApDung(id: number): Promise<void> {
    const ap = await this.apDungRepo.findOneBy({ id });
    if (!ap) throw new NotFoundException('Bản ghi áp dụng không tồn tại');

    await this.apDungRepo.remove(ap);
  }

  async importChiTietMonHocFromExcel(
    chuongTrinhId: number,
    filePath: string,
  ): Promise<{
    message: string;
    totalRows: number;
    success: number;
    failed: number;
    errors: { row: number; maMonHoc: string; error: string }[];
    successRows: { row: number; maMonHoc: string; thuTuHocKy: number }[];
  }> {
    const results = {
      totalRows: 0,
      success: 0,
      failed: 0,
      errors: [] as { row: number; maMonHoc: string; error: string }[],
      successRows: [] as { row: number; maMonHoc: string; thuTuHocKy: number }[],
    };

    try {
      // 1. Kiểm tra chương trình đào tạo tồn tại
      const chuongTrinh = await this.chuongTrinhRepo.findOne({
        where: { id: chuongTrinhId },
      });

      if (!chuongTrinh) {
        throw new NotFoundException(`Chương trình đào tạo ID = ${chuongTrinhId} không tồn tại`);
      }

      // 2. Đọc file Excel
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

      // 3. Duyệt từng dòng
      for (const row of rows) {
        if (!row || row.actualCellCount === 0) continue;

        const rowNum = row.number;

        // Cấu trúc file:
        // A: STT
        // B: Học kỳ
        // C: Mã môn học
        // D: Ghi chú

        const thuTuHocKyStr = row.getCell(2).value?.toString().trim() || '';
        const maMonHoc = row.getCell(3).value?.toString().trim() || '';
        const ghiChu = row.getCell(4).value?.toString().trim() || undefined;

        // Validate Mã môn học
        if (!maMonHoc) {
          results.failed++;
          results.errors.push({
            row: rowNum,
            maMonHoc: 'N/A',
            error: 'Thiếu mã môn học',
          });
          continue;
        }

        // Validate Thứ tự học kỳ
        if (!thuTuHocKyStr) {
          results.failed++;
          results.errors.push({
            row: rowNum,
            maMonHoc,
            error: 'Thiếu thứ tự học kỳ',
          });
          continue;
        }

        // Validate học kỳ
        const thuTuHocKy = parseInt(thuTuHocKyStr, 10);
        if (isNaN(thuTuHocKy) || thuTuHocKy < 1 || thuTuHocKy > 8) {
          results.failed++;
          results.errors.push({
            row: rowNum,
            maMonHoc,
            error: 'Thứ tự học kỳ phải là số nguyên từ 1 đến 8',
          });
          continue;
        }

        try {
          // 4. Tra cứu môn học
          const monHoc = await this.monHocRepo.findOne({ where: { maMonHoc } });
          if (!monHoc) {
            throw new NotFoundException(`Môn học với mã ${maMonHoc} không tồn tại`);
          }

          // 5. Check trùng môn trong CTĐT
          const exists = await this.chiTietRepo.findOne({
            where: {
              chuongTrinh: { id: chuongTrinhId },
              monHoc: { id: monHoc.id },
            },
          });

          if (exists) {
            throw new BadRequestException(`Môn ${maMonHoc} đã tồn tại trong CTĐT`);
          }

          // 6. Tạo DTO
          const dto: CreateChiTietMonHocDto = {
            thuTuHocKy,
            monHocId: monHoc.id,
            ghiChu,
          };

          // 7. Gọi nghiệp vụ hiện có
          await this.themMonHocVaoChuongTrinh(chuongTrinhId, dto);

          results.success++;
          results.successRows.push({
            row: rowNum,
            maMonHoc,
            thuTuHocKy,
          });
        } catch (error: any) {
          results.failed++;
          results.errors.push({
            row: rowNum,
            maMonHoc,
            error: error.message || 'Lỗi khi thêm môn vào chương trình đào tạo',
          });
        }
      }

      return {
        message: `Import CTĐT hoàn tất cho chương trình ID=${chuongTrinhId}. Thành công: ${results.success}/${results.totalRows}`,
        totalRows: results.totalRows,
        success: results.success,
        failed: results.failed,
        errors: results.errors.length > 0 ? results.errors : [],
        successRows: results.successRows,
      };
    } finally {
      // Xóa file tạm
      await fs.unlink(filePath).catch(() => { });
    }
  }


  // Thêm môn học vào chương trình
  async themMonHocVaoChuongTrinh(chuongTrinhId: number, dto: CreateChiTietMonHocDto) {
    const ct = await this.chuongTrinhRepo.findOneBy({ id: chuongTrinhId });
    if (!ct) throw new NotFoundException('Chương trình đào tạo không tồn tại');

    const monHoc = await this.monHocRepo.findOneBy({ id: dto.monHocId });
    if (!monHoc) throw new NotFoundException('Môn học không tồn tại');

    // Kiểm tra trùng môn trong chương trình
    const exist = await this.chiTietRepo.findOneBy({
      chuongTrinh: { id: chuongTrinhId },
      monHoc: { id: dto.monHocId },
    });
    if (exist) throw new BadRequestException('Môn học này đã tồn tại trong chương trình');

    const chiTiet = this.chiTietRepo.create({
      chuongTrinh: ct,
      monHoc,
      thuTuHocKy: dto.thuTuHocKy,
      ghiChu: dto.ghiChu,
    });

    return await this.chiTietRepo.save(chiTiet);
  }

  // Sửa chi tiết môn học trong chương trình
  async suaChiTietMonHoc(id: number, dto: UpdateChiTietMonHocDto) {
    // Load đầy đủ relation: cả monHoc và chuongTrinh
    const chiTiet = await this.chiTietRepo.findOne({
      where: { id },
      relations: ['monHoc', 'chuongTrinh', 'chuongTrinh.nganh'],
    });
    if (!chiTiet) throw new NotFoundException('Bản ghi chi tiết không tồn tại');

    // Bây giờ chiTiet.chuongTrinh chắc chắn có dữ liệu
    if (!chiTiet.chuongTrinh) {
      throw new BadRequestException('Bản ghi chi tiết không có thông tin chương trình đào tạo');
    }

    if (dto.thuTuHocKy !== undefined) chiTiet.thuTuHocKy = dto.thuTuHocKy;
    if (dto.ghiChu !== undefined) chiTiet.ghiChu = dto.ghiChu;

    return await this.chiTietRepo.save(chiTiet);
  }

  // Xóa môn khỏi chương trình
  async xoaMonKhoiChuongTrinh(id: number): Promise<void> {
    const chiTiet = await this.chiTietRepo.findOneBy({ id });
    if (!chiTiet) throw new NotFoundException('Bản ghi chi tiết không tồn tại');

    await this.chiTietRepo.remove(chiTiet);
  }

  async exportMauNhapChuongTrinhDaoTaoExcel(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    // =========================
    // Sheet 1: Nhập CTĐT
    // =========================
    const worksheet = workbook.addWorksheet('NHAP_CTDT');

    worksheet.columns = [
      { header: 'STT', key: 'stt', width: 8 },              // A
      { header: 'Học kỳ', key: 'hocKy', width: 14 },        // B
      { header: 'Môn học', key: 'monHoc', width: 40 },      // C
      { header: 'Ghi chú', key: 'ghiChu', width: 40 },      // D
    ];

    // =========================
    // Style Header
    // =========================
    const headerRow = worksheet.getRow(1);
    headerRow.height = 32;

    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0E3364' }, // xanh đậm
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Freeze header
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    // =========================
    // Sheet ẩn: Danh mục môn học
    // =========================
    const hiddenSheet = workbook.addWorksheet('DM_MON_HOC', { state: 'hidden' });

    hiddenSheet.columns = [
      { header: 'Mã môn', key: 'ma', width: 20 },   // A
      { header: 'Tên môn', key: 'ten', width: 40 }, // B
    ];

    const monHocs = await this.monHocRepo.find({
      order: { tenMonHoc: 'ASC' },
    });

    monHocs.forEach(m => {
      hiddenSheet.addRow({
        ma: m.maMonHoc,
        ten: m.tenMonHoc,
      });
    });

    const lastRow = monHocs.length + 1;

    // =========================
    // Dropdown Học kỳ (1 → 8)
    // =========================
    for (let i = 2; i <= 10; i++) {
      worksheet.getCell(`B${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"1,2,3,4,5,6,7,8"'],
        showErrorMessage: true,
        errorTitle: 'Giá trị không hợp lệ',
        error: 'Học kỳ chỉ được chọn từ 1 đến 8',
      };
    }

    // =========================
    // Dropdown Môn học (chọn MÃ)
    // =========================
    for (let i = 2; i <= 10; i++) {
      // Cột C: select mã môn
      worksheet.getCell(`C${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`=DM_MON_HOC!$A$2:$A$${lastRow}`], // danh sách mã môn
        showErrorMessage: true,
        errorTitle: 'Giá trị không hợp lệ',
        error: 'Chỉ được chọn mã môn từ danh sách',
      };

      // Hiển thị tên môn bằng VLOOKUP (comment gợi ý)
      worksheet.getCell(`C${i}`).note = `
Chọn mã môn từ danh sách.
Tên môn sẽ tự hiển thị theo mã môn.

Công thức Excel tham khảo:
=VLOOKUP(C${i}, DM_MON_HOC!A:B, 2, FALSE)
`;
    }
    // =========================
    // Format body
    // =========================
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.height = 26;
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
    // =========================
    // Xuất file
    // =========================
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }


  // Chi tiết 1 bản ghi
  async getChiTietMonHoc(id: number) {
    const chiTiet = await this.chiTietRepo.findOne({
      where: { id },
      relations: ['monHoc', 'chuongTrinh', 'chuongTrinh.nganh'],
    });
    if (!chiTiet) throw new NotFoundException('Bản ghi chi tiết không tồn tại');
    return chiTiet;
  }

  private formatDateVN(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }


  // DS môn học trong 1 chương trình (kèm áp dụng)
  async getTatCaMonHocTrongChuongTrinh(chuongTrinhId: number) {
    const ct = await this.chuongTrinhRepo.findOne({
      where: { id: chuongTrinhId },
      relations: [
        'nganh',
        'apDungChuongTrinhs',
        'apDungChuongTrinhs.nienKhoa',
        'chiTietMonHocs',
        'chiTietMonHocs.monHoc',
      ],
    });

    if (!ct) throw new NotFoundException('Chương trình đào tạo không tồn tại');

    // Lấy danh sách môn học trong CTDT
    const monHocIds = ct.chiTietMonHocs.map(ct => ct.monHoc.id);

    // Lấy tất cả lớp học phần thuộc các áp dụng CTDT của chương trình này
    const lopHocPhans = await this.lopHocPhanRepo.find({
      where: {
        monHoc: { id: In(monHocIds) }, // chỉ môn trong CTDT
        nganh: { id: ct.nganh.id },   // ngành của CTDT
        nienKhoa: In(ct.apDungChuongTrinhs.map(ap => ap.nienKhoa.id)), // các niên khóa áp dụng
      },
      relations: [
        'monHoc',
        'hocKy',
        'hocKy.namHoc',
        'giangVien',
        'nienKhoa',
        'nganh',
        'sinhVienLopHocPhans', // để tính sĩ số
      ],
      order: {
        nienKhoa: { namBatDau: 'DESC' },
        hocKy: { hocKy: 'ASC' },
        maLopHocPhan: 'ASC',
      },
    });

    // Tính sĩ số cho từng lớp (nếu cần)
    const lopWithSiSo = await Promise.all(
      lopHocPhans.map(async lhp => {
        const siSo = lhp.sinhVienLopHocPhans.length;
        return { ...lhp, siSo };
      }),
    );

    // ===== BỔ SUNG: Tổng số sinh viên theo từng niên khóa áp dụng CTDT =====
    const tongSinhVienTheoNienKhoa: Array<{ nienKhoa: number; maNienKhoa: string; soLuong: number }> = [];
    for (const ap of ct.apDungChuongTrinhs) {
      const nienKhoaId = ap.nienKhoa.id;

      // Đếm sinh viên đang học thuộc ngành + niên khóa này
      const soSv = await this.sinhVienRepo.count({
        where: {
          lop: {
            nganh: { id: ct.nganh.id },
            nienKhoa: { id: nienKhoaId },
          },
          tinhTrang: TinhTrangHocTapEnum.DANG_HOC, // chỉ sinh viên đang học
        },
      });

      tongSinhVienTheoNienKhoa.push({
        maNienKhoa: ap.nienKhoa.maNienKhoa,
        nienKhoa: ap.nienKhoa.id,
        soLuong: soSv,
      });
    }
    // Sắp xếp theo niên khóa mới nhất trước
    tongSinhVienTheoNienKhoa.sort((a, b) =>
      b.maNienKhoa.localeCompare(a.maNienKhoa)
    );

    // ===== TRƯỜNG MỚI: Tổng số sinh viên đang áp dụng CTDT (tổng hợp tất cả niên khóa) =====
    const tongSinhVienApDung = tongSinhVienTheoNienKhoa.reduce((sum, item) => sum + item.soLuong, 0);

    return {
      chuongTrinh: {
        id: ct.id,
        tenChuongTrinh: ct.tenChuongTrinh,
        maChuongTrinh: ct.maChuongTrinh,
        thoiGianDaoTao: ct.thoiGianDaoTao,
        nganh: ct.nganh,
      },
      apDung: ct.apDungChuongTrinhs.map(ap => ({
        nienKhoa: ap.nienKhoa,
        ngayApDung: ap.ngayApDung,
        ghiChu: ap.ghiChu,
      })),
      monHocs: ct.chiTietMonHocs
        .map(ct => ({
          id: ct.id,
          thuTuHocKy: ct.thuTuHocKy,
          monHoc: ct.monHoc,
          ghiChu: ct.ghiChu,
        }))
        .sort((a, b) => a.thuTuHocKy - b.thuTuHocKy),
      lopHocPhans: lopWithSiSo.map(lhp => ({
        id: lhp.id,
        maLopHocPhan: lhp.maLopHocPhan,
        monHoc: lhp.monHoc.maMonHoc,
        hocKy: `${lhp.hocKy.hocKy} (${this.formatDateVN(lhp.hocKy.ngayBatDau)} - ${this.formatDateVN(lhp.hocKy.ngayKetThuc)})`,
        nienKhoa: lhp.nienKhoa.maNienKhoa,
        giangVien: lhp.giangVien?.hoTen || 'Chưa phân công',
        siSo: lhp.siSo,
        khoaDiem: lhp.khoaDiem,
      })),
      tongSinhVienTheoNienKhoa,
      tongSinhVienApDung,
    };
  }

  async exportChuongTrinhDaoTaoExcel(chuongTrinhId: number): Promise<Buffer> {
    const data = await this.getTatCaMonHocTrongChuongTrinh(chuongTrinhId);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('CTDT');

    // Font mặc định cho toàn bộ file
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.font = { name: 'Times New Roman', size: 12 };
      });
    });

    // Header: Tiêu đề chính
    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'CHI TIẾT CHƯƠNG TRÌNH ĐÀO TẠO';
    titleCell.font = { name: 'Times New Roman', size: 16, bold: true };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 30;

    // Thông tin chương trình đào tạo
    worksheet.getCell('A3').value = 'Mã chương trình:';
    worksheet.getCell('B3').value = data.chuongTrinh.maChuongTrinh;
    worksheet.getCell('A4').value = 'Tên chương trình:';
    worksheet.getCell('B4').value = data.chuongTrinh.tenChuongTrinh;
    worksheet.getCell('A5').value = 'Thời gian đào tạo:';
    worksheet.getCell('B5').value = `${data.chuongTrinh.thoiGianDaoTao} năm`;
    worksheet.getCell('A6').value = 'Ngành:';
    worksheet.getCell('B6').value = data.chuongTrinh.nganh.tenNganh;

    // Niên khóa áp dụng
    worksheet.getCell('A8').value = 'Niên khóa áp dụng:';
    worksheet.getCell('B8').value = data.apDung.map(ap => ap.nienKhoa.maNienKhoa).join(', ');

    // Merge và style cho header thông tin
    for (let row = 3; row <= 8; row++) {
      worksheet.getCell(`A${row}`).font = { name: 'Times New Roman', size: 12, bold: true };
      worksheet.getCell(`B${row}`).alignment = { vertical: 'middle', horizontal: 'left' };
    }

    // Bảng chi tiết môn học
    const tableStartRow = 10;

    // Header bảng
    worksheet.getCell(`A${tableStartRow}`).value = 'STT';
    worksheet.getCell(`B${tableStartRow}`).value = 'Thứ tự học kỳ';
    worksheet.getCell(`C${tableStartRow}`).value = 'Mã môn học';
    worksheet.getCell(`D${tableStartRow}`).value = 'Tên môn học';
    worksheet.getCell(`E${tableStartRow}`).value = 'Số tín chỉ';
    worksheet.getCell(`F${tableStartRow}`).value = 'Loại môn';
    worksheet.getCell(`G${tableStartRow}`).value = 'Ghi chú';

    const headerRow = worksheet.getRow(tableStartRow);
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Times New Roman', size: 12, bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    headerRow.height = 25;

    // Dữ liệu bảng
    data.monHocs.forEach((monHoc, index) => {
      const rowIndex = tableStartRow + index + 1;
      worksheet.getCell(`A${rowIndex}`).value = index + 1;
      worksheet.getCell(`B${rowIndex}`).value = monHoc.thuTuHocKy;
      worksheet.getCell(`C${rowIndex}`).value = monHoc.monHoc.maMonHoc;
      worksheet.getCell(`D${rowIndex}`).value = monHoc.monHoc.tenMonHoc;
      worksheet.getCell(`E${rowIndex}`).value = monHoc.monHoc.soTinChi || '';
      worksheet.getCell(`F${rowIndex}`).value = monHoc.monHoc.loaiMon || ''; // Giả sử entity MonHoc có trường loaiMon
      worksheet.getCell(`G${rowIndex}`).value = monHoc.ghiChu || '';

      const row = worksheet.getRow(rowIndex);
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
      row.height = 20;
    });

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      if (!column) return;
      let maxLength = 0;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        if (cellValue.length > maxLength) {
          maxLength = cellValue.length;
        }
      });
      column.width = Math.min(maxLength + 2, 30); // Giới hạn max width
    });

    // Freeze header bảng
    worksheet.views = [{ state: 'frozen', ySplit: tableStartRow }];

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async getTatCaMonHocTrongChuongTrinhCuaSinhVien(userId: number) {
    // 1. Lấy thông tin người dùng và sinh viên
    const nguoiDung = await this.nguoiDungRepo.findOne({
      where: { id: userId },
      relations: ['sinhVien', 'sinhVien.lop', 'sinhVien.lop.nganh', 'sinhVien.lop.nienKhoa'],
    });

    if (!nguoiDung || !nguoiDung.sinhVien) {
      throw new ForbiddenException('Tài khoản không phải sinh viên hoặc chưa liên kết hồ sơ sinh viên');
    }

    const sinhVien = nguoiDung.sinhVien;

    const nganhId = sinhVien.lop.nganh.id;
    const nienKhoaId = sinhVien.lop.nienKhoa.id;

    // 2. Tìm chương trình đào tạo áp dụng cho ngành + niên khóa của sinh viên
    const chuongTrinh = await this.chuongTrinhRepo.findOne({
      where: {
        nganh: { id: nganhId },
        apDungChuongTrinhs: {
          nienKhoa: { id: nienKhoaId },
        },
      },
      relations: [
        'nganh',
        'apDungChuongTrinhs',
        'apDungChuongTrinhs.nienKhoa',
        'chiTietMonHocs',
        'chiTietMonHocs.monHoc',
      ],
    });

    if (!chuongTrinh) {
      throw new NotFoundException(
        `Không tìm thấy chương trình đào tạo áp dụng cho ngành ${sinhVien.lop.nganh.tenNganh} niên khóa ${sinhVien.lop.nienKhoa.maNienKhoa}`
      );
    }

    // 3. Lấy danh sách mã môn học trong CTDT
    const monHocIds = chuongTrinh.chiTietMonHocs.map(ct => ct.monHoc.id);

    // 4. Lấy các lớp học phần liên quan (chỉ cùng ngành và cùng niên khóa SV)
    // Chỉ lấy lớp thuộc các môn trong CTDT, cùng ngành, cùng niên khóa của SV
    const lopHocPhans = await this.lopHocPhanRepo.find({
      where: {
        monHoc: { id: In(monHocIds) },
        nganh: { id: nganhId },
        nienKhoa: { id: nienKhoaId }
      },
      relations: [
        'monHoc',
        'hocKy',
        'hocKy.namHoc',
        'giangVien',
        'nienKhoa',
        'nganh',
        'sinhVienLopHocPhans',
        'sinhVienLopHocPhans.sinhVien',
      ],
      order: {
        hocKy: { hocKy: 'ASC' },
        maLopHocPhan: 'ASC',
      },
    });

    // 5. Xác định lớp nào sinh viên đã đăng ký / đã học
    const lopDaDangKyIds = new Set(
      lopHocPhans
        .filter(lhp =>
          (lhp.sinhVienLopHocPhans ?? []).some(svlhp => svlhp.sinhVien.id === sinhVien.id)
        )
        .map(lhp => lhp.id)
    );

    // 6. Chuẩn bị dữ liệu trả về
    const monHocs = chuongTrinh.chiTietMonHocs
      .map(ct => ({
        id: ct.id,
        thuTuHocKy: ct.thuTuHocKy,
        monHoc: {
          id: ct.monHoc.id,
          maMonHoc: ct.monHoc.maMonHoc,
          tenMonHoc: ct.monHoc.tenMonHoc,
          soTinChi: ct.monHoc.soTinChi,
          // có thể thêm các trường khác nếu entity MonHoc có
        },
        ghiChu: ct.ghiChu,
      }))
      .sort((a, b) => a.thuTuHocKy - b.thuTuHocKy);

    const lopHocPhansMapped = lopHocPhans.map(lhp => ({
      id: lhp.id,
      maLopHocPhan: lhp.maLopHocPhan,
      monHoc: {
        maMonHoc: lhp.monHoc.maMonHoc,
        tenMonHoc: lhp.monHoc.tenMonHoc,
      },
      hocKy: `${lhp.hocKy.hocKy} (${this.formatDateVN(lhp.hocKy.ngayBatDau)} - ${this.formatDateVN(lhp.hocKy.ngayKetThuc)})`,
      nienKhoa: lhp.nienKhoa.tenNienKhoa,
      giangVien: lhp.giangVien?.hoTen || 'Chưa phân công',
      siSo: lhp.sinhVienLopHocPhans.length,
      daDangKy: lopDaDangKyIds.has(lhp.id),
      khoaDiem: lhp.khoaDiem,
    }));

    return {
      chuongTrinh: {
        id: chuongTrinh.id,
        tenChuongTrinh: chuongTrinh.tenChuongTrinh,
        maChuongTrinh: chuongTrinh.maChuongTrinh,
        thoiGianDaoTao: chuongTrinh.thoiGianDaoTao,
        nganh: chuongTrinh.nganh,
        nienKhoaApDung: chuongTrinh.apDungChuongTrinhs.find(
          ap => ap.nienKhoa.id === nienKhoaId
        )?.nienKhoa,
      },
      monHocs,
      lopHocPhans: lopHocPhansMapped,
      tongSoMon: monHocs.length,
      tongSoLopTrongCTDT: lopHocPhans.length,
    };
  }

}