import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChiTietChuongTrinhDaoTao } from './entity/chi-tiet-chuong-trinh-dao-tao.entity';
import { ChuongTrinhDaoTao } from './entity/chuong-trinh-dao-tao.entity';
import { HocKy } from './entity/hoc-ky.entity';
import { NamHoc } from './entity/nam-hoc.entity';
import { QuyDinhDaoTao } from './entity/quy-dinh-dao-tao.entity';
import { ApDungChuongTrinhDT } from './entity/ap-dung-chuong-trinh-dt.entity';
import { Nganh } from 'src/danh-muc/entity/nganh.entity';
import { NienKhoa } from 'src/danh-muc/entity/nien-khoa.entity';
import { MonHoc } from 'src/danh-muc/entity/mon-hoc.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChiTietChuongTrinhDaoTao, ChuongTrinhDaoTao, HocKy, NamHoc, QuyDinhDaoTao, ApDungChuongTrinhDT, Nganh, NienKhoa, MonHoc])],
  controllers: [],
  providers: [],
})
export class DaoTaoModule {}
