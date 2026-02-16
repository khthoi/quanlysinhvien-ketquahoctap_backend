import { Module } from '@nestjs/common';
import { DaoTaoService } from './dao-tao.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChiTietChuongTrinhDaoTao } from './entity/chi-tiet-chuong-trinh-dao-tao.entity';
import { ChuongTrinhDaoTao } from './entity/chuong-trinh-dao-tao.entity';
import { HocKy } from './entity/hoc-ky.entity';
import { NamHoc } from './entity/nam-hoc.entity';
import { DaoTaoController } from './dao-tao.controller';
import { QuyDinhDaoTao } from './entity/quy-dinh-dao-tao.entity';
import { ApDungChuongTrinhDT } from './entity/ap-dung-chuong-trinh-dt.entity';
import { Nganh } from 'src/danh-muc/entity/nganh.entity';
import { NienKhoa } from 'src/danh-muc/entity/nien-khoa.entity';
import { MonHoc } from 'src/danh-muc/entity/mon-hoc.entity';
import { LopHocPhan } from 'src/giang-day/entity/lop-hoc-phan.entity';
import { SinhVien } from 'src/sinh-vien/entity/sinh-vien.entity';
import { NguoiDung } from 'src/auth/entity/nguoi-dung.entity';
import { YeuCauHocPhan } from 'src/giang-day/entity/yeu-cau-hoc-phan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChiTietChuongTrinhDaoTao, ChuongTrinhDaoTao, HocKy, NamHoc, QuyDinhDaoTao, ApDungChuongTrinhDT, Nganh, NienKhoa, MonHoc, LopHocPhan, SinhVien, NguoiDung, YeuCauHocPhan])],
  controllers: [DaoTaoController],
  providers: [DaoTaoService],
})
export class DaoTaoModule {}
