import {
  Injectable,
  NotFoundException,
  BadRequestException,
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
  ) { }

  // ==================== NĂM HỌC ====================

  async getAllNamHoc(query: GetNamHocQueryDto) {
    const { search, page = 1, limit = 10 } = query;

    const qb = this.namHocRepo
      .createQueryBuilder('namHoc')
      .leftJoinAndSelect('namHoc.hocKys', 'hocKy')
      .orderBy('namHoc.namBatDau', 'DESC'); // ❗ bỏ orderBy liên quan hocKy

    if (search) {
      qb.andWhere(
        '(LOWER(namHoc.tenNamHoc) LIKE :search OR LOWER(namHoc.maNamHoc) LIKE :search)',
        { search: `%${search.toLowerCase()}%` },
      );
    }

    // Phân trang
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

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

    // Kiểm tra chồng thời gian với các học kỳ hiện có
    const allHocKy = await this.hocKyRepo.find({
      where: { namHoc: { id: namHocId } },
    });

    for (const hk of allHocKy) {
      const hkBd = new Date(hk.ngayBatDau);
      const hkKt = new Date(hk.ngayKetThuc);

      // Chồng nếu: bd mới nằm trong khoảng cũ hoặc kt mới nằm trong khoảng cũ
      if (!(kt <= hkBd || bd >= hkKt)) {
        throw new BadRequestException(
          `Thời gian học kỳ chồng với học kỳ thứ ${hk.hocKy} (${hk.ngayBatDau.toLocaleDateString('vi-VN')} - ${hk.ngayKetThuc.toLocaleDateString('vi-VN')})`,
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

  async updateHocKy(id: number, dto: UpdateHocKyDto) {
    const hocKy = await this.hocKyRepo.findOne({
      where: { id },
      relations: ['namHoc'],
    });
    if (!hocKy) throw new NotFoundException('Học kỳ không tồn tại');

    let finalNamHoc = hocKy.namHoc;
    if (dto.namHocId && dto.namHocId !== hocKy.namHoc.id) {
      const foundNamHoc = await this.namHocRepo.findOneBy({ id: dto.namHocId });
      if (!foundNamHoc) throw new BadRequestException('Năm học không tồn tại');
      finalNamHoc = foundNamHoc;
    }

    // Validate ngày nếu có thay đổi
    let finalBd = hocKy.ngayBatDau;
    let finalKt = hocKy.ngayKetThuc;
    if (dto.ngayBatDau) finalBd = new Date(dto.ngayBatDau);
    if (dto.ngayKetThuc) finalKt = new Date(dto.ngayKetThuc);

    const startOfNam = new Date(finalNamHoc.namBatDau, 0, 1);
    const endOfNam = new Date(finalNamHoc.namKetThuc, 11, 31);

    if (finalBd < startOfNam) {
      throw new BadRequestException(`Ngày bắt đầu phải từ 01/01/${finalNamHoc.namBatDau} trở đi`);
    }
    if (finalKt > endOfNam) {
      throw new BadRequestException(`Ngày kết thúc không được vượt quá 31/12/${finalNamHoc.namKetThuc}`);
    }
    if (finalBd >= finalKt) {
      throw new BadRequestException('Ngày bắt đầu phải nhỏ hơn ngày kết thúc');
    }

    // Nếu đổi thứ tự học kỳ → kiểm tra trùng và liền kề
    if (dto.hocKy !== undefined) {
      if (dto.hocKy <= 0) throw new BadRequestException('Thứ tự học kỳ phải >= 1');

      const exist = await this.hocKyRepo.findOne({
        where: { hocKy: dto.hocKy, namHoc: { id: finalNamHoc.id } },
      });
      if (exist && exist.id !== id) {
        throw new BadRequestException(`Năm học này đã có học kỳ thứ ${dto.hocKy}`);
      }

      const max = await this.hocKyRepo.findOne({
        where: { namHoc: { id: finalNamHoc.id } },
        order: { hocKy: 'DESC' },
      });
      const expected = max ? max.hocKy + 1 : 1;
      if (dto.hocKy !== hocKy.hocKy && dto.hocKy !== expected) {
        throw new BadRequestException(`Chỉ được đổi thành học kỳ thứ ${expected}`);
      }
    }

    // Kiểm tra chồng thời gian với các học kỳ khác (trừ chính nó)
    const others = await this.hocKyRepo.find({
      where: { namHoc: { id: finalNamHoc.id } },
    });

    for (const other of others) {
      if (other.id === id) continue;

      const otherBd = new Date(other.ngayBatDau);
      const otherKt = new Date(other.ngayKetThuc);

      if (!(finalKt <= otherBd || finalBd >= otherKt)) {
        throw new BadRequestException(
          `Thời gian chồng với học kỳ thứ ${other.hocKy} (${other.ngayBatDau.toLocaleDateString('vi-VN')} - ${other.ngayKetThuc.toLocaleDateString('vi-VN')})`,
        );
      }
    }

    // Cập nhật
    if (dto.hocKy !== undefined) hocKy.hocKy = dto.hocKy;
    if (dto.ngayBatDau) hocKy.ngayBatDau = finalBd;
    if (dto.ngayKetThuc) hocKy.ngayKetThuc = finalKt;
    if (dto.namHocId) hocKy.namHoc = finalNamHoc;

    return await this.hocKyRepo.save(hocKy);
  }

  async deleteHocKy(id: number) {
    const hocKy = await this.hocKyRepo.findOneBy({ id });
    if (!hocKy) throw new NotFoundException('Học kỳ không tồn tại');

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
      relations: ['apDungChuongTrinhs'],
    });
    if (!ct) throw new NotFoundException('Chương trình đào tạo không tồn tại');

    if (ct.apDungChuongTrinhs?.length > 0) {
      throw new BadRequestException('Không thể xóa chương trình đang được áp dụng');
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
        nienKhoa: lhp.nienKhoa.tenNienKhoa,
        giangVien: lhp.giangVien?.hoTen || 'Chưa phân công',
        siSo: lhp.siSo,
        khoaDiem: lhp.khoaDiem,
      })),
      tongSinhVienTheoNienKhoa,
      tongSinhVienApDung,
    };
  }
}