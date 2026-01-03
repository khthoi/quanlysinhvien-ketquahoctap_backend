// src/dao-tao/dao-tao.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NamHoc } from './entity/nam-hoc.entity';
import { HocKy } from './entity/hoc-ky.entity';
import { CreateNamHocDto } from './dtos/create-nam-hoc.dto';
import { UpdateNamHocDto } from './dtos/update-nam-hoc.dto';
import { CreateHocKyDto } from './dtos/create-hoc-ky.dto';
import { UpdateHocKyDto } from './dtos/update-hoc-ky.dto';
import { GetNamHocQueryDto } from './dtos/get-nam-hoc-query.dto';
import { GetHocKyQueryDto } from './dtos/get-hoc-ky-query.dto';

@Injectable()
export class DaoTaoService {
  constructor(
    @InjectRepository(NamHoc)
    private namHocRepo: Repository<NamHoc>,
    @InjectRepository(HocKy)
    private hocKyRepo: Repository<HocKy>,
  ) { }

  // ==================== NĂM HỌC ====================

  async getAllNamHoc(query: GetNamHocQueryDto & { page?: number; limit?: number }) {
    const { search, page = 1, limit = 10 } = query;

    const qb = this.namHocRepo
      .createQueryBuilder('namHoc')
      .leftJoinAndSelect('namHoc.hocKys', 'hocKy')
      .orderBy('namHoc.namBatDau', 'DESC')
      .addOrderBy('hocKy.tenHocKy', 'ASC');

    if (search) {
      qb.andWhere('LOWER(namHoc.tenNamHoc) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
    }

    // Đếm tổng số bản ghi (cho pagination)
    const total = await qb.getCount();

    // Phân trang
    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    // Lấy dữ liệu
    const namHocs = await qb.getMany();

    return {
      data: namHocs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createNamHoc(dto: CreateNamHocDto) {
    // Kiểm tra trùng năm bắt đầu + kết thúc (do có @Unique)
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

    // Nếu cập nhật năm bắt đầu/kết thúc → kiểm tra trùng
    if (dto.namBatDau || dto.namKetThuc) {
      const exist = await this.namHocRepo.findOneBy({
        namBatDau: dto.namBatDau || namHoc.namBatDau,
        namKetThuc: dto.namKetThuc || namHoc.namKetThuc,
      });
      if (exist && exist.id !== id) {
        throw new BadRequestException('Khoảng thời gian năm học đã tồn tại');
      }
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
    const { namHocId, search } = query;

    const qb = this.hocKyRepo
      .createQueryBuilder('hocKy')
      .leftJoinAndSelect('hocKy.namHoc', 'namHoc')
      .orderBy('namHoc.namBatDau', 'DESC')
      .addOrderBy('hocKy.tenHocKy', 'ASC');

    if (namHocId) {
      qb.andWhere('hocKy.nam_hoc_id = :namHocId', { namHocId });
    }

    if (search) {
      qb.andWhere('LOWER(hocKy.tenHocKy) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
    }

    return await qb.getMany();
  }

  async createHocKy(dto: CreateHocKyDto) {
    const namHoc = await this.namHocRepo.findOneBy({ id: dto.namHocId });
    if (!namHoc) throw new BadRequestException('Năm học không tồn tại');

    const hocKy = this.hocKyRepo.create({
      ...dto,
      namHoc,
    });

    return await this.hocKyRepo.save(hocKy);
  }

  async updateHocKy(id: number, dto: UpdateHocKyDto) {
    const hocKy = await this.hocKyRepo.findOneBy({ id });
    if (!hocKy) throw new NotFoundException('Học kỳ không tồn tại');

    if (dto.namHocId) {
      const namHoc = await this.namHocRepo.findOneBy({ id: dto.namHocId });
      if (!namHoc) throw new BadRequestException('Năm học không tồn tại');
      hocKy.namHoc = namHoc;
    }

    Object.assign(hocKy, dto);
    return await this.hocKyRepo.save(hocKy);
  }

  async deleteHocKy(id: number) {
    const hocKy = await this.hocKyRepo.findOneBy({ id });
    if (!hocKy) throw new NotFoundException('Học kỳ không tồn tại');

    await this.hocKyRepo.remove(hocKy);
    return { message: 'Xóa học kỳ thành công' };
  }
}