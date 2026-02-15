import { Module } from '@nestjs/common';
import { BaoCaoService } from './bao-cao.service';
import { BaoCaoController } from './bao-cao.controller';
import { LopHocPhan } from 'src/giang-day/entity/lop-hoc-phan.entity';
import { SinhVien } from 'src/sinh-vien/entity/sinh-vien.entity';
import { KetQuaHocTap } from 'src/ket-qua/entity/ket-qua-hoc-tap.entity';
import { SinhVienLopHocPhan } from 'src/giang-day/entity/sinhvien-lophocphan.entity';
import { GiangVien } from 'src/danh-muc/entity/giang-vien.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HocKy } from 'src/dao-tao/entity/hoc-ky.entity';
import { NienKhoa } from 'src/danh-muc/entity/nien-khoa.entity';
import { MonHoc } from 'src/danh-muc/entity/mon-hoc.entity';
import { Khoa } from 'src/danh-muc/entity/khoa.entity';
import { Nganh } from 'src/danh-muc/entity/nganh.entity';
import { Lop } from 'src/danh-muc/entity/lop.entity';
import { ChuongTrinhDaoTao } from 'src/dao-tao/entity/chuong-trinh-dao-tao.entity';
import { NguoiDung } from 'src/auth/entity/nguoi-dung.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LopHocPhan,
      SinhVien,
      KetQuaHocTap,
      GiangVien,
      SinhVienLopHocPhan,
      HocKy,
      NienKhoa,
      MonHoc,
      Khoa,
      Nganh,
      Lop,
      ChuongTrinhDaoTao,
      NguoiDung,
    ]),
  ],
  controllers: [BaoCaoController],
  providers: [BaoCaoService],
  exports: [BaoCaoService],
})
export class BaoCaoModule {}
