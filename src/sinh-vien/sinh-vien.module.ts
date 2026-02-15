import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SinhVienService } from './sinh-vien.service';
import { SinhVien } from './entity/sinh-vien.entity';
import { KhenThuongKyLuat } from './entity/khenthuong-kyluat.entity';
import { SinhVienController } from './sinh-vien.controller';
import { Lop } from 'src/danh-muc/entity/lop.entity';
import { NguoiDung } from 'src/auth/entity/nguoi-dung.entity';
import { SinhVienLopHocPhan } from 'src/giang-day/entity/sinhvien-lophocphan.entity';
import { ChiTietChuongTrinhDaoTao } from 'src/dao-tao/entity/chi-tiet-chuong-trinh-dao-tao.entity';
import { ApDungChuongTrinhDT } from 'src/dao-tao/entity/ap-dung-chuong-trinh-dt.entity';
import { KetQuaHocTap } from 'src/ket-qua/entity/ket-qua-hoc-tap.entity';
import { NienKhoa } from 'src/danh-muc/entity/nien-khoa.entity';
import { YeuCauHocPhan } from 'src/giang-day/entity/yeu-cau-hoc-phan.entity';
import { LopHocPhan } from 'src/giang-day/entity/lop-hoc-phan.entity';
import { MonHoc } from 'src/danh-muc/entity/mon-hoc.entity';
import { NamHoc } from 'src/dao-tao/entity/nam-hoc.entity';
import { HocKy } from 'src/dao-tao/entity/hoc-ky.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SinhVien,
      KhenThuongKyLuat,
      Lop,
      NguoiDung,
      SinhVienLopHocPhan,
      ApDungChuongTrinhDT,
      KetQuaHocTap,
      ChiTietChuongTrinhDaoTao,
      NienKhoa,
      YeuCauHocPhan,
      LopHocPhan,
      MonHoc,
      NamHoc,
      HocKy,
    ]),
  ],
  controllers: [SinhVienController],
  providers: [SinhVienService],
})
export class SinhVienModule {}
