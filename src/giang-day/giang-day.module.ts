import { Module } from '@nestjs/common';
import { GiangDayService } from './giang-day.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GiangDayController } from './giang-day.controller';
import { LopHocPhan } from './entity/lop-hoc-phan.entity';
import { SinhVienLopHocPhan } from './entity/sinhvien-lophocphan.entity';
import { GiangVien } from 'src/danh-muc/entity/giang-vien.entity';
import { GiangVienMonHoc } from 'src/danh-muc/entity/giangvien-monhoc.entity';
import { MonHoc } from 'src/danh-muc/entity/mon-hoc.entity';
import { Nganh } from 'src/danh-muc/entity/nganh.entity';
import { NienKhoa } from 'src/danh-muc/entity/nien-khoa.entity';
import { HocKy } from 'src/dao-tao/entity/hoc-ky.entity';
import { SinhVien } from 'src/sinh-vien/entity/sinh-vien.entity';
import { KetQuaHocTap } from 'src/ket-qua/entity/ket-qua-hoc-tap.entity';
import { NguoiDung } from 'src/auth/entity/nguoi-dung.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LopHocPhan, SinhVienLopHocPhan, GiangVien, GiangVienMonHoc, MonHoc, Nganh, NienKhoa, HocKy, SinhVien, KetQuaHocTap, NguoiDung, GiangVien])],
  controllers: [GiangDayController],
  providers: [GiangDayService],
})
export class GiangDayModule {}
