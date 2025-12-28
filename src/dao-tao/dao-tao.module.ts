import { Module } from '@nestjs/common';
import { DaoTaoService } from './dao-tao.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChiTietChuongTrinhDaoTao } from './entity/chi-tiet-chuong-trinh-dao-tao.entity';
import { ChuongTrinhDaoTao } from './entity/chuong-trinh-dao-tao.entity';
import { HocKy } from './entity/hoc-ky.entity';
import { NamHoc } from './entity/nam-hoc.entity';
import { DaoTaoController } from './dao-tao.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ChiTietChuongTrinhDaoTao, ChuongTrinhDaoTao, HocKy, NamHoc])],
  controllers: [DaoTaoController],
  providers: [DaoTaoService],
})
export class DaoTaoModule {}
